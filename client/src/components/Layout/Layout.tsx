import { useAuth } from "../../context/AuthContext";
import { logout } from "../../api/auth";
import styles from "./Layout.module.css";
import { useState } from "react";
import { Gallery } from "../Gallery/Gallery";
import { Trash } from "../Trash/Trash";

export function Layout() {
  const [view, setView] = useState<"gallery" | "trash">("gallery");
  const [isOpen, setIsOpen] = useState(false);
  const { setUser } = useAuth();

  async function handleLogout() {
    await logout();
    setUser(null);
  }

  return (
    <div className={styles.LayoutContainer}>
      <button onClick={() => setIsOpen((prev) => !prev)}>☰</button>
      {isOpen && (
        <aside>
          <button onClick={handleLogout}>Logout</button>
          <button onClick={() => setView("gallery")}>Gallery</button>
          <button onClick={() => setView("trash")}>Bin</button>
        </aside>
      )}
      <main>{view === 'gallery' ? <Gallery/> : <Trash/> }</main>
    </div>
  );
}
