<template>
  <v-container>
    <v-row align="end" class="mb-10">
      <v-col>
        <p class="text-display-medium font-weight-black text-black mb-2">
          商品銷售統計
        </p>
        <p class="text-grey-darken-1 mb-0">查看商品在各展覽的銷售表現</p>
      </v-col>
    </v-row>

    <v-expansion-panels multiple variant="inset">
      <v-expansion-panel
        v-for="product in productReport"
        :key="product.id"
        class="mb-4 border"
      >
        <v-expansion-panel-title class="bg-grey-lighten-4">
          <v-row no-gutters align="center">
            <v-col cols="4" class="text-h6 font-weight-black text-primary">{{
              product.name
            }}</v-col>
            <v-col cols="8" class="text-right pr-4">
              <v-chip color="primary" variant="flat" size="small" class="mr-2"
                >總銷量: {{ product.total_quantity }}</v-chip
              >
              <v-chip color="success" variant="flat" size="small"
                >總營收: ${{ product.total_revenue }}</v-chip
              >
            </v-col>
          </v-row>
        </v-expansion-panel-title>

        <v-expansion-panel-text class="pa-0">
          <v-list lines="two" class="pa-0">
            <template v-for="(ex, index) in product.exhibitions" :key="ex.id">
              <v-divider v-if="index !== 0"></v-divider>

              <v-list-item>
                <template v-slot:prepend>
                  <v-icon icon="mdi-calendar-check" color="blue"></v-icon>
                </template>

                <v-list-item-title class="font-weight-bold text-subtitle-1">
                  {{ ex.name }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  展覽小計: {{ ex.ex_total_qty }} 件 | 營收貢獻: ${{
                    ex.ex_total_rev
                  }}
                </v-list-item-subtitle>

                <v-data-table
                  :headers="[
                    { title: '攤位 (攤主) / 來源項目', key: 'booth_info' },
                    { title: '拆算單價', key: 'event_price', align: 'center' },
                    { title: '總銷量', key: 'quantity', align: 'center' },
                    { title: '應得營收', key: 'revenue', align: 'end' },
                  ]"
                  :items="ex.booths"
                  density="compact"
                  hide-default-footer
                  class="mt-3 border rounded shadow-sm"
                >
                  <template v-slot:item.booth_info="{ item }">
                    <div class="d-flex align-center">
                      <div class="font-weight-bold mr-3">
                        {{ item.booth_info }}
                      </div>
                      <v-chip
                        size="x-small"
                        :color="
                          item.source_name === '一般單品' ? 'grey' : 'purple'
                        "
                        variant="tonal"
                      >
                        <v-icon start size="10">{{
                          item.source_name === "一般單品"
                            ? "mdi-tag"
                            : "mdi-package-variant"
                        }}</v-icon>
                        {{ item.source_name }}
                      </v-chip>
                    </div>
                  </template>

                  <template v-slot:item.revenue="{ item }">
                    <div class="d-flex align-center justify-end">
                      <span class="text-success font-weight-bold mr-3"
                        >${{ item.revenue }}</span
                      >
                      <v-btn
                        v-if="!item.is_paid"
                        size="x-small"
                        color="orange-darken-1"
                        @click="confirmPayment(item.detail_id)"
                      >
                        確認收款
                      </v-btn>
                      <v-chip
                        v-else
                        size="x-small"
                        color="blue"
                        variant="flat"
                        prepend-icon="mdi-check-circle"
                      >
                        已結清
                      </v-chip>
                    </div>
                  </template>
                </v-data-table>
              </v-list-item>
            </template>
          </v-list>

          <div
            v-if="product.exhibitions.length === 0"
            class="pa-4 text-center text-grey"
          >
            此商品尚未在任何展覽上架
          </div>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>
  </v-container>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const userStore = useMainStore();

const loading = ref(false);
const productReport = ref<any[]>([]);

