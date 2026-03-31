export const usePosSystem = () => {
  const supabase = useSupabaseClient();
  const userStore = useMainStore();
  
  const booths = ref<any[]>([]);
  const selectedBooth = ref<number | null>(null);
  const products = ref<any[]>([]);
  const cart = ref<any[]>([]);
  const loading = ref(false);

  const totalAmount = computed(() => cart.value.reduce((s, c) => s + (c.event_price * c.quantity), 0));

  const init = async () => {
    if (!userStore.profile?.id) return;
    
    const { data, error } = await supabase
      .from('Exhibition_Booths')
      .select('id, booth_number, exhibitions:exhibition_id (name)')
      // 修改重點：只抓取自己的攤位
      .eq('owner_id', userStore.profile.id);
  
    if (!error) {
      booths.value = data?.map(b => ({ 
        id: b.id, 
        exhibition_name: `${b.exhibitions.name} (${b.booth_number})` 
      })) || [];
    }
  };

  watch(selectedBooth, async (val) => {
    if (!val) {
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
          product:product_id!inner (
            id,
            name,
            total_inventory,
            permissions:Product_Permissions!inner (
              enable,
              owner_id
            )
          )
        `)
        .eq('booth_id', val)
        .eq('product.permissions.enable', true)
        .eq('product.permissions.owner_id', userStore.profile?.id);
  
      if (error) throw error;
  
      // 關鍵修正：過濾掉任何 product 為 null 的異常資料
      // 確保 item.product 存在且 total_inventory 不是 undefined
      products.value = (data || []).filter(item => item.product !== null);
      
    } catch (err) {
      console.error('POS 商品載入失敗:', err);
      products.value = [];
    } finally {
      loading.value = false;
    }
  });

  const addToCart = (item: any) => {
    // 假設 product 裡面有帶出 total_inventory
    const currentInventory = item.product.total_inventory; 
    const exist = cart.value.find(c => c.id === item.id);
    
    if (exist) {
      if (exist.quantity >= currentInventory) {
        alert('已達庫存上限！');
        return;
      }
      exist.quantity++;
    } else {
      if (currentInventory <= 0) {
        alert('商品已無庫存！');
        return;
      }
      cart.value.push({ ...item, quantity: 1 });
    }
  };

  const checkout = async () => {
    if (cart.value.length === 0) return;
    loading.value = true;
  
    try {
      // 準備傳給 SQL Function 的資料格式
      const itemsToProcess = cart.value.map(c => ({
        detail_id: c.id,
        quantity: c.quantity
      }));
  
      // 呼叫 Supabase RPC
      const { error } = await supabase.rpc('pos_checkout', {
        p_items: itemsToProcess
      });
  
      if (error) throw error;
  
      // 成功後的處理
      alert('結帳成功！庫存已同步扣除。');
      cart.value = [];
      
      // 關鍵：重新抓取商品資訊（更新畫面上顯示的庫存數字）
      await refreshProductData(); 
  
    } catch (err: any) {
      console.error('結帳失敗:', err.message);
      alert('結帳失敗：' + (err.message.includes('庫存不足') ? '部分商品庫存不足，請重新確認' : err.message));
    } finally {
      loading.value = false;
    }
  };
  
  // 封裝一個刷新商品的 function
  const refreshProductData = async () => {
    if (!selectedBooth.value) return;
    // 重新執行原本 watch 裡的抓取邏輯
    const { data } = await supabase
      .from('Exhibition_Product_Details')
      .select(`
        id, event_price,
        product:product_id ( id, name, total_inventory, permissions:Product_Permissions!inner (enable, owner_id) )
      `)
      .eq('booth_id', selectedBooth.value)
      .eq('product.permissions.enable', true);
    
    products.value = (data || []).filter(item => item.product !== null);
  };

  onMounted(init);

  return { booths, selectedBooth, products, cart, totalAmount, addToCart, checkout, loading };
};