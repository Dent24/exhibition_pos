<template>
  <v-container>
    <v-row class="mb-4" align="center">
      <v-col>
        <h1 class="text-h4 text-primary">商品授權管理</h1>
        <p class="text-subtitle-1 text-grey">管理您的商品被哪些攤主販售</p>
      </v-col>
    </v-row>

    <v-expansion-panels multiple variant="accordion">
      <v-expansion-panel
        v-for="product in filteredProducts"
        :key="product.id"
        class="mb-2 border"
      >
        <v-expansion-panel-title>
          <v-row no-gutters align="center">
            <v-col cols="6" class="font-weight-bold text-primary">
              <v-icon icon="mdi-package-variant" class="mr-2"></v-icon>
              {{ product.name }}
            </v-col>
            <v-col cols="6" class="text-right">
              <v-chip size="small" variant="tonal" color="info" class="mr-2">
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
          <v-table density="comfortable">
            <thead>
              <tr>
                <th class="text-left">攤主暱稱</th>
                <th class="text-center">目前狀態</th>
                <th class="text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="per in product.permissions" :key="per.id">
                <td>{{ per.owner_nickname }}</td>
                <td class="text-center">
                  <v-chip
                    :color="per.enable ? 'success' : 'grey'"
                    size="x-small"
                    variant="flat"
                  >
                    {{ per.enable ? "已啟用" : "已停用" }}
                  </v-chip>
                </td>
                <td class="text-right">
                  <v-btn
                    :color="per.enable ? 'error' : 'success'"
                    size="small"
                    variant="outlined"
                    :prepend-icon="
                      per.enable ? 'mdi-link-off' : 'mdi-link-variant'
                    "
                    @click="togglePermission(per)"
                  >
                    {{ per.enable ? "取消授權" : "恢復授權" }}
                  </v-btn>
                </td>
              </tr>
              <tr v-if="product.permissions.length === 0">
                <td colspan="3" class="text-center py-4 text-grey">
                  尚未授權給任何攤主
                </td>
              </tr>
            </tbody>
          </v-table>
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

    <v-dialog v-model="addDialog" max-width="400px">
      <v-card>
        <v-card-title class="d-flex align-center">
          新增授權對象
          <v-spacer></v-spacer>
          <v-btn
            icon="mdi-close"
            variant="text"
            @click="addDialog = false"
          ></v-btn>
        </v-card-title>

        <v-divider></v-divider>

        <v-card-text style="max-height: 400px; overflow-y: auto">
          <div class="mb-2 text-subtitle-2 text-grey">
            商品：<span class="text-white font-weight-bold">{{
              activeProduct?.name
            }}</span>
          </div>

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

const supabase = useSupabaseClient();
const userStore = useMainStore();

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
