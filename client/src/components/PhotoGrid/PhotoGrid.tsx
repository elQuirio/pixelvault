import styles from "./PhotoGrid.module.css";
import type { Photo } from "../../api/upload";
import { useState } from "react";
import { LightBox } from "../LightBox/LightBox";
import { API_BASE } from "../../config/api";


type PhotoGridProps = {
  files: Photo[];
  handleDeletePhoto: (id: string) => void;
  handleDeleteBulkClick: (ids: string[]) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void; 
};

export function PhotoGrid({ files, handleDeletePhoto, handleDeleteBulkClick, sortBy, setSortBy }: PhotoGridProps) {
  const [lightBoxIndex, setLightBoxIndex] = useState<number | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
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

  const sortMap = [
    { sortkey: 'creationDateDesc',
      label: 'New first'
    },
    { sortkey: 'creationDateAsc',
      label: 'Old first'
    }
  ]

  return (
    <div>
      <button className="" onClick={toggleSelectMode}>
        toggle select mode
      </button>
      <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}> 
        {sortMap.map((s) => <option key={s.sortkey} value={s.sortkey}>{s.label}</option>)}
      </select>
      {isSelectMode && <button className="" onClick={() => handleDeleteBulkClick(selectedIds)}>Delete</button>}
      <div className={styles.gridContainer}>
        {files.map((u, i) => (
          <div key={u.id}>
            {isSelectMode && (
              <input
                type="checkbox"
                checked={selectedIds.includes(u.id)}
                onChange={() => handleCheckboxOnChange(u.id)}
              />
            )}
            <img
              className={styles.thumbnail}
              src={`${API_BASE}${u.thumbnail}`}
              alt={files[i].id}
              onClick={() => {
                setLightBoxIndex(i);
              }}
            />
          </div>
        ))}
        {lightBoxIndex !== null && (
          <LightBox
            photos={files}
            lightBoxIndex={lightBoxIndex}
            setLightBoxIndex={setLightBoxIndex}
            onClose={() => setLightBoxIndex(null)}
            handleDeletePhoto={handleDeletePhoto}
          />
        )}
      </div>
    </div>
  );
}
