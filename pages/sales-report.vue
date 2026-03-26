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

    <v-expansion-panels multiple>
      <v-expansion-panel v-for="booth in boothsReport" :key="booth.id">
        <v-expansion-panel-title>
          <div class="d-flex justify-space-between w-100 align-center pr-4">
            <div>
              <v-icon icon="mdi-map-marker-outline" class="mr-2"></v-icon>
              <strong>{{ booth.exhibitions.name }}</strong>
              <v-chip size="x-small" class="ml-2"
                >攤位: {{ booth.booth_number }}</v-chip
              >
            </div>
            <span class="text-success font-weight-bold"
              >營收: ${{ booth.total_booth_revenue }}</span
            >
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-data-table
            :headers="[
              { title: '', key: 'data-table-expand' },
              { title: '商品名稱', key: 'product.name' },
              { title: '單價', key: 'event_price' },
              { title: '累計銷量', key: 'total_qty' },
              { title: '小計', key: 'subtotal' },
            ]"
            :items="
              booth.details.map((d) => ({
                ...d,
                total_qty: d.sales.reduce((s, r) => s + r.quantity, 0),
                subtotal:
                  d.sales.reduce((s, r) => s + r.quantity, 0) * d.event_price,
              }))
            "
            show-expand
            density="compact"
          >
            <template v-slot:expanded-row="{ columns, item }">
              <tr>
                <td :colspan="columns.length" class="bg-grey-lighten-4 pa-4">
                  <div class="text-subtitle-2 mb-2">
                    <v-icon icon="mdi-history" size="small"></v-icon>
                    販售紀錄明細
                  </div>

                  <v-table density="compact" class="elevation-1 rounded">
                    <thead>
                      <tr>
                        <th>銷售時間</th>
                        <th>數量</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="record in item.sales" :key="record.id">
                        <td>
                          {{ new Date(record.created_at).toLocaleString() }}
                        </td>
                        <td>{{ record.quantity }}</td>
                        <td>
                          <v-btn
                            icon="mdi-delete"
                            variant="text"
                            color="error"
                            size="x-small"
                            @click="deleteSingleRecord(record.id)"
                          ></v-btn>
                        </td>
                      </tr>
                      <tr v-if="item.sales.length === 0">
                        <td colspan="3" class="text-center text-grey">
                          目前尚無販售紀錄
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </td>
              </tr>
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

  // 1. 在 boothsReport 中尋找選中的攤位 ID
  const targetBooth = boothsReport.value.find(
    (b) => b.id === selectedBoothIdInDialog.value
  );

  // 2. 關鍵：請檢查你的資料結構。
  // 如果你在 fetch 完後有處理過資料，請確認 details 是否存在
  if (!targetBooth || !targetBooth.details) {
    console.warn("找不到該攤位的商品細節", targetBooth);
    return [];
  }

  // 回傳該攤位的商品詳情 (Exhibition_Product_Details)
  return targetBooth.details;
});

// 1. 取得所有銷售報表資料
const fetchSalesReport = async () => {
  loading.value = true;
  const { data, error } = await supabase
    .from("Exhibition_Booths")
    .select(
      `
      id, booth_number,
      exhibitions:exhibition_id ( name ),
      details:Exhibition_Product_Details (
        id, event_price,
        product:product_id ( name ),
        sales:Sales_Records ( id, quantity, created_at )
      )
    `
    )
    .eq("owner_id", userStore.profile.id);

  if (!error) {
    // 預處理資料，計算每一層的小計
    boothsReport.value = data.map((booth) => ({
      ...booth,
      total_booth_revenue: booth.details.reduce(
        (sum, d) =>
          sum + d.sales.reduce((s, r) => s + r.quantity, 0) * d.event_price,
        0
      ),
    }));
  }
  loading.value = false;
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
const deleteSingleRecord = async (recordId: number) => {
  // 1. 二次確認，防止誤點
  if (!confirm("確定要刪除這筆銷售紀錄嗎？此動作將會影響營收統計。")) return;

  loading.value = true;
  try {
    // 2. 執行刪除指令
    const { error } = await supabase
      .from("Sales_Records")
      .delete()
      .eq("id", recordId);

    if (error) throw error;

    // 3. 刪除成功後，重新抓取報表資料以更新畫面上的統計數字
    await fetchSalesReport();

    // 選用：加入一個簡單的成功提示（若你有使用 Snackbar）
    // snackbar.show('紀錄已刪除', 'success');
  } catch (err: any) {
    console.error("刪除失敗:", err.message);
    alert("無法刪除紀錄：" + err.message);
  } finally {
    loading.value = false;
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
