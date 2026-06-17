// 展覽期效 / 攤位可編輯狀態判斷（Nuxt 會自動 import）

export type ExhibitionStatus = "locked" | "editable";

/**
 * 攤位編輯狀態：展覽開始(含)後鎖定，開始前可編輯。
 * 通販攤位無展覽（無 start_date），永遠可編輯。
 */
export const getExhibitionStatus = (
  startDate?: string | null
): ExhibitionStatus => {
  if (!startDate) return "editable";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);
  return today >= start ? "locked" : "editable";
};

/** 展覽是否已結束（今天 > 結束日）。無結束日（通販）視為未結束。 */
export const isExhibitionEnded = (endDateStr?: string | null): boolean => {
  if (!endDateStr) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDateStr);
  end.setHours(0, 0, 0, 0);
  return today > end;
};
