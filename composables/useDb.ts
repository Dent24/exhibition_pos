import type { Database } from "~/types/database";

/**
 * 具型別的 Supabase client。
 * 等同 useSupabaseClient<Database>()，集中型別來源，
 * 讓 from()/insert()/update()/rpc() 取得正確的資料表型別。
 */
export const useDb = () => useSupabaseClient<Database>();
