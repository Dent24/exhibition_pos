<template>
  <div class="outer-box">
    <v-card class="rounded-lg overflow-hidden my-6">
      <v-card-title class="text-center py-8 bg-primary elevation-3">
        會員註冊
      </v-card-title>
      <v-card-text class="bg-white px-10 py-6">
        <v-form ref="form" v-model="valid" lazy-validation>
          <div class="mb-4">
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
            />
          </div>
          <div class="mb-4">
            <label class="d-block mb-2 ml-1"> 暱稱 (Nickname) </label>
            <v-text-field
              v-model="nickname"
              :rules="nicknameRules"
              required
              bg-color="#e5e2e1"
              class="rounded-b-0"
              density="comfortable"
              hide-details
              placeholder="nickname"
              prepend-inner-icon="mdi-account-circle"
              rounded="t-lg"
              variant="filled"
            />
          </div>
          <div class="mb-4">
            <label class="d-block mb-2 ml-1"> 密碼 (Password) </label>
            <v-text-field
              v-model="password"
              :rules="passwordRules"
              required
              bg-color="#e5e2e1"
              class="rounded-b-0"
              density="comfortable"
              hide-details
              placeholder="••••••••"
              prepend-inner-icon="mdi-lock"
              rounded="t-lg"
              type="password"
              variant="filled"
            />
          </div>
          <div class="mb-4">
            <label class="d-block mb-2 ml-1"> 確認密碼 (Check Password) </label>
            <v-text-field
              v-model="confirmPassword"
              :rules="confirmPasswordRules"
              required
              bg-color="#e5e2e1"
              class="rounded-b-0"
              density="comfortable"
              hide-details
              placeholder="••••••••"
              prepend-inner-icon="mdi-lock-check"
              rounded="t-lg"
              type="password"
              variant="filled"
            />
          </div>
          <v-row class="mb-4">
            <v-col cols="6">
              <v-switch
                v-model="is_owner"
                label="我是攤主"
                color="info"
                hide-details
                inset
              />
            </v-col>
            <v-col cols="6">
              <v-switch
                v-model="is_seller"
                label="我是賣家"
                color="info"
                hide-details
                inset
              />
            </v-col>
          </v-row>
          <v-alert v-if="errorMsg" type="error" class="my-3">
            {{ errorMsg }}
          </v-alert>
          <v-alert v-if="successMsg" type="success" class="my-3">
            {{ successMsg }}
          </v-alert>
          <v-btn
            @click="handleRegister"
            :disabled="!valid"
            :loading="loading"
            block
            class="font-bold rounded-xl text-white"
            color="primary"
            elevation="4"
            size="x-large"
          >
            註冊
          </v-btn>
        </v-form>
        <div class="mt-8 flex flex-col items-center space-y-4">
          <v-btn
            append-icon="mdi-arrow-right"
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

const mainStore = useMainStore();
const supabase = useSupabaseClient();
const router = useRouter();

definePageMeta({
  layout: "clear",
});

// 1. 表單狀態與類型限制
const form = ref<VForm | null>(null);
const valid = ref<boolean>(true);
const loading = ref<boolean>(false);

const email = ref<string>("");
const password = ref<string>("");
const confirmPassword = ref<string>("");

// 新增的三個欄位
const nickname = ref<string>("");
const is_seller = ref<boolean>(false);
const is_owner = ref<boolean>(false);

const errorMsg = ref<string | null>(null);
const successMsg = ref<string | null>(null);

// 2. 驗證規則
const emailRules = [
  (v: string) => !!v || "E-mail 是必填項",
  (v: string) => /.+@.+\..+/.test(v) || "E-mail 格式不正確",
];
const nicknameRules = [
  (v: string) => !!v || "暱稱是必填項",
  (v: string) => v.length <= 20 || "暱稱不能超過 20 個字元",
];
const passwordRules = [
  (v: string) => !!v || "密碼是必填項",
  (v: string) => v.length >= 6 || "密碼長度至少為 6 個字元",
];
const confirmPasswordRules = [
  (v: string) => !!v || "請確認密碼",
  (v: string) => v === password.value || "兩次輸入的密碼不一致",
];

// 3. 註冊邏輯 (雙重寫入：Auth + Users Table)
const handleRegister = async (): Promise<void> => {
  errorMsg.value = null;
  successMsg.value = null;

  if (!form.value) return;
  const { valid: formValid } = await form.value.validate();
  if (!formValid) return;

  loading.value = true;

  try {
    // 第一步：建立 Auth 帳號
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.value,
      password: password.value,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("無法取得用戶資訊");

    // 第二步：同步寫入 Users 資料表
    // 這裡我們拿 authData.user.id 作為關聯鍵
    const { error: dbError } = await supabase.from("Users").insert({
      nickname: nickname.value,
      is_seller: is_seller.value,
      is_owner: is_owner.value,
      Uid: authData.user.id,
    });

    if (dbError) throw dbError;

    // 成功回饋
    if (authData.session === null) {
      successMsg.value = "註冊成功！請檢查信箱驗證帳號。";
    } else {
      successMsg.value = "註冊成功，正在進入系統...";
      await mainStore.fetchProfile();
      setTimeout(() => router.push("/"), 1500);
    }
  } catch (err: any) {
    errorMsg.value = `發生錯誤: ${err.message}`;
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
