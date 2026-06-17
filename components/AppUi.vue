<template>
  <!-- 全域通知 -->
  <v-snackbar
    v-model="snackbarState.show"
    :color="snackbarState.color"
    :timeout="snackbarState.timeout"
    location="top"
  >
    {{ snackbarState.text }}
    <template #actions>
      <v-btn
        icon="mdi-close"
        variant="text"
        size="small"
        @click="snackbarState.show = false"
      ></v-btn>
    </template>
  </v-snackbar>

  <!-- 全域確認對話框 -->
  <v-dialog v-model="confirmState.show" max-width="420" persistent>
    <v-card class="rounded-xl">
      <v-card-title class="font-weight-bold text-grey-darken-4 pt-5">
        {{ confirmState.title }}
      </v-card-title>
      <v-card-text class="text-body-1 text-grey-darken-2" style="white-space: pre-line">
        {{ confirmState.message }}
      </v-card-text>
      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn
          variant="text"
          class="text-grey-darken-1"
          @click="respond(false)"
        >
          {{ confirmState.cancelText }}
        </v-btn>
        <v-btn
          :color="confirmState.confirmColor"
          variant="flat"
          class="px-6"
          @click="respond(true)"
        >
          {{ confirmState.confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
const { snackbarState } = useSnackbar();
const { confirmState, respond } = useConfirm();
</script>
