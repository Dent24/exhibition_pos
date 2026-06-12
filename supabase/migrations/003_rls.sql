-- ============================================================
-- 展場 POS 系統 — Row Level Security (RLS) — 與正式庫對齊的 baseline
-- 來源：000 (rowsecurity / pg_policies) 對正式庫的匯出 (2026-06)。
-- 前提：先執行 001_schema、002_functions。
--
-- ⚠️ 用途：在「全新空白資料庫」重建。請勿對既有正式庫執行 (會疊加重複政策)。
--
-- 正式庫現況忠實還原：
--   * 所有表 (含 Users) 皆啟用 RLS。Users 開放 public SELECT/INSERT (未登入可檢查與新增)、
--     UPDATE 限本人 (會員頁編輯)，無 DELETE 政策。
--   * Exhibition_Product_Details 的新增/修改/刪除政策含時間鎖：
--       展覽攤位需 Exhibitions.start_date > CURRENT_DATE 才能編輯 (開始即鎖定)；
--       通販攤位 (exhibition_id IS NULL) 不受期效限制，永遠可編輯。
--   * Orders 對 public 開放 SELECT(true)，配合 SECURITY DEFINER 函式供匿名查單。
--   * 政策名稱沿用正式庫 (含中文名)。
-- ============================================================

-- 啟用 RLS -------------------------------------------------
ALTER TABLE "Users"                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Exhibitions"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Products"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product_Permissions"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Exhibition_Booths"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product_Bundles"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Bundle_Items"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Exhibition_Product_Details" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Orders"                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Sales_Records"              ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- Users  (未登入 anon 亦可 SELECT / INSERT；UPDATE 限本人；無 DELETE 政策 → 拒絕)
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON "Users";
CREATE POLICY "Enable read access for all users" ON "Users"
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Enable insert for all users" ON "Users";
CREATE POLICY "Enable insert for all users" ON "Users"
  FOR INSERT TO public WITH CHECK (true);

-- 會員頁編輯：僅限登入者更新自己那筆 (暱稱 / 攤主 / 賣家)
DROP POLICY IF EXISTS "Users can update their own profile" ON "Users";
CREATE POLICY "Users can update their own profile" ON "Users"
  FOR UPDATE TO authenticated
  USING ("Uid" = auth.uid())
  WITH CHECK ("Uid" = auth.uid());

-- ============================================================
-- Exhibitions
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON "Exhibitions";
CREATE POLICY "Enable read access for all users" ON "Exhibitions"
  FOR SELECT TO public USING (true);

-- ============================================================
-- Products
-- ============================================================
DROP POLICY IF EXISTS "Allow authenticated users to view products" ON "Products";
CREATE POLICY "Allow authenticated users to view products" ON "Products"
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Sellers can insert their own products" ON "Products";
CREATE POLICY "Sellers can insert their own products" ON "Products"
  FOR INSERT TO authenticated
  WITH CHECK (
    (seller_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid()))
    AND ((SELECT "Users".is_seller FROM "Users" WHERE "Users"."Uid" = auth.uid()) = true)
  );

DROP POLICY IF EXISTS "Sellers can update their own products" ON "Products";
CREATE POLICY "Sellers can update their own products" ON "Products"
  FOR UPDATE TO authenticated
  USING (seller_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid()))
  WITH CHECK (seller_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid()));

DROP POLICY IF EXISTS "Sellers can delete their own products" ON "Products";
CREATE POLICY "Sellers can delete their own products" ON "Products"
  FOR DELETE TO authenticated
  USING (seller_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid()));

-- ============================================================
-- Product_Permissions
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON "Product_Permissions";
CREATE POLICY "Enable read access for all users" ON "Product_Permissions"
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Sellers can insert permissions for their own products" ON "Product_Permissions";
CREATE POLICY "Sellers can insert permissions for their own products" ON "Product_Permissions"
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Products"
     WHERE "Products".id = "Product_Permissions".product_id
       AND "Products".seller_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid())
  ));

