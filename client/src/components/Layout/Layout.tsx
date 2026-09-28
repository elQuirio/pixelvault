
import styles from "./Layout.module.css";
import { useState } from "react";
import { Gallery } from "../Gallery/Gallery";
import { Trash } from "../Trash/Trash";
import { formatSize } from "../../helpers/helpers";
import { getStorage } from "../../api/upload";
import { SidePanel } from "../SidePanel/SidePanel";
import { Drive } from '../Drive/Drive';
import { Duplicates } from '../Duplicates/Duplicates'; 

export type ViewType = "gallery" | "drive" | "trash" | "duplicates";

export function Layout() {
  const [spaceUsed, setSpaceUsed] = useState("");
  const [view, setView] = useState<ViewType>("gallery");
  let viewComponent : React.JSX.Element = <div></div>;


  async function getSpaceUsed() {
    const resp = await getStorage();
    const spaceString = formatSize(resp) as string;
    setSpaceUsed(spaceString);
  }

  if (view === 'gallery') viewComponent = <Gallery getSpaceUsed={getSpaceUsed}/>; 
  else if (view === 'trash') viewComponent = <Trash getSpaceUsed={getSpaceUsed}/>;
  else if (view === 'drive') viewComponent = <Drive getSpaceUsed={getSpaceUsed}/>;
  else if (view === 'duplicates') viewComponent = <Duplicates getSpaceUsed={getSpaceUsed}/>;

  return (
    <div className={styles.layoutContainer}>
      <SidePanel setView={setView} spaceUsed={spaceUsed} getSpaceUsed={getSpaceUsed}/>
      <main className={styles.mainContainer}>{viewComponent}</main>
    </div>
  );
}
