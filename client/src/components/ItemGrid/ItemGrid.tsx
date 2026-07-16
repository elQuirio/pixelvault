import styles from "./ItemGrid.module.css";
import type { Item } from "../../api/upload";
import { useState } from "react";
import { LightBox } from "../LightBox/LightBox";
import { API_BASE } from "../../config/api";
import { TypeIcon } from "../TypeIcon/TypeIcon";


type ItemGridProps = {
  files: Item[];
  handleDeleteItem: (id: string) => void;
  handleDeleteBulkClick: (ids: string[]) => void;
  handleRestore?: (id: string) => void;
  handleBulkRestore?: (ids: string[]) => void;
  sortBy: string;
  setSortBy: (sortBy: string) => void;
  onFolderOpen?: (id: string, name: string) => void;
};

export function ItemGrid({ files, handleDeleteItem, handleDeleteBulkClick, sortBy, setSortBy, handleRestore, handleBulkRestore, onFolderOpen}: ItemGridProps) {
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

  const handleOnClick = (u: Item, i: number) => {
    if (isSelectMode) {handleCheckboxOnChange(u.id); return;}
    if (u.itemType === 'folder') {onFolderOpen?.(u.id, u.visibleName); return;}
      setLightBoxIndex(i);
  }

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
      <button className={`${styles.selectModeBtn} ${isSelectMode ? styles.active : ''}`} onClick={toggleSelectMode}>
        Select...
      </button>
      <select className={styles.select} value={sortBy} onChange={(e) => setSortBy(e.target.value)}> 
        {sortMap.map((s) => <option key={s.sortkey} value={s.sortkey}>{s.label}</option>)}
      </select>
      {isSelectMode && (<>
          <button onClick={() => handleDeleteBulkClick(selectedIds)}>Delete</button>
          {handleBulkRestore && <button onClick={() => handleBulkRestore(selectedIds)}>Restore</button>}
                      </>)}
      <div className={styles.gridContainer}>
        {files.map((u, i) => (
          <div key={u.id} className={styles.thumbnailContainer}>
            {isSelectMode && (
              <input
                type="checkbox"
                className={styles.selectionCheckbox}
                checked={selectedIds.includes(u.id)}
                onChange={() => handleCheckboxOnChange(u.id)}
              />
            )}
            {u.thumbnail ? <img className={styles.thumbnail} src={`${API_BASE}${u.thumbnail}`} alt={files[i].id}
              onClick={() => handleOnClick(u, i)}/> : <TypeIcon itemType={u.itemType} onClick={() => handleOnClick(u, i)}/>}
          </div>
        ))}
        {lightBoxIndex !== null && (
          <LightBox
            items={files}
            lightBoxIndex={lightBoxIndex}
            setLightBoxIndex={setLightBoxIndex}
            onClose={() => setLightBoxIndex(null)}
            handleDeleteItem={handleDeleteItem}
            handleRestore={handleRestore}
          />
        )}
      </div>
    </div>
  );
}
