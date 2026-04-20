<template>
  <v-container>
    <v-row align="end" class="mb-10">
      <v-col>
        <p class="text-display-medium font-weight-black text-black mb-2">
          銷售紀錄查詢
        </p>
        <p class="text-grey-darken-1 mb-0">
          調閱交易明細、權重拆解後的賣家分潤紀錄。
        </p>
      </v-col>
      <v-col class="text-right">
        <v-btn
          color="primary"
          prepend-icon="mdi-cart-plus"
          @click="addDialog = true"
        >
          手動新增銷量
        </v-btn>
      </v-col>
    </v-row>

    <v-expansion-panels multiple v-model="openedPanels">
      <v-expansion-panel v-for="booth in boothsReport" :key="booth.id">
        <v-expansion-panel-title class="bg-primary text-white">
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
            </div>
            <span class="text-h6 font-weight-bold"
              >總營收: ${{ booth.total_booth_revenue }}</span
            >
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text class="pa-0 bg-grey-lighten-4">
          <v-card
            v-for="seller in booth.sellers"
            :key="seller.id"
            variant="outlined"
            class="ma-4 border-primary bg-white"
          >
            <v-toolbar density="compact" color="primary-lighten-5 text-primary">
              <v-icon icon="mdi-account-star" class="ml-4 mr-2"></v-icon>
              <span class="font-weight-bold">賣家：{{ seller.nickname }}</span>
              <v-spacer></v-spacer>
              <span class="mr-4 text-subtitle-1">
                賣家應得小計:
                <b class="text-h6">${{ seller.seller_total_revenue }}</b>
              </span>
            </v-toolbar>

            <v-data-table
              :headers="headers"
              :items="seller.products"
              item-value="rowKey"
              show-expand
              density="comfortable"
            >
              <template v-slot:item.display_name="{ item }">
                <div class="d-flex align-center py-2">
                  <v-icon
                    v-if="item.type === 'bundle_split'"
                    color="purple"
                    size="small"
                    class="mr-2"
                    >mdi-package-variant</v-icon
                  >
                  <v-icon v-else color="grey" size="small" class="mr-2"
                    >mdi-tag-outline</v-icon
                  >
                  <div>
                    <div class="font-weight-bold">{{ item.display_name }}</div>
                    <div
                      v-if="item.sub_items_text"
                      class="text-caption text-grey-darken-1"
                    >
                      內含：{{ item.sub_items_text }}
                    </div>
                  </div>
                </div>
              </template>

              <template v-slot:item.type="{ item }">
                <v-chip
                  :color="item.type === 'bundle_split' ? 'purple' : 'grey'"
                  size="x-small"
                  variant="flat"
                >
                  {{ item.type === "bundle_split" ? "組合分潤" : "一般單品" }}
                </v-chip>
              </template>

              <template v-slot:item.status="{ item }">
                <v-chip
                  v-if="item.is_paid"
                  color="blue"
                  size="x-small"
                  variant="flat"
                  prepend-icon="mdi-lock"
                >
                  已收款
                </v-chip>
                <v-chip v-else color="grey" size="x-small" variant="outlined">
                  待結算
                </v-chip>
              </template>

              <template v-slot:item.subtotal="{ item }">
                <span
                  class="font-weight-black"
                  :class="item.is_paid ? 'text-blue' : ''"
                >
                  ${{ item.subtotal }}
                </span>
              </template>

              <template v-slot:expanded-row="{ columns, item }">
                <tr>
                  <td :colspan="columns.length" class="bg-grey-lighten-5 pa-4">
                    <div class="text-caption font-weight-bold mb-2">
                      銷售流水紀錄：
                    </div>
                    <v-table density="compact" class="border rounded bg-white">
                      <thead>
                        <tr>
                          <th>訂單編號</th>
                          <th>銷售時間</th>
                          <th>數量</th>
                          <th>電話末三碼</th>
                          <th>支付方式</th>
                          <th class="text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="record in item.sales" :key="record.id">
                          <td>{{ record.order_no }}</td>
                          <td>{{ record.time }}</td>
                          <td>{{ record.quantity }}</td>
                          <td>{{ record.phone }}</td>
                          <td>{{ record.method }}</td>
                          <td class="text-right">
                            <v-btn
                              v-if="!item.is_paid"
                              icon="mdi-delete"
                              variant="text"
                              color="error"
                              size="x-small"
                              @click="deleteSingleRecord(record.id)"
                            ></v-btn>
                            <v-icon
                              v-else
                              icon="mdi-lock-outline"
                              size="small"
                              color="grey"
                            ></v-icon>
                          </td>
                        </tr>
                      </tbody>
                    </v-table>
                  </td>
                </tr>
              </template>
            </v-data-table>
          </v-card>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-dialog v-model="addDialog" max-width="600px" persistent>
      <v-card rounded="xl">
        <v-card-title class="bg-primary text-white pa-4 d-flex align-center">
          <v-icon class="mr-2">mdi-cart-plus</v-icon>
          手動新增銷售 (批量模式)
        </v-card-title>

        <v-card-text class="pt-6">
          <v-select
            v-model="selectedBoothIdInDialog"
            label="選擇展覽攤位"
            :items="boothsReport"
            item-title="exhibition_name"
            item-value="id"
            variant="filled"
            bg-color="grey-lighten-4"
            :disabled="cart.length > 0"
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

          <v-row v-if="selectedBoothIdInDialog" align="center">
            <v-col cols="7">
              <v-select
                v-model="tempItem.detail"
                label="選擇商品 / 組合包"
                :items="productsInSelectedBooth"
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
                      item.is_paid
                        ? '已結清 (不可再新增銷量)'
                        : `售價: $${item.event_price}`
                    "
                  >
                    <template v-slot:append v-if="item.is_paid">
                      <v-icon color="blue" size="small">mdi-lock</v-icon>
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>
            <v-col cols="3">
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
            <v-col cols="2">
              <v-btn
                color="primary"
                icon="mdi-plus"
                @click="addToCart"
                :disabled="!tempItem.detail"
              ></v-btn>
            </v-col>
          </v-row>

          <v-list v-if="cart.length > 0" class="mt-4 border rounded-lg">
            <v-list-subheader class="font-weight-bold text-primary"
              >待提交清單</v-list-subheader
            >
            <v-list-item v-for="(item, index) in cart" :key="index">
              <template v-slot:prepend>
                <v-icon>{{
                  item.bundle_id ? "mdi-package-variant" : "mdi-tag-outline"
                }}</v-icon>
              </template>
              <v-list-item-title class="font-weight-bold">
                {{ item.name }} x {{ item.quantity }}
              </v-list-item-title>
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
                  @click="cart.splice(index, 1)"
                ></v-btn>
              </template>
            </v-list-item>

            <v-divider></v-divider>
            <div
              class="pa-4 d-flex justify-space-between align-center bg-grey-lighten-5"
            >
              <span class="text-subtitle-1">總金額</span>
              <span class="text-h6 font-weight-black text-primary"
                >${{ cartTotal }}</span
              >
            </div>
          </v-list>

          <div v-if="cart.length > 0" class="mt-4">
            <v-label class="mb-2 d-block text-caption font-weight-bold"
              >訂單聯絡電話 (後三碼將用於編號)</v-label
            >
            <v-text-field
              v-model="saleForm.phone"
              placeholder="例如：0912345678"
              variant="outlined"
              density="comfortable"
              prepend-inner-icon="mdi-phone"
              maxlength="10"
            ></v-text-field>
          </div>

          <div v-if="cart.length > 0" class="mt-6">
            <v-label class="mb-2 d-block text-caption font-weight-bold"
              >支付方式</v-label
            >
            <v-btn-toggle
              v-model="saleForm.method"
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
            @click="saveBulkSale"
            :loading="loading"
            :disabled="cart.length === 0"
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
const supabase = useSupabaseClient();
const userStore = useMainStore();

