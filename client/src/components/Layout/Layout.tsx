import { useAuth } from "../../context/AuthContext";
import { logout } from "../../api/auth";
import styles from "./Layout.module.css";
import { useState } from "react";
import { Gallery } from "../Gallery/Gallery";
import { Trash } from "../Trash/Trash";
import { useEffect } from "react";
import { formatSize } from "../../helpers/helpers";
import { getStorage } from "../../api/upload";

export function Layout() {
  const [view, setView] = useState<"gallery" | "trash">("gallery");
  const [isOpen, setIsOpen] = useState(false);
  const [spaceUsed, setSpaceUsed] = useState('');
  const { setUser } = useAuth();

  async function handleLogout() {
    await logout();
    setUser(null);
  };

  async function getSpaceUsed() {
    const resp = await getStorage();
    const spaceString = formatSize(resp) as string;
    setSpaceUsed(spaceString);
  }

  useEffect(() => {
    getSpaceUsed();
  }, [])



  return (
    <div className={styles.LayoutContainer}>
      <button onClick={() => setIsOpen((prev) => !prev)}>☰</button>
      {isOpen && (
        <aside>
          <button onClick={handleLogout}>Logout</button>
          <button onClick={() => setView("gallery")}>Gallery</button>
          <button onClick={() => setView("trash")}>Bin</button>
          <div>{spaceUsed}</div>
        </aside>
      )}
      <main>{view === 'gallery' ? <Gallery getSpaceUsed={getSpaceUsed}/> : <Trash getSpaceUsed={getSpaceUsed}/> }</main>
    </div>
  );
}
