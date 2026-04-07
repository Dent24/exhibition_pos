<template>
  <v-container>
    <v-row class="mb-4" align="center">
      <v-col>
        <h1 class="text-h4 text-primary">銷售紀錄查詢</h1>
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
        <v-expansion-panel-title class="bg-primary text-white">
          <div class="d-flex justify-space-between w-100 align-center pr-4">
            <div>
              <v-icon icon="mdi-storefront" class="mr-2"></v-icon>
              <strong>{{ booth.exhibitions.name }}</strong>
              <v-chip
                size="x-small"
                color="white"
                variant="outlined"
                class="ml-2"
                >攤位: {{ booth.booth_number }}</v-chip
              >
            </div>
            <span class="text-h6 font-weight-bold"
              >總營收: ${{ booth.total_booth_revenue }}</span
            >
          </div>
        </v-expansion-panel-title>

        <v-expansion-panel-text class="pa-0">
          <v-card
            v-for="seller in booth.sellers"
            :key="seller.id"
            variant="outlined"
            class="ma-4 border-primary"
          >
            <v-toolbar density="compact" color="primary-lighten-5 bg-white">
              <v-icon
                icon="mdi-account-star"
                class="ml-4 mr-2"
                color="primary"
              ></v-icon>
              <span class="font-weight-bold text-primary"
                >賣家：{{ seller.nickname }}</span
              >
              <v-spacer></v-spacer>
              <span class="mr-4 text-subtitle-1"
                >賣家小計:
                <b class="text-primary"
                  >${{ seller.seller_total_revenue }}</b
                ></span
              >
            </v-toolbar>

            <v-data-table
              :headers="[
                { title: '', key: 'data-table-expand' },
                { title: '商品名稱', key: 'product.name' },
                { title: '狀態', key: 'status', width: '100px' }, // 新增狀態欄位
                { title: '展覽單價', key: 'event_price' },
                { title: '累計銷量', key: 'total_qty' },
                { title: '小計', key: 'subtotal' },
              ]"
              :items="seller.products"
              show-expand
              density="comfortable"
            >
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
                  :class="
                    item.is_paid
                      ? 'text-blue font-weight-bold'
                      : 'font-weight-bold'
                  "
                >
                  ${{ item.subtotal }}
                </span>
              </template>

              <template v-slot:expanded-row="{ columns, item }">
                <tr>
                  <td :colspan="columns.length" class="bg-grey-lighten-5 pa-4">
                    <div class="d-flex align-center mb-2">
                      <div class="text-caption font-weight-bold">
                        單筆銷售流水紀錄：
                      </div>
                      <v-spacer></v-spacer>
                      <span v-if="item.is_paid" class="text-caption text-blue">
                        <v-icon size="small">mdi-information</v-icon>
                        賣家已確認收款，紀錄已鎖定
                      </span>
                    </div>

                    <v-table density="compact" class="border rounded">
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
                          <td class="text-caption">
                            {{ new Date(record.created_at).toLocaleString() }}
                          </td>
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
          >
            <template v-slot:item="{ props, item }">
              <v-list-item
                v-bind="props"
                :disabled="item.is_paid || !item.product.total_inventory"
                :subtitle="
                  item.is_paid
                    ? '⚠️ 賣家已收款鎖定'
                    : !item.product.total_inventory
                    ? '⚠️ 無庫存'
                    : `展覽售價: $${item.event_price}`
                "
              >
                <template
                  v-slot:append
                  v-if="item.is_paid || !item.product.total_inventory"
                >
                  <v-icon color="blue">mdi-lock</v-icon>
                </template>
              </v-list-item>
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

          <v-btn-toggle
            v-model="saleForm.method"
            color="primary"
            mandatory
            variant="outlined"
            class="d-flex w-100"
            density="comfortable"
            rounded="lg"
          >
            <v-btn value="現金" class="flex-grow-1" prepend-icon="mdi-cash"
              >現金</v-btn
            >
            <v-btn
              value="Line Pay"
              class="flex-grow-1"
              prepend-icon="mdi-wallet"
              >Line Pay</v-btn
            >
          </v-btn-toggle>
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
  method: "現金",
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