useHead({
  title: "銷售紀錄查詢",
});

const loading = ref(false);
const boothsReport = ref<any[]>([]);
const addDialog = ref(false);
const openedPanels = ref([0]);

const saleForm = ref({
  detail_id: null as number | null,
  quantity: 1,
  method: "現金 - 手動",
  phone: "", // 新增電話欄位
});
const selectedBoothIdInDialog = ref<number | null>(null);

const cart = ref<any[]>([]);
const tempItem = ref({
  detail: null as any,
  quantity: 1,
});

const headers: ReadonlyArray<{
  title: string;
  key: string;
  width?: string;
  align?: "start" | "end" | "center";
}> = [
  { title: "", key: "data-table-expand" },
  { title: "項目名稱", key: "display_name" },
  { title: "分類", key: "type", width: "100px" },
  { title: "狀態", key: "status", width: "100px" },
  { title: "拆算單價總計", key: "event_price", align: "end" },
  { title: "銷售數量", key: "total_qty", align: "center" },
  { title: "應得小計", key: "subtotal", align: "end" },
];

const productsInSelectedBooth = computed(() => {
  if (!selectedBoothIdInDialog.value) return [];

  const target = boothsReport.value.find(
    (b) => b.id === selectedBoothIdInDialog.value
  );

  if (!target || !target.rawDetails) return [];

  return target.rawDetails.filter((d: any) => !d.is_paid);
});

