<template>
  <v-container>
    <v-row align="end" class="mb-10">
      <v-col>
        <p class="text-display-medium font-weight-black text-black mb-2">
          設定攤位商品
        </p>
        <p class="text-grey-darken-1 mb-0">各攤位銷售品項的上架與價格設定。</p>
      </v-col>
    </v-row>

    <v-expansion-panels multiple variant="accordion">
      <v-expansion-panel
        v-for="booth in boothsData"
        :key="booth.id"
        class="mb-4"
      >
        <v-expansion-panel-title class="bg-grey-lighten-4">
          <v-row no-gutters align="center">
            <v-col cols="8">
              <span class="font-weight-bold text-primary">{{
                booth.exhibitions.name
              }}</span>
              <v-chip size="small" class="ml-2" variant="outlined">
                攤位：{{ booth.booth_number || "未定" }}
              </v-chip>
              <v-chip
                :color="booth.details.length ? 'primary' : 'error'"
                class="ml-2"
                size="small"
              >
                數量：{{ booth.details.length }}
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
              <v-btn
                v-if="getStatus(booth.exhibitions.start_date) === 'editable'"
                color="primary"
                prepend-icon="mdi-plus"
                size="small"
                class="ml-4"
                @click="openAddDialog(booth.id)"
              >
                上架新商品
              </v-btn>
            </v-col>
          </v-row>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-data-table
            :headers="headers"
            :items="booth.details"
            density="comfortable"
            class="elevation-0"
            hide-default-footer
            disable-sort
          >
            <template v-slot:item.product.name="{ item }">
              <div class="d-flex align-center py-3">
                <v-avatar
                  :color="item.is_paid ? 'blue-lighten-5' : 'grey-lighten-4'"
                  rounded="lg"
                  size="36"
                  class="mr-3"
                >
                  <v-icon :color="item.is_paid ? 'blue' : 'grey'" size="18">
                    {{
                      item.is_paid
                        ? "mdi-check-decagram"
                        : "mdi-package-variant"
                    }}
                  </v-icon>
                </v-avatar>
                <div
                  class="font-weight-bold"
                  :class="item.is_paid ? 'text-grey' : ''"
                >
                  {{ item.product.name }}
                </div>
              </div>
            </template>

            <template v-slot:item.status="{ item }">
              <v-chip
                v-if="item.is_paid"
                color="blue"
                size="x-small"
                variant="flat"
                class="font-weight-bold"
                prepend-icon="mdi-shield-check"
              >
                已結清
              </v-chip>
              <v-chip
                v-else
                color="orange-darken-1"
                size="x-small"
                variant="tonal"
                class="font-weight-bold"
                prepend-icon="mdi-clock-outline"
              >
                銷售中
              </v-chip>
            </template>

            <template v-slot:item.event_price="{ item }">
              <div class="d-flex flex-column">
                <span
                  :class="
                    item.is_paid
                      ? 'text-grey'
                      : 'text-primary font-weight-black'
                  "
                >
                  ${{ item.event_price }}
                </span>
                <span
                  v-if="item.event_price !== item.product.original_price"
                  class="text-caption text-grey text-decoration-line-through"
                >
                  ${{ item.product.original_price }}
                </span>
              </div>
            </template>

            <template v-slot:item.product.total_inventory="{ item }">
              <span
                :class="
                  item.product.total_inventory <= 5
                    ? 'text-error font-weight-bold'
                    : ''
                "
              >
                {{ item.product.total_inventory }} <small>pcs</small>
              </span>
            </template>

            <template v-slot:item.actions="{ item }">
              <div v-if="item.is_paid" class="d-flex align-center justify-end">
                <v-tooltip text="賣家已結清帳務，無法修改" location="top">
                  <template v-slot:activator="{ props }">
                    <v-chip
                      v-bind="props"
                      size="x-small"
                      color="blue-lighten-4"
                      text-color="blue-darken-2"
                      variant="flat"
                      class="px-2"
                    >
                      <v-icon start icon="mdi-lock" size="12"></v-icon>
                      帳務鎖定
                    </v-chip>
                  </template>
                </v-tooltip>
              </div>

              <div
                v-else-if="
                  getStatus(booth.exhibitions.start_date) === 'editable'
                "
                class="d-flex justify-end"
              >
                <v-btn
                  icon="mdi-pencil-outline"
                  variant="text"
                  color="blue-darken-1"
                  size="small"
                  @click="openEditDialog(booth.id, item)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete-outline"
                  variant="text"
                  color="error"
                  size="small"
                  @click="removeProduct(item.id)"
                ></v-btn>
              </div>

              <div v-else class="d-flex align-center justify-end">
                <v-icon
                  icon="mdi-lock-clock"
                  color="grey-lighten-1"
                  size="small"
                  class="mr-1"
                ></v-icon>
                <span class="text-caption text-grey-lighten-1">活動中鎖定</span>
              </div>
            </template>

            <template v-slot:no-data>
              <div class="pa-10 text-grey">目前尚無商品，請新增商品</div>
            </template>
          </v-data-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-dialog
      v-model="addDialog"
      max-width="560px"
      persistent
      transition="dialog-bottom-transition"
    >
      <v-card class="rounded-xl overflow-hidden elevation-24 bg-surface">
        <div
          class="px-6 py-5 bg-grey-lighten-5 border-b d-flex justify-space-between align-center"
        >
          <h3 class="font-weight-black text-grey-darken-4">
            {{ isEdit ? "修改展覽售價" : "上架商品到攤位" }}
          </h3>
          <v-btn
            icon="mdi-close"
            variant="text"
            color="grey-darken-1"
            @click="addDialog = false"
          ></v-btn>
        </div>

        <v-card-text class="pa-8">
          <div class="mb-6">
            <label
              class="text-subtitle-2 font-weight-bold text-grey-darken-2 d-block mb-2"
            >
              {{ isEdit ? "正在編輯商品" : "選擇尚未上架的商品" }}
            </label>
            <v-select
              v-model="eventPriceForm.product_id"
              :items="displayProducts"
              item-title="name"
              item-value="id"
              placeholder="請選擇授權商品"
              variant="filled"
              flat
              hide-details
              bg-color="grey-lighten-4"
              rounded="t-lg"
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
                >
                  <template v-slot:prepend>
                    <v-icon color="grey-darken-1">mdi-package-variant</v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-select>
          </div>

          <div class="mb-6">
            <label
              class="text-subtitle-2 font-weight-bold text-grey-darken-2 d-block mb-2"
            >
              展覽售價 (NT$)
            </label>
            <v-text-field
              v-model.number="eventPriceForm.price"
              type="number"
              prefix="$"
              placeholder="請輸入展場售價"
              variant="filled"
              flat
              hide-details
              bg-color="grey-lighten-4"
              rounded="t-lg"
            ></v-text-field>
          </div>

          <div class="bg-blue-lighten-5 pa-4 rounded-lg d-flex align-start">
            <v-icon color="primary" class="mr-3 mt-1" size="20"
              >mdi-tag-outline</v-icon
            >
            <div class="text-caption text-blue-darken-4 leading-relaxed">
              <strong>定價提示：</strong>
              您可以針對不同展覽設定不同的售價。此價格僅會影響該攤位的 POS
              結帳金額，不會修改原始商品的設定價格。
            </div>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="px-8 py-6 bg-grey-lighten-5">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            class="font-weight-bold px-6 text-grey-darken-1"
            @click="addDialog = false"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            class="font-weight-bold px-8 rounded-lg"
            height="44"
            variant="flat"
            :disabled="!eventPriceForm.product_id"
            :loading="loading"
            @click="saveProduct"
          >
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

