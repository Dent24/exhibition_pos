<template>
  <v-container>
    <v-row align="end" class="mb-6">
      <v-col>
        <p class="text-display-medium font-weight-black text-black mb-2">
          展覽銷售概覽
        </p>
        <p class="text-grey-darken-1 mb-0">
          以展覽場次為核心，管理您的攤位分潤與收款狀態。
        </p>
      </v-col>
    </v-row>

    <v-row v-if="loading" justify="center" class="my-12">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </v-row>

    <v-expansion-panels
      v-else
      v-model="openedExhibitions"
      multiple
      variant="inset"
    >
      <v-expansion-panel
        v-for="ex in exhibitionReport"
        :key="ex.id"
        class="mb-4 border-lg"
      >
        <v-expansion-panel-title class="bg-primary text-white">
          <v-row no-gutters align="center">
            <v-col cols="6" class="text-h6 font-weight-black">
              <v-icon icon="mdi-calendar-star" class="mr-2"></v-icon>
              {{ ex.name }}
            </v-col>
            <v-col cols="6" class="text-right">
              <span class="mr-4 text-subtitle-2"
                >總銷量: {{ ex.total_qty }}</span
              >
              <span class="text-h6 font-weight-black"
                >總應得: ${{ ex.total_rev }}</span
              >
            </v-col>
          </v-row>
        </v-expansion-panel-title>

        <v-expansion-panel-text class="pa-4 bg-grey-lighten-5">
          <v-card
            v-for="booth in ex.booths"
            :key="booth.booth_id"
            variant="flat"
            class="mb-6 border overflow-hidden shadow-sm"
          >
            <v-toolbar density="compact" color="white" class="border-b px-4">
              <v-icon
                icon="mdi-storefront"
                color="primary"
                class="mr-2"
              ></v-icon>
              <span class="font-weight-bold"
                >攤位：{{ booth.booth_number }}</span
              >
              <v-chip size="x-small" variant="tonal" class="ml-2"
                >攤主: {{ booth.owner_name }}</v-chip
              >
              <v-spacer></v-spacer>
              <div class="d-flex align-center">
                <span class="text-subtitle-2 mr-3"
                  >攤位小計: <b>${{ booth.booth_total_rev }}</b></span
                >

                <v-btn
                  v-if="!booth.all_paid"
                  size="small"
                  color="orange-darken-1"
                  elevation="1"
                  @click="confirmBoothPayment(booth)"
                >
                  確認整攤收款
                </v-btn>
                <v-chip
                  v-else
                  size="small"
                  color="blue"
                  variant="flat"
                  prepend-icon="mdi-check-circle"
                >
                  已結清
                </v-chip>
              </div>
            </v-toolbar>

            <v-table density="comfortable" class="bg-white">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th class="text-left">銷售項目 / 來源</th>
                  <th class="text-center">單價 (拆算)</th>
                  <th class="text-center">銷量</th>
                  <th class="text-right">應得小計</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in booth.items" :key="item.key">
                  <td>
                    <div class="d-flex align-center">
                      <v-icon
                        v-if="item.is_bundle"
                        size="small"
                        color="purple"
                        class="mr-1"
                        >mdi-package-variant</v-icon
                      >
                      <v-icon v-else size="small" color="grey" class="mr-1"
                        >mdi-tag-outline</v-icon
                      >
                      <span
                        class="font-weight-bold"
                        :class="item.quantity === 0 ? 'text-grey' : ''"
                      >
                        {{ item.display_name }}
                      </span>
                    </div>
                    <div
                      v-if="item.is_bundle"
                      class="text-caption text-grey-darken-1 mt-1"
                    >
                      <v-icon size="10">mdi-subdirectory-arrow-right</v-icon>
                      內含您的商品：{{ item.sub_products.join("、") }}
                    </div>
                  </td>
                  <td
                    class="text-center"
                    :class="item.quantity === 0 ? 'text-grey' : ''"
                  >
                    ${{ item.event_price }}
                  </td>
                  <td class="text-center">
                    <v-chip
                      v-if="item.quantity === 0"
                      size="x-small"
                      variant="outlined"
                      color="grey"
                      >未開單</v-chip
                    >
                    <span v-else>{{ item.quantity }}</span>
                  </td>
                  <td
                    class="text-right font-weight-black"
                    :class="item.quantity === 0 ? 'text-grey' : 'text-primary'"
                  >
                    ${{ item.revenue }}
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <div
      v-if="exhibitionReport.length === 0 && !loading"
      class="text-center pa-12"
    >
      <v-icon size="64" color="grey-lighten-1">mdi-chart-box-outline</v-icon>
      <p class="text-grey mt-4">尚無上架或銷售紀錄</p>
    </div>
  </v-container>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const userStore = useMainStore();

const loading = ref(false);
const exhibitionReport = ref<any[]>([]);
const openedExhibitions = ref([0]);

