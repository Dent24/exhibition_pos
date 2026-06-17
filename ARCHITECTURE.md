# 展場 POS 系統 — 專案架構文件

> Exhibition POS — 為展覽攤位設計的銷售（Point of Sale）系統。支援攤主管理攤位／商品、賣家授權與拆賬、現場結帳（含離線佇列）、訂單查詢與多種銷售報表。

---

## 1. 技術棧

| 類別 | 技術 | 版本 |
|------|------|------|
| 框架 | [Nuxt 3](https://nuxt.com) | `^3.21.2` |
| UI 層 | Vue 3 | `^3.5.30` |
| UI 元件庫 | [Vuetify](https://vuetexify.com) | `^4.0.3` |
| 狀態管理 | Pinia + `pinia-plugin-persistedstate` | `^3.0.4` |
| 後端 / 資料庫 | Supabase（PostgreSQL + Auth + RPC） | `@nuxtjs/supabase ^2.0.4` |
| 樣式 | SCSS（`sass ^1.98.0`） | — |
| 圖示 | Material Design Icons (`@mdi/font`) | `^7.4.47` |
| QR Code | `qrcode.vue` | `^3.8.1` |
| 部署 | GitHub Pages（`gh-pages`，靜態產出） | — |

### 重要設定（[nuxt.config.ts](nuxt.config.ts)）

- **`ssr: false`** — 純客戶端渲染（SPA）。
- **`app.baseURL: '/exhibition_pos/'`** — 部署於 GitHub Pages 子路徑。
- **`buildAssetsDir: 'assets'`** — 避免 GitHub Pages 阻擋底線開頭資料夾。
- **模組**：`@pinia/nuxt`、`@nuxtjs/supabase`、`pinia-plugin-persistedstate/nuxt`。
- **`supabase.redirect: false`** — 關閉 Supabase 內建路由守衛，改由 layout 自行控管登入導向。

### 環境變數（[.env](.env)）

- `SUPABASE_URL`
- `SUPABASE_KEY`

---

## 2. 目錄結構

```
exhibition_pos/
├── nuxt.config.ts          # Nuxt 設定
├── pages/                  # 檔案式路由（見第 4 節）
│   ├── index.vue           # 首頁／儀表板入口
│   ├── login.vue           # 登入（layout: clear）
│   ├── register.vue        # 註冊（layout: clear）
│   ├── booth-settings.vue       # 攤主：設定參展攤位
│   ├── booth-products.vue       # 攤主：設定攤位商品
│   ├── sales-report.vue         # 攤主：攤位銷售紀錄（含補開單／退貨）
│   ├── settlement-report.vue    # 攤主：賣家拆賬（依原價）
│   ├── product-settings.vue     # 賣家：設定個人商品
│   ├── seller-permissions.vue   # 賣家：授權可售攤主
│   ├── product-sales-report.vue # 賣家：商品銷售統計
│   ├── order/[id].vue           # 顧客：訂單明細查詢（layout: clear，手機後三碼驗證）
│   └── pos/
│       ├── index.vue       # 依螢幕寬度導向 desktop / mobile
│       ├── desktop.vue     # 桌面版 POS 結帳
│       └── mobile.vue      # 手機版 POS 結帳
├── composables/
│   ├── usePosSystem.ts     # POS 核心邏輯（購物車／庫存／離線結帳佇列）
│   ├── useDb.ts            # 具型別的 Supabase client：useSupabaseClient<Database>()
│   └── useUi.ts            # 全域 Snackbar 通知 + Confirm 對話框（單例狀態）
├── components/
│   └── AppUi.vue           # 全域 UI 回饋元件（掛載於 layouts，渲染 snackbar/confirm）
├── stores/
│   └── main.ts             # Pinia store：使用者 profile 與權限
├── layouts/
│   ├── default.vue         # 側邊導覽列（手機改 Hamburger 暫時抽屜，依角色顯示選單）
│   └── clear.vue           # 無導覽列（登入／註冊／訂單頁）
├── middleware/
│   └── auth.global.ts      # 全域路由守衛：登入導向 + is_owner/is_seller 角色權限
├── utils/                  # 共用工具（Nuxt 自動 import）
│   ├── format.ts           # formatDate / formatDateTime / formatCurrency
│   ├── exhibition.ts       # getExhibitionStatus / isExhibitionEnded
│   ├── csv.ts              # downloadCsv（含 BOM）
│   └── constants.ts        # ANONYMOUS_PHONE / QUEUE_STORAGE_KEY / USER_STORE_KEY
├── types/
│   └── database.ts         # Supabase 資料庫型別（npm run db:types 可重新產生）
├── plugins/
│   ├── vuetify.ts          # Vuetify 初始化
│   └── supabase-guard.client.ts # 攔截 Supabase REST 400 → 清除登入並導向 /login
├── assets/scss/base.scss   # 全域樣式
├── server/                 # （僅 tsconfig；SPA 模式無 server route）
└── public/                 # favicon、robots.txt
```

### 橫切關注點（Cross-cutting）

- **路由守衛**（[middleware/auth.global.ts](middleware/auth.global.ts)）：集中處理「未登入導向 `/login`」與「跨角色以 URL 直接存取時導回 `/`」。公開路由：`/login`、`/register`、`/forgot-password`、`/reset-password`、`/order/:id`。
- **全域 UI 回饋**（[composables/useUi.ts](composables/useUi.ts) + [components/AppUi.vue](components/AppUi.vue)）：以 `useSnackbar()` / `useConfirm()` 取代原生 `alert()` / `confirm()`，統一 Vuetify 設計語言。
- **Supabase 400 守衛**（[plugins/supabase-guard.client.ts](plugins/supabase-guard.client.ts)）：包裝 `window.fetch`，資料 / RPC 請求回 400 時自動登出（排除 `/auth/v1/`）。
- **型別**（[types/database.ts](types/database.ts)）：透過 `useDb()` 提供具型別的 client；可用 `npm run db:types` 由線上資料庫重新產生（需 `supabase login` 或 `SUPABASE_ACCESS_TOKEN`）。

---

## 3. 角色與權限模型

使用者（`Users`）有兩個布林旗標，可同時成立：

- **攤主 `is_owner`** — 擁有展覽攤位，管理攤位商品、查看銷售紀錄、操作 POS 結帳、賣家拆賬。
- **賣家 `is_seller`** — 擁有商品，授權給特定攤主販售，查看自己商品的銷售統計。

權限判斷集中於 Pinia store（[stores/main.ts](stores/main.ts)）：

- `isLoggedIn` — 是否已載入 profile
- `canManageBooth` — `is_owner`
- `canSellProduct` — `is_seller`

[layouts/default.vue](layouts/default.vue) 依角色動態渲染側邊選單（攤主管理區 / 賣家管理區），並在 `user` 為空時導向 `/login`。

---

## 4. 頁面與路由

### 公開 / 認證（layout: `clear`）

| 路由 | 檔案 | 說明 |
|------|------|------|
| `/login` | [login.vue](pages/login.vue) | Supabase `signInWithPassword` 登入，成功後 `fetchProfile`。進頁先 `signOut` 清狀態。 |
| `/register` | [register.vue](pages/register.vue) | `auth.signUp` 後寫入 `Users` 表。 |
| `/order/:id` | [order/[id].vue](pages/order/[id].vue) | 顧客憑 `order_token` + 手機後三碼查詢訂單；預設先以匿名電話 `0900000000` 自動解鎖。透過 RPC `get_order_by_token_and_last_three_phone`。 |

### 攤主管理區（`is_owner`）

| 路由 | 檔案 | 說明 |
|------|------|------|
| `/booth-settings` | [booth-settings.vue](pages/booth-settings.vue) | 管理名下展覽攤位。 |
| `/booth-products` | [booth-products.vue](pages/booth-products.vue) | 設定攤位展示的商品 / 組合包與展售價。 |
| `/sales-report` | [sales-report.vue](pages/sales-report.vue) | 攤位訂單明細與總收入；支援補開單（`pos_checkout_v3`）與退貨還庫存（`delete_sale_and_restock`）。 |
| `/settlement-report` | [settlement-report.vue](pages/settlement-report.vue) | 賣家拆賬，依**原價**計算各賣家應得金額。 |
| `/pos` → `/pos/desktop` 或 `/pos/mobile` | [pos/](pages/pos/) | 現場結帳系統，依螢幕寬度（< 600px）自動分流。 |

### 賣家管理區（`is_seller`）

| 路由 | 檔案 | 說明 |
|------|------|------|
| `/product-settings` | [product-settings.vue](pages/product-settings.vue) | 新增 / 修改個人商品。 |
| `/seller-permissions` | [seller-permissions.vue](pages/seller-permissions.vue) | 授權特定攤主販售自己的商品（`Product_Permissions`）。 |
| `/product-sales-report` | [product-sales-report.vue](pages/product-sales-report.vue) | 商品在各展覽的銷售表現。 |

---

## 5. POS 核心邏輯（[composables/usePosSystem.ts](composables/usePosSystem.ts)）

POS 系統最關鍵的設計是**離線優先（offline-first）的結帳佇列**，因應展場現場網路不穩定。

### 狀態
- `booths` / `selectedBooth` — 攤位選擇
- `products` — 攤位商品（含 `computed_inventory` 計算後庫存、`display_name`）
- `cart` / `totalAmount` — 購物車與總金額
- `checkoutQueue` — 待推送的結帳佇列（持久化於 `localStorage`，key = `pos-checkout-queue`）
- `lastOrder` — 最近一筆訂單（含 token，供顯示 QR Code）

### 商品 / 庫存規則
- 商品可為**單品**（`product_id`）或**組合包**（`bundle_id`）。
- 組合包庫存 = 包內所有商品庫存的**最小值**（`getInventory`）。
- 已結清（`is_paid`）的項目不可加入購物車。

### 結帳流程（`checkout`）— 不阻塞網路
1. 產生 `localId`（`crypto.randomUUID()`）並建立佇列項目。
2. **立即本地扣庫存**，使下一筆結帳看到正確數量。
3. 清空購物車，設定 `lastOrder`（先顯示為 `isQueued`，臨時單號取 `localId` 前 8 碼）。
4. 推入佇列、寫入 `localStorage`，非阻塞呼叫 `processQueue()`。

### 佇列推送（`processQueue`）
- 一次只送佇列第一筆，呼叫 RPC **`pos_checkout_v3`**（參數：`p_booth_id`、`p_items`、`p_method`、`p_phone`）。
- 成功 → `shift` 出佇列、回填真實 `order_token` / `order_number`（讓畫面顯示 QR Code）、繼續下一筆。
- 失敗 → 不丟棄，等下次重試。
- **重試觸發**：`window` 的 `online` 事件 + 每 10 秒輪詢 + mount 時嘗試。
- 匿名電話預設 `0900000000`。

---

## 6. 狀態管理（[stores/main.ts](stores/main.ts)）

`useMainStore`（Pinia）：

- **state**：`profile`（`Users` 表結構：`id` / `nickname` / `is_owner` / `is_seller`）、`loading`。
- **actions**：`setProfile`、`clearProfile`、`fetchProfile`（依 Auth session 的 `user.id` 查 `Users.Uid`）。
- **persist**：僅持久化 `profile` 至 `localStorage`，key = `pos-user-store`。

---

## 7. 資料庫結構（Supabase / PostgreSQL）

> 詳見 [README.md](README.md)。前端透過 `supabase.from(...)` 直接讀寫，並以 RPC 處理交易性操作。

| 資料表 | 主要欄位 | 說明 |
|--------|----------|------|
| `Users` | `Uid`(對應 Auth)、`is_seller`、`is_owner`、`nickname` | 人員 |
| `Products` | `seller_id`、`name`、`original_price`、`total_inventory` | 商品（屬於賣家） |
| `Product_Permissions` | `product_id`、`owner_id`、`enable` | 商品授權（賣家授權攤主販售） |
| `Exhibitions` | `name`、`start_date`、`end_date`、`location` | 展覽 |
| `Exhibition_Booths` | `exhibition_id`、`owner_id`、`booth_number` | 展覽攤位 |
| `Exhibition_Product_Details` | `booth_id`、`product_id`(nullable)、`bundle_id`(nullable)、`event_price` | 攤位上架商品／組合包與展售價 |
| `Sales_Records` | `detail_id`、`quantity`、`method`、`order_id` | 銷售紀錄 |
| `Product_Bundles` | `booth_id`、`name`、`is_active` | 組合包 |
| `Bundle_Items` | `bundle_id`、`product_id` | 組合包內含商品 |
| `Orders` | `order_number`、`booth_id`、`created_at`、`phone`(後三碼)、`method`、`order_token`(uuid) | 交易訂單 |

### 使用到的 RPC（資料庫函式）

| RPC | 用途 | 呼叫處 |
|-----|------|--------|
| `pos_checkout_v3` | 結帳：建立訂單 + 寫銷售紀錄 + 扣庫存（交易） | [usePosSystem.ts](composables/usePosSystem.ts)、[sales-report.vue](pages/sales-report.vue)（補開單） |
| `delete_sale_and_restock` | 退貨：刪除銷售紀錄並還原庫存 | [sales-report.vue](pages/sales-report.vue) |
| `get_order_by_token_and_last_three_phone` | 顧客憑 token + 手機後三碼查訂單 | [order/[id].vue](pages/order/[id].vue) |

---

## 8. 開發與部署

```bash
npm install        # 安裝相依套件（postinstall 會跑 nuxt prepare）
npm run dev        # 開發伺服器 http://localhost:3000
npm run build      # 建置
npm run generate   # 產出靜態檔案 (.output/public)
npm run preview    # 預覽 production build
npm run deploy     # nuxi generate + gh-pages 部署到 GitHub Pages
```

- `dist` 為指向 `.output/public` 的 symlink。
- 因 `ssr: false` + 靜態產出，所有後端邏輯（交易、權限）都依賴 Supabase（RPC + Row Level Security）。

---

## 9. 關鍵設計重點摘要

1. **SPA + Supabase BaaS**：無自建 server，前端直連 Supabase，交易性操作走 RPC。
2. **離線優先結帳**：本地先扣庫存 + localStorage 佇列 + 自動重試，確保展場斷網仍能結帳。
3. **雙角色權限**：攤主 / 賣家可並存，UI 與選單依角色動態呈現。
4. **單品 / 組合包**：組合包庫存以成分最小值計算。
5. **拆賬以原價計算**：展售價（`event_price`）用於收款，原價（`original_price`）用於賣家分潤。
6. **訂單可查詢**：每筆訂單有 `order_token`（QR Code）+ 手機後三碼雙重驗證。
```

