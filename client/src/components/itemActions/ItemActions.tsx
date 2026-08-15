
import { FolderPen, Move, CircleEllipsis } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { Item } from "../../api/upload";
import styles from './ItemActions.module.css';
import type { ReactNode } from "react";

type ItemActionsProps = {
    item: Item;
    onRename?: ({id, name}: {id: string, name: string}) => void;
    onMove?: (ids: string[]) => void;

}

export function ItemActions({item, onRename, onMove}: ItemActionsProps) {
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
        document.addEventListener('mousedown', handleClickOutside);

        return () => document.removeEventListener('mousedown', handleClickOutside);

    }, [isOpen]);

    const handleRename = () => {
        onRename?.({id: item.id, name: item.visibleName});
        setIsOpen(false);
    }

    const handleMove = () => {
        onMove?.([item.id]);
        setIsOpen(false);
    }

    if (onRename || onMove) {
        body = (<div className={styles.actionMenuWrapper}>
                    {onRename && <button className={styles.renameButton} onClick={handleRename}><FolderPen size={12}/><div>Rename</div></button>}
                    {onMove && <button className={styles.moveButton} onClick={handleMove}><Move size={12}/><div>Move</div></button>}
                </div>)
    } else {
        body = null;
    }

    return <div ref={wrapperRef} className={styles.actionBtnWrapper}>
                {body && <button className={styles.actionMenuButton} onClick={toggleMenu}><CircleEllipsis size={12}/></button>}
                {isOpen && body}
            </div>
}