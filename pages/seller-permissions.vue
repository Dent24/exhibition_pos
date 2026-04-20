<template>
  <v-container>
    <v-row align="end" class="mb-10">
      <v-col>
        <p class="text-display-medium font-weight-black text-black mb-2">
          設定可售攤主
        </p>
        <p class="text-grey-darken-1 mb-0">授權特定攤主販售您的商品</p>
      </v-col>
    </v-row>

    <v-expansion-panels multiple variant="accordion">
      <v-expansion-panel
        v-for="product in filteredProducts"
        :key="product.id"
        class="mb-2 border"
      >
        <v-expansion-panel-title class="bg-grey-lighten-4">
          <v-row no-gutters align="center">
            <v-col cols="6" class="font-weight-bold text-primary">
              <v-icon icon="mdi-package-variant" class="mr-2"></v-icon>
              {{ product.name }}
            </v-col>
            <v-col cols="6" class="text-right">
              <v-chip
                size="small"
                variant="tonal"
                :color="product.permissions.length ? 'info' : 'error'"
                class="mr-4"
              >
                {{ product.permissions.length }} 位授權
              </v-chip>
              <v-btn
                class="mr-2"
                size="small"
                color="primary"
                prepend-icon="mdi-account-plus"
                variant="flat"
                @click.stop="openAddDialog(product)"
              >
                新增授權
              </v-btn>
            </v-col>
          </v-row>
        </v-expansion-panel-title>

        <v-expansion-panel-text>
          <v-data-table
            :headers="permissionHeaders"
            :items="product.permissions"
            density="comfortable"
            class="elevation-0"
            hide-default-footer
            disable-sort
          >
            <template v-slot:item.enable="{ item }">
              <v-chip
                :color="item.enable ? 'success' : 'grey-lighten-1'"
                :prepend-icon="
                  item.enable ? 'mdi-check-circle' : 'mdi-minus-circle'
                "
                size="x-small"
                variant="flat"
                class="font-weight-bold"
              >
                {{ item.enable ? "已啟用" : "已停用" }}
              </v-chip>
            </template>

            <template v-slot:item.actions="{ item }">
              <v-btn
                :color="item.enable ? 'error' : 'success'"
                size="small"
                :variant="item.enable ? 'text' : 'tonal'"
                :prepend-icon="
                  item.enable ? 'mdi-link-off' : 'mdi-link-variant'
                "
                class="font-weight-bold"
                @click="togglePermission(item)"
              >
                {{ item.enable ? "取消授權" : "恢復授權" }}
              </v-btn>
            </template>

            <template v-slot:no-data>
              <div class="pa-6 text-center text-grey text-body-2">
                <v-icon
                  icon="mdi-account-off-outline"
                  class="mb-2"
                  size="large"
                ></v-icon>
                <p>尚未授權給任何攤主</p>
              </div>
            </template>
          </v-data-table>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-card
      v-if="filteredProducts.length === 0 && !loading"
      variant="flat"
      class="text-center py-10"
    >
      <v-icon size="64" color="grey-lighten-1"
        >mdi-package-variant-remove</v-icon
      >
      <div class="mt-4 text-grey">找不到符合條件的商品或授權紀錄</div>
    </v-card>

    <v-dialog
      v-model="addDialog"
      max-width="400px"
      persistent
      transition="dialog-bottom-transition"
    >
      <v-card class="rounded-xl overflow-hidden elevation-24">
        <div
          class="px-6 bg-grey-lighten-5 border-b d-flex justify-space-between align-center"
        >
          <h3 class="font-weight-black text-grey-darken-4">新增授權對象</h3>
          <v-btn
            icon="mdi-close"
            variant="text"
            color="grey-darken-1"
            @click="addDialog = false"
          ></v-btn>
        </div>

        <v-divider></v-divider>

        <v-card-text style="max-height: 400px; overflow-y: auto">
          <v-list v-if="availableOwners.length > 0">
            <v-list-item
              v-for="owner in availableOwners"
              :key="owner.id"
              :title="owner.nickname"
            >
              <template v-slot:append>
                <v-btn
                  size="small"
                  color="success"
                  variant="tonal"
                  :loading="addLoading"
                  @click="addPermission(owner.id)"
                >
                  授權
                </v-btn>
              </template>
            </v-list-item>
          </v-list>

          <v-alert v-else type="info" variant="tonal" density="compact">
            目前沒有可授權的新攤主
          </v-alert>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
interface Permission {
  id: number;
  product_id: number;
  owner_id: number;
  enable: boolean;
  owner_nickname?: string; // 從 Users Join 回來的資料
}

interface ProductWithPermissions {
  id: number;
  name: string;
  permissions: Permission[];
}

