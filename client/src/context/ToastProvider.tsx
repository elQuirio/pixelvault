import { ToastContext } from "./ToastContext";
import { useState, type ReactNode } from "react";
import styles from './ToastProvider.module.css';

type Toast = {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
}



export function ToastProvider({children}: {children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    function removeToast(id: string) {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }

    function showToast (message: string, type: Toast['type']) {
        const id = crypto.randomUUID();
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 3500);
    };

    return (<ToastContext.Provider value={{showToast}} >
            {children}
            <div className={styles.toastWrapper}>
                {toasts.map((t) => <div key={t.id} className={styles.toast}>{t.message}</div>)}
            </div>
        </ToastContext.Provider>)
}