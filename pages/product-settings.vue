<template>
  <v-container>
    <v-row align="end" class="mb-10">
      <v-col>
        <p class="text-display-medium font-weight-black text-black mb-2">
          設定商品
        </p>
        <p class="text-grey-darken-1 mb-0">管理您的個人原創商品與庫存數量。</p>
      </v-col>
      <v-col cols="auto">
        <v-btn
          class="font-weight-bold"
          color="primary"
          prepend-icon="mdi-plus"
          size="large"
          rounded="lg"
          @click="
            dialog = true;
            isEdit = false;
          "
        >
          新增商品
        </v-btn>
      </v-col>
    </v-row>

    <v-card class="rounded-xl border-sm" elevation="0">
      <v-data-table
        :headers="headers"
        :items="productTableItems"
        :loading="loading"
        class="elevation-0"
        disable-sort
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center py-3">
            <v-avatar
              :color="item.color"
              class="mr-4"
              rounded="lg"
              size="40"
              variant="tonal"
            >
              <v-icon :color="item.color">{{ item.icon }}</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-bold text-subtitle-1">
                {{ item.name }}
              </div>
              <div class="text-caption text-grey">商品編號: #{{ item.id }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.original_price="{ item }">
          <span class="font-weight-medium">{{ item.priceDisplay }}</span>
        </template>

        <template v-slot:item.total_inventory="{ item }">
          <v-chip
            :color="item.color"
            size="small"
            variant="flat"
            class="font-weight-bold"
          >
            {{ item.total_inventory }} 件
          </v-chip>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-btn
              color="blue-darken-1"
              icon="mdi-pencil-outline"
              size="small"
              variant="text"
              @click="openEdit(item)"
            ></v-btn>
            <v-btn
              color="error"
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              @click="deleteProduct(item.id)"
            ></v-btn>
          </div>
        </template>

        <template v-slot:no-data>
          <div class="pa-10 text-grey">目前尚無商品，點擊右上方新增</div>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog
      v-model="dialog"
      max-width="560px"
      persistent
      transition="dialog-bottom-transition"
    >
      <v-card class="rounded-xl overflow-hidden elevation-24 bg-surface">
        <div
          class="px-6 py-5 bg-grey-lighten-5 border-b d-flex justify-space-between align-center"
        >
          <h3 class="text-h6 font-weight-black text-grey-darken-4">
            {{ isEdit ? "修改商品資訊" : "新增個人商品" }}
          </h3>
          <v-btn
            icon="mdi-close"
            variant="text"
            color="grey-darken-1"
            @click="dialog = false"
          ></v-btn>
        </div>

        <v-card-text class="pa-8">
          <div class="mb-6">
            <label
              class="text-subtitle-2 font-weight-bold text-grey-darken-2 d-block mb-2"
              >商品名稱</label
            >
            <v-text-field
              v-model="form.name"
              placeholder="例如：原創角色壓克力吊飾"
              variant="filled"
              flat
              hide-details
              bg-color="grey-lighten-4"
              rounded="t-lg"
            ></v-text-field>
          </div>

          <v-row class="mb-4">
            <v-col cols="6">
              <label
                class="text-subtitle-2 font-weight-bold text-grey-darken-2 d-block mb-2"
                >原價 (NT$)</label
              >
              <v-text-field
                v-model.number="form.original_price"
                type="number"
                prefix="$"
                variant="filled"
                flat
                hide-details
                bg-color="grey-lighten-4"
                rounded="t-lg"
              ></v-text-field>
            </v-col>
            <v-col cols="6">
              <label
                class="text-subtitle-2 font-weight-bold text-grey-darken-2 d-block mb-2"
                >總庫存</label
              >
              <v-text-field
                v-model.number="form.total_inventory"
                type="number"
                variant="filled"
                flat
                hide-details
                bg-color="grey-lighten-4"
                rounded="t-lg"
              ></v-text-field>
            </v-col>
          </v-row>

          <div class="bg-blue-lighten-5 pa-4 rounded-lg d-flex align-center">
            <v-icon color="primary" class="mr-3" size="20"
              >mdi-information</v-icon
            >
            <div class="text-caption text-blue-darken-4 leading-relaxed">
              庫存設定為總發放/製作數量。若已在展覽中售出，系統會自動在結帳後扣除剩餘庫存。
            </div>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="px-8 py-6 bg-grey-lighten-5">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            class="font-weight-bold px-6 text-grey-darken-1"
            @click="dialog = false"
            >取消</v-btn
          >
          <v-btn
            color="primary"
            class="font-weight-bold px-8 rounded-lg"
            height="44"
            variant="flat"
            :disabled="!form.name"
            :loading="loading"
            @click="saveProduct"
          >
            儲存商品
          </v-btn>
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

const headers: ReadonlyArray<{
  title: string;
  key: string;
  align?: "start" | "end" | "center";
}> = [
  { title: "商品資訊", key: "name", align: "start" },
  { title: "原價 (NT$)", key: "original_price", align: "start" },
  { title: "當前庫存", key: "total_inventory", align: "start" },
  { title: "操作", key: "actions", align: "end" },
];

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

const productTableItems = computed(() => {
  return products.value.map((item) => ({
    ...item,
    // 根據庫存狀況給予不同顏色與圖示
    color:
      item.total_inventory > 10
        ? "primary"
        : item.total_inventory > 0
        ? "orange"
        : "error",
    icon:
      item.total_inventory > 0
        ? "mdi-package-variant-closed"
        : "mdi-package-variant-remove",
    priceDisplay: `NT$ ${item.original_price.toLocaleString()}`,
  }));
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
