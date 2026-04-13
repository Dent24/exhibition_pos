<template>
  <v-container>
    <v-row align="end" class="mb-10">
      <v-col>
        <p class="text-display-medium font-weight-black text-black mb-2">
          設定攤位商品
        </p>
        <p class="text-grey-darken-1 mb-0">
          各攤位銷售品項的上架、價格與組合包設定。
        </p>
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
                項目數：{{ booth.details.length }}
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

              <v-menu
                v-if="getStatus(booth.exhibitions.start_date) === 'editable'"
              >
                <template v-slot:activator="{ props }">
                  <v-btn
                    color="primary"
                    prepend-icon="mdi-plus"
                    size="small"
                    class="ml-4"
                    v-bind="props"
                  >
                    上架新項目
                  </v-btn>
                </template>
                <v-list density="compact" class="py-0">
                  <v-list-item
                    prepend-icon="mdi-package-variant"
                    title="上架單一商品"
                    @click="openAddDialog(booth.id, 'product')"
                  ></v-list-item>
                  <v-list-item
                    prepend-icon="mdi-gift-outline"
                    title="建立組合優惠"
                    @click="openAddDialog(booth.id, 'bundle')"
                  ></v-list-item>
                </v-list>
              </v-menu>
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
                  :color="
                    item.bundle
                      ? 'purple-lighten-5'
                      : item.is_paid
                      ? 'blue-lighten-5'
                      : 'grey-lighten-4'
                  "
                  rounded="lg"
                  size="36"
                  class="mr-3"
                >
                  <v-icon
                    :color="
                      item.bundle ? 'purple' : item.is_paid ? 'blue' : 'grey'
                    "
                    size="18"
                  >
                    {{
                      item.bundle
                        ? "mdi-gift-outline"
                        : item.is_paid
                        ? "mdi-check-decagram"
                        : "mdi-package-variant"
                    }}
                  </v-icon>
                </v-avatar>
                <div>
                  <div
                    class="font-weight-bold"
                    :class="item.is_paid ? 'text-grey' : ''"
                  >
                    <template v-if="item.bundle">
                      {{ item.bundle?.name }}
                      <span class="text-grey-darken-1 font-weight-regular">
                        ({{
                          item.bundle.items
                            .map((i) => i.product.name)
                            .join(", ")
                        }})
                      </span>
                    </template>
                    <template v-else>
                      {{ item.product?.name }}
                    </template>
                  </div>
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

            <template v-slot:item.product.original_price="{ item }">
              <div v-if="item.bundle" class="d-flex flex-column">
                <span class="text-grey-darken-2 font-weight-bold"
                  >${{ calculateBundleOriginalPrice(item.bundle) }}</span
                >
                <span class="text-caption text-purple">組合原價</span>
              </div>
              <span v-else>${{ item.product?.original_price }}</span>
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
                  v-if="
                    !item.bundle &&
                    item.product &&
                    item.event_price !== item.product.original_price
                  "
                  class="text-caption text-grey text-decoration-line-through"
                >
                  ${{ item.product.original_price }}
                </span>
              </div>
            </template>

            <template v-slot:item.product.total_inventory="{ item }">
              <div v-if="item.bundle">
                <span
                  :class="
                    calculateBundleStock(item.bundle) <= 5
                      ? 'text-error font-weight-bold'
                      : ''
                  "
                >
                  {{ calculateBundleStock(item.bundle) }} <small>sets</small>
                </span>
              </div>
              <span
                v-else
                :class="
                  item.product?.total_inventory <= 5
                    ? 'text-error font-weight-bold'
                    : ''
                "
              >
                {{ item.product?.total_inventory }} <small>pcs</small>
              </span>
            </template>

            <template v-slot:item.actions="{ item }">
              <div v-if="item.is_paid" class="d-flex align-center justify-end">
                <v-chip
                  size="x-small"
                  color="blue-lighten-4"
                  text-color="blue-darken-2"
                  variant="flat"
                >
                  <v-icon start icon="mdi-lock" size="12"></v-icon> 帳務鎖定
                </v-chip>
              </div>

              <div
                v-else-if="
                  getStatus(
                    getBoothByDetailId(item.id)?.exhibitions.start_date
                  ) === 'editable'
                "
                class="d-flex justify-end"
              >
                <v-btn
                  icon="mdi-pencil-outline"
                  variant="text"
                  color="blue-darken-1"
                  size="small"
                  @click="openEditDialog(getBoothByDetailId(item.id)?.id, item)"
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
                ></v-icon>
              </div>
            </template>

            <template v-slot:no-data>
              <div class="pa-10 text-grey">
                目前尚無項目，請新增商品或組合包
              </div>
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
      <v-card class="rounded-xl overflow-hidden elevation-24">
        <div
          class="px-6 py-5 bg-grey-lighten-5 border-b d-flex justify-space-between align-center"
        >
          <h3 class="font-weight-black text-grey-darken-4">
            {{
              isBundleMode
                ? "設定組合販售"
                : isEdit
                ? "修改展覽售價"
                : "上架商品到攤位"
            }}
          </h3>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="addDialog = false"
          ></v-btn>
        </div>

        <v-card-text class="pa-8">
          <div v-if="isBundleMode" class="mb-6">
            <label
              class="text-subtitle-2 font-weight-bold text-grey-darken-2 d-block mb-2"
              >組合包名稱</label
            >
            <v-text-field
              v-model="bundleForm.name"
              :disabled="isEdit"
              placeholder="例如：新刊豪華套組"
              variant="filled"
              flat
              hide-details
              bg-color="grey-lighten-4"
              rounded="t-lg"
            ></v-text-field>

            <label
              class="text-subtitle-2 font-weight-bold text-grey-darken-2 d-block mt-4 mb-2"
              >選擇內容物</label
            >
            <v-select
              v-model="bundleForm.selectedProducts"
              :items="rawAuthorizedProducts"
              item-title="name"
              item-value="id"
              :disabled="isEdit"
              placeholder="請選擇商品 (可多選)"
              multiple
              chips
              variant="filled"
              flat
              hide-details
              bg-color="grey-lighten-4"
            ></v-select>
          </div>

          <div v-else class="mb-6">
            <label
              class="text-subtitle-2 font-weight-bold text-grey-darken-2 d-block mb-2"
              >選擇商品</label
            >
            <v-select
              v-model="eventPriceForm.product_id"
              :items="displayProducts"
              item-title="name"
              item-value="id"
              :disabled="isEdit"
              variant="filled"
              flat
              hide-details
              bg-color="grey-lighten-4"
            ></v-select>
          </div>

          <div class="mb-6">
            <label
              class="text-subtitle-2 font-weight-bold text-grey-darken-2 d-block mb-2"
              >展覽售價 (NT$)</label
            >
            <v-text-field
              v-model.number="eventPriceForm.price"
              type="number"
              prefix="$"
              variant="filled"
              flat
              hide-details
              bg-color="grey-lighten-4"
            ></v-text-field>
          </div>
        </v-card-text>

        <v-card-actions class="px-8 py-6 bg-grey-lighten-5">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="addDialog = false">取消</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            :loading="loading"
            @click="saveItem"
            >確認上架</v-btn
          >
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
  { title: "項目資訊", key: "product.name", align: "start" },
  { title: "對帳狀態", key: "status", width: "120px", align: "center" },
  { title: "原價", key: "product.original_price", align: "start" },
  { title: "現場售價", key: "event_price", align: "start" },
  { title: "目前庫存", key: "product.total_inventory", align: "center" },
  { title: "操作", key: "actions", align: "end" },
];

