<template>
  <v-container>
    <v-row align="end" class="mb-10">
      <v-col>
        <p class="text-display-medium font-weight-black text-black mb-2">
          設定參展攤位
        </p>
        <p class="text-grey-darken-1 mb-0">管理展場平面位置與攤主進駐資訊。</p>
      </v-col>
      <v-col cols="auto">
        <v-btn
          class="font-weight-bold"
          color="primary"
          prepend-icon="mdi-plus"
          size="large"
          @click="
            dialog = true;
            isEdit = false;
          "
        >
          新增參展展覽
        </v-btn>
      </v-col>
    </v-row>

    <v-row class="mb-8">
      <v-col cols="12" md="3">
        <v-card class="pa-6 rounded-xl">
          <v-icon class="mb-4" color="primary" size="32">
            mdi-calendar-check
          </v-icon>
          <div class="text-display-medium font-weight-black">
            {{ totalExhibitionsCount }}
          </div>
          <div class="text-title-medium font-weight-bold text-grey-darken-1">
            目前所有活動
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="3">
        <v-card class="pa-6 rounded-xl">
          <v-icon class="mb-4" color="orange-darken-3" size="32">
            mdi-store
          </v-icon>
          <div class="text-display-medium font-weight-black">
            {{ myBoothsCount }}
          </div>
          <div class="text-title-medium font-weight-bold text-grey-darken-1">
            自有攤位
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card
          class="pa-6 rounded-xl d-flex align-center justify-space-between h-100"
          color="grey-darken-4"
        >
          <template v-if="featuredExhibition">
            <div>
              <div class="text-display-small font-weight-bold mb-1">
                {{ featuredExhibition.name }}
              </div>
              <p class="text-title-medium text-grey-lighten-1 mb-0">
                {{ featuredExhibition.daysText }} /
                {{ featuredExhibition.statusText }}
              </p>
            </div>
            <v-btn
              class="font-weight-bold"
              color="primary"
              rounded="pill"
              :href="featuredExhibition.link"
              target="_blank"
            >
              前往官網
            </v-btn>
          </template>
          <div v-else>
            <div class="text-display-small font-weight-bold mb-1 text-grey">
              暫無進行中活動
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-card :loading="loading">
      <v-data-table
        :headers="headers"
        :items="exhibitionsTableItems"
        :loading="loading"
        class="elevation-0"
        disable-sort
        color="white"
      >
        <template v-slot:item.name="{ item }">
          <div class="d-flex align-center py-3">
            <v-avatar
              :color="item.color"
              class="mr-4"
              rounded="lg"
              size="40"
              variant="tonal"
            >
              <v-icon :color="item.color">{{ item.icon }}</v-icon>
            </v-avatar>
            <div>
              <div class="font-weight-bold text-subtitle-1">
                {{ item.name }}
              </div>
              <div class="text-caption text-grey">{{ item.subName }}</div>
            </div>
          </div>
        </template>

        <template v-slot:item.booth="{ item }">
          <v-chip
            class="font-weight-bold"
            :color="item.booth !== '未設定' ? 'success' : 'grey-lighten-4'"
            size="small"
            variant="flat"
          >
            {{ item.booth }}
          </v-chip>
        </template>

        <template v-slot:item.location="{ item }">
          <div class="d-flex align-center text-body-2">
            <v-icon class="mr-1" color="primary" size="16"
              >mdi-map-marker</v-icon
            >
            {{ item.location }}
          </div>
        </template>

        <template v-slot:item.actions="{ item }">
          <div class="d-flex justify-end">
            <template v-if="!item.isEnded">
              <v-btn
                class="mr-2"
                color="blue-darken-1"
                icon="mdi-pencil-outline"
                size="small"
                variant="text"
                @click="openEdit(item.raw)"
              ></v-btn>
              <v-btn
                color="error"
                icon="mdi-delete-outline"
                size="small"
                variant="text"
                @click="deleteBooth(item.id)"
              ></v-btn>
            </template>
            <v-chip v-else size="x-small" color="grey-lighten-1" variant="flat"
              >已鎖定</v-chip
            >
          </div>
        </template>

        <template v-slot:no-data>
          <div class="pa-10 text-grey">目前沒有參展紀錄</div>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog
      v-model="dialog"
      max-width="560px"
      persistent
      scrollable
      transition="dialog-bottom-transition"
    >
      <v-card class="rounded-xl overflow-hidden elevation-24">
        <div
          class="px-6 py-5 bg-grey-lighten-5 border-b d-flex justify-space-between align-center"
        >
          <div class="font-weight-black text-grey-darken-4">
            {{ isEdit ? "修改攤位資訊" : "新增參展展覽" }}
          </div>
          <v-btn
            icon="mdi-close"
            variant="text"
            color="grey-darken-1"
            density="comfortable"
            @click="dialog = false"
          ></v-btn>
        </div>

        <v-card-text class="pa-8">
          <div class="mb-6">
            <label class="font-weight-bold text-grey-darken-2 d-block mb-2">
              選擇展覽
            </label>
            <v-select
              v-model="form.exhibition_id"
              :items="availableExhibitions"
              item-title="name"
              item-value="id"
              placeholder="請選擇展覽活動"
              variant="filled"
              flat
              hide-details
              bg-color="grey-lighten-4"
              rounded="t-lg"
              :disabled="isEdit"
              :no-data-text="isEdit ? '正在編輯中' : '目前無可選展覽'"
            />
          </div>

          <div class="mb-6">
            <label class="font-weight-bold text-grey-darken-2 d-block mb-2">
              攤位編號
            </label>
            <v-text-field
              v-model="form.booth_number"
              placeholder="例如: A01, Hall 4-B2"
              variant="filled"
              flat
              hide-details
              bg-color="grey-lighten-4"
              rounded="t-lg"
            ></v-text-field>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="px-8 py-6 bg-grey-lighten-5">
          <v-spacer></v-spacer>
          <v-btn
            variant="text"
            class="font-weight-bold px-6 text-grey-darken-1"
            @click="dialog = false"
            :disabled="loading"
          >
            取消
          </v-btn>
          <v-btn
            color="primary"
            class="font-weight-bold px-8 rounded-lg elevation-2"
            height="44"
            variant="flat"
            :disabled="!form.exhibition_id"
            :loading="loading"
            @click="saveBooth"
          >
            儲存
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
// 定義介面
interface Exhibition {
  id: number;
  name: string;
  start_date: string;
  end_date: string;
  location: string;
  link?: string;
}

