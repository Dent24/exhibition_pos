<template>
  <v-row no-gutters class="fill-height bg-grey-lighten-4">
    <v-col cols="8" class="pa-4 overflow-y-auto" style="height: 100vh">
      <v-select
        v-model="selectedBooth"
        label="切換目前攤位"
        :items="booths"
        item-title="exhibition_name"
        item-value="id"
        variant="solo"
        class="mb-4"
        :loading="loading"
      ></v-select>

      <v-row>
        <v-col v-for="item in products" :key="item.id" cols="4" lg="3">
          <v-card
            @click="
              !item.is_paid && item.computed_inventory > 0
                ? addToCart(item)
                : null
            "
            :hover="!item.is_paid && item.computed_inventory > 0"
            :disabled="item.is_paid || item.computed_inventory <= 0"
            :class="{
              'opacity-60 bg-grey-lighten-3':
                item.is_paid || item.computed_inventory <= 0,
              'border-purple-darken-1': item.bundle_id && !item.is_paid, // 組合包特殊邊框
            }"
            class="pa-4 text-center rounded-lg border-sm d-flex flex-column justify-center"
            style="min-height: 160px"
          >
            <v-chip
              v-if="item.bundle_id"
              size="x-small"
              color="purple"
              variant="flat"
              class="position-absolute mt-n2 ml-n2"
              style="top: 10px; left: 10px"
            >
              SET
            </v-chip>

            <div class="text-h6 font-weight-bold mb-1">
              {{ item.display_name }}
            </div>

            <div class="text-primary text-h5 font-weight-black">
              ${{ item.event_price }}
            </div>

            <div class="mt-2">
              <v-chip
                v-if="item.is_paid"
                size="x-small"
                color="blue-darken-2"
                variant="flat"
                label
              >
                已結清
              </v-chip>
              <v-chip
                v-else
                size="x-small"
                :color="item.computed_inventory > 0 ? 'grey-darken-1' : 'error'"
                variant="flat"
                label
              >
                {{
                  item.computed_inventory > 0
                    ? `庫存: ${item.computed_inventory}`
                    : "已售罄"
                }}
              </v-chip>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </v-col>

    <v-col
      cols="4"
      class="bg-white border-s-lg d-flex flex-column"
      style="height: 100vh"
    >
      <v-toolbar color="grey-darken-4" title="待結帳清單"></v-toolbar>
      <v-list class="flex-grow-1 overflow-y-auto">
        <v-list-item v-for="(c, i) in cart" :key="i">
          <template v-slot:title>
            <span
              :class="
                c.bundle_id ? 'text-purple-darken-2 font-weight-bold' : ''
              "
            >
              {{ c.display_name }}
            </span>
          </template>
          <template v-slot:subtitle
            >${{ c.event_price }} x {{ c.quantity }}</template
          >
          <template v-slot:append>
            <v-btn
              icon="mdi-minus"
              size="x-small"
              @click="c.quantity > 1 ? c.quantity-- : cart.splice(i, 1)"
            ></v-btn>
            <span class="mx-2">{{ c.quantity }}</span>
            <v-btn
              icon="mdi-plus"
              size="x-small"
              @click="c.quantity < c.computed_inventory ? c.quantity++ : null"
              :disabled="c.quantity >= c.computed_inventory"
            ></v-btn>
          </template>
        </v-list-item>
      </v-list>

      <div class="px-6 py-2 bg-white">
        <v-text-field
          v-model="checkoutForm.phone"
          label="客戶電話 (產單編號用)"
          placeholder="輸入電話或後三碼"
          variant="outlined"
          density="compact"
          hide-details
          prepend-inner-icon="mdi-phone"
          maxlength="10"
          class="mb-2"
        ></v-text-field>
      </div>

      <div class="pa-6 border-t-lg bg-grey-lighten-5">
        <div class="d-flex justify-space-between align-end mb-4">
          <span class="text-h5 font-weight-bold">總金額</span>
          <span class="text-h3 text-success font-weight-black"
            >${{ totalAmount }}</span
          >
        </div>

        <v-row no-gutters class="mt-2">
          <v-col cols="6" class="pr-1">
            <v-btn
              block
              color="blue-darken-2"
              height="60"
              @click="handleCheckout('現金')"
              >現金結帳</v-btn
            >
          </v-col>
          <v-col cols="6" class="pl-1">
            <v-btn
              block
              color="green-darken-1"
              height="60"
              @click="handleCheckout('Line Pay')"
              >Line Pay</v-btn
            >
          </v-col>
        </v-row>
      </div>
    </v-col>

    <v-btn
      icon="mdi-home"
      color="grey-darken-3"
      size="large"
      elevation="8"
      position="fixed"
      location="bottom left"
      class="ma-6"
      style="z-index: 100"
      to="/"
    >
      <v-icon size="32">mdi-home</v-icon>
      <v-tooltip activator="parent" location="top">回到首頁</v-tooltip>
    </v-btn>

    <v-dialog v-model="showSuccessDialog" max-width="400" persistent>
      <v-card class="rounded-xl pa-4 text-center">
        <v-card-text>
          <v-icon color="success" size="64" class="mb-2"
            >mdi-check-circle</v-icon
          >
          <div class="text-h5 font-weight-black mb-1">結帳成功</div>
          <div class="text-subtitle-1 mb-4">
            訂單編號：{{ lastOrder?.number }}
          </div>

          <div class="bg-grey-lighten-4 pa-4 rounded-lg d-inline-block">
            <qrcode-vue
              v-if="orderUrl"
              :value="orderUrl"
              :size="200"
              level="H"
              render-as="svg"
            />
          </div>

          <p class="text-caption text-grey-darken-1 mt-4">
            請消費者掃描上方 QR Code<br />
            輸入<b>電話後三碼</b>即可查看訂單細節
          </p>
        </v-card-text>

        <v-card-actions>
          <v-btn
            block
            color="primary"
            size="large"
            variant="flat"
            @click="showSuccessDialog = false"
          >
            完成 (下一個客人)
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-row>
</template>

<script setup lang="ts">
import QrcodeVue from "qrcode.vue";

// 核心邏輯 (與手機版共用)
const {
  booths,
  selectedBooth,
  products,
  cart,
  totalAmount,
  addToCart,
  checkout,
  loading,
  checkoutForm,
  lastOrder,
} = usePosSystem();

definePageMeta({
  layout: "clear",
});

const showSuccessDialog = ref(false);

// 動態產生訂單查詢網址 (請替換為你的實際網域)
const orderUrl = computed(() => {
  if (!lastOrder.value?.token) return "";
  const baseUrl = window.location.origin;
  return `${baseUrl}/exhibition_pos/order/${lastOrder.value.token}`;
});

// 包裝原有的 checkout 邏輯
const handleCheckout = async (method: string) => {
  const success = await checkout(method);
  if (success) {
    showSuccessDialog.value = true;
  }
};
</script>
