<template>
  <v-container>
    <h1 class="text-h4 mb-6 text-primary">攤位商品設定</h1>

    <v-expansion-panels multiple variant="inset">
      <v-expansion-panel
        v-for="booth in boothsData"
        :key="booth.id"
        class="mb-4"
      >
        <v-expansion-panel-title>
          <v-row no-gutters align="center">
            <v-col cols="8">
              <span class="text-h6 font-weight-bold">{{
                booth.exhibitions.name
              }}</span>
              <v-chip size="small" class="ml-2" variant="outlined">
                攤位：{{ booth.booth_number || "未定" }}
              </v-chip>
            </v-col>
            <v-col cols="4" class="text-right pr-4">
              <v-chip
                :color="
                  getStatus(booth.exhibitions.start_date) === 'locked'
                    ? 'error'
                    : 'success'
                "
                size="small"
              >
                {{
                  getStatus(booth.exhibitions.start_date) === "locked"
                    ? "已開始 (鎖定)"
                    : "準備中 (可編輯)"
                }}
              </v-chip>
            </v-col>
          </v-row>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <div class="d-flex justify-end mb-4">
            <v-btn
              v-if="getStatus(booth.exhibitions.start_date) === 'editable'"
              color="primary"
              prepend-icon="mdi-plus"
              @click="openAddDialog(booth.id)"
            >
              上架新商品
            </v-btn>
          </div>

          <v-data-table
            :headers="[
              { title: '商品名稱', key: 'product.name' },
              { title: '原價', key: 'product.original_price' },
              { title: '展覽售價', key: 'event_price' },
              { title: '操作', key: 'actions', align: 'end', sortable: false },
            ]"
            :items="booth.details"
            density="comfortable"
            no-data-text="此攤位尚未設定商品"
          >
            <template v-slot:item.event_price="{ item }">
              <span class="text-primary font-weight-bold"
                >${{ item.event_price }}</span
              >
            </template>

            <template v-slot:item.actions="{ item }">
              <template
                v-if="getStatus(booth.exhibitions.start_date) === 'editable'"
              >
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  color="blue"
                  size="small"
                  @click="openEditDialog(booth.id, item)"
                ></v-btn>

                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  color="error"
                  size="small"
                  @click="removeProduct(item.id)"
                ></v-btn>
              </template>
              <v-icon v-else icon="mdi-lock" color="grey" size="small"></v-icon>
            </template>
          </v-data-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-dialog v-model="addDialog" max-width="500px">
      <v-card>
        <v-card-title>{{
          isEdit ? "修改展覽售價" : "上架商品到攤位"
        }}</v-card-title>
        <v-card-text>
          <v-select
            v-model="eventPriceForm.product_id"
            :items="displayProducts"
            item-title="name"
            item-value="id"
            :label="isEdit ? '正在編輯商品' : '選擇尚未上架的商品'"
            variant="outlined"
            :disabled="isEdit"
            :no-data-text="
              rawAuthorizedProducts.length === 0
                ? '目前無授權商品'
                : '所有授權商品皆已在此攤位上架'
            "
          >
            <template v-slot:item="{ props, item }">
              <v-list-item
                v-bind="props"
                :subtitle="`庫存: ${item.total_inventory} | 賣家: ${item.seller?.nickname}`"
              ></v-list-item>
            </template>
          </v-select>

          <v-text-field
            v-model.number="eventPriceForm.price"
            label="展覽售價"
            prefix="$"
            type="number"
            variant="outlined"
            class="mt-4"
            hint="設定此商品在該場展覽的特別售價"
            persistent-hint
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="addDialog = false">取消</v-btn>
          <v-btn color="primary" :loading="loading" @click="saveProduct">
            {{ isEdit ? "更新售價" : "確認上架" }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const userStore = useMainStore();

// 狀態管理
const loading = ref(false);
const boothsData = ref<any[]>([]); // 存放所有攤位及其商品

// Dialog 控制
const addDialog = ref(false);
const activeBoothId = ref<number | null>(null);
const eventPriceForm = ref({
  product_id: null as number | null,
  price: 0,
});

// 在原本的狀態管理區新增
const isEdit = ref(false);
const currentDetailId = ref<number | null>(null);

const rawAuthorizedProducts = ref<any[]>([]);

const availableProductsForSelect = computed(() => {
  if (!activeBoothId.value) return [];

  // 找出目前選定攤位中，已經上架的商品 ID 列表
  const currentBooth = boothsData.value.find(
    (b) => b.id === activeBoothId.value
  );
  const existingProductIds =
    currentBooth?.details.map((d: any) => d.product.id) || [];

  // 傳回：(具備授權) 且 (庫存 > 0) 且 (不在目前攤位已有的 ID 列表中)
  return rawAuthorizedProducts.value.filter(
    (p) => !existingProductIds.includes(p.id)
  );
});

const displayProducts = computed(() => {
  // 如果是編輯模式，要把「目前這項商品」手動加進去，否則會因為被過濾掉而只顯示 ID
  if (isEdit.value && eventPriceForm.value.product_id) {
    const currentProduct = rawAuthorizedProducts.value.find(
      (p) => p.id === eventPriceForm.value.product_id
    );
    return currentProduct ? [currentProduct] : [];
  }

  // 如果是新增模式，維持原本的「排除已上架」邏輯
  return availableProductsForSelect.value;
});

// 1. 核心查詢：一次抓取「我的攤位」+「對應展覽」+「已上架商品」
const fetchAllData = async () => {
  if (!userStore.profile?.id) return;
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from("Exhibition_Booths")
      .select(
        `
        id, booth_number,
        exhibitions:exhibition_id ( id, name, start_date, end_date ),
        details:Exhibition_Product_Details (
          id, event_price,
          product:product_id ( id, name, original_price )
        )
      `
      )
      .eq("owner_id", userStore.profile.id);

    if (error) throw error;
    boothsData.value = data || [];
  } catch (err: any) {
    alert("讀取失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

// 2. 取得授權清單 (供新增時選擇)
const fetchAuthorized = async () => {
  const { data } = await supabase
    .from("Product_Permissions")
    .select(
      `
      product:product_id ( id, name, original_price, total_inventory, seller:seller_id(nickname) )
    `
    )
    .eq("owner_id", userStore.profile?.id)
    .eq("enable", true);

  if (data) {
    rawAuthorizedProducts.value = data.map((item: any) => item.product);
  }
};

// 3. 判斷展覽狀態
const getStatus = (startDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  return today >= start ? "locked" : "editable";
};

// 4. 新增商品
const openAddDialog = (boothId: number) => {
  activeBoothId.value = boothId;
  isEdit.value = false; // 確保是新增模式
  currentDetailId.value = null;
  eventPriceForm.value = { product_id: null, price: 0 };
  addDialog.value = true;
};

const saveProduct = async () => {
  if (!eventPriceForm.value.product_id || !activeBoothId.value) return;

  loading.value = true;
  try {
    if (isEdit.value && currentDetailId.value) {
      // 執行更新
      const { error } = await supabase
        .from("Exhibition_Product_Details")
        .update({ event_price: eventPriceForm.value.price })
        .eq("id", currentDetailId.value);
      if (error) throw error;
    } else {
      // 執行新增
      const { error } = await supabase
        .from("Exhibition_Product_Details")
        .insert({
          booth_id: activeBoothId.value,
          product_id: eventPriceForm.value.product_id,
          event_price: eventPriceForm.value.price,
        });
      if (error) throw error;
    }

    addDialog.value = false;
    await fetchAllData(); // 重新整理列表
  } catch (err: any) {
    alert("儲存失敗：" + err.message);
  } finally {
    loading.value = false;
  }
};

// 5. 移除商品
const removeProduct = async (detailId: number) => {
  if (!confirm("確定下架此商品？")) return;
  const { error } = await supabase
    .from("Exhibition_Product_Details")
    .delete()
    .eq("id", detailId);
  if (!error) fetchAllData();
};

// 新增開啟編輯彈窗的邏輯
const openEditDialog = (boothId: number, item: any) => {
  activeBoothId.value = boothId;
  isEdit.value = true; // 切換為編輯模式
  currentDetailId.value = item.id;
  eventPriceForm.value = {
    product_id: item.product.id,
    price: item.event_price,
  };
  addDialog.value = true;
};

onMounted(() => {
  fetchAllData();
  fetchAuthorized();
});
</script>