DROP POLICY IF EXISTS "Sellers can update their own product permissions" ON "Product_Permissions";
CREATE POLICY "Sellers can update their own product permissions" ON "Product_Permissions"
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "Products"
     WHERE "Products".id = "Product_Permissions".product_id
       AND "Products".seller_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Products"
     WHERE "Products".id = "Product_Permissions".product_id
       AND "Products".seller_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid())
  ));

DROP POLICY IF EXISTS "Sellers can delete permissions" ON "Product_Permissions";
CREATE POLICY "Sellers can delete permissions" ON "Product_Permissions"
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "Products"
     WHERE "Products".id = "Product_Permissions".product_id
       AND "Products".seller_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid())
  ));

-- ============================================================
-- Exhibition_Booths
-- ============================================================
DROP POLICY IF EXISTS "Users can view relevant booths" ON "Exhibition_Booths";
CREATE POLICY "Users can view relevant booths" ON "Exhibition_Booths"
  FOR SELECT TO authenticated
  USING (
    (owner_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid()))
    OR EXISTS (
      SELECT 1
        FROM "Exhibition_Product_Details" epd
        JOIN "Products" p ON p.id = epd.product_id
       WHERE epd.booth_id = "Exhibition_Booths".id
         AND p.seller_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Owners can insert their own booths" ON "Exhibition_Booths";
CREATE POLICY "Owners can insert their own booths" ON "Exhibition_Booths"
  FOR INSERT TO authenticated
  WITH CHECK (
    (owner_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid()))
    AND ((SELECT "Users".is_owner FROM "Users" WHERE "Users"."Uid" = auth.uid()) = true)
  );

DROP POLICY IF EXISTS "Owners can update their own booths" ON "Exhibition_Booths";
CREATE POLICY "Owners can update their own booths" ON "Exhibition_Booths"
  FOR UPDATE TO authenticated
  USING (owner_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid()))
  WITH CHECK (owner_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid()));

DROP POLICY IF EXISTS "Owners can delete their own booths" ON "Exhibition_Booths";
CREATE POLICY "Owners can delete their own booths" ON "Exhibition_Booths"
  FOR DELETE TO authenticated
  USING (owner_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid()));

-- ============================================================
-- Product_Bundles
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON "Product_Bundles";
CREATE POLICY "Enable read access for all users" ON "Product_Bundles"
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "僅攤主可編輯組合包" ON "Product_Bundles";
CREATE POLICY "僅攤主可編輯組合包" ON "Product_Bundles"
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM "Exhibition_Booths"
     WHERE "Exhibition_Booths".id = "Product_Bundles".booth_id
       AND "Exhibition_Booths".owner_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid())
  ));

-- ============================================================
-- Bundle_Items
-- ============================================================
DROP POLICY IF EXISTS "僅攤主可編輯組合內容" ON "Bundle_Items";
CREATE POLICY "僅攤主可編輯組合內容" ON "Bundle_Items"
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1
      FROM "Product_Bundles"
      JOIN "Exhibition_Booths" ON "Product_Bundles".booth_id = "Exhibition_Booths".id
     WHERE "Product_Bundles".id = "Bundle_Items".bundle_id
       AND "Exhibition_Booths".owner_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid())
  ));

-- ============================================================
-- Exhibition_Product_Details  (含「展覽開始即鎖定」時間鎖)
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON "Exhibition_Product_Details";
CREATE POLICY "Enable read access for all users" ON "Exhibition_Product_Details"
  FOR SELECT TO public USING (true);

-- 時間鎖：展覽攤位「開始前才可編輯」；通販攤位 (exhibition_id IS NULL) 永遠可編輯。
-- 用 LEFT JOIN 讓無展覽的攤位仍能比對到攤主。
DROP POLICY IF EXISTS "Owners can insert products before exhibition starts" ON "Exhibition_Product_Details";
CREATE POLICY "Owners can insert products before exhibition starts" ON "Exhibition_Product_Details"
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1
      FROM "Exhibition_Booths" b
      LEFT JOIN "Exhibitions" e ON e.id = b.exhibition_id
     WHERE b.id = "Exhibition_Product_Details".booth_id
       AND b.owner_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid())
       AND (b.exhibition_id IS NULL OR e.start_date > CURRENT_DATE)
  ));

