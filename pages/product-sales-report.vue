<template>
  <v-container>
    <v-row align="end" class="mb-6">
      <v-col>
        <p
          class="font-weight-black text-black mb-2"
          :class="mobile ? 'text-h5' : 'text-display-medium'"
        >
          商品銷售統計
        </p>
        <p class="text-grey-darken-1 mb-0">查看商品在各展覽的銷售表現</p>
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
        <!-- 手機版標題 -->
        <v-expansion-panel-title v-if="mobile" class="bg-primary text-white">
          <div class="w-100 pr-2">
            <div class="font-weight-black text-truncate mb-1">
              <v-icon icon="mdi-calendar-star" size="18" class="mr-1"></v-icon>
              {{ ex.name }}
            </div>
            <div class="d-flex justify-space-between align-center">
              <span class="text-caption">總銷量: {{ ex.total_qty }}</span>
              <span class="font-weight-black">總應得: ${{ ex.total_rev }}</span>
            </div>
          </div>
        </v-expansion-panel-title>

        <!-- 桌機版標題 -->
        <v-expansion-panel-title v-else class="bg-primary text-white">
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
            <!-- 攤位標頭 -->
            <div v-if="mobile" class="pa-3 border-b">
              <div class="d-flex align-center mb-2">
                <v-icon
                  icon="mdi-storefront"
                  color="primary"
                  size="18"
                  class="mr-2"
                ></v-icon>
                <span class="font-weight-bold text-truncate"
                  >攤位：{{ booth.booth_number }}</span
                >
                <v-chip size="x-small" variant="tonal" class="ml-2 flex-shrink-0"
                  >攤主: {{ booth.owner_name }}</v-chip
                >
              </div>
              <div class="d-flex align-center justify-space-between">
                <span class="text-subtitle-2"
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
            </div>

            <v-toolbar
              v-else
              density="compact"
              color="white"
              class="border-b px-4"
            >
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

            <!-- 手機版：項目卡片 -->
            <div v-if="mobile" class="pa-2 bg-white">
              <v-card
                v-for="item in booth.items"
                :key="item.key"
                border
                elevation="0"
                class="mb-2 pa-3 rounded-lg"
              >
                <div class="d-flex align-center">
                  <v-icon
                    :color="item.is_bundle ? 'purple' : 'grey'"
                    size="small"
                    class="mr-1"
                  >
                    {{
                      item.is_bundle ? "mdi-package-variant" : "mdi-tag-outline"
                    }}
                  </v-icon>
                  <span
                    class="font-weight-bold flex-grow-1 text-truncate"
                    :class="item.quantity === 0 ? 'text-grey' : ''"
                  >
                    {{ item.display_name }}
                  </span>
                  <v-chip
                    v-if="item.quantity === 0"
                    size="x-small"
                    variant="outlined"
                    color="grey"
                    class="flex-shrink-0"
                    >未開單</v-chip
                  >
                </div>
                <div
                  v-if="item.is_bundle"
                  class="text-caption text-grey-darken-1 mt-1"
                >
                  <v-icon size="10">mdi-subdirectory-arrow-right</v-icon>
                  內含您的商品：{{ item.sub_products.join("、") }}
                </div>

                <v-divider class="my-2"></v-divider>

                <div class="d-flex justify-space-between align-center">
                  <span class="text-caption text-grey-darken-1">
                    原價/件 ${{ item.event_price }} · 銷量
                    {{ item.quantity }}
                  </span>
                  <span
                    class="font-weight-black"
                    :class="item.quantity === 0 ? 'text-grey' : 'text-primary'"
                  >
                    ${{ item.revenue }}
                  </span>
                </div>
              </v-card>
            </div>

            <!-- 桌機版：表格 -->
            <v-table v-else density="comfortable" class="bg-white">
              <thead>
                <tr class="bg-grey-lighten-4">
                  <th class="text-left">銷售項目 / 來源</th>
                  <th class="text-center">原價/件</th>
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
import { useDisplay } from "vuetify";

const supabase = useDb();
const userStore = useMainStore();
const { smAndDown: mobile } = useDisplay();
const snackbar = useSnackbar();
const { confirm } = useConfirm();

useHead({
  title: "商品銷售統計",
});

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
        id, name, original_price,
        details:Exhibition_Product_Details (
          id, is_paid,
          booth:booth_id ( 
            id, booth_number, 
            owner:owner_id ( nickname ),
            exhibition:exhibition_id ( id, name )
          ),
          sales:Sales_Records ( quantity )
        ),
        bundle_shares:Bundle_Items (
          bundle:bundle_id (
            id, name,
            details:Exhibition_Product_Details (
              id, is_paid,
              booth:booth_id ( 
                id, booth_number, 
                owner:owner_id ( nickname ),
                exhibition:exhibition_id ( id, name )
              ),
              sales:Sales_Records ( quantity )
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
          // 通販攤位無展覽，歸入「通販」群組
          d.booth.exhibition ?? { id: 0, name: "通販" },
          d.booth,
          p.name,
          qty,
          qty * p.original_price,
          d.id,
          d.is_paid,
          "一般單品",
          false,
          p.original_price
        );
      });

      p.bundle_shares.forEach((share: any) => {
        share.bundle?.details.forEach((bd: any) => {
          const qty = bd.sales.reduce(
            (s: number, r: any) => s + (r.quantity || 0),
            0
          );
          processItem(
            // 通販攤位無展覽，歸入「通販」群組
            bd.booth.exhibition ?? { id: 0, name: "通販" },
            bd.booth,
            p.name,
            qty,
            qty * p.original_price,
            bd.id,
            bd.is_paid,
            share.bundle.name,
            true,
            p.original_price
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
  const ok = await confirm({
    title: "確認整攤收款",
    message: `確定收到攤位 ${booth.booth_number} 的款項 $${booth.booth_total_rev} 嗎？\n(將包含一般單品與組合包分潤)`,
    confirmText: "確認收款",
  });
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
    snackbar.success("收款確認成功！");
  } catch (err: any) {
    snackbar.error("確認失敗: " + err.message);
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
