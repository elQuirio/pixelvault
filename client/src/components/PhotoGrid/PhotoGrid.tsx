import styles from "./PhotoGrid.module.css";
import type { Photo } from "../../api/upload";
import { useState } from "react";
import { LightBox } from "../LightBox/LightBox";


type PhotoGridProps = {
  files: Photo[];
  handleDeletePhoto: (id: string) => void;
  handleDeleteBulkClick: (ids: string[]) => void;
};

const API_BASE = "http://localhost:3000";

export function PhotoGrid({ files, handleDeletePhoto, handleDeleteBulkClick }: PhotoGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleSelectMode = () => {
    setIsSelectMode((prev: boolean) => !prev);
  };

  const handleCheckboxOnChange = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds((prev) => [...prev.filter((i) => i !== id)]);
    } else {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  return (
    <div>
      <button className="" onClick={toggleSelectMode}>
        toggle select mode
      </button>
      {isSelectMode && <button className="" onClick={() => handleDeleteBulkClick(selectedIds)}>Delete</button>}
      <div className={styles.gridContainer}>
        {files.map((u, i) => (
          <div>
            {isSelectMode && (
              <input
                type="checkbox"
                checked={selectedIds.includes(u.id)}
                onChange={() => handleCheckboxOnChange(u.id)}
              />
            )}
            <img
              key={u.id}
              className={styles.thumbnail}
              src={`${API_BASE}${u.thumbnail}`}
              alt={files[i].id}
              onClick={() => {
                setSelectedIndex(i);
                console.log(i);
              }}
            />
          </div>
        ))}
        {selectedIndex !== null && (
          <LightBox
            photos={files}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            onClose={() => setSelectedIndex(null)}
            handleDeletePhoto={handleDeletePhoto}
          />
        )}
      </div>
    </div>
  );
}
