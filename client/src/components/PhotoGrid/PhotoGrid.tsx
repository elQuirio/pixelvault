import styles from "./PhotoGrid.module.css";
import { Photo } from '../../api/upload';
import { useState } from "react";
import { LightBox } from "../LightBox/LightBox";

type PhotoGridProps = {
  files: Photo[];
};

const API_BASE = "http://localhost:3000";

export function PhotoGrid({ files }: PhotoGridProps) {
  const [selected, setSelected] = useState<Photo | null>(null);

  return (
    <div className={styles.gridContainer}>
      {files.map((u, i) => (
        <img key={u.id} className={styles.thumbnail} src={`${API_BASE}${u.thumbnail}`} alt={files[i].id} onClick={() => setSelected(u)} />
      ))}
      {selected && <LightBox photo={selected} onClose={() => setSelected(null)}/>}
    </div>
  );
}
