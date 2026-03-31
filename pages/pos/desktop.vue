為了達成「無庫存顯示但無法點擊」的效果，我們需要調整 v-card
的樣式與邏輯。我們可以使用 Vuetify 的 disabled 屬性（或透過 CSS
類別模擬），並在卡片內新增一個庫存數量的顯示區塊。 以下是針對電腦版 POS
畫面的修改建議： 1. 修改後的 Template 部分 我們在 v-card 上加上了 disabled
判斷，並利用 v-chip 或簡單的 div 顯示剩餘庫存。 程式碼片段

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
      ></v-select>

      <v-row>
        <v-col v-for="item in products" :key="item.id" cols="4" lg="3">
          <v-card
            v-if="item.product"
            @click="item.product.total_inventory > 0 ? addToCart(item) : null"
            :hover="item.product.total_inventory > 0"
            :disabled="item.product.total_inventory <= 0"
            :class="{
              'opacity-60 bg-grey-lighten-3': item.product.total_inventory <= 0,
            }"
            class="pa-4 text-center rounded-lg border-sm d-flex flex-column justify-center"
            style="min-height: 160px"
          >
            <div class="text-h6 font-weight-bold mb-1">
              {{ item.product.name }}
            </div>

            <div class="text-primary text-h5 font-weight-black">
              ${{ item.event_price }}
            </div>

            <div class="mt-2">
              <v-chip
                size="x-small"
                :color="
                  item.product.total_inventory > 0 ? 'grey-darken-1' : 'error'
                "
                variant="flat"
                label
              >
                {{
                  item.product.total_inventory > 0
                    ? `庫存: ${item.product.total_inventory}`
                    : "暫無庫存"
                }}
              </v-chip>
            </div>

            <v-overlay
              contained
              scrim="white"
              :model-value="item.product.total_inventory <= 0"
              persistent
              class="align-center justify-center"
            >
              <span class="text-error font-weight-bold text-h6">已售罄</span>
            </v-overlay>
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
          <template v-slot:title>{{ c.product.name }}</template>
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
              @click="
                c.quantity < c.product.total_inventory ? c.quantity++ : null
              "
              :disabled="c.quantity >= c.product.total_inventory"
            ></v-btn>
          </template>
        </v-list-item>
      </v-list>
      <div class="pa-6 border-t-lg">
        <div class="d-flex justify-space-between text-h4 mb-4">
          <span>總金額</span>
          <span class="text-success font-weight-black">${{ totalAmount }}</span>
        </div>
        <v-btn
          block
          color="success"
          size="x-large"
          :loading="loading"
          @click="checkout"
          >確認結帳</v-btn
        >
      </div>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
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
} = usePosSystem();

definePageMeta({
  layout: "clear",
});
</script>
