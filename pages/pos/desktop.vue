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
              @click="checkout('現金')"
              >現金結帳</v-btn
            >
          </v-col>
          <v-col cols="6" class="pl-1">
            <v-btn
              block
              color="green-darken-1"
              height="60"
              @click="checkout('Line Pay')"
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
