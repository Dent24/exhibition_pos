<template>
  <v-container>
    <v-row align="end" class="mb-10">
      <v-col>
        <p class="text-display-medium font-weight-black text-black mb-2">
          賣家拆賬
        </p>
        <p class="text-grey-darken-1 mb-0">
          依商品原價計算各賣家應得金額，供完場後結算付款使用。
        </p>
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
        v-for="booth in boothsReport"
        :key="booth.id"
        class="mb-4"
      >
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
              >總應付: ${{ booth.total_payout }}</span
            >
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text class="pa-0 bg-grey-lighten-4">
          <v-alert
            v-if="booth.sellers.length === 0"
            type="info"
            variant="tonal"
            class="ma-4"
          >
            此攤位目前無銷售紀錄。
          </v-alert>

          <v-card
            v-for="seller in booth.sellers"
            :key="seller.id"
            variant="outlined"
            class="ma-4 border-primary bg-white"
          >
            <v-toolbar density="compact" color="blue-lighten-5">
              <v-icon
                icon="mdi-account-star"
                class="ml-4 mr-2"
                color="primary"
              ></v-icon>
              <span class="font-weight-bold text-primary"
                >賣家：{{ seller.nickname }}</span
              >
              <v-spacer></v-spacer>
              <span class="mr-4 text-subtitle-1 text-primary">
                應付小計：<b class="text-h6">${{ seller.seller_total }}</b>
              </span>
            </v-toolbar>

            <v-data-table
              :headers="headers"
              :items="seller.products"
              item-value="rowKey"
              density="comfortable"
              :loading="loading"
            >
              <template v-slot:item.display_name="{ item }">
                <div class="d-flex align-center py-2">
                  <v-icon
                    :color="item.type === 'bundle_split' ? 'purple' : 'grey'"
                    size="small"
                    class="mr-2"
                  >
                    {{
                      item.type === "bundle_split"
                        ? "mdi-package-variant"
                        : "mdi-tag-outline"
                    }}
                  </v-icon>
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
                  color="success"
                  size="x-small"
                  variant="flat"
                  prepend-icon="mdi-check-circle"
                >
                  已付款
                </v-chip>
                <v-chip v-else color="orange" size="x-small" variant="outlined">
                  待結算
                </v-chip>
              </template>

              <template v-slot:item.subtotal="{ item }">
                <span
                  class="font-weight-black"
                  :class="item.is_paid ? 'text-success' : 'text-primary'"
                >
                  ${{ item.subtotal }}
                </span>
              </template>

              <template v-slot:item.actions="{ item }">
                <v-btn
                  v-if="!item.is_paid"
                  size="x-small"
                  color="success"
                  variant="tonal"
                  prepend-icon="mdi-cash-check"
                  :loading="markingPaid === item.detail_id"
                  @click="markAsPaid(item.detail_id, booth.id, seller.id)"
                >
                  標記已付
                </v-btn>
                <span v-else class="text-caption text-grey">
                  <v-icon size="14" class="mr-1">mdi-lock-outline</v-icon>已鎖定
                </span>
              </template>
            </v-data-table>
          </v-card>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const userStore = useMainStore();

useHead({ title: "賣家拆賬" });

const loading = ref(false);
const markingPaid = ref<number | null>(null);
const boothsReport = ref<any[]>([]);
const openedPanels = ref([0]);

const headers: ReadonlyArray<{
  title: string;
  key: string;
  width?: string;
  align?: "start" | "end" | "center";
}> = [
  { title: "項目名稱", key: "display_name" },
  { title: "分類", key: "type", width: "110px" },
  { title: "狀態", key: "status", width: "90px" },
  { title: "原價/件", key: "unit_price", align: "end", width: "100px" },
  { title: "銷售數量", key: "total_qty", align: "center", width: "90px" },
  { title: "應付小計", key: "subtotal", align: "end", width: "110px" },
  { title: "操作", key: "actions", align: "end", width: "110px" },
];

