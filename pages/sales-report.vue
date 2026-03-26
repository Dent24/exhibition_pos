<template>
  <v-container>
    <v-row class="mb-4" align="center">
      <v-col>
        <h1 class="text-h4 text-primary">銷售數據報表</h1>
        <p class="text-subtitle-1 text-grey">查看並管理各場次的銷售統計</p>
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

    <v-expansion-panels multiple variant="inset">
      <v-expansion-panel
        v-for="booth in boothsReport"
        :key="booth.id"
        class="mb-4 border"
      >
        <v-expansion-panel-title>
          <v-row no-gutters align="center">
            <v-col cols="6">
              <span class="text-h6 font-weight-bold">{{
                booth.exhibitions.name
              }}</span>
              <span class="text-grey ml-2"
                >(攤位: {{ booth.booth_number }})</span
              >
            </v-col>
            <v-col cols="6" class="text-right pr-4">
              <v-chip color="success" variant="flat" size="small">
                總營收: ${{
                  booth.processedDetails.reduce(
                    (a, b) => a + b.total_revenue,
                    0
                  )
                }}
              </v-chip>
            </v-col>
          </v-row>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-data-table
            :headers="[
              { title: '商品名稱', key: 'product.name' },
              { title: '展覽售價', key: 'event_price', align: 'center' },
              { title: '銷售數量', key: 'total_quantity', align: 'center' },
              { title: '小計營收', key: 'total_revenue', align: 'center' },
              { title: '管理', key: 'actions', align: 'end', sortable: false },
            ]"
            :items="booth.processedDetails"
            density="comfortable"
          >
            <template v-slot:item.event_price="{ item }">
              ${{ item.event_price }}
            </template>

            <template v-slot:item.total_revenue="{ item }">
              <span class="text-success font-weight-bold"
                >${{ item.total_revenue }}</span
              >
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn
                icon="mdi-trash-can-outline"
                variant="text"
                color="error"
                size="small"
                @click="deleteSaleRecord(item.id)"
              ></v-btn>
            </template>
          </v-data-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-dialog v-model="addDialog" max-width="500px">
      <v-card>
        <v-card-title class="bg-primary text-white">手動新增銷售</v-card-title>
        <v-card-text class="pt-4">
          <v-select
            v-model="selectedBoothIdInDialog"
            label="選擇展覽攤位"
            :items="boothsReport"
            item-title="exhibitions.name"
            item-value="id"
            variant="outlined"
            @update:model-value="saleForm.detail_id = null"
          >
            <template v-slot:item="{ props, item }">
              <v-list-item
                v-bind="props"
                :subtitle="`攤位號碼: ${item.booth_number}`"
              ></v-list-item>
            </template>
          </v-select>

          <v-select
            v-model="saleForm.detail_id"
            :disabled="!selectedBoothIdInDialog"
            label="選擇上架商品"
            :items="productsInSelectedBooth"
            item-title="product.name"
            item-value="id"
            variant="outlined"
            class="mt-2"
            :no-data-text="
              selectedBoothIdInDialog
                ? '此攤位尚未設定任何商品'
                : '請先選擇攤位'
            "
          >
            <template v-slot:item="{ props, item }">
              <v-list-item
                v-bind="props"
                :subtitle="`展覽售價: $${item.event_price}`"
              ></v-list-item>
            </template>
          </v-select>

          <v-text-field
            v-model.number="saleForm.quantity"
            label="銷售數量"
            type="number"
            min="1"
            variant="outlined"
            class="mt-2"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="addDialog = false">取消</v-btn>
          <v-btn color="primary" @click="saveSale" :loading="loading"
            >確認新增</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
const supabase = useSupabaseClient();
const userStore = useMainStore();

// 狀態管理
const loading = ref(false);
const boothsReport = ref<any[]>([]); // 存放攤位、商品及其銷售紀錄
const addDialog = ref(false);

// 新增紀錄表單
const saleForm = ref({
  detail_id: null as number | null,
  quantity: 1,
});

// 專門給 Dialog 使用的暫存狀態
const selectedBoothIdInDialog = ref<number | null>(null);

const productsInSelectedBooth = computed(() => {
  if (!selectedBoothIdInDialog.value) return [];

  // 從 boothsReport 中找到目前選中的那個攤位
  const targetBooth = boothsReport.value.find(
    (b) => b.id === selectedBoothIdInDialog.value
  );

  // 回傳該攤位已經在 Exhibition_Product_Details 設定好的商品
  return targetBooth ? targetBooth.processedDetails : [];
});

// 1. 取得所有銷售報表資料
const fetchSalesReport = async () => {
  if (!userStore.profile?.id) return;
  loading.value = true;

  try {
    // 這裡進行多層嵌套查詢：攤位 -> 展覽 -> 商品詳情 -> 銷售紀錄
    const { data, error } = await supabase
      .from("Exhibition_Booths")
      .select(
        `
        id, booth_number,
        exhibitions:exhibition_id ( name ),
        details:Exhibition_Product_Details (
          id, event_price,
          product:product_id ( name ),
          sales:Sales_Records ( id, quantity )
        )
      `
      )
      .eq("owner_id", userStore.profile.id);

    if (error) throw error;

    // 整理資料：計算每個商品項目的總銷額與銷量
    boothsReport.value = (data || []).map((booth) => ({
      ...booth,
      processedDetails: booth.details.map((d: any) => {
        const totalQty = d.sales.reduce(
          (sum: number, s: any) => sum + s.quantity,
          0
        );
        return {
          ...d,
          total_quantity: totalQty,
          total_revenue: totalQty * d.event_price,
          sales_list: d.sales, // 保留原始清單供刪除使用（若需要細項管理）
        };
      }),
    }));
  } catch (err: any) {
    alert("讀取報表失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

// 2. 新增銷售紀錄
const saveSale = async () => {
  if (!saleForm.value.detail_id || saleForm.value.quantity <= 0) return;

  loading.value = true;
  const { error } = await supabase.from("Sales_Records").insert({
    detail_id: saleForm.value.detail_id,
    quantity: saleForm.value.quantity,
  });

  if (!error) {
    addDialog.value = false;
    await fetchSalesReport();
  } else {
    alert("新增失敗: " + error.message);
  }
  loading.value = false;
};

// 3. 刪除銷售紀錄 (這通常會刪除該品項在該攤位的所有紀錄，或可改為針對特定 ID)
const deleteSaleRecord = async (detailId: number) => {
  if (!confirm("確定要刪除此商品在該攤位的所有銷售紀錄嗎？此動作不可逆。"))
    return;

  const { error } = await supabase
    .from("Sales_Records")
    .delete()
    .eq("detail_id", detailId);

  if (!error) {
    await fetchSalesReport();
  } else {
    alert("刪除失敗: " + error.message);
  }
};

const resetForm = () => {
  selectedBoothIdInDialog.value = null;
  saleForm.value = {
    detail_id: null,
    quantity: 1,
  };
};

watch(addDialog, (val) => {
  if (!val) {
    resetForm();
  }
});

onMounted(fetchSalesReport);
</script>
