export const usePosSystem = () => {
  const supabase = useSupabaseClient();
  const userStore = useMainStore();
  
  const booths = ref<any[]>([]);
  const selectedBooth = ref<number | null>(null);
  const products = ref<any[]>([]);
  const cart = ref<any[]>([]);
  const loading = ref(false);

  const checkoutForm = ref({
    phone: '',
  });

  const lastOrder = ref<{ token: string, number: string } | null>(null);

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

  const totalAmount = computed(() => cart.value.reduce((s, c) => s + (c.event_price * c.quantity), 0));

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
      
      // 過濾權限（單品直接查，組合包則檢查擁有者 ID，這裡假設組合包也歸屬在攤主下）
      products.value = (data || []).map(item => {
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
      booths.value = data?.map(b => ({ 
        id: b.id, 
        exhibition_name: `${b.exhibitions.name} (${b.booth_number})` 
      })) || [];
    }
  };

  // 修改 watch：直接呼叫 fetchProducts
  watch(selectedBooth, fetchProducts);

  const addToCart = (item: any) => {
    if (item.is_paid) return alert('此項目已結清！');
  
    const currentInventory = item.computed_inventory; 
    const exist = cart.value.find(c => c.id === item.id);
    
    if (exist) {
      if (exist.quantity >= currentInventory) return alert('已達庫存上限！');
      exist.quantity++;
    } else {
      if (currentInventory <= 0) return alert('已無庫存！');
      cart.value.push({ ...item, quantity: 1 });
    }
  };

  // 修改 checkout：結帳後執行 fetchProducts 刷新庫存
  // usePosSystem.ts 內
  const ANONYMOUS_PHONE = '0900000000'

  const checkout = async (paymentMethod: string) => {
    if (cart.value.length === 0) return;
    if (!selectedBooth.value) return;

    loading.value = true;
    try {
      const { data, error } = await supabase.rpc('pos_checkout_v3', {
        p_booth_id: selectedBooth.value,
        p_items: cart.value.map(c => ({ detail_id: c.id, quantity: c.quantity })),
        p_method: paymentMethod,
        p_phone: checkoutForm.value.phone || ANONYMOUS_PHONE
      });

      if (error) throw error;

      const result = data[0];
      lastOrder.value = {
        token: result.r_order_token,
        number: result.r_order_number
      };

      cart.value = [];
      checkoutForm.value.phone = '';
      await fetchProducts(); 
      
      return true;
    } catch (err: any) {
      alert('結帳失敗：' + err.message);
      return false;
    } finally {
      loading.value = false;
    }
  };

  onMounted(init);

  return { 
    booths, selectedBooth, products, cart, totalAmount, lastOrder,
    addToCart, checkout, loading, fetchProducts, getInventory, getDisplayName, checkoutForm
  };
};