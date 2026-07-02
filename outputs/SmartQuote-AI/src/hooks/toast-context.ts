import { createContext, type ReactNode } from "react";

export type ToastType = "success" | "error" | "warning" | "loading" | "info";

export interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  action?: ToastAction;
}

export interface ToastContextValue {
  show: (toast: Omit<ToastMessage, "id">) => string;
  dismiss: (id: string) => void;
  success: (title: string, description?: string, action?: ToastAction) => string;
  error: (title: string, description?: string, action?: ToastAction) => string;
  warning: (title: string, description?: string, action?: ToastAction) => string;
  loading: (title: string, description?: string) => string;
  info: (title: string, description?: string, action?: ToastAction) => string;
}

export const ToastContext = createContext<ToastContextValue | null>(null);

export interface ToastIconMap {
  success: ReactNode;
  error: ReactNode;
  warning: ReactNode;
  loading: ReactNode;
  info: ReactNode;
}
