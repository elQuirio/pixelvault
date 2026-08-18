
import { FolderPen, Move, CircleEllipsis, Trash } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Item } from "../../api/upload";
import styles from './ItemActions.module.css';
import type { ReactNode } from "react";

type ItemActionsProps = {
    item: Item;
    onRename?: ({id, name}: {id: string, name: string}) => void;
    onMove?: (ids: string[]) => void;
    onDelete?: (ids: string[]) => void;

}

export function ItemActions({item, onRename, onMove, onDelete}: ItemActionsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    let body : ReactNode;

    const toggleMenu = () => {
        setIsOpen((prev) => !prev);
    }

    useEffect(() => {
        if (!isOpen) return;
        function handleClickOutside(e: MouseEvent) {
            if (!wrapperRef.current?.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }

        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        }

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        }

    }, [isOpen]);

    const handleRename = () => {
        onRename?.({id: item.id, name: item.visibleName});
        setIsOpen(false);
    }

    const handleMove = () => {
        onMove?.([item.id]);
        setIsOpen(false);
    }

    const handleDelete = () => {
        onDelete?.([item.id]);
        setIsOpen(false);
    }

    if (onRename || onMove) {
        body = (<div className={styles.actionMenuWrapper}>
                    {onRename && <button className={styles.renameButton} onClick={handleRename}><FolderPen size={14}/><div className={styles.buttonLabel}>Rename</div></button>}
                    {onMove && <button className={styles.moveButton} onClick={handleMove}><Move size={14}/><div className={styles.buttonLabel}>Move</div></button>}
                    {onDelete && <button className={styles.deleteButton} onClick={handleDelete}><Trash size={14}/><div className={styles.buttonLabel}>Delete</div></button>}
                </div>)
    } else {
        body = null;
    }

    return <div ref={wrapperRef} className={styles.actionBtnWrapper}>
                {body && <button className={styles.actionMenuButton} onClick={toggleMenu}><CircleEllipsis size={20}/></button>}
                {isOpen && body}
            </div>
}