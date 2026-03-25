<template>
  <v-container>
    <v-row v-if="mainStore.loading">
      <v-col cols="12" class="text-center">
        <v-progress-circular
          indeterminate
          color="primary"
        ></v-progress-circular>
      </v-col>
    </v-row>

    <v-row v-else>
      <v-col v-if="mainStore.profile?.is_owner" cols="12">
        <h2 class="text-h5 mb-4 text-secondary">攤主管理區</h2>
        <v-row>
          <v-col cols="12" md="6">
            <v-card hover @click="router.push('/booth-settings')">
              <v-card-item prepend-icon="mdi-store-cog">
                <v-card-title>設定參展攤位</v-card-title>
                <v-card-subtitle>管理您名下的展覽攤位資訊</v-card-subtitle>
              </v-card-item>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card hover @click="router.push('/booth-products')">
              <v-card-item prepend-icon="mdi-package-variant-closed">
                <v-card-title>設定攤位商品</v-card-title>
                <v-card-subtitle>管理攤位內展示的商品清單</v-card-subtitle>
              </v-card-item>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <v-col v-if="mainStore.profile?.is_seller" cols="12">
        <h2 class="text-h5 mb-4 text-secondary">賣家管理區</h2>
        <v-row>
          <v-col cols="12" md="6">
            <v-card hover @click="router.push('/product-settings')">
              <v-card-item prepend-icon="mdi-tag-plus">
                <v-card-title>設定商品</v-card-title>
                <v-card-subtitle>新增或修改您的個人商品</v-card-subtitle>
              </v-card-item>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card hover @click="router.push('/seller-permissions')">
              <v-card-item prepend-icon="mdi-account-check">
                <v-card-title>設定可售攤主</v-card-title>
                <v-card-subtitle>授權特定攤主販售您的商品</v-card-subtitle>
              </v-card-item>
            </v-card>
          </v-col>
        </v-row>
      </v-col>

      <v-col
        v-if="!mainStore.profile?.is_owner && !mainStore.profile?.is_seller"
        cols="12"
      >
        <v-alert type="info"
          >您目前尚未擁有任何管理權限，請聯繫管理員。</v-alert
        >
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
const mainStore = useMainStore();
const router = useRouter();
</script>
