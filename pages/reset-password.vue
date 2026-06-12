<template>
  <div class="outer-box">
    <div class="mb-4 text-center">
      <h1 class="text-display-small text-indigo-darken-1 mb-2">展場POS系統</h1>
      <p class="text-title-small text-grey-darken-1">設定新密碼</p>
    </div>
    <v-card class="rounded-lg overflow-hidden">
      <v-card-title class="text-center py-8 bg-primary elevation-3">
        重設密碼
      </v-card-title>
      <v-card-text class="bg-white px-10 py-6">
        <!-- 完成 -->
        <template v-if="done">
          <v-alert type="success" variant="tonal" class="mb-4">
            密碼已更新，請使用新密碼重新登入。
          </v-alert>
          <v-btn
            block
            class="font-bold rounded-xl text-white"
            color="primary"
            size="x-large"
            to="/login"
          >
            前往登入
          </v-btn>
        </template>

        <!-- 未帶信箱（未從忘記密碼頁進入） -->
        <template v-else-if="!canReset">
          <v-alert type="warning" variant="tonal" class="mb-4">
            請先從「忘記密碼」頁面確認信箱後再進入此頁。
          </v-alert>
          <v-btn
            block
            class="font-bold rounded-xl"
            color="primary"
            variant="tonal"
            size="x-large"
            to="/forgot-password"
          >
            前往忘記密碼
          </v-btn>
        </template>

        <!-- 輸入新密碼 -->
        <template v-else>
          <p class="text-body-2 text-grey-darken-1 mb-6">
            正在為
            <strong>{{ email }}</strong>
            設定新密碼。
          </p>
          <v-form ref="form" v-model="valid" lazy-validation>
            <div class="mb-6">
              <label class="d-block mb-2 ml-1"> 新密碼 </label>
              <v-text-field
                v-model="password"
                :rules="passwordRules"
                required
                type="password"
                bg-color="#e5e2e1"
                class="rounded-b-0"
                density="comfortable"
                hide-details
                placeholder="至少 6 碼"
                prepend-inner-icon="mdi-lock"
                rounded="t-lg"
                variant="filled"
              ></v-text-field>
            </div>
            <div class="mb-6">
              <label class="d-block mb-2 ml-1"> 確認新密碼 </label>
              <v-text-field
                v-model="confirmPassword"
                :rules="confirmRules"
                required
                @keyup.enter="handleReset"
                type="password"
                bg-color="#e5e2e1"
                class="rounded-b-0"
                density="comfortable"
                hide-details
                placeholder="再次輸入新密碼"
                prepend-inner-icon="mdi-lock-check"
                rounded="t-lg"
                variant="filled"
              ></v-text-field>
            </div>
            <v-alert v-if="errorMsg" type="error" variant="tonal" class="my-3">
              {{ errorMsg }}
            </v-alert>
            <v-btn
              @click="handleReset"
              :disabled="!valid"
              :loading="loading"
              block
              class="font-bold rounded-xl text-white"
              color="primary"
              elevation="4"
              size="x-large"
            >
              更新密碼
            </v-btn>
          </v-form>
        </template>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
import type { VForm } from "vuetify/components";

definePageMeta({
  layout: "clear",
});

useHead({
  title: "重設密碼",
});

const supabase = useSupabaseClient();
const route = useRoute();

const form = ref<VForm | null>(null);
const valid = ref<boolean>(true);
const loading = ref<boolean>(false);
const done = ref<boolean>(false);

// 由「忘記密碼」頁帶入的信箱；沒有則無法重設
const email = computed(() => (route.query.email as string) || "");
const canReset = computed(() => !!email.value);

const password = ref<string>("");
const confirmPassword = ref<string>("");
const errorMsg = ref<string | null>(null);

const passwordRules: ((v: string) => boolean | string)[] = [
  (v) => !!v || "請輸入新密碼",
  (v) => (v && v.length >= 6) || "密碼至少需 6 碼",
];

const confirmRules: ((v: string) => boolean | string)[] = [
  (v) => !!v || "請再次輸入密碼",
  (v) => v === password.value || "兩次輸入的密碼不一致",
];

const handleReset = async (): Promise<void> => {
  errorMsg.value = null;
  if (!form.value || !email.value) return;

  const { valid: formValid } = await form.value.validate();
  if (!formValid) return;

  loading.value = true;
  try {
    // 無寄信流程：直接以信箱重設密碼
    const { data, error } = await supabase.rpc("reset_password_by_email", {
      p_email: email.value,
      p_new_password: password.value,
    });
    if (error) throw error;

    if (!data) {
      errorMsg.value = "查無此信箱，無法重設。";
      return;
    }

    done.value = true;
  } catch (err: any) {
    errorMsg.value = "更新失敗，請稍後再試。";
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped>
.outer-box {
  margin: 0 auto;
  max-width: 480px;
  width: 100%;
}
</style>