DROP POLICY IF EXISTS "Owners can update product details before exhibition starts" ON "Exhibition_Product_Details";
CREATE POLICY "Owners can update product details before exhibition starts" ON "Exhibition_Product_Details"
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1
      FROM "Exhibition_Booths" b
      LEFT JOIN "Exhibitions" e ON e.id = b.exhibition_id
     WHERE b.id = "Exhibition_Product_Details".booth_id
       AND b.owner_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid())
       AND (b.exhibition_id IS NULL OR e.start_date > CURRENT_DATE)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM "Exhibition_Booths" b
     WHERE b.id = "Exhibition_Product_Details".booth_id
       AND b.owner_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid())
  ));

DROP POLICY IF EXISTS "Owners can delete products before exhibition starts" ON "Exhibition_Product_Details";
CREATE POLICY "Owners can delete products before exhibition starts" ON "Exhibition_Product_Details"
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1
      FROM "Exhibition_Booths" b
      LEFT JOIN "Exhibitions" e ON e.id = b.exhibition_id
     WHERE b.id = "Exhibition_Product_Details".booth_id
       AND b.owner_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid())
       AND (b.exhibition_id IS NULL OR e.start_date > CURRENT_DATE)
  ));

-- ============================================================
-- Orders  (對 public 開放 SELECT；匿名查單靠 SECURITY DEFINER 函式)
--   注意：「允許透過 Token 與電話後三碼查詢訂單」政策的條件
--   (order_token = order_token AND phone = phone) 為恆真式，等同 true，
--   原樣還原以忠實對齊正式庫。
-- ============================================================
DROP POLICY IF EXISTS "Enable read access for all users" ON "Orders";
CREATE POLICY "Enable read access for all users" ON "Orders"
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Enable access to order via token and phone" ON "Orders";
CREATE POLICY "Enable access to order via token and phone" ON "Orders"
  FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "允許透過 Token 與電話後三碼查詢訂單" ON "Orders";
CREATE POLICY "允許透過 Token 與電話後三碼查詢訂單" ON "Orders"
  FOR SELECT TO anon
  USING ((order_token = order_token) AND (phone = phone));

-- ============================================================
-- Sales_Records
-- ============================================================
DROP POLICY IF EXISTS "Users can view relevant sales records" ON "Sales_Records";
CREATE POLICY "Users can view relevant sales records" ON "Sales_Records"
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
        FROM "Exhibition_Product_Details" epd
        JOIN "Exhibition_Booths" eb ON eb.id = epd.booth_id
       WHERE epd.id = "Sales_Records".detail_id
         AND eb.owner_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid())
    )
    OR EXISTS (
      SELECT 1
        FROM "Exhibition_Product_Details" epd
        JOIN "Products" p ON p.id = epd.product_id
       WHERE epd.id = "Sales_Records".detail_id
         AND p.seller_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Owners can insert sales for their own booths" ON "Sales_Records";
CREATE POLICY "Owners can insert sales for their own booths" ON "Sales_Records"
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1
      FROM "Exhibition_Product_Details" epd
      JOIN "Exhibition_Booths" eb ON eb.id = epd.booth_id
     WHERE epd.id = "Sales_Records".detail_id
       AND eb.owner_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid())
  ));

DROP POLICY IF EXISTS "Owners can delete sales for their own booths" ON "Sales_Records";
CREATE POLICY "Owners can delete sales for their own booths" ON "Sales_Records"
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1
      FROM "Exhibition_Product_Details" epd
      JOIN "Exhibition_Booths" eb ON eb.id = epd.booth_id
     WHERE epd.id = "Sales_Records".detail_id
       AND eb.owner_id = (SELECT "Users".id FROM "Users" WHERE "Users"."Uid" = auth.uid())
  ));
