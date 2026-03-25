<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="4">
        <v-card class="bg-white elevation-12" :loading="loading">
          <v-toolbar color="primary" dark flat>
            <v-toolbar-title>會員登入</v-toolbar-title>
          </v-toolbar>
          <v-card-text>
            <v-form ref="form" v-model="valid" lazy-validation>
              <v-text-field
                v-model="email"
                label="信箱 (Email)"
                name="login"
                prepend-icon="mdi-account"
                type="email"
                :rules="emailRules"
                required
              ></v-text-field>

              <v-text-field
                v-model="password"
                label="密碼 (Password)"
                name="password"
                prepend-icon="mdi-lock"
                type="password"
                :rules="passwordRules"
                required
                @keyup.enter="handleLogin"
              ></v-text-field>
            </v-form>

            <v-alert v-if="errorMsg" type="error" variant="tonal" class="mt-3">
              {{ errorMsg }}
            </v-alert>
          </v-card-text>

          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="secondary" variant="text" to="/register"
              >還沒有帳號？去註冊</v-btn
            >
            <v-btn
              color="primary"
              @click="handleLogin"
              :disabled="!valid"
              :loading="loading"
            >
              登入
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import type { VForm } from "vuetify/components";

definePageMeta({
  layout: "clear",
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
</script>
