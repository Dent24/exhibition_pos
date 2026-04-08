<template>
  <v-app>
    <v-layout>
      <v-main>
        <NuxtPage />
      </v-main>
    </v-layout>
  </v-app>
</template>

<script setup lang="ts">
const mainStore = useMainStore();
const user = useSupabaseUser();
const router = useRouter();

watch(
  user,
  (newUser, oldUser) => {
    if (!newUser && !mainStore.isLoggedIn) {
      if (
        router.currentRoute.value.path !== "/login" &&
        router.currentRoute.value.path !== "/register"
      ) {
        router.push("/login");
      }
    }
  },
  { immediate: true }
);
</script>