const cartTotal = computed(() => {
  return cart.value.reduce(
    (sum, item) => sum + item.event_price * item.quantity,
    0
  );
});

const fetchSalesReport = async () => {
  if (!userStore.profile?.id) return;
  loading.value = true;
  try {
    const { data, error } = await supabase
      .from("Exhibition_Booths")
      .select(
        `
        id, booth_number,
        exhibitions:exhibition_id ( name ),
        details:Exhibition_Product_Details (
          id, event_price, is_paid, bundle_id,
          product:product_id ( id, name, seller:seller_id ( id, nickname ) ),
          bundle:bundle_id ( 
            id, name,
            items:Bundle_Items (
              share_weight,
              product:product_id ( id, name, seller:seller_id ( id, nickname ) )
            )
          ),
          sales:Sales_Records ( 
            id, quantity, created_at,
            order:order_id ( method, order_number, phone )
          )
        )
      `
      )
      .eq("owner_id", userStore.profile.id);

    if (error) throw error;

    boothsReport.value = data.map((booth) => {
      const sellerMap = new Map();

      booth.details.forEach((detail) => {
        const salesArr = detail.sales || [];
        const totalQty = salesArr.reduce((s, r) => s + (r.quantity || 0), 0);

        const formattedSales = salesArr.map((s) => ({
          ...s,
          time: new Date(s.created_at).toLocaleString(),
          method: s.order?.method || "未知",
          phone: s.order?.phone ? s.order.phone.slice(-3) : "無",
          order_no: s.order?.order_number || "無",
        }));

        if (detail.bundle_id && detail.bundle) {
          const totalWeight = detail.bundle.items.reduce(
            (s, i) => s + (i.share_weight || 0),
            0
          );

          detail.bundle.items.forEach((bItem) => {
            const seller = bItem.product.seller;
            if (!seller) return;

            if (!sellerMap.has(seller.id)) {
              sellerMap.set(seller.id, {
                id: seller.id,
                nickname: seller.nickname,
                seller_total_revenue: 0,
                products: [],
              });
            }

            const sellerData = sellerMap.get(seller.id);
            const weightRatio =
              totalWeight > 0 ? bItem.share_weight / totalWeight : 0;
            const splitPrice = weightRatio * detail.event_price;
            const subtotal = splitPrice * totalQty;

            sellerData.seller_total_revenue += subtotal;

            const bundleRowKey = `seller-${seller.id}-bundle-${detail.bundle_id}-detail-${detail.id}`;
            let bundleRow = sellerData.products.find(
              (p: any) => p.rowKey === bundleRowKey
            );

            if (!bundleRow) {
              bundleRow = {
                rowKey: bundleRowKey,
                display_name: `${detail.bundle.name}`,
                sub_items: [bItem.product.name],
                event_price: 0,
                total_qty: totalQty,
                subtotal: 0,
                is_paid: !!detail.is_paid,
                sales: formattedSales,
                type: "bundle_split",
              };
              sellerData.products.push(bundleRow);
            } else {
              if (!bundleRow.sub_items.includes(bItem.product.name))
                bundleRow.sub_items.push(bItem.product.name);
            }

            bundleRow.event_price = (
              Number(bundleRow.event_price) + splitPrice
            ).toFixed(0);
            bundleRow.subtotal = (
              Number(bundleRow.subtotal) + subtotal
            ).toFixed(0);
            bundleRow.sub_items_text = bundleRow.sub_items.join("、");
          });
        } else if (detail.product) {
          const seller = detail.product.seller;
          if (!seller) return;

          if (!sellerMap.has(seller.id)) {
            sellerMap.set(seller.id, {
              id: seller.id,
              nickname: seller.nickname,
              seller_total_revenue: 0,
              products: [],
            });
          }

          const sellerData = sellerMap.get(seller.id);
          const subtotal = totalQty * detail.event_price;

          sellerData.seller_total_revenue += subtotal;
          sellerData.products.push({
            rowKey: `s-${detail.id}`,
            display_name: detail.product.name,
            sub_items_text: null,
            event_price: detail.event_price.toFixed(0),
            total_qty: totalQty,
            subtotal: subtotal.toFixed(0),
            is_paid: !!detail.is_paid,
            sales: formattedSales,
            type: "single",
          });
        }
      });

      const sellersArray = Array.from(sellerMap.values()).map((s) => ({
        ...s,
        seller_total_revenue: Number(s.seller_total_revenue).toFixed(0),
      }));

      return {
        id: booth.id,
        booth_number: booth.booth_number,
        exhibition_name: booth.exhibitions.name,
        rawDetails: booth.details,
        sellers: sellersArray,
        total_booth_revenue: sellersArray
          .reduce((s, sel) => s + Number(sel.seller_total_revenue), 0)
          .toFixed(0),
      };
    });
  } catch (err: any) {
    console.error("處理報表時出錯:", err);
  } finally {
    loading.value = false;
  }
};

