<template>
  <v-container>
    <v-row class="mb-4">
      <v-col>
        <h1 class="text-h4 font-weight-bold text-primary">商品銷售統計</h1>
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
                    { title: '攤位 (攤主)', key: 'booth_info' },
                    { title: '現場定價', key: 'event_price', align: 'center' },
                    { title: '銷量', key: 'quantity', align: 'center' },
                    { title: '營收', key: 'revenue', align: 'end' },
                  ]"
                  :items="ex.booths"
                  density="compact"
                  hide-default-footer
                  class="mt-3 border rounded shadow-sm"
                >
                  <template v-slot:item.revenue="{ item }">
                    <span class="text-success font-weight-medium"
                      >${{ item.revenue }}</span
                    >
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
        id, name,
        details:Exhibition_Product_Details (
          id, event_price,
          booth:booth_id ( 
            id, booth_number, 
            owner:owner_id ( nickname ),
            exhibition:exhibition_id ( id, name )
          ),
          sales:Sales_Records ( quantity )
        )
      `
      )
      .eq("seller_id", userStore.profile.id);

    if (error) throw error;

    // 資料加工：商品 -> 展覽 -> 攤位
    productReport.value = (data || []).map((product) => {
      let totalQty = 0;
      let totalRev = 0;

      // 1. 先將細節按「展覽 ID」分組
      const exhibitionGroups: Record<number, any> = {};

      product.details.forEach((d: any) => {
        const ex = d.booth.exhibition;
        const qty = d.sales.reduce(
          (sum: number, s: any) => sum + s.quantity,
          0
        );
        const rev = qty * d.event_price;

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
          booth_info: `${d.booth.booth_number} (${d.booth.owner.nickname})`,
          event_price: d.event_price,
          quantity: qty,
          revenue: rev,
        });
      });

      return {
        ...product,
        total_quantity: totalQty,
        total_revenue: totalRev,
        avg_price: totalQty > 0 ? (totalRev / totalQty).toFixed(1) : 0,
        exhibitions: Object.values(exhibitionGroups), // 轉為陣列供前端循環
      };
    });
  } catch (err: any) {
    alert("讀取報表失敗: " + err.message);
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
