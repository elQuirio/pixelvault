import { ToastContext } from "./ToastContext";
import { useState, type ReactNode } from "react";
import styles from './ToastProvider.module.css';

type Toast = {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}



export function ToastProvider({children}: {children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    let toastId = 0;

    function removeToast(id: number) {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }

    function showToast (message: string, type: Toast['type']) {
        const id = toastId +1;
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => removeToast(id), 3500);
    };

    return (<ToastContext.Provider value={{showToast}} >
            {children}
            <div className={styles.toastWrapper}>
                {toasts.map((t) => <div key={t.id} className={`${styles.toast} ${styles[t.type]}`}>{t.message}</div>)}
            </div>
        </ToastContext.Provider>)
}