useHead({
  title: "設定可售攤主",
});

const supabase = useSupabaseClient();
const userStore = useMainStore();

const permissionHeaders: ReadonlyArray<{
  title: string;
  key: string;
  align?: "start" | "end" | "center";
}> = [
  { title: "攤主暱稱", key: "owner_nickname", align: "start" },
  { title: "目前狀態", key: "enable", align: "center" },
  { title: "操作", key: "actions", align: "end" },
];

const loading = ref(false);
const search = ref("");
const productsData = ref<ProductWithPermissions[]>([]);
const addDialog = ref(false);
const activeProduct = ref<ProductWithPermissions | null>(null);
const allOwners = ref<any[]>([]); // 儲存所有可選的攤主
const addLoading = ref(false);

// 1. 取得所有商品及其授權名單
const fetchPermissions = async () => {
  if (!userStore.profile?.id) return;
  loading.value = true;

  try {
    // 這裡使用巢狀查詢：抓取商品 -> 抓取授權 -> 抓取授權對象的暱稱
    const { data, error } = await supabase
      .from("Products")
      .select(
        `
        id,
        name,
        permissions:Product_Permissions (
          id,
          product_id,
          owner_id,
          enable,
          owner:owner_id ( nickname )
        )
      `
      )
      .eq("seller_id", userStore.profile.id);

    if (error) throw error;

    // 整理資料格式，方便前端讀取
    productsData.value = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      permissions: p.permissions.map((per: any) => ({
        ...per,
        owner_nickname: per.owner?.nickname || "未知用戶",
      })),
    }));
  } catch (err: any) {
    alert("讀取授權資料失敗: " + err.message);
  } finally {
    loading.value = false;
  }
};

// 2. 切換授權狀態 (Enable / Disable)
const togglePermission = async (permission: Permission) => {
  const newStatus = !permission.enable;
  const { error } = await supabase
    .from("Product_Permissions")
    .update({ enable: newStatus })
    .eq("id", permission.id);

  if (!error) {
    permission.enable = newStatus; // 成功後直接更新本地狀態，不需重新 fetch
  } else {
    alert("更新失敗: " + error.message);
  }
};

// 3. 搜尋過濾邏輯
const filteredProducts = computed(() => {
  if (!search.value) return productsData.value;

  const s = search.value.toLowerCase();
  return productsData.value.filter((p) => {
    // 檢查商品名稱是否符合
    const productNameMatch = p.name.toLowerCase().includes(s);
    // 檢查授權名單內是否有攤主名稱符合
    const ownerNameMatch = p.permissions.some((per) =>
      per.owner_nickname?.toLowerCase().includes(s)
    );

    return productNameMatch || ownerNameMatch;
  });
});

// 1. 取得所有具備攤主身份的用戶
const fetchPotentialOwners = async () => {
  const { data } = await supabase
    .from("Users")
    .select("id, nickname")
    .eq("is_owner", true);
  if (data) allOwners.value = data;
};

// 2. 計算目前該商品「尚未授權」的攤主清單
const availableOwners = computed(() => {
  if (!activeProduct.value) return [];
  // 取得該商品已有的 owner_id 列表
  const existingOwnerIds = activeProduct.value.permissions.map(
    (p) => p.owner_id
  );
  // 過濾掉已經在名單內的
  return allOwners.value.filter(
    (owner) => !existingOwnerIds.includes(owner.id)
  );
});

// 3. 打開新增授權視窗
const openAddDialog = (product: ProductWithPermissions) => {
  activeProduct.value = product;
  addDialog.value = true;
};

// 4. 執行新增授權到資料庫
const addPermission = async (ownerId: number) => {
  if (!activeProduct.value) return;

  addLoading.value = true;
  try {
    const { data, error } = await supabase
      .from("Product_Permissions")
      .insert({
        product_id: activeProduct.value.id,
        owner_id: ownerId,
        enable: true,
      })
      .select("id, product_id, owner_id, enable, owner:owner_id(nickname)")
      .single();

    if (error) throw error;

    // 同步更新本地資料，避免重新 fetch 整份大名單
    const targetProduct = productsData.value.find(
      (p) => p.id === activeProduct.value?.id
    );
    if (targetProduct && data) {
      targetProduct.permissions.push({
        id: data.id,
        product_id: data.product_id,
        owner_id: data.owner_id,
        enable: data.enable,
        owner_nickname: (data.owner as any).nickname,
      });
    }
  } catch (err: any) {
    alert("新增授權失敗: " + err.message);
  } finally {
    addLoading.value = false;
  }
};

onMounted(() => {
  fetchPermissions();
  fetchPotentialOwners();
});
</script>