interface BoothWithExhibition {
  id: number;
  exhibition_id: number;
  booth_number: string;
  exhibitions: Exhibition; // Supabase Join 回來的資料
}

const supabase = useSupabaseClient();
const userStore = useMainStore();

const headers: ReadonlyArray<{
  title: string;
  key: string;
  align?: "start" | "end" | "center";
}> = [
  { title: "展覽資訊", key: "name", align: "start" },
  { title: "日期範圍", key: "dateRange", align: "start" },
  { title: "攤位編號", key: "booth", align: "start" },
  { title: "地點", key: "location", align: "start" },
  { title: "操作", key: "actions", align: "end" },
];

// 狀態管理
const loading = ref(false);
const booths = ref<BoothWithExhibition[]>([]);
const allExhibitions = ref<Exhibition[]>([]);

// Dialog 控制
const dialog = ref(false);
const isEdit = ref(false);
const currentBoothId = ref<number | null>(null);

// 表單資料
const form = ref({
  exhibition_id: null as number | null,
  booth_number: "",
});

// 計算出尚未參加過的展覽清單
const availableExhibitions = computed(() => {
  if (isEdit.value) return allExhibitions.value;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // 設定為今天的凌晨，用於純日期比對

  // 1. 取得目前已經參加的展覽 ID 列表
  const joinedIds = booths.value.map((b) => b.exhibition_id);

  // 2. 執行多重過濾
  return allExhibitions.value.filter((e) => {
    // 條件 A：不能是已參加過的
    const notJoined = !joinedIds.includes(e.id);

    // 條件 B：展覽的開始日期必須在「明天」之後 (大於今天)
    const startDate = new Date(e.start_date);
    startDate.setHours(0, 0, 0, 0);
    const isFuture = startDate > today;

    return notJoined && isFuture;
  });
});
const totalExhibitionsCount = computed(() => allExhibitions.value.length);
const myBoothsCount = computed(() => booths.value.length);
const featuredExhibition = computed(() => {
  if (allExhibitions.value.length === 0) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // 將展覽分為：進行中、未來
  const ongoing = allExhibitions.value.filter((e) => {
    const start = new Date(e.start_date);
    const end = new Date(e.end_date);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return now >= start && now <= end;
  });

  const upcoming = allExhibitions.value
    .filter((e) => new Date(e.start_date) > now)
    .sort(
      (a, b) =>
        new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );

  // 優先取進行中，若無則取最快到的未來展覽
  const target =
    ongoing.length > 0 ? ongoing[0] : upcoming.length > 0 ? upcoming[0] : null;

  if (!target) return null;

  // 計算狀態文字與天數
  const startDate = new Date(target.start_date);
  const endDate = new Date(target.end_date);
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);

  let statusText = "";
  let daysText = "";

  if (now >= startDate && now <= endDate) {
    statusText = "進行中";
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysText = `剩餘 ${diffDays} 天`;
  } else {
    statusText = "即將開始";
    const diffTime = startDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysText = `倒數 ${diffDays} 天`;
  }

  return {
    name: target.name,
    statusText,
    daysText,
    link: target.link || "",
  };
});
const exhibitionsTableItems = computed(() => {
  return booths.value.map((item) => {
    const isEnded = isExhibitionEnded(item.exhibitions.end_date);

    return {
      id: item.id,
      name: item.exhibitions.name,
      subName: `展期：${formatDate(item.exhibitions.start_date)} - ${formatDate(
        item.exhibitions.end_date
      )}`,
      dateRange: `${formatDate(item.exhibitions.start_date)} ~ ${formatDate(
        item.exhibitions.end_date
      )}`,
      booth: item.booth_number || "未設定",
      location: item.exhibitions.location,
      // 根據是否結束動態給予圖示與顏色
      color: isEnded ? "grey" : "primary",
      icon: isEnded ? "mdi-calendar-remove" : "mdi-calendar-star",
      // 保留原始資料供操作使用
      raw: item,
      isEnded: isEnded,
    };
  });
});

