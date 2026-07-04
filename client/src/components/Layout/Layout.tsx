
import styles from "./Layout.module.css";
import { useState } from "react";
import { Gallery } from "../Gallery/Gallery";
import { Trash } from "../Trash/Trash";
import { formatSize } from "../../helpers/helpers";
import { getStorage } from "../../api/upload";
import { SidePanel } from "../SidePanel/SidePanel";

export type ViewType = "gallery" | "trash";

export function Layout() {
  const [spaceUsed, setSpaceUsed] = useState("");
  const [view, setView] = useState<ViewType>("gallery");


  async function getSpaceUsed() {
    const resp = await getStorage();
    const spaceString = formatSize(resp) as string;
    setSpaceUsed(spaceString);
  }


  return (
    <div className={styles.layoutContainer}>
      <SidePanel setView={setView} spaceUsed={spaceUsed} getSpaceUsed={getSpaceUsed}/>
      <main className={styles.mainContainer}>{view === 'gallery' ? <Gallery getSpaceUsed={getSpaceUsed}/> : <Trash getSpaceUsed={getSpaceUsed}/> }</main>
    </div>
  );
}
