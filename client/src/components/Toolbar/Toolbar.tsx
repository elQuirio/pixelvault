import styles from './Toolbar.module.css';

type ToolbarProps = {
    isSelectMode: boolean;
    onToggleSelectMode: () => void;
    sortBy: string;
    setSortBy: (sortBy: string) => void;
    onDeleteBulk: () => void;
    onRestoreBulk?: () => void;
    onMoveBulk?: () => void;
    onCreateFolder?: () => void;
}

export function Toolbar({isSelectMode, onToggleSelectMode, sortBy, setSortBy, onDeleteBulk, onRestoreBulk, onMoveBulk, onCreateFolder }: ToolbarProps) {
    const sortMap = [
        { sortkey: "creationDateDesc", label: "New first" },
        { sortkey: "creationDateAsc", label: "Old first" },
    ];


    return <div className={styles.toolbar}>
            <button className={`${styles.selectModeBtn} ${isSelectMode ? styles.active : ""}`} onClick={onToggleSelectMode}>Select...</button>
            <select className={styles.select} value={sortBy} onChange={(e) => setSortBy(e.target.value)} >
                {sortMap.map((s) => ( <option key={s.sortkey} value={s.sortkey}>{s.label}</option> ))}
            </select>
            {onCreateFolder &&  <button onClick={onCreateFolder}>Create folder</button>}
            {isSelectMode && (<>
                                <button onClick={() => onDeleteBulk()}>Delete</button>
                                    {onRestoreBulk && (<button onClick={() => onRestoreBulk()} >Restore</button>)}
                                    {onMoveBulk && <button onClick={() => onMoveBulk()} >Move</button>}
                            </>)
            }
            
        </div>

}