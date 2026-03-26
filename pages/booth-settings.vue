<template>
  <v-container>
    <v-row class="mb-4" align="center">
      <v-col>
        <h1 class="text-h4 text-primary">參展攤位設定</h1>
      </v-col>
      <v-col class="text-right">
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="
            dialog = true;
            isEdit = false;
          "
        >
          新增參展展覽
        </v-btn>
      </v-col>
    </v-row>

    <v-card :loading="loading">
      <v-table>
        <thead>
          <tr>
            <th>展覽名稱</th>
            <th>展覽日期</th>
            <th>攤位編號</th>
            <th>地點</th>
            <th class="text-center">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in booths" :key="item.id">
            <td>{{ item.exhibitions.name }}</td>
            <td>
              {{ formatDate(item.exhibitions.start_date) }} ~
              {{ formatDate(item.exhibitions.end_date) }}
            </td>
            <td>
              <v-chip color="secondary" size="small">{{
                item.booth_number || "未設定"
              }}</v-chip>
            </td>
            <td>{{ item.exhibitions.location }}</td>
            <td class="text-center">
              <template v-if="!isExhibitionEnded(item.exhibitions.end_date)">
                <v-btn
                  icon="mdi-pencil"
                  variant="text"
                  color="blue"
                  @click="openEdit(item)"
                ></v-btn>
                <v-btn
                  icon="mdi-delete"
                  variant="text"
                  color="error"
                  @click="deleteBooth(item.id)"
                ></v-btn>
              </template>
              <v-chip
                v-else
                size="small"
                variant="flat"
                color="grey-lighten-1"
                prepend-icon="mdi-lock"
              >
                已結束
              </v-chip>
            </td>
          </tr>
          <tr v-if="booths.length === 0 && !loading">
            <td colspan="5" class="text-center py-4 text-grey">
              目前沒有參展紀錄
            </td>
          </tr>
        </tbody>
      </v-table>
    </v-card>

    <v-dialog v-model="dialog" max-width="500px">
      <v-card>
        <v-card-title>{{
          isEdit ? "修改攤位資訊" : "新增參展展覽"
        }}</v-card-title>
        <v-card-text>
          <v-select
            v-model="form.exhibition_id"
            :items="availableExhibitions"
            item-title="name"
            item-value="id"
            label="選擇展覽"
            :disabled="isEdit"
          ></v-select>
          <v-text-field
            v-model="form.booth_number"
            label="攤位編號 (例如: A01)"
            hint="之後也可以隨時修改"
            persistent-hint
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="dialog = false">取消</v-btn>
          <v-btn color="primary" :loading="loading" @click="saveBooth"
            >儲存</v-btn
          >
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
}

interface BoothWithExhibition {
  id: number;
  exhibition_id: number;
  booth_number: string;
  exhibitions: Exhibition; // Supabase Join 回來的資料
}

const supabase = useSupabaseClient();
const userStore = useMainStore();

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

// 4. 刪除攤位
const deleteBooth = async (id: number) => {
  if (!confirm("確定要刪除此參展紀錄嗎？")) return;

  const { error } = await supabase
    .from("Exhibition_Booths")
    .delete()
    .eq("id", id);
  if (!error) fetchMyBooths();
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
