<template>
  <v-container class="fill-height justify-center">
    <v-progress-circular indeterminate color="primary"></v-progress-circular>
  </v-container>
</template>

<script setup lang="ts">
const router = useRouter();

onMounted(() => {
  if (window.innerWidth < 600) {
    router.replace("/pos/mobile");
  } else {
    router.replace("/pos/desktop");
  }
});
</script>
