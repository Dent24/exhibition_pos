<template>
  <v-container>
    <v-row class="mb-4" align="center">
      <v-col>
        <h1 class="text-h4 text-primary">設定商品</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="
            dialog = true;
            isEdit = false;
          "
        >
          新增商品
        </v-btn>
      </v-col>
    </v-row>

    <v-card :loading="loading">
      <v-table>
        <thead>
          <tr>
            <th>商品名稱</th>
            <th>原價 (NT$)</th>
            <th>總庫存</th>
            <th class="text-center">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in products" :key="item.id">
            <td class="font-weight-bold">{{ item.name }}</td>
            <td>{{ item.original_price }}</td>
            <td>
              <v-chip
                size="small"
                :color="item.total_inventory > 0 ? 'success' : 'error'"
              >
                {{ item.total_inventory }}
              </v-chip>
            </td>
            <td class="text-center">
              <v-btn
                icon="mdi-pencil"
                variant="text"
                color="blue"
                @click="openEdit(item)"
              ></v-btn>
              <v-btn
                icon="mdi-delete"
                variant="text"
                color="error"
                @click="deleteProduct(item.id)"
              ></v-btn>
            </td>
          </tr>
          <tr v-if="products.length === 0 && !loading">
            <td colspan="4" class="text-center py-4 text-grey">
              目前尚無商品，點擊右上方新增
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="bg-primary text-white">
          {{ isEdit ? "修改商品資訊" : "新增個人商品" }}
        </v-card-title>
        <v-card-text class="pt-4">
          <v-text-field
            v-model="form.name"
            label="商品名稱"
            placeholder="例如：原創角色壓克力吊飾"
            variant="outlined"
          ></v-text-field>

          <v-row>
            <v-col cols="6">
              <v-text-field
                v-model.number="form.original_price"
                label="原價 (NT$)"
                type="number"
                prefix="$"
                variant="outlined"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <v-text-field
                v-model.number="form.total_inventory"
                label="總庫存"
                type="number"
                variant="outlined"
              ></v-text-field>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog = false">取消</v-btn>
          <v-btn color="primary" :loading="loading" @click="saveProduct"
            >儲存商品</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
interface Product {
  id: number;
  name: string;
  original_price: number;
  total_inventory: number;
  seller_id: number;
}

const supabase = useSupabaseClient();
const userStore = useMainStore();

// 狀態管理
const loading = ref(false);
const products = ref<Product[]>([]);
const dialog = ref(false);
const isEdit = ref(false);
const currentProductId = ref<number | null>(null);

// 表單資料
const form = ref({
  name: "",
  original_price: 0,
  total_inventory: 0,
});

// 1. 取得資料：讀取該賣家的所有商品
const fetchMyProducts = async () => {
  if (!userStore.profile?.id) return;

  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("Products")
      .select("*")
      .eq("seller_id", userStore.profile.id)
      .order("id", { ascending: false });

    if (error) throw error;
    products.value = data || [];
  } catch (err: any) {
    alert("讀取商品失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

// 2. 儲存商品 (新增或修改)
const saveProduct = async () => {
  if (!form.value.name) return;

  loading.value = true;
  const payload = {
    ...form.value,
    seller_id: userStore.profile?.id,
  };

  try {
    if (isEdit.value && currentProductId.value) {
      const { error } = await supabase
        .from("Products")
        .update(payload)
        .eq("id", currentProductId.value);
      if (error) throw error;
    } else {
      const { error } = await supabase.from("Products").insert(payload);
      if (error) throw error;
    }

    dialog.value = false;
    await fetchMyProducts();
  } catch (err: any) {
    alert("儲存失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

// 3. 刪除商品
const deleteProduct = async (id: number) => {
  loading.value = true;

  try {
    // 1. 檢查是否有「展覽攤位」正在使用此商品 (Exhibition_Product_Details)
    const { count: boothCount, error: boothError } = await supabase
      .from("Exhibition_Product_Details")
      .select("*", { count: "exact", head: true })
      .eq("product_id", id);

    if (boothError) throw boothError;

    if (boothCount && boothCount > 0) {
      alert(
        `無法刪除：此商品目前已關聯到 ${boothCount} 個展覽攤位。請先聯絡攤主移除該攤位上的商品設定。`
      );
      return;
    }

    // 2. 檢查是否有「銷售紀錄」 (Sales_Records)
    // 雖然銷售紀錄是連到 Exhibition_Product_Details，
    // 但保險起見，我們檢查該商品的任一 Detail 是否有過 Sales
    const { data: details } = await supabase
      .from("Exhibition_Product_Details")
      .select("id")
      .eq("product_id", id);

    if (details && details.length > 0) {
      const detailIds = details.map((d) => d.id);
      const { count: salesCount, error: salesError } = await supabase
        .from("Sales_Records")
        .select("*", { count: "exact", head: true })
        .in("detail_id", detailIds);

      if (salesError) throw salesError;

      if (salesCount && salesCount > 0) {
        alert(
          `無法刪除：此商品已有 ${salesCount} 筆銷售紀錄。為了保留帳務準確性，建議您將授權關閉或將庫存設為 0，而非刪除商品。`
        );
        return;
      }
    }

    // 3. 通過檢查後才執行刪除
    if (!confirm("確定要刪除此商品嗎？此動作無法復原。")) return;

    const { error: deleteError } = await supabase
      .from("Products")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // 重新整理列表
    await fetchMyProducts();
  } catch (err: any) {
    console.error("刪除檢查失敗:", err);
    alert("刪除失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

// 開啟編輯
const openEdit = (item: Product) => {
  isEdit.value = true;
  currentProductId.value = item.id;
  form.value = {
    name: item.name,
    original_price: item.original_price,
    total_inventory: item.total_inventory,
  };
  dialog.value = true;
};

// 重置表單
const resetForm = () => {
  isEdit.value = false;
  currentProductId.value = null;
  form.value = {
    name: "",
    original_price: 0,
    total_inventory: 0,
  };
};

// 監聽 Dialog 關閉自動清空
watch(dialog, (val) => {
  if (!val) resetForm();
});

onMounted(() => {
  fetchMyProducts();
});
</script>