const loading = ref(false);
const boothsData = ref<any[]>([]);
const rawAuthorizedProducts = ref<any[]>([]);
const addDialog = ref(false);
const activeBoothId = ref<number | null>(null);
const isEdit = ref(false);
const isBundleMode = ref(false);
const currentDetailId = ref<number | null>(null);

const eventPriceForm = ref({ product_id: null as number | null, price: 0 });
const bundleForm = ref({ name: "", selectedProducts: [] as number[] });

// --- 修正後的邏輯函式 ---

// 計算組合包原價總和
const calculateBundleOriginalPrice = (bundle: any) => {
  if (!bundle?.items?.length) return 0;
  return bundle.items.reduce(
    (sum: number, item: any) => sum + (item.product?.original_price || 0),
    0
  );
};

// 計算組合包最少庫存
const calculateBundleStock = (bundle: any) => {
  if (!bundle?.items?.length) return 0;
  return Math.min(
    ...bundle.items.map((i: any) => i.product?.total_inventory || 0)
  );
};

const getBoothByDetailId = (detailId: number) => {
  return boothsData.value.find((b) =>
    b.details.some((d: any) => d.id === detailId)
  );
};

const getStatus = (startDate: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  return today >= start ? "locked" : "editable";
};

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
          product:product_id ( id, name, original_price, total_inventory ),
          bundle:bundle_id ( 
            id, name, 
            items:Bundle_Items ( product:product_id ( id, name, original_price, total_inventory ) ) 
          )
        )
      `
      )
      .eq("owner_id", userStore.profile.id);
    if (error) throw error;
    boothsData.value = data || [];
  } catch (err: any) {
    console.error("Fetch Error:", err.message);
  } finally {
    loading.value = false;
  }
};

const fetchAuthorized = async () => {
  const { data } = await supabase
    .from("Product_Permissions")
    .select(
      `product:product_id ( id, name, original_price, total_inventory, seller:seller_id(nickname) )`
    )
    .eq("owner_id", userStore.profile?.id)
    .eq("enable", true);
  if (data) rawAuthorizedProducts.value = data.map((item: any) => item.product);
};

const displayProducts = computed(() => {
  if (isEdit.value) return rawAuthorizedProducts.value;
  const currentBooth = boothsData.value.find(
    (b) => b.id === activeBoothId.value
  );
  const existingIds =
    currentBooth?.details.map((d: any) => d.product?.id).filter(Boolean) || [];
  return rawAuthorizedProducts.value.filter((p) => !existingIds.includes(p.id));
});

const openAddDialog = (boothId: number, mode: "product" | "bundle") => {
  activeBoothId.value = boothId;
  isBundleMode.value = mode === "bundle";
  isEdit.value = false;
  eventPriceForm.value = { product_id: null, price: 0 };
  bundleForm.value = { name: "", selectedProducts: [] };
  addDialog.value = true;
};

// 修正後的編輯 Dialog 開啟邏輯
const openEditDialog = (boothId: number, item: any) => {
  activeBoothId.value = boothId;
  isEdit.value = true;
  currentDetailId.value = item.id;
  eventPriceForm.value.price = item.event_price;

  if (item.bundle) {
    // 進入組合包編輯模式 (目前僅支援改價)
    isBundleMode.value = true;
    bundleForm.value.name = item.bundle.name;
    bundleForm.value.selectedProducts = item.bundle.items.map(
      (i: any) => i.product.id
    );
  } else {
    // 進入單品編輯模式
    isBundleMode.value = false;
    eventPriceForm.value.product_id = item.product.id;
  }
  addDialog.value = true;
};

const saveItem = async () => {
  if (isBundleMode.value && !bundleForm.value.name) return alert("請輸入名稱");
  if (!isBundleMode.value && !eventPriceForm.value.product_id)
    return alert("請選擇商品");

  loading.value = true;
  try {
    let finalBundleId = null;

    // 只有在「非編輯模式」的新增情況下才建立組合包
    if (isBundleMode.value && !isEdit.value) {
      const { data: bData, error: bErr } = await supabase
        .from("Product_Bundles")
        .insert({ booth_id: activeBoothId.value, name: bundleForm.value.name })
        .select()
        .single();
      if (bErr) throw bErr;
      const items = bundleForm.value.selectedProducts.map((pid) => ({
        bundle_id: bData.id,
        product_id: pid,
      }));
      await supabase.from("Bundle_Items").insert(items);
      finalBundleId = bData.id;
    }

    if (isEdit.value) {
      // 修改僅更新現場售價
      await supabase
        .from("Exhibition_Product_Details")
        .update({ event_price: eventPriceForm.value.price })
        .eq("id", currentDetailId.value);
    } else {
      // 新增明細
      await supabase.from("Exhibition_Product_Details").insert({
        booth_id: activeBoothId.value,
        product_id: isBundleMode.value ? null : eventPriceForm.value.product_id,
        bundle_id: finalBundleId,
        event_price: eventPriceForm.value.price,
      });
    }
    addDialog.value = false;
    await fetchAllData();
  } catch (err: any) {
    alert(err.message);
  } finally {
    loading.value = false;
  }
};

const removeProduct = async (detailId: number) => {
  // 1. 找到該筆資料，判斷是單品還是組合包
  let targetDetail: any = null;
  boothsData.value.forEach((b) => {
    const found = b.details.find((d: any) => d.id === detailId);
    if (found) targetDetail = found;
  });

  if (!targetDetail) return;

  const isBundle = !!targetDetail.bundle;
  const message = isBundle
    ? `確定要下架組合包「${targetDetail.bundle?.name}」嗎？\n這將會同步刪除該組合的定義與配方。`
    : `確定要下架商品「${targetDetail.product?.name}」嗎？`;

  if (!confirm(message)) return;

  loading.value = true;
  try {
    // 2. 檢查是否有銷售紀錄 (安全性檢查)
    const { count, error: salesError } = await supabase
      .from("Sales_Records")
      .select("*", { count: "exact", head: true })
      .eq("detail_id", detailId);

    if (salesError) throw salesError;
    if (count && count > 0) {
      alert(`無法下架：此項目已有 ${count} 筆銷售紀錄，無法刪除。`);
      return;
    }

    // 3. 執行刪除 (核心修正：手動處理關聯刪除順序)
    if (isBundle) {
      const bundleId = targetDetail.bundle.id;

      // 第一步：先刪除展覽明細 (Exhibition_Product_Details)
      const { error: detailErr } = await supabase
        .from("Exhibition_Product_Details")
        .delete()
        .eq("id", detailId);
      if (detailErr) throw detailErr;

      // 第二步：刪除組合包內的商品清單 (Bundle_Items)
      // 這是解決你錯誤訊息的關鍵！
      const { error: itemsErr } = await supabase
        .from("Bundle_Items")
        .delete()
        .eq("bundle_id", bundleId);
      if (itemsErr) throw itemsErr;

      // 第三步：最後刪除組合包定義 (Product_Bundles)
      const { error: bundleErr } = await supabase
        .from("Product_Bundles")
        .delete()
        .eq("id", bundleId);
      if (bundleErr) throw bundleErr;
    } else {
      // 單純刪除單品明細
      const { error: err } = await supabase
        .from("Exhibition_Product_Details")
        .delete()
        .eq("id", detailId);
      if (err) throw err;
    }

    await fetchAllData();
    alert("已成功下架項目");
  } catch (err: any) {
    alert("操作失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchAllData();
  fetchAuthorized();
});
</script>
