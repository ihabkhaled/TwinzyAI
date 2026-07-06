import { toast } from 'sonner';

/**
 * Canonical toast intents. Values map 1:1 onto sonner's toast variants so the
 * rest of the app never references sonner directly.
 */
export const ToastType = {
  Success: 'success',
  Error: 'error',
  Info: 'info',
  Warning: 'warning',
} as const;

export type ToastTypeValue = (typeof ToastType)[keyof typeof ToastType];

export interface ShowToastOptions {
  type: ToastTypeValue;
  /** Already-translated, user-facing message. */
  message: string;
  /** Optional stable id for deduping / updating an existing toast. */
  id?: string | number;
}

type ToastHandler = (message: string, options?: { id: string | number }) => void;

const TOAST_HANDLERS: Record<ToastTypeValue, ToastHandler> = {
  [ToastType.Success]: (message, options) => {
    toast.success(message, options);
  },
  [ToastType.Error]: (message, options) => {
    toast.error(message, options);
  },
  [ToastType.Info]: (message, options) => {
    toast.info(message, options);
  },
  [ToastType.Warning]: (message, options) => {
    toast.warning(message, options);
  },
};

/**
 * Show a toast for the given intent. `message` must already be translated —
 * this facade performs no i18n lookups.
 */
export function showToast({ type, message, id }: ShowToastOptions): void {
  const notify = TOAST_HANDLERS[type];

  if (id === undefined) {
    notify(message);
    return;
  }

  notify(message, { id });
}
