import { useState } from "react";
import type { ViewType } from "../Layout/Layout";
import styles from "./MobilePanel.module.css";
import { Ellipsis } from "lucide-react";
import { navItems } from "../../config/navItems.ts";
import { MobilePanelDetails } from './MobilePanelDetails.tsx';

type MobilePanelProps = {
  view: ViewType;
  setView: (viewType: ViewType) => void;
  spaceUsed: string;
};

export function MobilePanel({ view, setView, spaceUsed }: MobilePanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const barItems = navItems.slice(0, 4);
  const moreItems = navItems.slice(4);
  const isMoreActive = moreItems.some((i) => i.view === view);

  function handleSelect(next: ViewType) {
    setView(next);
    setIsOpen(false);
  }

  return (
    <nav className={styles.navBar}>
      {barItems.map((i) =>
        <button key={i.view} className={`${styles.navBarButton} ${view === i.view ? styles.active : ''}`} onClick={() => handleSelect(i.view)}>
          <i.icon size={22}/><span>{i.label}</span>
        </button>
      )}
      <button className={`${styles.navBarButton} ${(isOpen || isMoreActive) ? styles.active : ''}`} onClick={() => setIsOpen((prev) => !prev)} >
        <Ellipsis size={22}/><span>More</span>
      </button>
      {isOpen && <MobilePanelDetails items={moreItems} view={view} spaceUsed={spaceUsed} onSelect={handleSelect} onClose={() => setIsOpen(false)}/>}
    </nav>
  );
}
