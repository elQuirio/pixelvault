import styles from "./PhotoGrid.module.css";
import { Photo } from "../../api/upload";
import { useState } from "react";
import { LightBox } from "../LightBox/LightBox";

type PhotoGridProps = {
  files: Photo[];
  handleDeletePhoto: () => {};
};

const API_BASE = "http://localhost:3000";

export function PhotoGrid({ files, handleDeletePhoto }: PhotoGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <div className={styles.gridContainer}>
      {files.map((u, i) => (
        <img
          key={u.id}
          className={styles.thumbnail}
          src={`${API_BASE}${u.thumbnail}`}
          alt={files[i].id}
          onClick={() => {
            setSelectedIndex(i)
          console.log(i)}}
        />
      ))}
      {(selectedIndex !== null) && (
        <LightBox
          photos={files}
          selectedIndex={selectedIndex}
          setSelectedIndex={setSelectedIndex}
          onClose={() => setSelectedIndex(null)}
          handleDeletePhoto={handleDeletePhoto}
        />
      )}
    </div>
  );
}
