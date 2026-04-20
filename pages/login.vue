<template>
  <div class="outer-box">
    <div class="mb-4 text-center">
      <h1 class="text-display-small text-indigo-darken-1 mb-2">展場POS系統</h1>
      <p class="text-title-small text-grey-darken-1">攤主/賣家登入入口</p>
    </div>
    <v-card class="rounded-lg overflow-hidden">
      <v-card-title class="text-center py-8 bg-primary elevation-3">
        會員登入
      </v-card-title>
      <v-card-text class="bg-white px-10 py-6">
        <v-form ref="form" v-model="valid" lazy-validation>
          <div class="mb-6">
            <label class="d-block mb-2 ml-1"> 信箱 (Email) </label>
            <v-text-field
              v-model="email"
              type="email"
              :rules="emailRules"
              required
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
          <div class="mb-6">
            <label class="d-block mb-2 ml-1"> 密碼 (Password) </label>
            <v-text-field
              v-model="password"
              :rules="passwordRules"
              required
              @keyup.enter="handleLogin"
              bg-color="#e5e2e1"
              class="rounded-b-0"
              density="comfortable"
              hide-details
              placeholder="••••••••"
              prepend-inner-icon="mdi-lock"
              rounded="t-lg"
              type="password"
              variant="filled"
            ></v-text-field>
          </div>
          <v-alert v-if="errorMsg" type="error" variant="tonal" class="my-3">
            {{ errorMsg }}
          </v-alert>
          <v-btn
            @click="handleLogin"
            :disabled="!valid"
            :loading="loading"
            block
            class="font-bold rounded-xl text-white"
            color="primary"
            elevation="4"
            size="x-large"
          >
            登入
          </v-btn>
        </v-form>
        <div class="mt-8">
          <v-btn
            append-icon="mdi-arrow-right"
            class="font-semibold text-sm lowercase"
            color="primary"
            variant="text"
            to="/register"
          >
            立即註冊帳號
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
  title: "登入",
});

const mainStore = useMainStore();
const supabase = useSupabaseClient();
const router = useRouter();

const form = ref<VForm | null>(null);
const valid = ref<boolean>(true);
const loading = ref<boolean>(false);

const email = ref<string>("");
const password = ref<string>("");
const errorMsg = ref<string | null>(null);

const emailRules: ((v: string) => boolean | string)[] = [
  (v) => !!v || "E-mail 是必填項",
  (v) => /.+@.+\..+/.test(v) || "E-mail 格式不正確",
];

const passwordRules: ((v: string) => boolean | string)[] = [
  (v) => !!v || "請輸入密碼",
];

const handleLogin = async (): Promise<void> => {
  errorMsg.value = null;

  if (!form.value) return;

  const { valid: formValid } = await form.value.validate();
  if (!formValid) return;

  loading.value = true;

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    });

    if (error) throw error;
    await mainStore.fetchProfile();
    await router.push("/");
  } catch (err: any) {
    errorMsg.value = "登入失敗：信箱或密碼錯誤。";
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
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
