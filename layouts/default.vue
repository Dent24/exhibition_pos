<template>
  <v-layout>
    <v-app-bar color="primary" elevation="2">
      <v-app-bar-nav-icon
        v-if="mobile"
        @click="drawer = !drawer"
      ></v-app-bar-nav-icon>
      <v-app-bar-title class="cursor-pointer" @click="router.push('/')">
        展場POS系統
      </v-app-bar-title>
      <v-spacer />
      <v-skeleton-loader
        v-if="mainStore.loading"
        type="text"
        :width="mobile ? 40 : 100"
        class="mr-2 mr-sm-4"
      />
      <!-- 手機版：暱稱只用頭像圖示 -->
      <v-btn
        v-else-if="mainStore.profile && mobile"
        icon="mdi-account-circle"
        variant="text"
        :active="route.fullPath === '/profile'"
        @click="router.push('/profile')"
      ></v-btn>
      <v-btn
        v-else-if="mainStore.profile"
        class="mr-4"
        variant="text"
        prepend-icon="mdi-account-circle"
        :active="route.fullPath === '/profile'"
        @click="router.push('/profile')"
      >
        你好，{{ mainStore.profile.nickname }}
      </v-btn>
      <!-- 手機版：登出只用圖示 -->
      <v-btn
        v-if="mobile"
        icon="mdi-logout"
        variant="text"
        @click="handleLogout"
      ></v-btn>
      <v-btn v-else class="mr-4" variant="outlined" @click="handleLogout"
        >登出</v-btn
      >
    </v-app-bar>

    <v-navigation-drawer
      v-model="drawer"
      class="elevation-3"
      color="white"
      width="280"
      :permanent="!mobile"
      :temporary="mobile"
    >
      <v-list v-model:opened="open">
        <v-list-group value="Owner" v-if="mainStore.profile?.is_owner">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" title="攤主管理區"></v-list-item>
          </template>
          <v-list-item
            v-for="(item, i) in ownerItems"
            class="list-item"
            :active="route.fullPath === item.route"
            active-color="primary"
            :key="i"
            :prepend-icon="item.icon"
            :title="item.title"
            :value="item.title"
            :subtitle="item.subtitle"
            @click="router.push(item.route)"
          ></v-list-item>
        </v-list-group>
        <v-list-group value="Seller" v-if="mainStore.profile?.is_seller">
          <template v-slot:activator="{ props }">
            <v-list-item v-bind="props" title="賣家管理區"></v-list-item>
          </template>
          <v-list-item
            v-for="(item, i) in saleItems"
            class="list-item"
            :active="route.fullPath === item.route"
            active-color="primary"
            :key="i"
            :prepend-icon="item.icon"
            :title="item.title"
            :value="item.title"
            :subtitle="item.subtitle"
            @click="router.push(item.route)"
          ></v-list-item>
        </v-list-group>
      </v-list>
    </v-navigation-drawer>

    <v-main class="fill-height" style="min-height: 100vh">
      <NuxtPage />
    </v-main>

    <AppUi />
  </v-layout>
</template>

<script setup lang="ts">
import { useDisplay } from "vuetify";

const mainStore = useMainStore();
const supabase = useSupabaseClient();
const user = useSupabaseUser();
const router = useRouter();
const route = useRoute();

// 手機版判斷（< 960px 視為行動裝置）
const { smAndDown: mobile } = useDisplay();

// 抽屜開關：桌機預設開啟、手機預設收合
const drawer = ref(!mobile.value);

const ownerItems = [
  {
    title: "設定參展攤位",
    subtitle: "管理您名下的展覽攤位資訊",
    route: "/booth-settings",
    icon: "mdi-store-cog",
  },
  {
    title: "設定攤位商品",
    subtitle: "管理攤位內展示的商品清單",
    route: "/booth-products",
    icon: "mdi-package-variant-closed",
  },
  {
    title: "攤位銷售紀錄",
    subtitle: "查看各場展覽的訂單明細與總收入",
    route: "/sales-report",
    icon: "mdi-receipt-text-outline",
  },
  {
    title: "賣家拆賬",
    subtitle: "依原價計算各賣家應得金額",
    route: "/settlement-report",
    icon: "mdi-cash-multiple",
  },
  {
    title: "現場 POS 結帳系統",
    subtitle: "快速錄入銷售、自動扣除庫存、即時計算金額",
    route: "/pos",
    icon: "mdi-cash-register",
  },
];

const saleItems = [
  {
    title: "設定商品",
    subtitle: "新增或修改您的個人商品",
    route: "/product-settings",
    icon: "mdi-tag-plus",
  },
  {
    title: "設定可售攤主",
    subtitle: "授權特定攤主販售您的商品",
    route: "/seller-permissions",
    icon: "mdi-account-check",
  },
  {
    title: "商品銷售統計",
    subtitle: "查看商品在各展覽的銷售表現",
    route: "/product-sales-report",
    icon: "mdi-chart-line",
  },
];

const open = ref(["Owner", "Seller"]);

// 1. 取得使用者在 Users 表的詳細權限資訊
onMounted(async () => {
  await mainStore.fetchProfile();
});

// 2. 登出邏輯
const handleLogout = async () => {
  const { error } = await supabase.auth.signOut();
  mainStore.clearProfile();
  if (!error) router.push("/login");
};

watch(
  () => route.fullPath,
  (val) => {
    if (val === "/") {
      open.value = ["Owner", "Seller"];
    }
    // 手機版切換頁面後自動收合抽屜
    if (mobile.value) drawer.value = false;
  }
);

// 視窗尺寸跨越斷點時，同步抽屜預設狀態
watch(mobile, (isMobile) => {
  drawer.value = !isMobile;
});

watch(
  user,
  (newUser, oldUser) => {
    if (!newUser && !mainStore.isLoggedIn) {
      router.push("/login");
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.list-item {
  padding-left: 16px;
}
</style>
