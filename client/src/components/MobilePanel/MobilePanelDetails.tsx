import type { ViewType } from "../Layout/Layout";
import { useEffect } from "react";
import { logout } from "../../api/auth";
import { useAuth } from "../../context/useAuth";
import { CirclePower } from "lucide-react";
import type { navItems } from "../../config/navItems";
import styles from "./MobilePanelDetails.module.css";

type MobilePanelDetailsProps = {
  items: typeof navItems;
  view: ViewType;
  spaceUsed: string;
  onSelect: (viewType: ViewType) => void;
  onClose: () => void;
};

export function MobilePanelDetails({ items, view, spaceUsed, onSelect, onClose }: MobilePanelDetailsProps) {
  const { setUser } = useAuth();

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <>
      <div className={styles.overlay} onClick={onClose}/>
      <div className={styles.panel}>
        <div className={styles.spaceUsed}>Space used: {spaceUsed}</div>
        {items.map((n) =>
          <button key={n.view} className={`${styles.panelButton} ${view === n.view ? styles.active : ''}`} onClick={() => onSelect(n.view)}>
            <n.icon size={20}/><span>{n.label}</span>
          </button>
        )}
        <button className={`${styles.panelButton} ${styles.logoutButton}`} onClick={handleLogout}>
          <CirclePower size={20}/><span>Logout</span>
        </button>
      </div>
    </>
  );
}
