import { createContext } from "react";

type ToastContextValue = {
    showToast: (message: string, type: 'success'|'error'|'info') => void;
}

export const ToastContext = createContext<ToastContextValue|null>(null);
