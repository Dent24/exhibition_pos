<template>
  <v-container>
    <v-row class="mb-8">
      <v-col cols="12" md="8">
        <p class="text-primary font-weight-bold">近期展覽資訊</p>
        <p
          class="text-display-medium font-weight-black text-grey-darken-4 my-3"
        >
          {{ exhibition.name }}
        </p>
        <p class="text-grey text-title-small">
          {{ formatDate(exhibition.start_date) }} ~
          {{ formatDate(exhibition.end_date) }}
          {{ exhibition.location ? `| 地點：${exhibition.location}` : "" }}
        </p>
      </v-col>

      <v-col class="d-flex justify-md-end" cols="12" md="4">
        <v-card class="bg-white pa-4 d-flex align-center rounded-xl" flat>
          <v-avatar class="mr-4" color="blue-lighten-4" size="44">
            <v-icon color="primary">mdi-calendar</v-icon>
          </v-avatar>
          <div>
            <div class="font-weight-bold text-grey text-uppercase">
              Today's Date
            </div>
            <div class="font-weight-bold">{{ getFormattedToday() }}</div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <template v-if="mainStore.profile?.is_owner">
      <div
        class="text-title-large font-weight-bold py-2 pl-4 w-100 mb-6 text-grey-darken-4"
        style="border-left: 4px solid #2196f3"
      >
        攤主管理區
      </div>
      <v-row class="mb-10">
        <v-col cols="12" md="6">
          <v-card
            class="pa-8 rounded-xl d-flex flex-column justify-space-between overflow-hidden position-relative h-100 bg-white"
            elevation="8"
          >
            <v-icon
              class="position-absolute opacity-10"
              size="240"
              style="right: -40px; bottom: -40px"
              >mdi-cash-register</v-icon
            >
            <div>
              <v-avatar
                class="rounded-lg mb-6 border-sm"
                color="blue-lighten-5"
                size="64"
              >
                <v-icon color="primary" size="32">mdi-cash-register</v-icon>
              </v-avatar>
              <div class="text-display-small font-weight-black mb-4">
                現場 POS 結帳系統
              </div>
              <div
                class="text-grey-lighten-1 text-body-1"
                style="max-width: 320px"
              >
                即時現場交易處理與庫存連動，為展區提供最高效的收銀服務。
              </div>
            </div>
            <v-btn
              class="text-primary font-weight-bold px-0 d-flex align-center justify-start"
              size="large"
              variant="text"
              @click="router.push('/pos')"
            >
              立即開啟系統
              <v-icon class="ml-2" icon="mdi-arrow-right"></v-icon>
            </v-btn>
          </v-card>
        </v-col>
        <v-col cols="12" md="6">
          <v-row>
            <v-col cols="12" sm="6">
              <v-card
                class="rounded-xl pa-6 d-flex flex-column justify-space-between border cursor-pointer bg-white"
                hover
                @click="router.push('/booth-settings')"
              >
                <div class="d-flex justify-space-between">
                  <v-avatar
                    class="rounded-lg"
                    color="rgba(33, 150, 243, 0.15)"
                    size="48"
                  >
                    <v-icon color="primary">mdi-store-cog</v-icon>
                  </v-avatar>
                  <v-icon color="grey-lighten-1">mdi-open-in-new</v-icon>
                </div>
                <div>
                  <div class="text-title-medium font-weight-bold my-3">
                    設定參展攤位
                  </div>
                  <div class="text-grey">管理展場平面位置與攤主進駐資訊。</div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12" sm="6">
              <v-card
                class="rounded-xl pa-6 d-flex flex-column justify-space-between border cursor-pointer bg-white"
                hover
                @click="router.push('/booth-products')"
              >
                <div class="d-flex justify-space-between">
                  <v-avatar class="rounded-lg" color="blue-lighten-5" size="48">
                    <v-icon color="primary">mdi-package-variant-closed</v-icon>
                  </v-avatar>
                  <v-icon color="grey-lighten-1">mdi-open-in-new</v-icon>
                </div>
                <div>
                  <div class="text-title-medium font-weight-bold my-3">
                    設定攤位商品
                  </div>
                  <div class="text-grey">各攤位銷售品項的上架與價格設定。</div>
                </div>
              </v-card>
            </v-col>
            <v-col cols="12">
              <v-card
                class="rounded-xl pa-6 d-flex align-center border cursor-pointer bg-white"
                hover
                @click="router.push('/sales-report')"
              >
                <v-avatar
                  class="rounded-xl mr-6"
                  color="blue-lighten-5"
                  size="72"
                >
                  <v-icon color="primary" size="36">mdi-finance</v-icon>
                </v-avatar>
                <div class="flex-grow-1">
                  <div class="text-title-medium font-weight-bold mb-1">
                    銷售紀錄查詢
                  </div>
                  <div class="text-grey">
                    調閱過往交易明細、發票紀錄與退貨處理程序。
                  </div>
                </div>
                <v-icon color="primary">mdi-chevron-right</v-icon>
              </v-card>
            </v-col>
          </v-row>
        </v-col>
      </v-row>
    </template>

    <template v-if="mainStore.profile?.is_seller">
      <div
        class="text-title-large font-weight-bold py-2 pl-4 w-100 mb-6 text-grey-darken-4"
        style="border-left: 4px solid #2196f3"
      >
        賣家管理區
      </div>
      <v-row class="mb-10">
        <v-col cols="12" sm="4">
          <v-card
            class="rounded-xl pa-5 d-flex flex-column justify-space-between border bg-white"
          >
            <v-avatar
              class="rounded-lg"
              color="rgba(33, 150, 243, 0.15)"
              size="48"
            >
              <v-icon color="primary">mdi-tag-plus</v-icon>
            </v-avatar>
            <div>
              <div class="text-title-medium font-weight-bold my-3">
                設定商品
              </div>
              <div class="text-grey">新增或修改您的個人商品</div>
            </div>
            <v-btn
              class="text-primary font-weight-bold px-0 d-flex align-center justify-start mt-2"
              size="small"
              variant="text"
              @click="router.push('/product-settings')"
            >
              進入設定
              <v-icon class="ml-2" icon="mdi-arrow-right"></v-icon>
            </v-btn>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card
            class="rounded-xl pa-5 d-flex flex-column justify-space-between border bg-white"
          >
            <v-avatar
              class="rounded-lg"
              color="rgba(33, 150, 243, 0.15)"
              size="48"
            >
              <v-icon color="primary">mdi-account-check</v-icon>
            </v-avatar>
            <div>
              <div class="text-title-medium font-weight-bold my-3">
                設定可售攤主
              </div>
              <div class="text-grey">授權特定攤主販售您的商品</div>
            </div>
            <v-btn
              class="text-primary font-weight-bold px-0 d-flex align-center justify-start mt-2"
              size="small"
              variant="text"
              @click="router.push('/seller-permissions')"
            >
              進入設定
              <v-icon class="ml-2" icon="mdi-arrow-right"></v-icon>
            </v-btn>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card
            class="rounded-xl pa-5 d-flex flex-column justify-space-between border bg-white"
          >
            <v-avatar
              class="rounded-lg"
              color="rgba(33, 150, 243, 0.15)"
              size="48"
            >
              <v-icon color="primary">mdi-chart-line</v-icon>
            </v-avatar>
            <div>
              <div class="text-title-medium font-weight-bold my-3">
                商品銷售統計
              </div>
              <div class="text-grey">查看商品在各展覽的銷售表現</div>
            </div>
            <v-btn
              class="text-primary font-weight-bold px-0 d-flex align-center justify-start mt-2"
              size="small"
              variant="text"
              @click="router.push('/product-sales-report')"
            >
              進入設定
              <v-icon class="ml-2" icon="mdi-arrow-right"></v-icon>
            </v-btn>
          </v-card>
        </v-col>
      </v-row>
    </template>

    <v-alert
      v-if="!mainStore.profile?.is_owner && !mainStore.profile?.is_seller"
      class="mt-6"
      type="info"
    >
      您目前尚未擁有任何管理權限，請聯繫管理員。
    </v-alert>
  </v-container>
