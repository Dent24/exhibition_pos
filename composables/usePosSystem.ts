interface QueuedCheckout {
  localId: string
  boothId: number
  items: { detail_id: number; quantity: number }[]
  method: string
  phone: string
  queuedAt: number
}

const ANONYMOUS_PHONE = '0900000000'
const QUEUE_STORAGE_KEY = 'pos-checkout-queue'

export const usePosSystem = () => {
  const supabase = useSupabaseClient();
  const userStore = useMainStore();

  const booths = ref<any[]>([]);
  const selectedBooth = ref<number | null>(null);
  const products = ref<any[]>([]);
  const cart = ref<any[]>([]);
  const loading = ref(false);

  const checkoutForm = ref({ phone: '' });

  const lastOrder = ref<{ token: string | null; number: string; isQueued: boolean; localId: string } | null>(null);

  const checkoutQueue = ref<QueuedCheckout[]>([]);
  const isSyncing = ref(false);
  const pendingCount = computed(() => checkoutQueue.value.length);

  const saveQueue = () => {
    localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(checkoutQueue.value));
  };

  // 輔助函式：計算組合包內的最少庫存
  const getInventory = (item: any) => {
    if (item.bundle_id) {
      if (!item.bundle?.items?.length) return 0;
      return Math.min(...item.bundle.items.map((i: any) => i.product?.total_inventory || 0));
    }
    return item.product?.total_inventory || 0;
  };

  // 輔助函式：取得顯示名稱
  const getDisplayName = (item: any) => {
    return item.bundle_id ? item.bundle.name : item.product?.name;
  };

  const totalAmount = computed(() =>
    cart.value.reduce((s, c) => s + c.event_price * c.quantity, 0)
  );

  const fetchProducts = async () => {
    if (!selectedBooth.value) {
      products.value = [];
      return;
    }

    loading.value = true;
    try {
      const { data, error } = await supabase
        .from('Exhibition_Product_Details')
        .select(`
          id,
          event_price,
          is_paid,
          bundle_id,
          product:product_id (
            id, name, total_inventory,
            permissions:Product_Permissions!inner ( enable, owner_id )
          ),
          bundle:bundle_id (
            id, name,
            items:Bundle_Items (
              share_weight,
              product:product_id ( id, name, total_inventory )
            )
          )
        `)
        .eq('booth_id', selectedBooth.value)
        .or('product_id.not.is.null, bundle_id.not.is.null');

      if (error) throw error;

      products.value = (data || []).map((item) => {
        const inventory = getInventory(item);
        const name = getDisplayName(item);
        return { ...item, computed_inventory: inventory, display_name: name };
      });
    } catch (err) {
      console.error('POS 商品載入失敗:', err);
      products.value = [];
    } finally {
      loading.value = false;
    }
  };

  const init = async () => {
    if (!userStore.profile?.id) return;

    const { data, error } = await supabase
      .from('Exhibition_Booths')
      .select('id, booth_number, exhibitions:exhibition_id (name)')
      .eq('owner_id', userStore.profile.id);

    if (!error) {
      booths.value =
        data?.map((b) => ({
          id: b.id,
          exhibition_name: `${b.exhibitions.name} (${b.booth_number})`,
        })) || [];
    }
  };

  watch(selectedBooth, fetchProducts);

  const addToCart = (item: any) => {
    if (item.is_paid) return alert('此項目已結清！');

    const currentInventory = item.computed_inventory;
    const exist = cart.value.find((c) => c.id === item.id);

    if (exist) {
      if (exist.quantity >= currentInventory) return alert('已達庫存上限！');
      exist.quantity++;
    } else {
      if (currentInventory <= 0) return alert('已無庫存！');
      cart.value.push({ ...item, quantity: 1 });
    }
  };

  const clearCart = () => {
    cart.value = [];
  };

  // 依序處理佇列，每次只推送第一筆，成功後繼續下一筆
  const processQueue = async () => {
    if (isSyncing.value || checkoutQueue.value.length === 0 || !navigator.onLine) return;

    isSyncing.value = true;
    const item = checkoutQueue.value[0];

    try {
      const { data, error } = await supabase.rpc('pos_checkout_v3', {
        p_booth_id: item.boothId,
        p_items: item.items,
        p_method: item.method,
        p_phone: item.phone,
      });

      if (error) throw error;

      checkoutQueue.value.shift();
      saveQueue();
      isSyncing.value = false;

      // 若此筆對應到畫面上正在顯示的訂單，回填真實 token 以顯示 QR Code
      if (lastOrder.value?.localId === item.localId && data?.[0]) {
        lastOrder.value = {
          ...lastOrder.value,
          token: data[0].r_order_token,
          number: data[0].r_order_number,
          isQueued: false,
        };
      }

      // 推送成功後繼續處理下一筆
      if (checkoutQueue.value.length > 0) processQueue();
    } catch {
      // 推送失敗，等下次 online 事件或輪詢再重試
      isSyncing.value = false;
    }
  };

  // 結帳：立即扣本地庫存並加入佇列，不等待網路回應
  const checkout = async (paymentMethod: string) => {
    if (cart.value.length === 0 || !selectedBooth.value) return;

    const phone = checkoutForm.value.phone || ANONYMOUS_PHONE;

    const queueItem: QueuedCheckout = {
      localId: crypto.randomUUID(),
      boothId: selectedBooth.value,
      items: cart.value.map((c) => ({ detail_id: c.id, quantity: c.quantity })),
      method: paymentMethod,
      phone,
      queuedAt: Date.now(),
    };

    // 立即扣除本地庫存，讓下一筆結帳看到正確庫存
    for (const cartItem of cart.value) {
      const product = products.value.find((p) => p.id === cartItem.id);
      if (product) {
        product.computed_inventory = Math.max(
          0,
          product.computed_inventory - cartItem.quantity
        );
      }
    }

    cart.value = [];
    checkoutForm.value.phone = '';

    lastOrder.value = {
      token: null,
      number: queueItem.localId.slice(0, 8).toUpperCase(),
      isQueued: true,
      localId: queueItem.localId,
    };

    checkoutQueue.value.push(queueItem);
    saveQueue();
    processQueue(); // 非阻塞，立即嘗試推送

    return true;
  };

  onMounted(() => {
    init();

    // 載入上次未完成的佇列
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) checkoutQueue.value = JSON.parse(stored);
    } catch {
      checkoutQueue.value = [];
    }

    // 網路恢復時自動繼續推送
    window.addEventListener('online', processQueue);

    // 每 10 秒輪詢一次，處理卡住的佇列
    const interval = setInterval(processQueue, 10000);

    // 嘗試推送上次未完成的項目
    processQueue();

    onUnmounted(() => {
      window.removeEventListener('online', processQueue);
      clearInterval(interval);
    });
  });

  return {
    booths, selectedBooth, products, cart, totalAmount, lastOrder,
    addToCart, checkout, clearCart, loading, fetchProducts, getInventory, getDisplayName, checkoutForm,
    checkoutQueue, isSyncing, pendingCount,
  };
};
