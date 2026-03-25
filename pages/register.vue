<template>
  <v-container class="fill-height">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="bg-white elevation-12" :loading="loading">
          <v-toolbar color="primary" title="建立帳號" flat></v-toolbar>

          <v-card-text>
            <v-form ref="form" v-model="valid">
              <v-text-field
                v-model="email"
                label="信箱"
                prepend-icon="mdi-email"
                :rules="emailRules"
              />

              <v-text-field
                v-model="nickname"
                label="暱稱"
                prepend-icon="mdi-account-circle"
                :rules="nicknameRules"
              />

              <v-text-field
                v-model="password"
                label="密碼"
                prepend-icon="mdi-lock"
                type="password"
                :rules="passwordRules"
              />

              <v-text-field
                v-model="confirmPassword"
                label="確認密碼"
                prepend-icon="mdi-lock-check"
                type="password"
                :rules="confirmPasswordRules"
              />

              <v-divider class="my-4"></v-divider>

              <v-row>
                <v-col cols="6">
                  <v-switch
                    v-model="is_owner"
                    label="我是攤主"
                    color="primary"
                    hide-details
                  ></v-switch>
                </v-col>
                <v-col cols="6">
                  <v-switch
                    v-model="is_seller"
                    label="我是賣家"
                    color="secondary"
                    hide-details
                  ></v-switch>
                </v-col>
              </v-row>
            </v-form>

            <v-alert v-if="errorMsg" type="error" class="mt-4">{{
              errorMsg
            }}</v-alert>
            <v-alert v-if="successMsg" type="success" class="mt-4">{{
              successMsg
            }}</v-alert>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn variant="text" to="/login">返回登入</v-btn>
            <v-btn
              color="primary"
              :loading="loading"
              :disabled="!valid"
              @click="handleRegister"
              >註冊</v-btn
            >
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { VForm } from "vuetify/components";

const mainStore = useMainStore();
const supabase = useSupabaseClient();
const router = useRouter();

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
</script>
