import { Modal } from "../Modal/Modal";
import { useState } from "react";
import { useItems } from "../../hooks/useItems";
import { ArrowBigLeft } from "lucide-react";
import styles from './NavigationModal.module.css';

type NavigationModalProps = {
    initialPath: {id: string, name: string}[],
    excludedIds: string[],
    onConfirm: (currentFolder: string) => Promise<void>,
    onClose: () => void,
}

export function NavigationModal({initialPath, excludedIds, onConfirm, onClose}: NavigationModalProps) {
    const [path, setPath] = useState<{id: string, name: string}[]>(initialPath);
    const currentFolder = path.at(-1)?.id ?? 'root';
    const {items} = useItems({parentId: currentFolder, type: ['folder']});
    const filteredItems = items.filter((i) => !excludedIds.includes(i.id));

  function handleOnSubmit(e: React.FormEvent) {
    e.preventDefault();
    onConfirm(currentFolder);
  }

  const handleFolderClick = (id: string, name: string) => {
    setPath((prev) => [...prev, {id, name}]);
  };

  const handleNavigateBack= () => {
    setPath((prev) => prev.slice(0,-1));
  }


  const modalContent = (<form onSubmit={handleOnSubmit} onClick={(e) => e.stopPropagation()} className={styles.modal}>
                                <div className={styles.modalWrapper}>
                                    <div className={styles.header}>
                                      <button type='button' className={styles.backButton} disabled={path.length===1} onClick={handleNavigateBack}><div><ArrowBigLeft size={18}/></div></button>
                                      <div className={styles.title}>{path.at(-1)?.name}</div>
                                    </div>
                                    <div className={styles.navigationWrapper}>
                                        {filteredItems.length>0 ? filteredItems.map((i) => {
                                                return <button className={styles.folderButton} key={i.id} type='button' onClick={() => handleFolderClick(i.id, i.visibleName)}><div>{i.visibleName}</div></button>
                                        }) : <div className={styles.empty}>Empty folder</div>
                                        }
                                    </div>
                                    <div className={styles.modalButtons}>
                                      <button type="submit">Move here</button>
                                      <button type="button" onClick={onClose}>Cancel</button>
                                    </div>
                                </div>
                            </form>);

    return <Modal onClose={onClose} modalContent={modalContent}/>
}



