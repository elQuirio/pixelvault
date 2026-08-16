import { Modal } from "../Modal/Modal";
import { useState } from "react";
import { useItems } from "../../hooks/useItems";
import { ArrowBigLeft, Folder, File } from "lucide-react";
import styles from './NavigationModal.module.css';

type NavigationModalProps = {
    initialPath: {id: string, name: string}[],
    excludedIds: string[],
    onConfirm: (destinationId: string) => Promise<void>,
    onClose: () => void,
}

export function NavigationModal({initialPath, excludedIds, onConfirm, onClose}: NavigationModalProps) {
    const [path, setPath] = useState<{id: string, name: string}[]>(initialPath);
    const currentFolder = path.at(-1)?.id ?? 'root';
    const openingFolder = initialPath.at(-1)?.id ?? 'root';
    const {items} = useItems({parentId: currentFolder, type: ['folder']});
    const filteredItems = items.filter((i) => !excludedIds.includes(i.id));
    const [isMoving, setIsMoving] = useState<boolean>(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsMoving(true);
    await onConfirm(currentFolder);
    setIsMoving(false);
  }

  const handleFolderClick = (id: string, name: string) => {
    setPath((prev) => [...prev, {id, name}]);
  };

  const handleNavigateBack= () => {
    setPath((prev) => prev.slice(0,-1));
  }


  const modalContent = (<form onSubmit={handleSubmit} onClick={(e) => e.stopPropagation()} className={styles.modal}>
                                <div className={styles.modalWrapper}>
                                    <div className={styles.header}>
                                      <button type='button' className={styles.backButton} disabled={path.length===1} onClick={handleNavigateBack}><ArrowBigLeft size={18}/></button>
                                      <div className={styles.title}>{path.at(-1)?.name}</div>
                                    </div>
                                    <div className={styles.navigationWrapper}>
                                        {filteredItems.length>0 ? filteredItems.map((i) => {
                                                return  <button className={styles.folderButton} key={i.id} type='button' onClick={() => handleFolderClick(i.id, i.visibleName)}>
                                                          <div className={styles.folderLabel}>{i.visibleName}</div>
                                                          <div className={styles.folderStats}><div className={styles.itemsStatsWrapper}><File className={styles.modalIcon} size={15}/>{i.childCount}</div><div className={styles.folderStatsWrapper}><Folder className={styles.modalIcon} size={15}/>{i.folderCount}</div></div>
                                                        </button>
                                        }) : <div className={styles.empty}>No subfolders</div>
                                        }
                                    </div>
                                    <div className={styles.modalButtons}>
                                      <button type="submit" className={styles.confirmButton} disabled={isMoving || (openingFolder===currentFolder)}>Move here</button>
                                      <button type="button" onClick={onClose}>Cancel</button>
                                    </div>
                                </div>
                            </form>);

    return <Modal onClose={onClose} modalContent={modalContent}/>
}



