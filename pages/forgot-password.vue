<template>
  <div class="outer-box">
    <div class="mb-4 text-center">
      <h1 class="text-display-small text-indigo-darken-1 mb-2">展場POS系統</h1>
      <p class="text-title-small text-grey-darken-1">重設密碼</p>
    </div>
    <v-card class="rounded-lg overflow-hidden">
      <v-card-title class="text-center py-8 bg-primary elevation-3">
        忘記密碼
      </v-card-title>
      <v-card-text class="bg-white px-10 py-6">
        <p class="text-body-2 text-grey-darken-1 mb-6">
          請輸入註冊時使用的信箱，確認後即可設定新密碼。
        </p>
        <v-form ref="form" v-model="valid" lazy-validation>
          <div class="mb-6">
            <label class="d-block mb-2 ml-1"> 信箱 (Email) </label>
            <v-text-field
              v-model="email"
              type="email"
              :rules="emailRules"
              required
              @keyup.enter="handleSubmit"
              bg-color="#e5e2e1"
              class="rounded-b-0"
              density="comfortable"
              hide-details
              placeholder="example@domain.com"
              prepend-inner-icon="mdi-account"
              rounded="t-lg"
              variant="filled"
            ></v-text-field>
          </div>
          <v-alert v-if="errorMsg" type="error" variant="tonal" class="my-3">
            {{ errorMsg }}
          </v-alert>
          <v-btn
            @click="handleSubmit"
            :disabled="!valid"
            :loading="loading"
            block
            class="font-bold rounded-xl text-white"
            color="primary"
            elevation="4"
            size="x-large"
          >
            下一步
          </v-btn>
        </v-form>

        <div class="mt-8">
          <v-btn
            prepend-icon="mdi-arrow-left"
            class="font-semibold text-sm lowercase"
            color="primary"
            variant="text"
            to="/login"
          >
            返回登入
          </v-btn>
        </div>
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
  title: "忘記密碼",
});

const supabase = useSupabaseClient();
const router = useRouter();

const form = ref<VForm | null>(null);
const valid = ref<boolean>(true);
const loading = ref<boolean>(false);

const email = ref<string>("");
const errorMsg = ref<string | null>(null);

const emailRules: ((v: string) => boolean | string)[] = [
  (v) => !!v || "E-mail 是必填項",
  (v) => /.+@.+\..+/.test(v) || "E-mail 格式不正確",
];

const handleSubmit = async (): Promise<void> => {
  errorMsg.value = null;
  if (!form.value) return;

  const { valid: formValid } = await form.value.validate();
  if (!formValid) return;

  loading.value = true;
  try {
    // 無寄信流程：先確認信箱是否存在，再跳轉到重設頁
    const { data, error } = await supabase.rpc("auth_email_exists", {
      p_email: email.value,
    });
    if (error) throw error;

    if (!data) {
      errorMsg.value = "查無此信箱，請確認後再試。";
      return;
    }

    // 帶著信箱前往重設頁
    router.push({ path: "/reset-password", query: { email: email.value } });
  } catch (err: any) {
    errorMsg.value = "確認失敗，請稍後再試。";
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  // 非登入狀態頁面，清除任何殘留 session
  await supabase.auth.signOut();
});
</script>

<style scoped>
.outer-box {
  margin: 0 auto;
  max-width: 480px;
  width: 100%;
}
</style>
