import styles from './Toolbar.module.css';
import { ChevronDown, Trash, Move, FolderPlus, SquareMousePointer, Undo2, Shredder,  } from 'lucide-react';
import { type ItemType } from '../../types/types.ts';

type ToolbarProps = {
    isSelectMode: boolean;
    selectedCount: number;
    itemsCount: number;
    onToggleSelectMode: () => void;
    onToggleSelectAll: () => void;
    sortBy: string;
    setSortBy: (sortBy: string) => void;
    itemType: ItemType | 'all';
    setItemType: (itemType: ItemType | 'all') => void;
    typeOptions?: ItemType[];
    onDeleteBulk: () => void;
    onRestoreBulk?: () => void;
    onMoveBulk?: () => void;
    onCreateFolder?: () => void;
}

export function Toolbar({isSelectMode, selectedCount, itemsCount, onToggleSelectMode, onToggleSelectAll, sortBy, setSortBy, itemType, setItemType, typeOptions, onDeleteBulk, onRestoreBulk, onMoveBulk, onCreateFolder }: ToolbarProps) {
    const sortMap = [
        { sortkey: "creationDateDesc", label: "New first" },
        { sortkey: "creationDateAsc", label: "Old first" },
    ];

    const itemTypeMap : {itemTypekey: ItemType , label: string}[] = [
        { itemTypekey: "file", label: "File" },
        { itemTypekey: "video", label: "Video" },
        { itemTypekey: "image", label: "Image" },
        { itemTypekey: "folder", label: "Folder" },
    ];


    return <div className={styles.toolbar}>
        {<input className={`${styles.selectionCheckbox} ${!isSelectMode ? styles.disabled : ''}`} disabled={!isSelectMode} type="checkbox" checked={(selectedCount === itemsCount) && itemsCount > 0 } ref={(el) => {if (el) el.indeterminate = selectedCount > 0 && selectedCount < itemsCount;}} onChange={onToggleSelectAll} aria-label="Select all" title="Select all" />}
        <button className={`${styles.toolbarButton} ${isSelectMode ? styles.active : ""}`} onClick={onToggleSelectMode} aria-label="Select items" title="Select items"><SquareMousePointer className={styles.toolbarIcon}/></button>
            <span className={styles.selectWrap}>
                <select className={styles.select} value={sortBy} onChange={(e) => setSortBy(e.target.value)} >
                    {sortMap.map((s) => ( <option key={s.sortkey} value={s.sortkey}>{s.label}</option> ))}
                </select>
                <ChevronDown className={styles.caret}/>
            </span>
            <span className={styles.selectWrap}>
                <select className={styles.select} value={itemType} onChange={(e) => setItemType(e.target.value as ItemType | 'all')} >
                    <option key={'all'} value={'all'}>{'-'}</option>
                    {itemTypeMap.filter((s) => !typeOptions || typeOptions.includes(s.itemTypekey)).map((s) => <option key={s.itemTypekey} value={s.itemTypekey}>{s.label}</option> )}
                </select>
                <ChevronDown className={styles.caret}/>
            </span>
            
            {(onCreateFolder && !isSelectMode) &&  <button className={styles.toolbarButton} onClick={onCreateFolder} aria-label="Create new folder" title="Create new folder"><FolderPlus className={styles.toolbarIcon}/></button>}

            {isSelectMode && (<>
                                <button className={styles.toolbarButton} onClick={() => onDeleteBulk()} aria-label={onRestoreBulk ? "Delete permanently" : "Delete selected"} title={onRestoreBulk ? "Delete permanently" : "Delete selected"}>{onRestoreBulk ? <Shredder className={styles.toolbarIcon}/> : <Trash className={styles.toolbarIcon}/>}</button>
                                    {onRestoreBulk && (<button className={styles.toolbarButton} onClick={() => onRestoreBulk()} aria-label="Restore selected" title="Restore selected"><Undo2 className={styles.toolbarIcon}/></button>)}
                                    {onMoveBulk && <button className={styles.toolbarButton} onClick={() => onMoveBulk()} aria-label="Move selected" title="Move selected"><Move className={styles.toolbarIcon}/></button>}
                            </>)
            }
        </div>

}