// 1. 修改 fetchSalesReport 加入 is_paid
const fetchSalesReport = async () => {
  if (!userStore.profile?.id) return;
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from("Exhibition_Booths")
      .select(
        `
        id, 
        booth_number,
        exhibitions:exhibition_id ( name ),
        details:Exhibition_Product_Details (
          id, 
          event_price, 
          is_paid,
          product:product_id ( 
            name,
            total_inventory,
            seller:seller_id ( id, nickname ) 
          ),
          sales:Sales_Records ( id, quantity, created_at, method )
        )
      `
      )
      .eq("owner_id", userStore.profile.id);

    if (error) throw error;

    // 如果沒資料，直接設為空陣列並跳出
    if (!data || data.length === 0) {
      boothsReport.value = [];
      return;
    }

    // --- 安全的資料重組邏輯 ---
    boothsReport.value = data.map((booth) => {
      const sellerMap = new Map();

      // 檢查 details 是否存在
      if (booth.details) {
        booth.details.forEach((detail) => {
          // 安全取值：防止 product 或 seller 為 null
          const seller = detail.product?.seller;
          if (!seller) return; // 跳過異常資料

          const sellerId = seller.id;

          if (!sellerMap.has(sellerId)) {
            sellerMap.set(sellerId, {
              id: sellerId,
              nickname: seller.nickname,
              seller_total_revenue: 0,
              products: [],
            });
          }

          const sellerData = sellerMap.get(sellerId);
          // 安全檢查 sales 是否存在
          const salesArr = detail.sales || [];
          const totalQty = salesArr.reduce((s, r) => s + (r.quantity || 0), 0);
          const subtotal = totalQty * (detail.event_price || 0);

          sellerData.seller_total_revenue += subtotal;
          sellerData.products.push({
            ...detail,
            total_qty: totalQty,
            subtotal: subtotal,
            is_paid: !!detail.is_paid, // 強制轉為布林
            sales: salesArr,
          });
        });
      }

      return {
        ...booth,
        sellers: Array.from(sellerMap.values()),
        total_booth_revenue: Array.from(sellerMap.values()).reduce(
          (s, sel: any) => s + sel.seller_total_revenue,
          0
        ),
      };
    });
  } catch (err: any) {
    console.error("處理報表時出錯:", err);
    alert("讀取失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

// 2. 修改 saveSale 捕獲已收款錯誤
const saveSale = async () => {
  if (!saleForm.value.detail_id || saleForm.value.quantity <= 0) return;

  loading.value = true;
  try {
    const { error } = await supabase.rpc("manual_add_sale", {
      p_detail_id: saleForm.value.detail_id,
      p_quantity: saleForm.value.quantity,
      p_method: saleForm.value.method,
    });

    if (error) {
      if (error.message.includes("已完成收款確認")) {
        alert("無法新增：賣家已確認此商品的收款，數據已鎖定。");
      } else {
        throw error;
      }
      return;
    }

    addDialog.value = false;
    await fetchSalesReport();
  } catch (err: any) {
    alert("新增失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

// 3. 刪除單筆紀錄 (修改為呼叫 RPC)
const deleteSingleRecord = async (recordId: number) => {
  if (!confirm("確定要刪除這筆銷售紀錄嗎？")) return;

  loading.value = true;
  try {
    const { error } = await supabase.rpc("delete_sale_and_restock", {
      p_record_id: recordId,
    });

    if (error) {
      // 捕獲 SQL Function 丟出的 RAISE EXCEPTION
      if (error.message.includes("禁止修改")) {
        alert("無法刪除：該攤位商品已由賣家確認收款結案。");
      } else {
        throw error;
      }
      return;
    }

    await fetchSalesReport();
  } catch (err: any) {
    alert("操作失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

const resetForm = () => {
  selectedBoothIdInDialog.value = null;
  saleForm.value = {
    detail_id: null,
    quantity: 1,
    method: "現金",
  };
};

watch(addDialog, (val) => {
  if (!val) {
    resetForm();
  }
});

onMounted(fetchSalesReport);
</script>
