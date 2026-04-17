<template>
  <v-container class="fill-height bg-grey-lighten-4">
    <v-row justify="center">
      <v-col cols="12" md="6" lg="4">
        <v-card v-if="!isVerified" class="pa-6 rounded-xl shadow-lg border">
          <v-card-title class="text-h5 font-weight-black text-center mb-4">
            訂單安全驗證
          </v-card-title>

          <v-alert
            v-if="errorMsg"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4 text-caption"
          >
            {{ errorMsg }}
          </v-alert>

          <v-card-text>
            <p class="text-grey-darken-1 mb-6 text-center">
              請輸入訂單聯絡電話的後三碼 。
            </p>
            <v-otp-input
              v-model="authCode"
              length="3"
              type="number"
              variant="underlined"
              :disabled="loading"
              @finish="handleVerify"
            ></v-otp-input>
          </v-card-text>

          <v-card-actions>
            <v-btn
              block
              size="large"
              color="primary"
              variant="flat"
              :loading="loading"
              @click="handleVerify"
            >
              解鎖訂單
            </v-btn>
          </v-card-actions>
        </v-card>

        <v-card v-else class="rounded-xl overflow-hidden border">
          <v-toolbar color="success" class="px-4">
            <v-icon icon="mdi-shield-check" class="mr-2"></v-icon>
            <v-toolbar-title class="font-weight-black"
              >驗證成功</v-toolbar-title
            >
          </v-toolbar>

          <v-list lines="two" class="pa-4">
            <div class="d-flex justify-space-between align-center mb-4">
              <span class="text-h6 font-weight-black">訂單詳情</span>
              <v-chip size="small" color="primary">{{
                orderData?.method
              }}</v-chip>
            </div>

            <v-list-item class="px-0">
              <v-list-item-title class="text-caption text-grey"
                >訂單編號</v-list-item-title
              >
              <v-list-item-subtitle class="text-body-1 font-weight-bold">
                {{ orderData?.order_number }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-list-item class="px-0">
              <v-list-item-title class="text-caption text-grey"
                >交易時間</v-list-item-title
              >
              <v-list-item-subtitle class="text-body-1">
                {{ formatDate(orderData?.created_at) }}
              </v-list-item-subtitle>
            </v-list-item>

            <v-divider class="my-4"></v-divider>

            <div class="mb-4">
              <div
                v-for="item in orderItems"
                :key="item.id"
                class="d-flex justify-space-between mb-2"
              >
                <div>
                  <div class="text-body-2 font-weight-bold">
                    {{
                      item.details.product?.name || item.details.bundle?.name
                    }}
                  </div>
                  <div class="text-caption text-grey">
                    數量：{{ item.quantity }}
                  </div>
                </div>
                <div class="text-body-2 font-weight-medium">
                  ${{ item.quantity * item.details.event_price }}
                </div>
              </div>
            </div>

            <v-divider class="my-4 border-dashed"></v-divider>

            <div class="d-flex justify-space-between align-center">
              <span class="text-h6 font-weight-bold">總計金額</span>
              <span class="text-h5 font-weight-black text-primary"
                >${{ totalAmount }}</span
              >
            </div>
          </v-list>

          <v-btn
            block
            variant="text"
            color="grey"
            size="small"
            class="mb-2"
            @click="isVerified = false"
          >
            重新鎖定
          </v-btn>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const route = useRoute();
const supabase = useSupabaseClient();

definePageMeta({
  layout: "clear",
});

const loading = ref(false);
const isVerified = ref(false);
const authCode = ref("");
const errorMsg = ref("");

const orderData = ref<any>(null);
const orderItems = ref<any[]>([]);

const totalAmount = computed(() => {
  return orderItems.value.reduce(
    (sum, item) => sum + item.quantity * item.details.event_price,
    0
  );
});

const handleVerify = async () => {
  if (authCode.value.length !== 3) return;
  loading.value = true;
  errorMsg.value = "";

  try {
    // 改為呼叫 RPC 函數
    const { data, error } = await supabase.rpc(
      "get_order_by_token_and_last_three_phone",
      {
        t_token: route.params.id,
        t_last_three: authCode.value,
      }
    );

    if (error) throw error;

    if (!data || !data.order) {
      errorMsg.value = "驗證失敗：手機後三碼不正確。";
    } else {
      // 根據 RPC 回傳的結構重新賦值
      orderData.value = data.order;
      // 這裡要對應你 RPC 寫的結構
      orderItems.value = data.items.map((item) => ({
        quantity: item.quantity,
        details: {
          event_price: item.price,
          product: { name: item.product_name },
          bundle: { name: item.bundle_name },
        },
      }));
      isVerified.value = true;
    }
  } catch (err: any) {
    errorMsg.value = "查詢出錯，請確認連結是否正確。";
    console.error(err);
  } finally {
    loading.value = false;
  }
};

const formatDate = (dateStr: string) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};
</script>

<style scoped>
.shadow-lg {
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1) !important;
}
.border-dashed {
  border-style: dashed !important;
}
</style>
