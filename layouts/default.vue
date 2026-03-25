<template>
  <v-app>
    <v-app-bar color="primary" elevation="2">
      <v-app-bar-title @click="router.push('/')">管理系統</v-app-bar-title>
      <v-spacer></v-spacer>

      <v-skeleton-loader
        v-if="mainStore.loading"
        type="text"
        width="100"
        class="mr-4"
      ></v-skeleton-loader>
      <span v-else-if="mainStore.profile" class="mr-4">
        你好，{{ mainStore.profile.nickname }}
      </span>

      <v-btn variant="outlined" @click="handleLogout">登出</v-btn>
    </v-app-bar>

    <v-layout>
      <v-main class="mt-16">
        <NuxtPage />
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup lang="ts">
const mainStore = useMainStore();
const supabase = useSupabaseClient();
const router = useRouter();

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
</script>
