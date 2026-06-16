<template>
  <v-container>
    <v-row align="end" class="mb-6 mb-md-10">
      <v-col cols="12" sm="">
        <p
          class="font-weight-black text-black mb-2"
          :class="mobile ? 'text-h5' : 'text-display-medium'"
        >
          攤位銷售紀錄
        </p>
        <p class="text-grey-darken-1 mb-0">
          查看各攤位總收入及每筆訂單明細，以展覽售價為計算基準。
        </p>
      </v-col>
      <v-col cols="12" sm="auto" class="text-right">
        <v-btn
          color="primary"
          prepend-icon="mdi-cart-plus"
          :block="mobile"
          @click="addDialog = true"
        >
          手動新增銷量
        </v-btn>
      </v-col>
    </v-row>

    <v-progress-linear
      v-if="loading"
      indeterminate
      color="primary"
      class="mb-6"
      rounded
    ></v-progress-linear>

    <v-expansion-panels multiple v-model="openedPanels">
      <v-expansion-panel
        v-for="booth in boothsData"
        :key="booth.id"
        class="mb-4"
      >
        <!-- 手機版標題 -->
        <v-expansion-panel-title v-if="mobile" class="bg-primary text-white">
          <div class="w-100 pr-2">
            <div class="d-flex justify-space-between align-center mb-2">
              <span class="font-weight-bold text-truncate">
                <v-icon icon="mdi-storefront" size="18" class="mr-1"></v-icon>
                {{ booth.exhibition_name }}
              </span>
              <span class="font-weight-bold flex-shrink-0 ml-2"
                >${{ booth.total_revenue }}</span
              >
            </div>
            <div class="d-flex align-center ga-2 flex-wrap">
              <v-chip size="x-small" color="white" variant="outlined">
                攤位: {{ booth.booth_number }}
              </v-chip>
              <v-chip size="x-small" color="white" variant="outlined">
                {{ booth.order_count }} 筆
              </v-chip>
              <v-btn
                size="x-small"
                variant="outlined"
                color="white"
                prepend-icon="mdi-download"
                @click.stop="exportBooth(booth)"
              >
                匯出
              </v-btn>
            </div>
          </div>
        </v-expansion-panel-title>

        <!-- 桌機版標題 -->
        <v-expansion-panel-title v-else class="bg-primary text-white">
          <div class="d-flex justify-space-between w-100 align-center pr-4">
            <div>
              <v-icon icon="mdi-storefront" class="mr-2"></v-icon>
              <strong>{{ booth.exhibition_name }}</strong>
              <v-chip
                size="x-small"
                color="white"
                variant="outlined"
                class="ml-2"
              >
                攤位: {{ booth.booth_number }}
              </v-chip>
              <v-chip
                size="x-small"
                color="white"
                variant="outlined"
                class="ml-2"
              >
                {{ booth.order_count }} 筆訂單
              </v-chip>
            </div>
            <div class="d-flex align-center gap-3">
              <v-btn
                size="x-small"
                variant="outlined"
                color="white"
                prepend-icon="mdi-download"
                @click.stop="exportBooth(booth)"
              >
                匯出
              </v-btn>
              <span class="text-h6 font-weight-bold ml-2"
                >總收入: ${{ booth.total_revenue }}</span
              >
            </div>
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text class="pa-0 bg-grey-lighten-4">
          <v-alert
            v-if="booth.orders.length === 0"
            type="info"
            variant="tonal"
            class="ma-4"
          >
            此攤位尚無銷售紀錄。
          </v-alert>

          <!-- 手機版：訂單卡片 -->
          <div v-else-if="mobile" class="pa-3">
            <v-card
              v-for="order in booth.orders"
              :key="order.id"
              border
              elevation="0"
              class="mb-3 pa-3 rounded-lg bg-white"
            >
              <div class="d-flex justify-space-between align-start">
                <div style="min-width: 0">
                  <div class="font-weight-bold text-truncate">
                    {{ order.order_number }}
                  </div>
                  <div class="text-caption text-grey">
                    {{ formatDate(order.created_at) }}
                  </div>
                </div>
                <div class="text-right flex-shrink-0 ml-2">
                  <div class="font-weight-black text-primary text-h6">
                    ${{ order.total }}
                  </div>
                  <v-chip
                    :color="order.method?.includes('Line') ? 'green' : 'blue'"
                    size="x-small"
                    variant="flat"
                  >
                    {{ order.method }}
                  </v-chip>
                </div>
              </div>

              <v-divider class="my-2"></v-divider>

              <div
                v-for="line in order.lines"
                :key="line.id"
                class="d-flex justify-space-between align-center text-body-2 mb-1"
              >
                <span class="text-truncate mr-2">
                  <v-icon
                    :color="line.is_bundle ? 'purple' : 'grey'"
                    size="14"
                    class="mr-1"
                  >
                    {{
                      line.is_bundle
                        ? "mdi-package-variant"
                        : "mdi-tag-outline"
                    }}
                  </v-icon>
                  {{ line.name }} x{{ line.quantity }}
                </span>
                <span class="font-weight-bold flex-shrink-0"
                  >${{ line.subtotal }}</span
                >
              </div>

              <v-divider class="my-2"></v-divider>

              <div class="d-flex align-center justify-space-between">
                <span class="text-caption text-grey"
                  >電話 {{ order.phone }}</span
                >
                <div>
                  <v-btn
                    icon="mdi-open-in-new"
                    variant="text"
                    color="primary"
                    size="small"
                    :href="`/exhibition_pos/order/${order.token}`"
                    target="_blank"
                    :disabled="!order.token"
                  ></v-btn>
                  <v-btn
                    v-if="order.canDelete"
                    icon="mdi-delete-outline"
                    variant="text"
                    color="error"
                    size="small"
                    @click="deleteOrder(order, booth.id)"
                  ></v-btn>
                  <v-btn
                    v-else
                    icon="mdi-lock-outline"
                    variant="text"
                    color="grey-lighten-1"
                    size="small"
                    disabled
                  ></v-btn>
                </div>
              </div>
            </v-card>
          </div>

          <!-- 桌機版：表格 -->
          <div v-else class="pa-4">
            <v-data-table
              :headers="orderHeaders"
              :items="booth.orders"
              item-value="id"
              show-expand
              density="comfortable"
              class="rounded-xl border bg-white"
            >
              <template v-slot:item.created_at="{ item }">
                {{ formatDate(item.created_at) }}
              </template>

              <template v-slot:item.method="{ item }">
                <v-chip
                  :color="item.method?.includes('Line') ? 'green' : 'blue'"
                  size="x-small"
                  variant="flat"
                >
                  {{ item.method }}
                </v-chip>
              </template>

              <template v-slot:item.total="{ item }">
                <span class="font-weight-black text-primary"
                  >${{ item.total }}</span
                >
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  icon="mdi-open-in-new"
                  variant="text"
                  color="primary"
                  size="x-small"
                  :href="`/exhibition_pos/order/${item.token}`"
                  target="_blank"
                  :disabled="!item.token"
                ></v-btn>
                <v-tooltip
                  v-if="!item.canDelete"
                  text="訂單中有商品已結算，無法刪除"
                  location="top"
                >
                  <template v-slot:activator="{ props }">
                    <span v-bind="props">
                      <v-btn
                        icon="mdi-delete-outline"
                        variant="text"
                        color="grey-lighten-1"
                        size="x-small"
                        disabled
                      ></v-btn>
                    </span>
                  </template>
                </v-tooltip>
                <v-btn
                  v-else
                  icon="mdi-delete-outline"
                  variant="text"
                  color="error"
                  size="x-small"
                  @click="deleteOrder(item, booth.id)"
                ></v-btn>
              </template>

              <template v-slot:expanded-row="{ columns, item }">
                <tr>
                  <td :colspan="columns.length" class="bg-grey-lighten-5 pa-4">
                    <div
                      class="text-caption font-weight-bold mb-2 text-grey-darken-2"
                    >
                      訂單品項明細：
                    </div>
                    <v-table density="compact" class="border rounded bg-white">
                      <thead>
                        <tr>
                          <th>品項名稱</th>
                          <th class="text-center">數量</th>
                          <th class="text-right">單價</th>
                          <th class="text-right">小計</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="line in item.lines" :key="line.id">
                          <td>
                            <div class="d-flex align-center">
                              <v-icon
                                :color="line.is_bundle ? 'purple' : 'grey'"
                                size="small"
                                class="mr-1"
                              >
                                {{
                                  line.is_bundle
                                    ? "mdi-package-variant"
                                    : "mdi-tag-outline"
                                }}
                              </v-icon>
                              {{ line.name }}
                            </div>
                          </td>
                          <td class="text-center">{{ line.quantity }}</td>
                          <td class="text-right">${{ line.unit_price }}</td>
                          <td class="text-right font-weight-bold">
                            ${{ line.subtotal }}
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <!-- 手動新增銷量 Dialog -->
    <v-dialog v-model="addDialog" max-width="600px" persistent>
      <v-card rounded="xl">
        <v-card-title class="bg-primary text-white pa-4 d-flex align-center">
          <v-icon class="mr-2">mdi-cart-plus</v-icon>
          手動新增銷售
        </v-card-title>

        <v-card-text class="pt-6">
          <v-select
            v-model="selectedBoothId"
            label="選擇展覽攤位"
            :items="boothsData"
            item-title="exhibition_name"
            item-value="id"
            variant="filled"
            bg-color="grey-lighten-4"
            :disabled="manualCart.length > 0"
            density="comfortable"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item
                v-bind="props"
                :subtitle="`攤位: ${item.booth_number}`"
              ></v-list-item>
            </template>
          </v-select>

          <v-divider class="my-4"></v-divider>

          <v-row v-if="selectedBoothId" align="center">
            <v-col cols="12" sm="7">
              <v-select
                v-model="tempItem.detail"
                label="選擇商品 / 組合包"
                :items="boothDetails"
                :item-title="
                  (item) =>
                    item.bundle_id ? item.bundle.name : item.product.name
                "
                return-object
                variant="outlined"
                density="compact"
                hide-details
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item
                    v-bind="props"
                    :disabled="item.is_paid"
                    :title="
                      item.bundle_id ? item.bundle.name : item.product.name
                    "
                    :subtitle="
                      item.is_paid ? '已結清' : `售價: $${item.event_price}`
                    "
                  >
                    <template v-slot:append v-if="item.is_paid">
                      <v-icon color="blue" size="small">mdi-lock</v-icon>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>
            <v-col cols="8" sm="3">
              <v-text-field
                v-model.number="tempItem.quantity"
                type="number"
                label="數量"
                min="1"
                variant="outlined"
                density="compact"
                hide-details
              ></v-text-field>
            </v-col>
            <v-col cols="4" sm="2">
              <v-btn
                color="primary"
                icon="mdi-plus"
                :block="mobile"
                @click="addToManualCart"
                :disabled="!tempItem.detail"
              ></v-btn>
            </v-col>
          </v-row>

          <v-list v-if="manualCart.length > 0" class="mt-4 border rounded-lg">
            <v-list-subheader class="font-weight-bold text-primary"
              >待提交清單</v-list-subheader
            >
            <v-list-item v-for="(item, index) in manualCart" :key="index">
              <template v-slot:prepend>
                <v-icon>{{
                  item.bundle_id ? "mdi-package-variant" : "mdi-tag-outline"
                }}</v-icon>
              </template>
              <v-list-item-title class="font-weight-bold"
                >{{ item.name }} x {{ item.quantity }}</v-list-item-title
              >
              <v-list-item-subtitle
                >小計: ${{
                  item.event_price * item.quantity
                }}</v-list-item-subtitle
              >
              <template v-slot:append>
                <v-btn
                  icon="mdi-close-circle"
                  variant="text"
                  color="grey"
                  size="small"
                  @click="manualCart.splice(index, 1)"
                ></v-btn>
              </template>
            </v-list-item>
            <v-divider></v-divider>
            <div
              class="pa-4 d-flex justify-space-between align-center bg-grey-lighten-5"
            >
              <span class="text-subtitle-1">總金額</span>
              <span class="text-h6 font-weight-black text-primary"
                >${{ manualCartTotal }}</span
              >
            </div>
          </v-list>

          <div v-if="manualCart.length > 0" class="mt-4">
            <v-label class="mb-2 d-block text-caption font-weight-bold"
              >訂單聯絡電話</v-label
            >
            <v-text-field
              v-model="manualForm.phone"
              placeholder="例如：0912345678（選填）"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-phone"
              maxlength="10"
            ></v-text-field>
          </div>

          <div v-if="manualCart.length > 0" class="mt-2">
            <v-label class="mb-2 d-block text-caption font-weight-bold"
              >支付方式</v-label
            >
            <v-btn-toggle
              v-model="manualForm.method"
              color="primary"
              mandatory
              variant="outlined"
              class="d-flex w-100"
              density="comfortable"
            >
              <v-btn
                value="現金 - 手動"
                class="flex-grow-1"
                prepend-icon="mdi-cash"
                >現金</v-btn
              >
              <v-btn
                value="Line Pay - 手動"
                class="flex-grow-1"
                prepend-icon="mdi-wallet"
                >Line Pay</v-btn
              >
            </v-btn-toggle>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" color="grey-darken-1" @click="addDialog = false"
            >取消</v-btn
          >
          <v-btn
            color="primary"
            variant="elevated"
            @click="saveManualSale"
            :loading="saving"
            :disabled="manualCart.length === 0"
            class="px-8 rounded-lg"
          >
            送出訂單
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { useDisplay } from "vuetify";

