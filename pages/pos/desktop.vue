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
            @click="addToCart(item)"
            hover
            class="pa-4 text-center rounded-lg border-sm"
          >
            <div class="text-h6 font-weight-bold mb-1">
              {{ item.product.name }}
            </div>
            <div class="text-primary text-h5 font-weight-black">
              ${{ item.event_price }}
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
            <v-btn icon="mdi-plus" size="x-small" @click="c.quantity++"></v-btn>
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
