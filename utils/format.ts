// 共用格式化工具（Nuxt 會自動 import）

/** 日期：YYYY/MM/DD（null 顯示「未定」） */
export const formatDate = (dateStr?: string | null): string => {
  if (!dateStr) return "未定";
  return new Date(dateStr)
    .toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/-/g, "/");
};

/** 日期時間：MM/DD HH:mm（null 顯示空字串） */
export const formatDateTime = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** 完整日期時間：YYYY/MM/DD HH:mm（供匯出使用） */
export const formatDateTimeFull = (dateStr?: string | null): string => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** 金額：NT$ 1,234 */
export const formatCurrency = (amount?: number | null): string =>
  `NT$ ${(amount ?? 0).toLocaleString()}`;
