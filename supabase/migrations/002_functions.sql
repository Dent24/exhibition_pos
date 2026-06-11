-- ============================================================
-- 展場 POS 系統 — 資料庫函式 (RPC) — 與正式庫對齊的 baseline
-- 來源：000b 對正式庫 pg_get_functiondef 的逐字匯出 (2026-06)。
--
-- ⚠️ 用途：在「全新空白資料庫」重建。請勿覆蓋既有正式庫的函式。
--
-- 前端實際使用：pos_checkout_v3、delete_sale_and_restock、
--               get_order_by_token_and_last_three_phone、handle_stock_reduction(被 v3 呼叫)。
-- 其餘為歷史遺留 (legacy)，原樣保留以忠實重建；其中部分 (pos_checkout / manual_add_sale 的
-- v2 簽名) 內文 INSERT 了 Sales_Records 不存在的 method 欄 —— 屬無效死碼，呼叫會在執行期報錯。
-- 注意：plpgsql 函式建立時不檢查內文欄位，故即使欄位不存在仍可成功 CREATE。
-- ============================================================

-- ------------------------------------------------------------
-- [使用中] handle_stock_reduction — 依明細扣庫存 (被 pos_checkout_v3 呼叫)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_stock_reduction(p_detail_id bigint, p_qty integer)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_pid BIGINT;
  v_bid BIGINT;
BEGIN
  -- 1. 抓取該明細對應的是單品(product_id)還是組合包(bundle_id)
  SELECT product_id, bundle_id INTO v_pid, v_bid
  FROM "Exhibition_Product_Details"
  WHERE id = p_detail_id;

  IF v_bid IS NOT NULL THEN
    -- 2. 如果是組合包：扣除所有在 Bundle_Items 裡面的商品庫存
    UPDATE "Products"
    SET total_inventory = total_inventory - p_qty
    WHERE id IN (
      SELECT product_id
      FROM "Bundle_Items"
      WHERE bundle_id = v_bid
    );
  ELSIF v_pid IS NOT NULL THEN
    -- 3. 如果是單品：直接扣除該商品庫存
    UPDATE "Products"
    SET total_inventory = total_inventory - p_qty
    WHERE id = v_pid;
  END IF;
END;
$function$;

-- ------------------------------------------------------------
-- [使用中] pos_checkout_v3 — 結帳 (回傳 3 欄：r_order_id, r_order_token, r_order_number)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pos_checkout_v3(p_booth_id bigint, p_items jsonb, p_method text, p_phone text)
 RETURNS TABLE(r_order_id bigint, r_order_token uuid, r_order_number text)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_order_id BIGINT;
  v_order_token UUID := gen_random_uuid();
  v_order_number TEXT;
  v_time_part TEXT := to_char(now(), 'YYYYMMDDHH24MISS');
  v_phone_tail TEXT := right(p_phone, 3);
  item_record RECORD;
BEGIN
  -- 1. 插入訂單（此時 order_number 為 NULL）
  INSERT INTO "Orders" (booth_id, method, phone, order_token, created_at)
  VALUES (p_booth_id, p_method, p_phone, v_order_token, now())
  RETURNING id INTO v_order_id;

  -- 2. 根據產生的 ID 組合訂單編號
  -- 格式：[攤位ID]-[日期時間]-[電話後三碼]-[訂單ID]
  v_order_number := p_booth_id::text || '-' || v_time_part || '-' || v_phone_tail || '-' || v_order_id::text;

  -- 3. 回填編號
  UPDATE "Orders" SET order_number = v_order_number WHERE id = v_order_id;

  -- 4. 處理銷售紀錄
  FOR item_record IN SELECT * FROM jsonb_to_recordset(p_items) AS x(detail_id BIGINT, quantity INT)
  LOOP
    INSERT INTO "Sales_Records" (order_id, detail_id, quantity)
    VALUES (v_order_id, item_record.detail_id, item_record.quantity);

    -- 執行扣庫存
    PERFORM public.handle_stock_reduction(item_record.detail_id, item_record.quantity);
  END LOOP;

  -- 5. 回傳結果給前端
  RETURN QUERY SELECT v_order_id, v_order_token, v_order_number;
END;
$function$;

