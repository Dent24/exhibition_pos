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
                          <th>銷售時間</th>
                          <th>數量</th>
                          <th>支付方式</th>
                          <th class="text-right">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="record in item.sales" :key="record.id">
                          <td>{{ record.time }}</td>
                          <td>{{ record.quantity }}</td>
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

    <v-dialog v-model="addDialog" max-width="500px">
      <v-card rounded="lg">
        <v-card-title class="bg-primary text-white d-flex align-center">
          <v-icon class="mr-2">mdi-cart-plus</v-icon>
          手動新增銷售
        </v-card-title>

        <v-card-text class="pt-6">
          <v-select
            v-model="selectedBoothIdInDialog"
            label="選擇展覽攤位"
            :items="boothsReport"
            item-title="exhibition_name"
            item-value="id"
            variant="outlined"
            density="comfortable"
            @update:model-value="saleForm.detail_id = null"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item
                v-bind="props"
                :subtitle="`攤位: ${item.booth_number}`"
              ></v-list-item>
            </template>
          </v-select>

          <v-select
            v-model="saleForm.detail_id"
            :disabled="!selectedBoothIdInDialog"
            label="選擇銷售項目"
            :items="productsInSelectedBooth"
            item-value="id"
            variant="outlined"
            density="comfortable"
            class="mt-2"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item
                v-bind="props"
                :prepend-icon="
                  item.bundle_id ? 'mdi-package-variant' : 'mdi-tag-outline'
                "
                :title="
                  item.bundle_id ? `${item.bundle.name}` : item.product.name
                "
                :subtitle="`售價: $${item.event_price}`"
                :disabled="item.is_paid"
              >
                <template v-slot:append v-if="item.is_paid">
                  <v-icon color="blue" size="small">mdi-lock</v-icon>
                </template>
              </v-list-item>
            </template>
            <template v-slot:selection="{ item }">
              <span class="d-flex align-center">
                <v-icon size="small" class="mr-2">{{
                  item.bundle_id ? "mdi-package-variant" : "mdi-tag-outline"
                }}</v-icon>
                {{ item.bundle_id ? `${item.bundle.name}` : item.product.name }}
              </span>
            </template>
          </v-select>

          <v-text-field
            v-model.number="saleForm.quantity"
            label="銷售數量"
            type="number"
            min="1"
            variant="outlined"
            density="comfortable"
            class="mt-2"
          />

          <v-label class="mb-2 d-block text-caption">支付方式</v-label>
          <v-btn-toggle
            v-model="saleForm.method"
            color="primary"
            mandatory
            variant="outlined"
            class="d-flex w-100 mb-4"
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
            @click="saveSale"
            :loading="loading"
            class="px-6"
          >
            確認新增
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const userStore = useMainStore();

const loading = ref(false);
const boothsReport = ref<any[]>([]);
const addDialog = ref(false);
const openedPanels = ref([0]);

const saleForm = ref({
  detail_id: null as number | null,
  quantity: 1,
  method: "現金 - 手動",
});
const selectedBoothIdInDialog = ref<number | null>(null);

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
  return target?.rawDetails || [];
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
          sales:Sales_Records ( id, quantity, created_at, method )
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
        if (totalQty === 0) return;

        const formattedSales = salesArr.map((s) => ({
          ...s,
          time: new Date(s.created_at).toLocaleString(),
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

const saveSale = async () => {
  if (!saleForm.value.detail_id || saleForm.value.quantity <= 0) return;
  loading.value = true;
  try {
    const { error } = await supabase.rpc("manual_add_sale", {
      // 確保 detail_id 是 Number
      p_detail_id: Number(saleForm.value.detail_id),
      // 確保數量是 Number
      p_quantity: Math.floor(Number(saleForm.value.quantity)),
      p_method: String(saleForm.value.method),
    });

    if (error) throw error;

    addDialog.value = false;
    await fetchSalesReport();
    alert("新增成功！庫存已同步扣除");
  } catch (err: any) {
    alert("新增失敗: " + err.message);
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
  saleForm.value = { detail_id: null, quantity: 1, method: "現金 - 手動" };
};

watch(addDialog, (val) => {
  if (!val) resetForm();
});
onMounted(fetchSalesReport);
</script>
