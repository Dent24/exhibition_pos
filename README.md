# Nuxt Minimal Starter

Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Development Server

Start the development server on `http://localhost:3000`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.

目前資料
人員 Users

- id
- Uid (對應 Auth User.sub)
- is_seller 是否為賣家
- is_owner 是否為攤主
- nickname 昵称

商品 Products

- id
- seller_id (對應 Users)
- name 商品名稱
- original_price 原價
- total_inventory 總庫存量

商品授權 Product_Permissions

- id
- product_id (對應 Products)
- owner_id (對應 Users)
- enable 是否啟用授權

展覽 Exhibitions

- id
- name 展覽名稱
- start_date 展覽開始日期
- end_date 展覽結束日期
- location 展覽地點

展覽攤位 Exhibition_Booths

- id
- exhibition_id (對應 Exhibitions)
- owner_id (對應 Users)
- booth_number 攤位號碼

展覽攤位商品 Exhibition_Product_Details

- id
- booth_id (對應 Exhibition_Booths)
- product_id (對應 Products, nullable)
- bundle_id (對應 Product_Bundles, nullable)
- event_price 展覽上的售價

銷售紀錄 Sales_Records

- id
- detail_id (對應 Exhibition_Product_Details)
- quantity 銷售量
- method 支付方式
- order_id (對應 Orders)

組合包 Product_Bundles

- id
- booth_id (對應 Exhibition_Booths)
- name 組合包名稱
- is_active 是否啟用

組合包商品 Bundle_Items

- id
- bundle_id (對應 Product_Bundles)
- product_id (對應 Products)

交易訂單 Orders

- id
- order_number 訂單編號
- booth_id (對應 Exhibition_Booths)
- created_at 訂單創建時間
- phone 訂單聯絡電話後三碼
- method 支付方式
- order_token 訂單驗證碼 (uuid)