const fetchExhibitionReport = async () => {
  if (!userStore.profile?.id) return;
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from("Products")
      .select(
        `
        id, name,
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
              bundle:bundle_id ( items:Bundle_Items ( share_weight ) )
            )
          )
        )
      `
      )
      .eq("seller_id", userStore.profile.id);

    if (error) throw error;

    const exMap = new Map();

    const processItem = (
      ex: any,
      booth: any,
      product_name: string,
      qty: number,
      rev: number,
      detail_id: number,
      is_paid: boolean,
      source_name: string,
      is_bundle: boolean,
      raw_event_price: number
    ) => {
      // 1. 初始化展覽與攤位層級 (保持不變)
      if (!exMap.has(ex.id)) {
        exMap.set(ex.id, {
          id: ex.id,
          name: ex.name,
          total_qty: 0,
          total_rev: 0,
          booths: new Map(),
        });
      }
      const exData = exMap.get(ex.id);

      // 注意：ex_total_qty 在這裡先不加，因為組合包會重複進來，後面統一計算
      exData.total_rev += Math.round(rev);

      if (!exData.booths.has(booth.id)) {
        exData.booths.set(booth.id, {
          booth_id: booth.id,
          booth_number: booth.booth_number,
          owner_name: booth.owner.nickname,
          booth_total_rev: 0,
          all_paid: true,
          items: new Map(),
          detail_ids: new Set(),
        });
      }
      const boothData = exData.booths.get(booth.id);
      boothData.booth_total_rev += Math.round(rev);
      if (!is_paid) boothData.all_paid = false;
      boothData.detail_ids.add(detail_id);

      const itemKey = is_bundle ? `bundle-${detail_id}` : `single-${detail_id}`;

      if (boothData.items.has(itemKey)) {
        const existing = boothData.items.get(itemKey);
        // 營收要累加 (商品 A 的分潤 + 商品 B 的分潤)
        existing.revenue += Math.round(rev);
        // 權重單價要累加 (顯示當初設定的權重總和)
        existing.raw_event_price += raw_event_price;

        // 💡 關鍵修正：組合包的「數量」不重複累加
        // 因為同一個組合包被賣掉一個，對於賣家來說就是「一個組合包單位」
        if (!existing.sub_products.includes(product_name)) {
          existing.sub_products.push(product_name);
        }
      } else {
        boothData.items.set(itemKey, {
          key: itemKey,
          detail_id,
          display_name: is_bundle ? source_name : product_name,
          is_bundle,
          quantity: qty, // 第一次進入時設定數量
          revenue: Math.round(rev),
          sub_products: is_bundle ? [product_name] : [],
          raw_event_price,
        });

        // 只有在第一次建立 itemKey 時，才增加展覽的總銷量計數
        exData.total_qty += qty;
      }
    };

    data.forEach((p) => {
      p.details.forEach((d: any) => {
        const qty = d.sales.reduce(
          (s: number, r: any) => s + (r.quantity || 0),
          0
        );
        processItem(
          d.booth.exhibition,
          d.booth,
          p.name,
          qty,
          qty * d.event_price,
          d.id,
          d.is_paid,
          "一般單品",
          false,
          d.event_price
        );
      });

      p.bundle_shares.forEach((share: any) => {
        share.bundle?.details.forEach((bd: any) => {
          const qty = bd.sales.reduce(
            (s: number, r: any) => s + (r.quantity || 0),
            0
          );
          const totalWeight = bd.bundle.items.reduce(
            (s: number, i: any) => s + (i.share_weight || 0),
            0
          );
          const weightRatio =
            totalWeight > 0 ? share.share_weight / totalWeight : 0;
          // 組合包的「預估單價」顯示拆分後的價格
          const bundle_rev_share = bd.event_price * weightRatio;
          processItem(
            bd.booth.exhibition,
            bd.booth,
            p.name,
            qty,
            qty * bundle_rev_share,
            bd.id,
            bd.is_paid,
            share.bundle.name,
            true,
            bundle_rev_share
          );
        });
      });
    });

    exhibitionReport.value = Array.from(exMap.values()).map((ex) => ({
      ...ex,
      booths: Array.from(ex.booths.values()).map((b: any) => ({
        ...b,
        items: Array.from(b.items.values()).map((item: any) => ({
          ...item,
          // 如果數量 > 0 用實際營收除，否則用原始定價
          event_price:
            item.quantity > 0
              ? (item.revenue / item.quantity).toFixed(0)
              : Math.round(item.raw_event_price),
        })),
        detail_ids: Array.from(b.detail_ids),
      })),
    }));
  } catch (err) {
    console.error("報表生成失敗:", err);
  } finally {
    loading.value = false;
  }
};

const confirmBoothPayment = async (booth: any) => {
  const ok = confirm(
    `確定收到攤位 ${booth.booth_number} 的款項 $${booth.booth_total_rev} 嗎？\n(將包含一般單品與組合包分潤)`
  );
  if (!ok) return;

  loading.value = true;
  try {
    // 這裡我們直接使用 booth.detail_ids
    // 因為在 fetchExhibitionReport 階段，我們已經嚴格過濾過：
    // 只有「該賣家有參與（單品或組合包分攤）」的 detail_id 才會被加入這個 Set

    const targetIds = Array.from(booth.detail_ids);

    const { error } = await supabase
      .from("Exhibition_Product_Details")
      .update({ is_paid: true })
      .in("id", targetIds); // 直接對這些已驗證過的 ID 進行更新

    if (error) throw error;

    await fetchExhibitionReport();
    alert("收款確認成功！");
  } catch (err: any) {
    alert("確認失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

onMounted(fetchExhibitionReport);
</script>

<style scoped>
.shadow-sm {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05) !important;
}
.border-lg {
  border: 1px solid #e0e0e0 !important;
}
</style>