const saveBulkSale = async () => {
  if (cart.value.length === 0 || !selectedBoothIdInDialog.value) return;
  if (!saleForm.value.phone) {
    alert("請輸入聯絡電話以生成訂單編號");
    return;
  }

  loading.value = true;
  try {
    const itemsJson = cart.value.map((item) => ({
      detail_id: item.detail_id,
      quantity: item.quantity,
    }));

    const { data, error } = await supabase.rpc("pos_checkout_v3", {
      p_booth_id: selectedBoothIdInDialog.value,
      p_items: itemsJson,
      p_method: saleForm.value.method,
      p_phone: saleForm.value.phone,
    });

    if (error) throw error;

    const result = data[0];
    addDialog.value = false;

    // 成功提示包含訂單編號
    alert(`結帳成功！\n訂單編號：${result.r_order_number}`);

    await fetchSalesReport();
    resetForm();
  } catch (err: any) {
    alert("結帳失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

const deleteSingleRecord = async (recordId: number) => {
  if (!confirm("確定要刪除這筆銷售紀錄嗎？此動作將會自動補回商品庫存。"))
    return;
  loading.value = true;
  try {
    const { error } = await supabase.rpc("delete_sale_and_restock", {
      p_record_id: Number(recordId),
    });
    if (error) throw error;

    alert("已成功刪除並回補庫存");
    await fetchSalesReport();
  } catch (err: any) {
    console.error("操作失敗:", err);
    alert("操作失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  selectedBoothIdInDialog.value = null;
  cart.value = [];
  tempItem.value = { detail: null, quantity: 1 };
  saleForm.value = {
    detail_id: null,
    quantity: 1,
    method: "現金 - 手動",
    phone: "",
  };
};

const addToCart = () => {
  if (!tempItem.value.detail || tempItem.value.quantity < 1) return;

  const d = tempItem.value.detail;
  // 檢查是否已存在，存在則累加數量
  const existing = cart.value.find((c) => c.detail_id === d.id);
  if (existing) {
    existing.quantity += tempItem.value.quantity;
  } else {
    cart.value.push({
      detail_id: d.id,
      name: d.bundle_id ? d.bundle.name : d.product.name,
      event_price: d.event_price,
      quantity: tempItem.value.quantity,
      bundle_id: d.bundle_id,
    });
  }

  // 重置選取框
  tempItem.value.detail = null;
  tempItem.value.quantity = 1;
};

watch(addDialog, (val) => {
  if (!val) resetForm();
});
onMounted(fetchSalesReport);
</script>
