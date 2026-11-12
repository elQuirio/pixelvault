import { useAuth } from "../../context/useAuth";
import { logout } from "../../api/auth";
import { useEffect, useState } from "react";
import type { ViewType } from "../Layout/Layout";
import styles from "./SidePanel.module.css";
import { CirclePower } from "lucide-react";
import { navItems } from "../../config/navItems.ts";

type SidePanelProps = {
  setView: (viewType: ViewType) => void;
  spaceUsed: string;
  getSpaceUsed: () => void;
};

export function SidePanel({
  setView,
  spaceUsed,
  getSpaceUsed,
}: SidePanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { setUser } = useAuth();

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  useEffect(() => {
    getSpaceUsed();
  }, []);

  return (
    <aside className={`${styles.wrapper} ${isOpen ? styles.open : ''}`}>
      <button className={styles.hamburger} onClick={() => setIsOpen((prev) => !prev)}>☰</button>
      <div className={`${styles.content} ${isOpen ? styles.open : ''}`}>
        <div className={styles.spaceUsed}>Space used: {spaceUsed}</div>
        {navItems.map((i) =>
          <button key={i.view} onClick={() => {
            setView(i.view);
            setIsOpen((prev) => !prev);
            }}><i.icon/><div>{i.label}</div></button>
        )}
        <button className={styles.logoutButton} onClick={handleLogout}><CirclePower/><div>Logout</div></button>
      </div>


    </aside>
  );
}
