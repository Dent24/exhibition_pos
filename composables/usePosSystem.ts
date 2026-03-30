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
      const { data } = await supabase.from('Exhibition_Booths').select('id, booth_number, exhibitions:exhibition_id (name)');
      booths.value = data?.map(b => ({ id: b.id, exhibition_name: `${b.exhibitions.name} (${b.booth_number})` })) || [];
    };
  
    watch(selectedBooth, async (val) => {
      if (!val) return;
      const { data } = await supabase.from('Exhibition_Product_Details').select('id, event_price, product:product_id(name)').eq('booth_id', val);
      products.value = data || [];
    });
  
    const addToCart = (item: any) => {
      const exist = cart.value.find(c => c.id === item.id);
      if (exist) exist.quantity++;
      else cart.value.push({ ...item, quantity: 1 });
    };
  
    const checkout = async () => {
      if (cart.value.length === 0) return;
      loading.value = true;
      const records = cart.value.map(c => ({ detail_id: c.id, quantity: c.quantity }));
      const { error } = await supabase.from('Sales_Records').insert(records);
      if (!error) {
        cart.value = [];
        alert('結帳成功！');
      }
      loading.value = false;
    };
  
    onMounted(init);
  
    return { booths, selectedBooth, products, cart, totalAmount, addToCart, checkout, loading };
  };