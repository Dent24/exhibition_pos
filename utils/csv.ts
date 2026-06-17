// CSV 匯出工具（Nuxt 會自動 import）

/** 將二維陣列輸出為 CSV 並觸發下載（含 BOM 讓 Excel 正確顯示中文）。 */
export const downloadCsv = (
  filename: string,
  rows: (string | number)[][]
): void => {
  const escapeCell = (val: unknown): string => {
    const str = String(val ?? "");
    return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
  };

  const content = rows
    .map((row) => row.map(escapeCell).join(","))
    .join("\n");

  const bom = "﻿";
  const blob = new Blob([bom + content], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};
