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
              @click="addToCart(item)"
              class="pa-3 text-center rounded-lg"
            >
              <div class="text-truncate">{{ item.product.name }}</div>
              <div class="text-primary font-weight-bold">
                ${{ item.event_price }}
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
        <v-list style="max-height: 40vh" class="overflow-y-auto">
          <v-list-item v-for="(c, i) in cart" :key="i">
            <v-list-item-title>{{ c.product.name }}</v-list-item-title>
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
                @click="c.quantity++"
              ></v-btn>
            </template>
          </v-list-item>
        </v-list>
        <div class="pa-4">
          <v-btn block color="success" size="large" @click="checkout"
            >確認結帳 ${{ totalAmount }}</v-btn
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