// 1. 取得資料：讀取該使用者的所有攤位
const fetchMyBooths = async () => {
  loading.value = true;
  try {
    const { data, error } = await supabase.from("Exhibition_Booths").select(
      `
        id,
        exhibition_id,
        booth_number,
        exhibitions:exhibition_id ( id, name, start_date, end_date, location )
      `
    );

    if (error) throw error;
    booths.value = data as any;
  } catch (err: any) {
    alert("讀取攤位失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

// 2. 取得所有可選展覽 (用於下拉選單)
const fetchAllExhibitions = async () => {
  const { data } = await supabase.from("Exhibitions").select("*");
  if (data) allExhibitions.value = data;
};

// 3. 新增或修改儲存
const saveBooth = async () => {
  if (!form.value.exhibition_id) return;

  loading.value = true;
  const payload = {
    exhibition_id: form.value.exhibition_id,
    booth_number: form.value.booth_number,
    owner_id: userStore.profile?.id,
  };

  try {
    if (isEdit.value && currentBoothId.value) {
      const { error } = await supabase
        .from("Exhibition_Booths")
        .update(payload)
        .eq("id", currentBoothId.value);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("Exhibition_Booths")
        .insert(payload);
      if (error) throw error;
    }

    dialog.value = false;
    await fetchMyBooths(); // 重新整理列表
    resetForm();
  } catch (err: any) {
    alert("儲存失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

// 4. 刪除攤位 (強化版)
const deleteBooth = async (id: number) => {
  loading.value = true;

  try {
    // 1. 檢查是否有「銷售紀錄」 (Sales_Records)
    // 邏輯：從 Exhibition_Product_Details 找出屬於這個攤位的所有 Detail ID
    const { data: details, error: detailError } = await supabase
      .from("Exhibition_Product_Details")
      .select("id")
      .eq("booth_id", id);

    if (detailError) throw detailError;

    if (details && details.length > 0) {
      const detailIds = details.map((d) => d.id);

      const { count: salesCount, error: salesError } = await supabase
        .from("Sales_Records")
        .select("*", { count: "exact", head: true })
        .in("detail_id", detailIds);

      if (salesError) throw salesError;

      // 如果已有銷售，絕對禁止刪除
      if (salesCount && salesCount > 0) {
        alert(
          `無法刪除：此攤位已有 ${salesCount} 筆銷售紀錄。為了保留歷史帳務資料，請勿刪除。若不慎設錯，建議將攤位號碼改為「作廢」或聯絡管理員。`
        );
        return;
      }
    }

    // 2. 檢查是否為「進行中」的活動
    const targetBooth = booths.value.find((b) => b.id === id);
    if (targetBooth) {
      const now = new Date();
      const startDate = new Date(targetBooth.exhibitions.start_date);
      const endDate = new Date(targetBooth.exhibitions.end_date);

      // 如果現在時間在展覽期間內
      if (now >= startDate && now <= endDate) {
        if (
          !confirm(
            "警告：此展覽活動正在進行中！刪除攤位將導致 POS 系統無法運作。確定要繼續嗎？"
          )
        ) {
          return;
        }
      }
    }

    // 3. 執行刪除
    if (
      !confirm(
        "確定要刪除此參展紀錄嗎？這也會同時移除該攤位下所有的商品配置（但不會刪除商品本體）。"
      )
    )
      return;

    const { error: deleteError } = await supabase
      .from("Exhibition_Booths")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    // 重新整理列表
    await fetchMyBooths();
  } catch (err: any) {
    console.error("刪除檢查失敗:", err);
    alert("刪除失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

// 開啟編輯視窗
const openEdit = (item: BoothWithExhibition) => {
  isEdit.value = true;
  currentBoothId.value = item.id;
  form.value = {
    exhibition_id: item.exhibition_id,
    booth_number: item.booth_number,
  };
  dialog.value = true;
};

const resetForm = () => {
  isEdit.value = false;
  currentBoothId.value = null;
  form.value = { exhibition_id: null, booth_number: "" };
};

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return "未定";
  const date = new Date(dateStr);
  return date
    .toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/-/g, "/"); // 確保輸出為 YYYY/MM/DD
};

const isExhibitionEnded = (endDateStr: string | null) => {
  if (!endDateStr) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0); // 只比較日期，不比較時間

  const endDate = new Date(endDateStr);
  endDate.setHours(0, 0, 0, 0);

  return today > endDate;
};

watch(dialog, (val) => {
  // 當 val 為 false 時（代表視窗關閉）
  if (!val) {
    resetForm();
  }
});

onMounted(() => {
  fetchMyBooths();
  fetchAllExhibitions();
});
</script>