const supabase = useSupabaseClient();
const userStore = useMainStore();
const { smAndDown: mobile } = useDisplay();

useHead({ title: "攤位銷售紀錄" });

const loading = ref(false);
const saving = ref(false);
const boothsData = ref<any[]>([]);
const openedPanels = ref([0]);

const addDialog = ref(false);
const selectedBoothId = ref<number | null>(null);
const boothDetails = ref<any[]>([]);
const manualCart = ref<any[]>([]);
const tempItem = ref({ detail: null as any, quantity: 1 });
const manualForm = ref({ phone: "", method: "現金 - 手動" });

const orderHeaders: ReadonlyArray<{
  title: string;
  key: string;
  width?: string;
  align?: "start" | "end" | "center";
}> = [
  { title: "", key: "data-table-expand", width: "40px" },
  { title: "訂單編號", key: "order_number" },
  { title: "交易時間", key: "created_at" },
  { title: "支付方式", key: "method", width: "130px" },
  { title: "電話末三碼", key: "phone", align: "center", width: "100px" },
  { title: "總金額", key: "total", align: "end", width: "100px" },
  { title: "", key: "actions", align: "end", width: "90px" },
];

const manualCartTotal = computed(() =>
  manualCart.value.reduce((s, i) => s + i.event_price * i.quantity, 0)
);

