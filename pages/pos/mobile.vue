<template>
  <v-layout>
    <v-app-bar color="primary" density="compact" elevation="1">
      <v-app-bar-title class="font-weight-black">POS 現場結帳</v-app-bar-title>
      <v-spacer></v-spacer>
      <v-progress-linear
        v-if="loading"
        indeterminate
        color="white"
        absolute
        bottom
      ></v-progress-linear>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <v-container>
        <v-select
          v-model="selectedBooth"
          :items="booths"
          item-title="exhibition_name"
          item-value="id"
          label="選擇目前所在的攤位"
          variant="solo"
          density="comfortable"
          flat
          class="mb-2"
        ></v-select>

        <v-row dense>
          <v-col v-for="item in products" :key="item.id" cols="6">
            <v-card
              @click="
                !item.is_paid && item.computed_inventory > 0
                  ? addToCart(item)
                  : null
              "
              :disabled="item.is_paid || item.computed_inventory <= 0"
              :class="{
                'opacity-60 bg-grey-lighten-2': item.computed_inventory <= 0,
                'bg-blue-lighten-5 border-blue-lighten-3': item.is_paid,
                'border-purple-lighten-3': item.bundle_id && !item.is_paid,
              }"
              class="pa-3 text-center rounded-lg border"
              variant="flat"
              style="position: relative; overflow: hidden; min-height: 110px"
            >
              <v-chip
                v-if="item.bundle_id"
                size="x-small"
                color="purple"
                variant="flat"
                class="position-absolute"
                style="top: 4px; left: 4px; font-size: 0.6rem; height: 16px"
              >
                SET
              </v-chip>

              <div
                class="font-weight-bold text-truncate"
                :class="item.is_paid ? 'text-blue-darken-3' : ''"
              >
                {{ item.display_name }}
              </div>
              <div
                :class="item.is_paid ? 'text-blue-darken-1' : 'text-primary'"
                class="text-h6 font-weight-black"
              >
                ${{ item.event_price }}
              </div>

              <div class="mt-1" style="font-size: 0.7rem">
                <template v-if="item.is_paid">
                  <v-chip
                    size="x-small"
                    color="blue-darken-2"
                    variant="flat"
                    label
                    >已結清</v-chip
                  >
                </template>
                <template v-else>
                  <span
                    v-if="item.computed_inventory > 0"
                    class="text-grey-darken-1"
                  >
                    庫存: {{ item.computed_inventory }}
                  </span>
                  <span v-else class="text-error font-weight-bold">已售罄</span>
                </template>
              </div>

              <v-overlay
                contained
                :model-value="item.is_paid"
                scrim="blue-lighten-4"
                persistent
                opacity="0.3"
                class="align-center justify-center"
              >
                <v-icon color="blue-darken-2" size="large">mdi-lock</v-icon>
              </v-overlay>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-footer app class="pa-0 border-t shadow-lg">
      <v-btn
        block
        color="grey-darken-4"
        height="64"
        @click="showCart = true"
        class="rounded-0 text-h6"
        :disabled="loading"
      >
        <v-badge
          :content="cart.length"
          :model-value="cart.length > 0"
          color="red"
          offset-x="10"
        >
          <v-icon start icon="mdi-cart-outline"></v-icon>
        </v-badge>
        結帳清單 (${{ totalAmount }})
      </v-btn>
    </v-footer>

    <v-bottom-sheet v-model="showCart">
      <v-card class="rounded-t-xl overflow-hidden">
        <v-toolbar color="white" density="comfortable" class="border-b px-2">
          <v-btn
            icon="mdi-chevron-down"
            variant="text"
            @click="showCart = false"
          ></v-btn>
          <v-toolbar-title class="text-subtitle-1 font-weight-bold"
            >結帳明細</v-toolbar-title
          >
          <v-spacer></v-spacer>
          <v-btn variant="text" color="error" size="small" @click="cart = []"
            >清空</v-btn
          >
        </v-toolbar>

        <v-list style="max-height: 40vh" class="overflow-y-auto px-2">
          <v-list-item
            v-if="cart.length === 0"
            class="text-center py-12 text-grey"
          >
            尚未加入任何商品
          </v-list-item>

          <v-list-item v-for="(c, i) in cart" :key="i" class="px-2">
            <template v-slot:title>
              <div
                class="font-weight-bold text-body-1"
                :class="c.bundle_id ? 'text-purple-darken-2' : ''"
              >
                {{ c.display_name }}
              </div>
            </template>
            <template v-slot:subtitle>
              <span class="text-primary font-weight-bold"
                >${{ c.event_price }}</span
              >
            </template>

            <template v-slot:append>
              <div
                class="d-flex align-center bg-grey-lighten-4 rounded-pill px-1"
              >
                <v-btn
                  icon="mdi-minus"
                  size="x-small"
                  variant="text"
                  @click="c.quantity > 1 ? c.quantity-- : cart.splice(i, 1)"
                ></v-btn>
                <span
                  class="mx-2 font-weight-black"
                  style="min-width: 20px; text-align: center"
                  >{{ c.quantity }}</span
                >
                <v-btn
                  icon="mdi-plus"
                  size="x-small"
                  variant="text"
                  color="primary"
                  :disabled="c.quantity >= c.computed_inventory"
                  @click="
                    c.quantity < c.computed_inventory ? c.quantity++ : null
                  "
                ></v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>

        <v-divider></v-divider>

        <div v-if="cart.length > 0" class="px-6 pt-4 bg-white">
          <v-text-field
            v-model="checkoutForm.phone"
            label="客戶電話 (產單編號用)"
            placeholder="輸入電話或後三碼"
            variant="filled"
            density="comfortable"
            hide-details
            prepend-inner-icon="mdi-phone"
            maxlength="10"
            rounded="lg"
          ></v-text-field>
        </div>

        <div class="pa-6 bg-white">
          <div class="d-flex justify-space-between align-center mb-6">
            <span class="text-h6 font-weight-bold">應付總計</span>
            <span class="text-h4 font-weight-black text-success"
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
      </v-card>
    </v-bottom-sheet>

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

    <v-dialog v-model="showSuccessDialog" persistent max-width="340">
      <v-card class="rounded-xl text-center pa-6">
        <v-icon color="success" size="64" class="mb-2">mdi-check-circle</v-icon>
        <div class="text-h6 font-weight-black">結帳成功！</div>
        <div class="text-caption text-grey-darken-1 mb-4">
          訂單編號：{{ lastOrder?.number }}
        </div>

        <div class="d-flex justify-center bg-white pa-2 rounded-lg border">
          <qrcode-vue
            v-if="orderUrl"
            :value="orderUrl"
            :size="220"
            level="H"
            render-as="svg"
          />
        </div>

        <div class="mt-4 text-body-2 text-grey-darken-2">
          請讓客人掃描 QR Code<br />
          並告知輸入 <b>電話後三碼</b> 即可對帳
        </div>

        <v-card-actions class="mt-4 pa-0">
          <v-btn
            block
            color="primary"
            size="large"
            variant="flat"
            rounded="pill"
            @click="closeSuccessDialog"
          >
            完成，接下一單
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-layout>
</template>

<script setup lang="ts">
import QrcodeVue from "qrcode.vue";

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

const showCart = ref(false);
const showSuccessDialog = ref(false);

// 動態產生訂單查詢網址
const orderUrl = computed(() => {
  if (!lastOrder.value?.token) return "";
  // 這裡會自動抓取目前網頁的 domain
  const baseUrl = window.location.origin;
  return `${baseUrl}/exhibition_pos/order/${lastOrder.value.token}`;
});

// 封裝結帳處理
const handleCheckout = async (method: string) => {
  if (!checkoutForm.value.phone) {
    alert("請輸入聯絡電話以生成訂單編號");
    return;
  }

  const success = await checkout(method);

  if (success) {
    showCart.value = false; // 關閉購物車清單
    showSuccessDialog.value = true; // 開啟 QR Code 彈窗
  }
};

const closeSuccessDialog = () => {
  showSuccessDialog.value = false;
  // 可以在這裡做一些重置操作，如果有需要的話
};

definePageMeta({
  layout: "clear",
});
</script>
