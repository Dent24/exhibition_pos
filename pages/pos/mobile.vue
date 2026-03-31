<template>
  <v-layout>
    <v-app-bar color="primary" density="compact">
      <v-app-bar-title>POS 現場結帳</v-app-bar-title>
    </v-app-bar>

    <v-main class="bg-grey-lighten-4">
      <v-container>
        <v-select
          v-model="selectedBooth"
          :items="booths"
          item-title="exhibition_name"
          item-value="id"
          label="選擇攤位"
          variant="outlined"
          density="compact"
        ></v-select>

        <v-row dense>
          <v-col v-for="item in products" :key="item.id" cols="6">
            <v-card
              v-if="item.product"
              @click="item.product.total_inventory > 0 ? addToCart(item) : null"
              :disabled="item.product.total_inventory <= 0"
              :class="{
                'opacity-60 bg-grey-lighten-2':
                  item.product.total_inventory <= 0,
              }"
              class="pa-3 text-center rounded-lg"
              variant="flat"
            >
              <div class="text-truncate font-weight-bold">
                {{ item.product.name }}
              </div>
              <div class="text-primary font-weight-bold">
                ${{ item.event_price }}
              </div>

              <div class="mt-1" style="font-size: 0.75rem">
                <span
                  v-if="item.product.total_inventory > 0"
                  class="text-grey-darken-1"
                >
                  庫存: {{ item.product.total_inventory }}
                </span>
                <span v-else class="text-error font-weight-bold">已售罄</span>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </v-main>

    <v-footer app class="pa-0 border-t">
      <v-btn
        block
        color="grey-darken-4"
        height="60"
        @click="showCart = true"
        class="rounded-0"
      >
        <v-badge
          :content="cart.length"
          :model-value="cart.length > 0"
          color="red"
        >
          <v-icon start icon="mdi-cart"></v-icon>
        </v-badge>
        查看清單 (共 ${{ totalAmount }})
      </v-btn>
    </v-footer>

    <v-bottom-sheet v-model="showCart">
      <v-card class="rounded-t-xl">
        <v-toolbar title="結帳清單" density="compact">
          <v-btn icon="mdi-close" @click="showCart = false"></v-btn>
        </v-toolbar>
        <v-list style="max-height: 50vh" class="overflow-y-auto">
          <v-list-item v-for="(c, i) in cart" :key="i">
            <v-list-item-title class="font-weight-bold">{{
              c.product.name
            }}</v-list-item-title>
            <v-list-item-subtitle
              >${{ c.event_price }} / 剩餘:
              {{ c.product.total_inventory }}</v-list-item-subtitle
            >

            <template v-slot:append>
              <div class="d-flex align-center">
                <v-btn
                  icon="mdi-minus"
                  size="x-small"
                  variant="tonal"
                  @click="c.quantity > 1 ? c.quantity-- : cart.splice(i, 1)"
                ></v-btn>
                <span class="mx-3 font-weight-bold">{{ c.quantity }}</span>
                <v-btn
                  icon="mdi-plus"
                  size="x-small"
                  variant="tonal"
                  color="primary"
                  :disabled="c.quantity >= c.product.total_inventory"
                  @click="
                    c.quantity < c.product.total_inventory ? c.quantity++ : null
                  "
                ></v-btn>
              </div>
            </template>
          </v-list-item>
        </v-list>

        <v-divider></v-divider>

        <div class="pa-4 bg-white">
          <div class="d-flex justify-space-between mb-2 text-subtitle-1">
            <span>總金額</span>
            <span class="text-h6 font-weight-black text-success"
              >${{ totalAmount }}</span
            >
          </div>
          <v-btn
            block
            color="success"
            size="large"
            class="rounded-pill"
            @click="checkout"
            >確認結帳</v-btn
          >
        </div>
      </v-card>
    </v-bottom-sheet>
  </v-layout>
</template>

<script setup lang="ts">
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
const showCart = ref(false);

definePageMeta({
  layout: "clear",
});
</script>
