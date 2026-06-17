import { reactive } from "vue";

// =============================================================
// 全域 UI 回饋：Snackbar 通知 + Confirm 對話框
// 取代原生 alert() / confirm()，統一 Vuetify 設計語言。
// 狀態為模組層級單例，由 <AppUi /> 元件（掛在 layouts）統一渲染。
// =============================================================

// ---------- Snackbar ----------
interface SnackbarState {
  show: boolean;
  text: string;
  color: string;
  timeout: number;
}

const snackbarState = reactive<SnackbarState>({
  show: false,
  text: "",
  color: "success",
  timeout: 3000,
});

export const useSnackbar = () => {
  const notify = (text: string, color = "success", timeout = 3000) => {
    snackbarState.text = text;
    snackbarState.color = color;
    snackbarState.timeout = timeout;
    snackbarState.show = true;
  };

  return {
    snackbarState,
    notify,
    success: (text: string) => notify(text, "success", 3000),
    error: (text: string) => notify(text, "error", 5000),
    info: (text: string) => notify(text, "info", 3000),
    warning: (text: string) => notify(text, "warning", 4000),
  };
};

// ---------- Confirm dialog ----------
interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
}

interface ConfirmState {
  show: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  confirmColor: string;
}

const confirmState = reactive<ConfirmState>({
  show: false,
  title: "請確認",
  message: "",
  confirmText: "確認",
  cancelText: "取消",
  confirmColor: "primary",
});

let confirmResolver: ((value: boolean) => void) | null = null;

export const useConfirm = () => {
  /** 開啟確認對話框，回傳 Promise<boolean>（確認 true / 取消 false）。 */
  const confirm = (options: ConfirmOptions | string): Promise<boolean> => {
    const opts = typeof options === "string" ? { message: options } : options;
    confirmState.title = opts.title ?? "請確認";
    confirmState.message = opts.message;
    confirmState.confirmText = opts.confirmText ?? "確認";
    confirmState.cancelText = opts.cancelText ?? "取消";
    confirmState.confirmColor = opts.confirmColor ?? "primary";
    confirmState.show = true;

    return new Promise<boolean>((resolve) => {
      confirmResolver = resolve;
    });
  };

  const respond = (value: boolean) => {
    confirmState.show = false;
    confirmResolver?.(value);
    confirmResolver = null;
  };

  return { confirmState, confirm, respond };
};
