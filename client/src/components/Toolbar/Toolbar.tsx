import styles from './Toolbar.module.css';
import { ChevronDown, Trash, Move, FolderPlus, CircleCheck, Undo2, Shredder } from 'lucide-react';

type ToolbarProps = {
    isSelectMode: boolean;
    selectedCount: number;
    onToggleSelectMode: () => void;
    sortBy: string;
    setSortBy: (sortBy: string) => void;
    onDeleteBulk: () => void;
    onRestoreBulk?: () => void;
    onMoveBulk?: () => void;
    onCreateFolder?: () => void;
}

export function Toolbar({isSelectMode, selectedCount, onToggleSelectMode, sortBy, setSortBy, onDeleteBulk, onRestoreBulk, onMoveBulk, onCreateFolder }: ToolbarProps) {
    const sortMap = [
        { sortkey: "creationDateDesc", label: "New first" },
        { sortkey: "creationDateAsc", label: "Old first" },
    ];


    return <div className={styles.toolbar}>
            <button className={`${styles.toolbarButton} ${isSelectMode ? styles.active : ""}`} onClick={onToggleSelectMode} aria-label="Select items" title="Select items"><CircleCheck className={styles.toolbarIcon}/></button>
            <span className={styles.selectWrap}>
                <select className={styles.select} value={sortBy} onChange={(e) => setSortBy(e.target.value)} >
                    {sortMap.map((s) => ( <option key={s.sortkey} value={s.sortkey}>{s.label}</option> ))}
                </select>
                <ChevronDown className={styles.caret}/>
            </span>
            
            {(onCreateFolder && !isSelectMode) &&  <button className={styles.toolbarButton} onClick={onCreateFolder} aria-label="Create new folder" title="Create new folder"><FolderPlus className={styles.toolbarIcon}/></button>}
            {(isSelectMode && (selectedCount>0)) && (<>
                                <button className={styles.toolbarButton} onClick={() => onDeleteBulk()} aria-label={onRestoreBulk ? "Delete permanently" : "Delete selected"} title={onRestoreBulk ? "Delete permanently" : "Delete selected"}>{onRestoreBulk ? <Shredder className={styles.toolbarIcon}/> : <Trash className={styles.toolbarIcon}/>}</button>
                                    {onRestoreBulk && (<button className={styles.toolbarButton} onClick={() => onRestoreBulk()} aria-label="Restore selected" title="Restore selected"><Undo2 className={styles.toolbarIcon}/></button>)}
                                    {onMoveBulk && <button className={styles.toolbarButton} onClick={() => onMoveBulk()} aria-label="Move selected" title="Move selected"><Move className={styles.toolbarIcon}/></button>}
                            </>)
            }
        </div>

}