const fetchProductReport = async () => {
  if (!userStore.profile?.id) return;
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from("Products")
      .select(
        `
        id, 
        name,
        details:Exhibition_Product_Details (
          id, event_price, is_paid,
          booth:booth_id ( 
            id, booth_number, 
            owner:owner_id ( nickname ),
            exhibition:exhibition_id ( id, name )
          ),
          sales:Sales_Records ( quantity )
        ),
        bundle_shares:Bundle_Items (
          share_weight,
          bundle:bundle_id (
            id, name,
            details:Exhibition_Product_Details (
              id, event_price, is_paid,
              booth:booth_id ( 
                id, booth_number, 
                owner:owner_id ( nickname ),
                exhibition:exhibition_id ( id, name )
              ),
              sales:Sales_Records ( quantity ),
              bundle:bundle_id (
                items:Bundle_Items ( share_weight )
              )
            )
          )
        )
      `
      )
      .eq("seller_id", userStore.profile.id);

    if (error) throw error;

    productReport.value = (data || []).map((product) => {
      let totalQty = 0;
      let totalRev = 0;
      const exhibitionGroups: Record<number, any> = {};

      // 統一推入報表的輔助函式，新增 sourceName 參數
      const addToReport = (
        ex: any,
        booth: any,
        qty: number,
        rev: number,
        detailId: number,
        isPaid: boolean,
        sourceName: string
      ) => {
        if (qty === 0) return;
        totalQty += qty;
        totalRev += rev;

        if (!exhibitionGroups[ex.id]) {
          exhibitionGroups[ex.id] = {
            id: ex.id,
            name: ex.name,
            ex_total_qty: 0,
            ex_total_rev: 0,
            booths: [],
          };
        }
        exhibitionGroups[ex.id].ex_total_qty += qty;
        exhibitionGroups[ex.id].ex_total_rev += rev;
        exhibitionGroups[ex.id].booths.push({
          detail_id: detailId,
          is_paid: isPaid,
          booth_info: `${booth.booth_number} (${booth.owner.nickname})`,
          source_name: sourceName, // ⭐ 存入來源名稱（單品或組合包名）
          event_price: (rev / qty).toFixed(0),
          quantity: qty,
          revenue: Math.round(rev),
        });
      };

      // A. 處理單品
      product.details.forEach((d: any) => {
        const qty = d.sales.reduce(
          (sum: number, s: any) => sum + s.quantity,
          0
        );
        const rev = qty * d.event_price;
        addToReport(
          d.booth.exhibition,
          d.booth,
          qty,
          rev,
          d.id,
          d.is_paid,
          "一般單品"
        );
      });

      // B. 處理組合包
      product.bundle_shares.forEach((share: any) => {
        const bundle = share.bundle;
        if (!bundle) return;

        bundle.details.forEach((bd: any) => {
          const qty = bd.sales.reduce(
            (sum: number, s: any) => sum + s.quantity,
            0
          );
          if (qty === 0) return;

          const totalWeight = bd.bundle.items.reduce(
            (sum: number, i: any) => sum + (i.share_weight || 0),
            0
          );
          const weightRatio =
            totalWeight > 0 ? share.share_weight / totalWeight : 0;
          const myRev = qty * bd.event_price * weightRatio;

          // ⭐ 標記來自哪個組合包
          addToReport(
            bd.booth.exhibition,
            bd.booth,
            qty,
            myRev,
            bd.id,
            bd.is_paid,
            `組合包: ${bundle.name}`
          );
        });
      });

      return {
        ...product,
        total_quantity: totalQty,
        total_revenue: Math.round(totalRev),
        exhibitions: Object.values(exhibitionGroups),
      };
    });
  } catch (err: any) {
    console.error(err);
  } finally {
    loading.value = false;
  }
};

// 新增確認收款方法
const confirmPayment = async (detailId: number) => {
  // 防錯檢查：如果 ID 是 undefined 或 null，直接擋掉
  if (!detailId) {
    console.error("錯誤：detailId 為空，無法執行更新。");
    alert("系統錯誤：找不到該項目的識別碼，請重新整理頁面。");
    return;
  }

  const ok = confirm("確定已收到此攤位的款項嗎？確認後該筆銷售紀錄將鎖定。");
  if (!ok) return;

  loading.value = true;
  try {
    const { error } = await supabase
      .from("Exhibition_Product_Details")
      .update({ is_paid: true })
      .eq("id", detailId); // 這裡如果傳入 undefined 就會觸發資料庫報錯

    if (error) throw error;

    await fetchProductReport(); // 重新整理報表
    alert("收款確認成功！該項目已鎖定。");
  } catch (err: any) {
    alert("確認收款失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchProductReport);
</script>

<style scoped>
.shadow-sm {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05) !important;
}
</style>
