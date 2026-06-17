// =============================================================
// Supabase 資料庫型別
//
// ⚠️ 此檔目前為「依文件 schema 手寫」的版本（見 ARCHITECTURE.md / README.md）。
// 正式做法是用 Supabase CLI 由線上資料庫自動產生，請執行：
//
//   npx supabase login                       # 或設定 SUPABASE_ACCESS_TOKEN
//   npm run db:types                          # 見 package.json
//
// 產生後直接覆蓋本檔即可獲得最精準（含 Relationships）的型別。
// =============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      Users: {
        Row: {
          id: number;
          Uid: string | null;
          nickname: string | null;
          is_owner: boolean;
          is_seller: boolean;
        };
        Insert: {
          id?: number;
          Uid?: string | null;
          nickname?: string | null;
          is_owner?: boolean;
          is_seller?: boolean;
        };
        Update: {
          id?: number;
          Uid?: string | null;
          nickname?: string | null;
          is_owner?: boolean;
          is_seller?: boolean;
        };
        Relationships: [];
      };
      Products: {
        Row: {
          id: number;
          seller_id: number;
          name: string;
          original_price: number;
          total_inventory: number;
        };
        Insert: {
          id?: number;
          seller_id?: number | null;
          name: string;
          original_price?: number;
          total_inventory?: number;
        };
        Update: {
          id?: number;
          seller_id?: number | null;
          name?: string;
          original_price?: number;
          total_inventory?: number;
        };
        Relationships: [
          {
            foreignKeyName: "Products_seller_id_fkey";
            columns: ["seller_id"];
            isOneToOne: false;
            referencedRelation: "Users";
            referencedColumns: ["id"];
          }
        ];
      };
      Product_Permissions: {
        Row: {
          id: number;
          product_id: number;
          owner_id: number;
          enable: boolean;
        };
        Insert: {
          id?: number;
          product_id: number;
          owner_id: number;
          enable?: boolean;
        };
        Update: {
          id?: number;
          product_id?: number;
          owner_id?: number;
          enable?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "Product_Permissions_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "Products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Product_Permissions_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "Users";
            referencedColumns: ["id"];
          }
        ];
      };
      Exhibitions: {
        Row: {
          id: number;
          name: string;
          start_date: string | null;
          end_date: string | null;
          location: string | null;
          link: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          start_date?: string | null;
          end_date?: string | null;
          location?: string | null;
          link?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          start_date?: string | null;
          end_date?: string | null;
          location?: string | null;
          link?: string | null;
        };
        Relationships: [];
      };
      Exhibition_Booths: {
        Row: {
          id: number;
          exhibition_id: number | null;
          owner_id: number;
          booth_number: string | null;
          name: string | null;
          booth_type: string | null;
        };
        Insert: {
          id?: number;
          exhibition_id?: number | null;
          owner_id?: number | null;
          booth_number?: string | null;
          name?: string | null;
          booth_type?: string | null;
        };
        Update: {
          id?: number;
          exhibition_id?: number | null;
          owner_id?: number | null;
          booth_number?: string | null;
          name?: string | null;
          booth_type?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "Exhibition_Booths_exhibition_id_fkey";
            columns: ["exhibition_id"];
            isOneToOne: false;
            referencedRelation: "Exhibitions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Exhibition_Booths_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "Users";
            referencedColumns: ["id"];
          }
        ];
      };
      Exhibition_Product_Details: {
        Row: {
          id: number;
          booth_id: number;
          product_id: number | null;
          bundle_id: number | null;
          event_price: number;
          is_paid: boolean;
        };
        Insert: {
          id?: number;
          booth_id: number;
          product_id?: number | null;
          bundle_id?: number | null;
          event_price?: number;
          is_paid?: boolean;
        };
        Update: {
          id?: number;
          booth_id?: number;
          product_id?: number | null;
          bundle_id?: number | null;
          event_price?: number;
          is_paid?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "Exhibition_Product_Details_booth_id_fkey";
            columns: ["booth_id"];
            isOneToOne: false;
            referencedRelation: "Exhibition_Booths";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Exhibition_Product_Details_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "Products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Exhibition_Product_Details_bundle_id_fkey";
            columns: ["bundle_id"];
            isOneToOne: false;
            referencedRelation: "Product_Bundles";
            referencedColumns: ["id"];
          }
        ];
      };
      Sales_Records: {
        Row: {
          id: number;
          detail_id: number;
          quantity: number;
          method: string | null;
          order_id: number | null;
        };
        Insert: {
          id?: number;
          detail_id: number;
          quantity: number;
          method?: string | null;
          order_id?: number | null;
        };
        Update: {
          id?: number;
          detail_id?: number;
          quantity?: number;
          method?: string | null;
          order_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "Sales_Records_detail_id_fkey";
            columns: ["detail_id"];
            isOneToOne: false;
            referencedRelation: "Exhibition_Product_Details";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Sales_Records_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "Orders";
            referencedColumns: ["id"];
          }
        ];
      };
      Product_Bundles: {
        Row: {
          id: number;
          booth_id: number;
          name: string;
          is_active: boolean | null;
        };
        Insert: {
          id?: number;
          booth_id: number;
          name: string;
          is_active?: boolean | null;
        };
        Update: {
          id?: number;
          booth_id?: number;
          name?: string;
          is_active?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "Product_Bundles_booth_id_fkey";
            columns: ["booth_id"];
            isOneToOne: false;
            referencedRelation: "Exhibition_Booths";
            referencedColumns: ["id"];
          }
        ];
      };
      Bundle_Items: {
        Row: {
          id: number;
          bundle_id: number;
          product_id: number;
        };
        Insert: {
          id?: number;
          bundle_id: number;
          product_id: number;
        };
        Update: {
          id?: number;
          bundle_id?: number;
          product_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "Bundle_Items_bundle_id_fkey";
            columns: ["bundle_id"];
            isOneToOne: false;
            referencedRelation: "Product_Bundles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "Bundle_Items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "Products";
            referencedColumns: ["id"];
          }
        ];
      };
      Orders: {
        Row: {
          id: number;
          order_number: string;
          booth_id: number;
          created_at: string;
          phone: string | null;
          method: string | null;
          order_token: string | null;
        };
        Insert: {
          id?: number;
          order_number?: string;
          booth_id: number;
          created_at?: string;
          phone?: string | null;
          method?: string | null;
          order_token?: string | null;
        };
        Update: {
          id?: number;
          order_number?: string;
          booth_id?: number;
          created_at?: string;
          phone?: string | null;
          method?: string | null;
          order_token?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "Orders_booth_id_fkey";
            columns: ["booth_id"];
            isOneToOne: false;
            referencedRelation: "Exhibition_Booths";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      pos_checkout_v3: {
        Args: {
          p_booth_id: number;
          p_items: Json;
          p_method: string;
          p_phone: string;
        };
        Returns: {
          r_order_token: string;
          r_order_number: string;
        }[];
      };
      delete_sale_and_restock: {
        Args: { p_record_id: number };
        Returns: undefined;
      };
      get_order_by_token_and_last_three_phone: {
        Args: { t_token: string; t_last_three: string };
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

// 常用捷徑型別
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