const fetchSettlementReport = async () => {
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
          product:product_id (
            id, name, original_price,
            seller:seller_id ( id, nickname )
          ),
          bundle:bundle_id (
            id, name,
            items:Bundle_Items (
              product:product_id (
                id, name, original_price,
                seller:seller_id ( id, nickname )
              )
            )
          ),
          sales:Sales_Records ( id, quantity )
        )
      `
      )
      .eq("owner_id", userStore.profile.id);

    if (error) throw error;

    boothsReport.value = (data || []).map((booth) => {
      const sellerMap = new Map<number, any>();

      booth.details.forEach((detail: any) => {
        const totalQty = (detail.sales || []).reduce(
          (s: number, r: any) => s + (r.quantity || 0),
          0
        );
        if (totalQty === 0) return;

        if (detail.bundle_id && detail.bundle?.items?.length) {
          // 組合包：每個賣家依 original_price * qty 計算
          detail.bundle.items.forEach((bItem: any) => {
            const seller = bItem.product?.seller;
            if (!seller) return;

            if (!sellerMap.has(seller.id)) {
              sellerMap.set(seller.id, {
                id: seller.id,
                nickname: seller.nickname,
                seller_total: 0,
                products: [],
              });
            }
            const sellerData = sellerMap.get(seller.id)!;
            const unitRevenue = bItem.product.original_price || 0;
            const subtotal = unitRevenue * totalQty;

            sellerData.seller_total += subtotal;

            const rowKey = `seller-${seller.id}-bundle-${detail.bundle_id}-detail-${detail.id}`;
            let row = sellerData.products.find((p: any) => p.rowKey === rowKey);
            if (!row) {
              row = {
                rowKey,
                display_name: detail.bundle.name,
                sub_items: [bItem.product.name],
                type: "bundle_split",
                unit_price: 0,
                total_qty: totalQty,
                subtotal: 0,
                is_paid: !!detail.is_paid,
                detail_id: detail.id,
              };
              sellerData.products.push(row);
            } else {
              row.sub_items.push(bItem.product.name);
            }
            row.unit_price = Number((row.unit_price + unitRevenue).toFixed(0));
            row.subtotal = Number((row.subtotal + subtotal).toFixed(0));
            row.sub_items_text = row.sub_items.join("、");
          });
        } else if (detail.product) {
          const seller = detail.product.seller;
          if (!seller) return;

          if (!sellerMap.has(seller.id)) {
            sellerMap.set(seller.id, {
              id: seller.id,
              nickname: seller.nickname,
              seller_total: 0,
              products: [],
            });
          }
          const sellerData = sellerMap.get(seller.id)!;
          const unitPrice = detail.product.original_price || 0;
          const subtotal = unitPrice * totalQty;

          sellerData.seller_total += subtotal;
          sellerData.products.push({
            rowKey: `s-${detail.id}`,
            display_name: detail.product.name,
            sub_items_text: null,
            type: "single",
            unit_price: unitPrice,
            total_qty: totalQty,
            subtotal,
            is_paid: !!detail.is_paid,
            detail_id: detail.id,
          });
        }
      });

      const sellers = Array.from(sellerMap.values()).map((s) => ({
        ...s,
        seller_total: Number(s.seller_total.toFixed(0)),
      }));

      return {
        id: booth.id,
        booth_number: booth.booth_number,
        exhibition_name: booth.exhibitions.name,
        sellers,
        total_payout: sellers.reduce((s, sel) => s + sel.seller_total, 0),
      };
    });
  } catch (err: any) {
    console.error("拆賬報表載入失敗:", err);
  } finally {
    loading.value = false;
  }
};

const markAsPaid = async (
  detailId: number,
  _boothId: number,
  _sellerId: number
) => {
  if (!confirm("確定標記此項目為已付款？此動作無法復原。")) return;
  markingPaid.value = detailId;
  try {
    const { error } = await supabase
      .from("Exhibition_Product_Details")
      .update({ is_paid: true })
      .eq("id", detailId);
    if (error) throw error;
    await fetchSettlementReport();
  } catch (err: any) {
    alert("操作失敗：" + err.message);
  } finally {
    markingPaid.value = null;
  }
};

onMounted(fetchSettlementReport);
</script>
