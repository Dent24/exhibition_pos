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
              <span
                :class="
                  item.is_paid ? 'text-grey' : 'text-primary font-weight-black'
                "
              >
                ${{ item.event_price }}
              </span>
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
      scrollable
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

          <div
            v-if="isBundleMode && bundleForm.selectedProducts.length > 0"
            class="mt-4"
          >
            <label
              class="text-subtitle-2 font-weight-bold text-grey-darken-2 d-block mb-2"
            >
              拆帳權重設定 (預設按原價比例)
            </label>
            <v-list
              density="compact"
              bg-color="grey-lighten-5"
              class="rounded-lg"
            >
              <v-list-item
                v-for="pid in bundleForm.selectedProducts"
                :key="pid"
              >
                <v-row align="center" no-gutters>
                  <v-col cols="6" class="text-caption">
                    {{ rawAuthorizedProducts.find((p) => p.id === pid)?.name }}
                  </v-col>
                  <v-col cols="6">
                    <v-text-field
                      v-model.number="bundleForm.weights[pid]"
                      type="number"
                      density="compact"
                      hide-details
                      variant="outlined"
                      prefix="W"
                    ></v-text-field>
                  </v-col>
                </v-row>
              </v-list-item>
            </v-list>
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

useHead({
  title: "設定攤位商品",
});

const loading = ref(false);
const boothsData = ref<any[]>([]);
const rawAuthorizedProducts = ref<any[]>([]);
const addDialog = ref(false);
const activeBoothId = ref<number | null>(null);
const isEdit = ref(false);
const isBundleMode = ref(false);
const currentDetailId = ref<number | null>(null);

const eventPriceForm = ref({ product_id: null as number | null, price: 0 });
const bundleForm = ref({
  name: "",
  selectedProducts: [] as number[],
  weights: {} as Record<number, number>,
});

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
          items:Bundle_Items ( 
            share_weight, 
            product:product_id ( id, name, original_price, total_inventory ) 
          ) 
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
    isBundleMode.value = true;
    bundleForm.value.name = item.bundle.name;

    // 關鍵：從資料庫回傳的 bundle.items 中提取商品 ID 與對應的權重
    const selectedPids: number[] = [];
    const weights: Record<number, number> = {};

    item.bundle.items.forEach((i: any) => {
      const pid = i.product.id;
      selectedPids.push(pid);
      // 帶入該商品在該組合包中設定的權重
      weights[pid] = i.share_weight || i.product.original_price;
    });

    bundleForm.value.selectedProducts = selectedPids;
    bundleForm.value.weights = weights;
  } else {
    isBundleMode.value = false;
    eventPriceForm.value.product_id = item.product.id;
  }
  addDialog.value = true;
};

const saveItem = async () => {
  // 基本驗證
  if (isBundleMode.value && !bundleForm.value.name)
    return alert("請輸入組合包名稱");
  if (!isBundleMode.value && !eventPriceForm.value.product_id)
    return alert("請選擇商品");
  if (isEdit.value && !currentDetailId.value)
    return alert("找不到編輯對象，請重新開啟視窗");

  loading.value = true;
  try {
    let finalBundleId = null;

    if (isBundleMode.value) {
      if (isEdit.value) {
        // --- 1. 編輯組合包模式 ---
        // 找到目前的 detail 以獲取 bundle_id
        const detail = boothsData.value
          .flatMap((b) => b.details)
          .find((d) => d.id === currentDetailId.value);

        finalBundleId = detail?.bundle?.id;

        if (!finalBundleId) throw new Error("找不到對應的組合包 ID");

        // 更新組合包名稱
        const { error: nameErr } = await supabase
          .from("Product_Bundles")
          .update({ name: bundleForm.value.name })
          .eq("id", finalBundleId);
        if (nameErr) throw nameErr;

        // 更新權重 (Bundle_Items)
        const updatePromises = bundleForm.value.selectedProducts.map((pid) => {
          const weight = bundleForm.value.weights[pid];
          return supabase
            .from("Bundle_Items")
            .update({ share_weight: weight })
            .eq("bundle_id", finalBundleId)
            .eq("product_id", Number(pid));
        });

        const results = await Promise.all(updatePromises);
        const firstError = results.find((r) => r.error)?.error;
        if (firstError) throw firstError;
      } else {
        // --- 2. 新增組合包模式 ---
        const { data: bData, error: bErr } = await supabase
          .from("Product_Bundles")
          .insert({
            booth_id: activeBoothId.value,
            name: bundleForm.value.name,
          })
          .select()
          .single();
        if (bErr) throw bErr;

        finalBundleId = bData.id;

        const items = bundleForm.value.selectedProducts.map((pid) => ({
          bundle_id: finalBundleId,
          product_id: Number(pid),
          share_weight: bundleForm.value.weights[pid] || 0,
        }));
        const { error: iErr } = await supabase
          .from("Bundle_Items")
          .insert(items);
        if (iErr) throw iErr;
      }
    }

    // --- 3. 處理展覽明細 (Exhibition_Product_Details) ---
    if (isEdit.value) {
      // 編輯既有明細
      const { error: detailUpdateErr } = await supabase
        .from("Exhibition_Product_Details")
        .update({ event_price: eventPriceForm.value.price })
        .eq("id", Number(currentDetailId.value)); // 確保是數字型別
      if (detailUpdateErr) throw detailUpdateErr;
    } else {
      // 新增上架明細
      const insertData = {
        booth_id: activeBoothId.value,
        event_price: eventPriceForm.value.price,
        is_paid: false,
      };

      if (isBundleMode.value) {
        insertData.bundle_id = finalBundleId;
        insertData.product_id = null;
      } else {
        insertData.product_id = eventPriceForm.value.product_id;
        insertData.bundle_id = null;
      }

      const { error: detailInsertErr } = await supabase
        .from("Exhibition_Product_Details")
        .insert(insertData);
      if (detailInsertErr) throw detailInsertErr;
    }

    addDialog.value = false;
    await fetchAllData();
    alert(isEdit.value ? "修改成功" : "上架成功");
  } catch (err) {
    console.error("Save Error:", err);
    alert("儲存失敗：" + (err.message || "未知錯誤"));
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

watch(
  () => bundleForm.value.selectedProducts,
  (newPids) => {
    // 如果 newPids 為空，清空 weights 並結束
    if (!newPids || newPids.length === 0) {
      bundleForm.value.weights = {};
      return;
    }

    const newWeights: Record<number, number> = { ...bundleForm.value.weights };

    newPids.forEach((pid) => {
      // 只有在權重尚未設定時才自動填入原價
      if (newWeights[pid] === undefined) {
        const product = rawAuthorizedProducts.value.find((p) => p.id === pid);
        newWeights[pid] = product?.original_price || 1;
      }
    });

    // 移除已經不在選擇清單中的權重（保持資料整潔）
    Object.keys(newWeights).forEach((key) => {
      if (!newPids.includes(Number(key))) {
        delete newWeights[Number(key)];
      }
    });

    // 重新賦值以確保響應式
    bundleForm.value.weights = newWeights;
  },
  { deep: true }
);

onMounted(() => {
  fetchAllData();
  fetchAuthorized();
});
</script>