</template>

<script setup lang="ts">
interface Exhibition {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
}

const supabase = useSupabaseClient();
const mainStore = useMainStore();
const router = useRouter();

const exhibition = ref<Exhibition>({
  id: 0,
  name: "目前沒有正在進行的展覽",
  start_date: "",
  end_date: "",
  location: "",
});

const fetchCurrentExhibition = async () => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("Exhibitions")
    .select("id, name, start_date, end_date, location")
    // 1. 排除已結束的：結束時間必須 >= 現在
    .gte("end_date", now)
    // 2. 排序：最靠近現在的排在最前面
    .order("start_date", { ascending: true })
    // 3. 只取一筆
    .limit(1)
    .single();

  exhibition.value = data || {
    id: 0,
    name: "目前沒有進行中或即將的展覽",
    start_date: "",
    end_date: "",
    location: "",
  };
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date
    .toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/-/g, "/"); // 確保輸出為 YYYY/MM/DD
};

const getFormattedToday = () => {
  const now = new Date();

  // 取得年、月、日
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // 月份從 0 開始，需 +1
  const day = String(now.getDate()).padStart(2, "0");

  // 取得星期縮寫 (大寫)
  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const dayOfWeek = weekdays[now.getDay()];

  return `${year}.${month}.${day} (${dayOfWeek})`;
};

onMounted(async () => {
  await fetchCurrentExhibition();
});
</script>
