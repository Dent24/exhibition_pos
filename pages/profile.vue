<template>
  <v-container>
    <v-row align="end" class="mb-6 mb-md-10">
      <v-col>
        <p
          class="font-weight-black text-black mb-2"
          :class="mobile ? 'text-h5' : 'text-display-medium'"
        >
          會員資料
        </p>
        <p class="text-grey-darken-1 mb-0">查看您的帳號資訊並調整暱稱與身分。</p>
      </v-col>
    </v-row>

    <v-row>
      <!-- 帳號資訊（唯讀） -->
      <v-col cols="12" md="5">
        <v-card class="pa-6 rounded-xl h-100" :loading="mainStore.loading">
          <div class="d-flex align-center mb-6">
            <v-avatar color="blue-lighten-4" size="64" class="mr-4">
              <v-icon color="primary" size="36">mdi-account-circle</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-black">
                {{ mainStore.profile?.nickname || "—" }}
              </div>
              <div class="text-body-2 text-grey-darken-1">
                會員編號：{{ mainStore.profile?.id ?? "—" }}
              </div>
            </div>
          </div>

          <v-divider class="mb-4" />

          <div class="mb-4">
            <div class="text-caption text-grey-darken-1 mb-1">登入信箱</div>
            <div class="font-weight-medium">{{ user?.email || "—" }}</div>
          </div>

          <div>
            <div class="text-caption text-grey-darken-1 mb-2">目前身分</div>
            <div class="d-flex ga-2 flex-wrap">
              <v-chip
                v-if="mainStore.profile?.is_owner"
                color="primary"
                size="small"
                variant="flat"
                prepend-icon="mdi-store"
              >
                攤主
              </v-chip>
              <v-chip
                v-if="mainStore.profile?.is_seller"
                color="deep-purple"
                size="small"
                variant="flat"
                prepend-icon="mdi-tag"
              >
                賣家
              </v-chip>
              <span
                v-if="!mainStore.profile?.is_owner && !mainStore.profile?.is_seller"
                class="text-grey"
              >
                尚未設定身分
              </span>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- 編輯表單 -->
      <v-col cols="12" md="7">
        <v-card class="rounded-xl" :class="mobile ? 'pa-5' : 'pa-8'">
          <h3 class="font-weight-black text-grey-darken-4 mb-6">編輯資料</h3>

          <div class="mb-6">
            <label class="font-weight-bold text-grey-darken-2 d-block mb-2">
              暱稱
            </label>
            <v-text-field
              v-model="form.nickname"
              placeholder="請輸入暱稱"
              variant="filled"
              flat
              hide-details
              bg-color="grey-lighten-4"
              rounded="t-lg"
            ></v-text-field>
          </div>

          <div class="mb-2">
            <label class="font-weight-bold text-grey-darken-2 d-block mb-2">
              身分設定
            </label>
            <v-switch
              v-model="form.is_owner"
              color="primary"
              label="我是攤主"
              hide-details
              inset
            ></v-switch>
            <v-switch
              v-model="form.is_seller"
              color="deep-purple"
              label="我是賣家"
              hide-details
              inset
            ></v-switch>
          </div>

          <v-alert
            v-if="message"
            :type="messageType"
            variant="tonal"
            class="my-4"
            density="comfortable"
          >
            {{ message }}
          </v-alert>

          <v-divider class="my-4" />

          <div class="d-flex justify-end">
            <v-btn
              color="primary"
              class="font-weight-bold px-8 rounded-lg"
              height="44"
              variant="flat"
              :disabled="!isChanged || !form.nickname.trim()"
              :loading="saving"
              @click="save"
            >
              儲存變更
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { useDisplay } from "vuetify";

useHead({
  title: "會員資料",
});

const { smAndDown: mobile } = useDisplay();
const supabase = useDb();
const user = useSupabaseUser();
const mainStore = useMainStore();

const saving = ref(false);
const message = ref("");
const messageType = ref<"success" | "error">("success");

const form = ref({
  nickname: "",
  is_owner: false,
  is_seller: false,
});

// 從 store 帶入目前資料
const syncFromProfile = () => {
  const p = mainStore.profile;
  if (!p) return;
  form.value = {
    nickname: p.nickname ?? "",
    is_owner: !!p.is_owner,
    is_seller: !!p.is_seller,
  };
};

// 是否有變更（避免無意義的儲存）
const isChanged = computed(() => {
  const p = mainStore.profile;
  if (!p) return false;
  return (
    form.value.nickname !== (p.nickname ?? "") ||
    form.value.is_owner !== !!p.is_owner ||
    form.value.is_seller !== !!p.is_seller
  );
});

const save = async () => {
  if (!mainStore.profile?.id) return;
  saving.value = true;
  message.value = "";
  try {
    const { error } = await supabase
      .from("Users")
      .update({
        nickname: form.value.nickname.trim(),
        is_owner: form.value.is_owner,
        is_seller: form.value.is_seller,
      })
      .eq("id", mainStore.profile.id);

    if (error) throw error;

    // 重新同步 store，連動側邊選單的攤主/賣家區塊
    await mainStore.fetchProfile();
    syncFromProfile();
    messageType.value = "success";
    message.value = "資料已更新。";
  } catch (err: any) {
    messageType.value = "error";
    message.value = "更新失敗：" + (err.message || "未知錯誤");
  } finally {
    saving.value = false;
  }
};

onMounted(async () => {
  // profile 可能尚未載入（重新整理時），確保有資料
  if (!mainStore.profile) await mainStore.fetchProfile();
  syncFromProfile();
});

// profile 載入完成後同步表單
watch(() => mainStore.profile, syncFromProfile);
</script>