const headers: ReadonlyArray<{
  title: string;
  key: string;
  width?: string;
  align?: "start" | "end" | "center";
}> = [
  { title: "商品資訊", key: "product.name", align: "start" },
  {
    title: "對帳狀態",
    key: "status",
    width: "120px",
    align: "center",
  },
  { title: "原價", key: "product.original_price", align: "start" },
  { title: "現場售價", key: "event_price", align: "start" },
  {
    title: "目前庫存",
    key: "product.total_inventory",
    align: "center",
  },
  { title: "操作", key: "actions", align: "end" },
];

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
          id, event_price, is_paid,
          product:product_id ( id, name, original_price, total_inventory )
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

// 5. 移除商品 (下架) - 強化版
const removeProduct = async (detailId: number) => {
  // 找出該筆 detail 的資料
  let targetDetail: any = null;
  boothsData.value.forEach((b) => {
    const found = b.details.find((d: any) => d.id === detailId);
    if (found) targetDetail = found;
  });

  // 1. 檢查是否已收款
  if (targetDetail?.is_paid) {
    alert("無法下架：賣家已確認此商品的收款並結案，資料已鎖定。");
    return;
  }

  loading.value = true;
  try {
    // 2. 檢查是否有銷售紀錄
    const { count, error: salesError } = await supabase
      .from("Sales_Records")
      .select("*", { count: "exact", head: true })
      .eq("detail_id", detailId);

    if (salesError) throw salesError;

    if (count && count > 0) {
      alert(
        `無法下架：此商品在此攤位已有 ${count} 筆銷售紀錄，請先前往「銷售紀錄」處理。`
      );
      return;
    }

    // ... 其餘原本的刪除邏輯 ...
    if (!confirm("確定要下架此商品嗎？")) return;

    const { error: deleteError } = await supabase
      .from("Exhibition_Product_Details")
      .delete()
      .eq("id", detailId);

    if (deleteError) throw deleteError;
    await fetchAllData();
  } catch (err: any) {
    alert("操作失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

// 新增開啟編輯彈窗的邏輯
const openEditDialog = (boothId: number, item: any) => {
  if (item.is_paid) {
    alert("此商品已結清，無法修改售價。");
    return;
  }
  activeBoothId.value = boothId;
  isEdit.value = true;
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