const formatDate = (str: string) => {
  if (!str) return "";
  return new Date(str).toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const fetchSalesReport = async () => {
  if (!userStore.profile?.id) return;
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from("Exhibition_Booths")
      .select(
        `
        id, booth_number, name,
        exhibitions:exhibition_id ( name ),
        orders:Orders (
          id, order_number, order_token, method, phone, created_at,
          records:Sales_Records (
            id, quantity,
            detail:detail_id (
              id, event_price, is_paid,
              product:product_id ( name ),
              bundle:bundle_id ( name )
            )
          )
        )
      `
      )
      .eq("owner_id", userStore.profile.id);

    if (error) throw error;

    boothsData.value = (data || []).map((booth: any) => {
      const orders = (booth.orders || [])
        .map((order: any) => {
          const lines = (order.records || []).map((rec: any) => ({
            id: rec.id,
            name: rec.detail?.bundle
              ? rec.detail.bundle.name
              : rec.detail?.product?.name || "未知",
            is_bundle: !!rec.detail?.bundle,
            is_paid: rec.detail?.is_paid || false,
            quantity: rec.quantity,
            unit_price: rec.detail?.event_price || 0,
            subtotal: (rec.detail?.event_price || 0) * rec.quantity,
          }));
          const total = lines.reduce((s: number, l: any) => s + l.subtotal, 0);
          return {
            id: order.id,
            order_number: order.order_number,
            token: order.order_token || null,
            method: order.method,
            phone: order.phone ? `***${String(order.phone).slice(-3)}` : "—",
            created_at: order.created_at,
            total,
            lines,
            canDelete: lines.every((l: any) => !l.is_paid),
          };
        })
        .sort(
          (a: any, b: any) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

      return {
        id: booth.id,
        booth_number: booth.booth_number,
        exhibition_name: booth.exhibitions?.name ?? booth.name ?? "通販",
        orders,
        order_count: orders.length,
        total_revenue: orders.reduce((s: number, o: any) => s + o.total, 0),
      };
    });
  } catch (err: any) {
    console.error("銷售紀錄載入失敗:", err);
  } finally {
    loading.value = false;
  }
};

// 手動新增：載入攤位商品清單
watch(selectedBoothId, async (boothId) => {
  if (!boothId) {
    boothDetails.value = [];
    return;
  }
  const { data } = await supabase
    .from("Exhibition_Product_Details")
    .select(
      `
      id, event_price, is_paid, bundle_id,
      product:product_id ( name ),
      bundle:bundle_id ( name )
    `
    )
    .eq("booth_id", boothId);
  boothDetails.value = (data || []).filter((d: any) => !d.is_paid);
});

const addToManualCart = () => {
  if (!tempItem.value.detail || tempItem.value.quantity < 1) return;
  const d = tempItem.value.detail;
  const existing = manualCart.value.find((c) => c.detail_id === d.id);
  if (existing) {
    existing.quantity += tempItem.value.quantity;
  } else {
    manualCart.value.push({
      detail_id: d.id,
      name: d.bundle_id ? d.bundle.name : d.product.name,
      event_price: d.event_price,
      quantity: tempItem.value.quantity,
      bundle_id: d.bundle_id,
    });
  }
  tempItem.value = { detail: null, quantity: 1 };
};

const saveManualSale = async () => {
  if (manualCart.value.length === 0 || !selectedBoothId.value) return;
  saving.value = true;
  try {
    const { data, error } = await supabase.rpc("pos_checkout_v3", {
      p_booth_id: selectedBoothId.value,
      p_items: manualCart.value.map((i) => ({
        detail_id: i.detail_id,
        quantity: i.quantity,
      })),
      p_method: manualForm.value.method,
      p_phone: manualForm.value.phone || "0900000000",
    });
    if (error) throw error;
    alert(`新增成功！訂單編號：${data[0].r_order_number}`);
    addDialog.value = false;
    await fetchSalesReport();
  } catch (err: any) {
    alert("新增失敗：" + err.message);
  } finally {
    saving.value = false;
  }
};

const deleteOrder = async (order: any, _boothId: number) => {
  if (
    !confirm(
      `確定刪除訂單 ${order.order_number} 的所有銷售紀錄？此動作將回補庫存。`
    )
  )
    return;
  loading.value = true;
  try {
    for (const line of order.lines) {
      const { error } = await supabase.rpc("delete_sale_and_restock", {
        p_record_id: Number(line.id),
      });
      if (error) throw error;
    }
    await fetchSalesReport();
  } catch (err: any) {
    alert("刪除失敗：" + err.message);
  } finally {
    loading.value = false;
  }
};

const resetManualForm = () => {
  selectedBoothId.value = null;
  manualCart.value = [];
  tempItem.value = { detail: null, quantity: 1 };
  manualForm.value = { phone: "", method: "現金 - 手動" };
};

watch(addDialog, (val) => {
  if (!val) resetManualForm();
});

const exportBooth = (booth: any) => {
  const csvCell = (val: any) => {
    const str = String(val ?? "");
    return str.includes(",") || str.includes('"') || str.includes("\n")
      ? `"${str.replace(/"/g, '""')}"`
      : str;
  };

  const rows: string[] = [];

  // 攤位摘要列
  rows.push([
    "展覽名稱", "攤位編號", "訂單總數", "總收入"
  ].map(csvCell).join(","));
  rows.push([
    booth.exhibition_name,
    booth.booth_number,
    booth.order_count,
    booth.total_revenue,
  ].map(csvCell).join(","));

  rows.push(""); // 空行分隔

  // 訂單明細標頭
  rows.push([
    "訂單編號", "交易時間", "支付方式", "電話末三碼",
    "品項名稱", "類型", "數量", "單價", "小計", "訂單總金額"
  ].map(csvCell).join(","));

  for (const order of booth.orders) {
    const dateStr = order.created_at
      ? new Date(order.created_at).toLocaleString("zh-TW", {
          year: "numeric", month: "2-digit", day: "2-digit",
          hour: "2-digit", minute: "2-digit",
        })
      : "";

    if (order.lines.length === 0) {
      rows.push([
        order.order_number, dateStr, order.method, order.phone,
        "", "", "", "", "", order.total,
      ].map(csvCell).join(","));
    } else {
      order.lines.forEach((line: any, idx: number) => {
        rows.push([
          idx === 0 ? order.order_number : "",
          idx === 0 ? dateStr : "",
          idx === 0 ? order.method : "",
          idx === 0 ? order.phone : "",
          line.name,
          line.is_bundle ? "組合包" : "單品",
          line.quantity,
          line.unit_price,
          line.subtotal,
          idx === 0 ? order.total : "",
        ].map(csvCell).join(","));
      });
    }
  }

  rows.push(""); // 空行分隔
  rows.push(["", "", "", "", "", "", "", "", "總計", booth.total_revenue].map(csvCell).join(","));

  // 加 BOM 讓 Excel 正確顯示中文
  const bom = "\uFEFF";
  const blob = new Blob([bom + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `銷售紀錄_${booth.exhibition_name}_攤位${booth.booth_number}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

onMounted(fetchSalesReport);
</script>