-- ------------------------------------------------------------
-- [使用中] delete_sale_and_restock — 退貨：刪除銷售紀錄並回補庫存
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.delete_sale_and_restock(p_record_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_detail_id BIGINT;
  v_qty INT;
  v_pid BIGINT;
  v_bid BIGINT;
BEGIN
  SELECT detail_id, quantity INTO v_detail_id, v_qty
  FROM "Sales_Records"
  WHERE id = p_record_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '找不到此銷售紀錄 (ID:%)', p_record_id;
  END IF;

  SELECT product_id, bundle_id INTO v_pid, v_bid
  FROM "Exhibition_Product_Details"
  WHERE id = v_detail_id;

  IF v_bid IS NOT NULL THEN
    UPDATE "Products" SET total_inventory = total_inventory + v_qty
    WHERE id IN (SELECT product_id FROM "Bundle_Items" WHERE bundle_id = v_bid);
  ELSIF v_pid IS NOT NULL THEN
    UPDATE "Products" SET total_inventory = total_inventory + v_qty
    WHERE id = v_pid;
  END IF;

  DELETE FROM "Sales_Records" WHERE id = p_record_id;
END;
$function$;

-- ------------------------------------------------------------
-- [使用中] get_order_by_token_and_last_three_phone — 顧客憑 token + 手機後三碼查訂單
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_order_by_token_and_last_three_phone(t_token uuid, t_last_three text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'order', o,
        'items', (
            SELECT json_agg(json_build_object(
                'quantity', sr.quantity,
                'price', epd.event_price,
                'product_name', p.name,
                'bundle_name', pb.name
            ))
            FROM "Sales_Records" sr
            JOIN "Exhibition_Product_Details" epd ON sr.detail_id = epd.id
            LEFT JOIN "Products" p ON epd.product_id = p.id
            LEFT JOIN "Product_Bundles" pb ON epd.bundle_id = pb.id
            WHERE sr.order_id = o.id
        )
    ) INTO result
    FROM "Orders" o
    WHERE o.order_token = t_token
      AND o.phone LIKE '%' || t_last_three; -- 這裡執行後三碼比對

    RETURN result;
END;
$function$;

-- ------------------------------------------------------------
-- [legacy] get_order_by_token_and_phone — 舊版：完整電話比對
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_order_by_token_and_phone(t_token uuid, t_phone text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'order', o,
        'items', (
            SELECT json_agg(json_build_object(
                'quantity', sr.quantity,
                'price', epd.event_price,
                'product_name', p.name,
                'bundle_name', pb.name
            ))
            FROM "Sales_Records" sr
            JOIN "Exhibition_Product_Details" epd ON sr.detail_id = epd.id
            LEFT JOIN "Products" p ON epd.product_id = p.id
            LEFT JOIN "Product_Bundles" pb ON epd.bundle_id = pb.id
            WHERE sr.order_id = o.id
        )
    ) INTO result
    FROM "Orders" o
    WHERE o.order_token = t_token AND o.phone = t_phone;

    RETURN result;
END;
$function$;

-- ------------------------------------------------------------
-- [legacy] manual_add_sale (v1, integer 簽名) — 含 is_paid 與庫存檢查
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.manual_add_sale(p_detail_id integer, p_quantity integer)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_product_id int;
    v_current_inventory int;
    v_is_paid boolean;
BEGIN
    -- 增加檢查 is_paid
    SELECT p.id, p.total_inventory, epd.is_paid
    INTO v_product_id, v_current_inventory, v_is_paid
    FROM "Exhibition_Product_Details" epd
    JOIN "Products" p ON epd.product_id = p.id
    WHERE epd.id = p_detail_id;

    IF v_is_paid = true THEN
        RAISE EXCEPTION '該項目已完成收款確認，禁止新增銷售紀錄。';
    END IF;

    IF v_current_inventory < p_quantity THEN
        RAISE EXCEPTION '庫存不足，無法新增銷售紀錄';
    END IF;

    UPDATE "Products" SET total_inventory = total_inventory - p_quantity WHERE id = v_product_id;
    INSERT INTO "Sales_Records" (detail_id, quantity) VALUES (p_detail_id, p_quantity);
END;
$function$;

-- ------------------------------------------------------------
-- [legacy / 死碼] manual_add_sale (v2, 含 p_method)
--   ⚠️ INSERT 寫了 Sales_Records 不存在的 method 欄，呼叫會於執行期報錯。
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.manual_add_sale(p_detail_id bigint, p_quantity integer, p_method text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_product_id BIGINT;
  v_bundle_id BIGINT;
BEGIN
  -- 1. 取得該銷售項目的基本資訊
  SELECT product_id, bundle_id INTO v_product_id, v_bundle_id
  FROM "Exhibition_Product_Details"
  WHERE id = p_detail_id;

  -- 2. 寫入銷售紀錄
  INSERT INTO "Sales_Records" (detail_id, quantity, method, created_at)
  VALUES (p_detail_id, p_quantity, p_method, NOW());

  -- 3. 扣除庫存邏輯 (現在可以跨過 RLS 修改別人的商品庫存了)
  IF v_bundle_id IS NOT NULL THEN
    UPDATE "Products"
    SET total_inventory = total_inventory - p_quantity
    WHERE id IN (
      SELECT product_id FROM "Bundle_Items" WHERE bundle_id = v_bundle_id
    );
  ELSIF v_product_id IS NOT NULL THEN
    UPDATE "Products"
    SET total_inventory = total_inventory - p_quantity
    WHERE id = v_product_id;
  END IF;

  -- 4. 庫存不足檢查
  IF EXISTS (
    SELECT 1 FROM "Products"
    WHERE id IN (
      SELECT product_id FROM "Bundle_Items" WHERE bundle_id = v_bundle_id
      UNION ALL
      SELECT v_product_id
    ) AND total_inventory < 0
  ) THEN
    RAISE EXCEPTION '庫存不足，無法完成銷售';
  END IF;

END;
$function$;

-- ------------------------------------------------------------
-- [legacy / 死碼] pos_checkout (v2, 含 p_method)
--   ⚠️ 同樣 INSERT 了不存在的 method 欄。
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pos_checkout(p_items jsonb, p_method text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  item_record RECORD;
  v_product_id BIGINT;
  v_bundle_id BIGINT;
  v_is_paid BOOLEAN;
BEGIN
  FOR item_record IN SELECT * FROM jsonb_to_recordset(p_items) AS x(detail_id BIGINT, quantity INT)
  LOOP
    SELECT is_paid, product_id, bundle_id INTO v_is_paid, v_product_id, v_bundle_id
    FROM "Exhibition_Product_Details"
    WHERE id = item_record.detail_id;

    IF v_is_paid THEN
      RAISE EXCEPTION '項目 (ID:%) 已完成收款確認，無法進行銷售交易', item_record.detail_id;
    END IF;

    INSERT INTO "Sales_Records" (detail_id, quantity, method, created_at)
    VALUES (item_record.detail_id, item_record.quantity, p_method, NOW());

    IF v_bundle_id IS NOT NULL THEN
      UPDATE "Products"
      SET total_inventory = total_inventory - item_record.quantity
      WHERE id IN (
        SELECT product_id FROM "Bundle_Items" WHERE bundle_id = v_bundle_id
      );
    ELSIF v_product_id IS NOT NULL THEN
      UPDATE "Products"
      SET total_inventory = total_inventory - item_record.quantity
      WHERE id = v_product_id;
    END IF;
  END LOOP;

  IF EXISTS (SELECT 1 FROM "Products" WHERE total_inventory < 0) THEN
    RAISE EXCEPTION '結帳失敗：部分商品庫存不足';
  END IF;

END;
$function$;

-- ------------------------------------------------------------
-- [legacy] pos_checkout (v1, 僅 p_items) — 含 FOR UPDATE 鎖列防超賣
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pos_checkout(p_items jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
DECLARE
  item jsonb;
  v_detail_id int;
  v_quantity int;
  v_product_id int;
  v_current_inventory int;
BEGIN
  FOR item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_detail_id := (item->>'detail_id')::int;
    v_quantity := (item->>'quantity')::int;

    SELECT product_id
    INTO v_product_id
    FROM "Exhibition_Product_Details"
    WHERE id = v_detail_id;

    SELECT total_inventory
    INTO v_current_inventory
    FROM "Products"
    WHERE id = v_product_id
    FOR UPDATE;

    IF v_current_inventory < v_quantity THEN
      RAISE EXCEPTION '商品庫存不足 (ID: %)', v_product_id;
    END IF;

    UPDATE "Products"
    SET total_inventory = total_inventory - v_quantity
    WHERE id = v_product_id;

    INSERT INTO "Sales_Records" (
      detail_id,
      quantity
    )
    VALUES (
      v_detail_id,
      v_quantity
    );

  END LOOP;
END;
$function$;

-- ------------------------------------------------------------
-- 函式執行權限
--   訂單查詢供未登入顧客 (anon)；其餘金流/庫存操作限已登入 (authenticated)。
--   ※ 正式庫的實際 GRANT 未在 000b 匯出，此處依前端使用情境補上，
--     若與正式庫不同可自行調整。
-- ------------------------------------------------------------
GRANT EXECUTE ON FUNCTION public.pos_checkout_v3(bigint, jsonb, text, text)               TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_sale_and_restock(bigint)                          TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_stock_reduction(bigint, integer)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_by_token_and_last_three_phone(uuid, text)      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_order_by_token_and_phone(uuid, text)                 TO anon, authenticated;
