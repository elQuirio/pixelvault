import styles from './Toolbar.module.css';

type ToolbarProps = {
    isSelectMode: boolean;
    toggleSelectMode: () => void;
    sortBy: string;
    setSortBy: (sortBy: string) => void;
    onBulkDelete: () => void;
    onBulkRestore?: undefined | (() => void);
}

export function Toolbar({isSelectMode, toggleSelectMode, sortBy, setSortBy, onBulkDelete, onBulkRestore }: ToolbarProps) {
    const sortMap = [
        { sortkey: "creationDateDesc", label: "New first" },
        { sortkey: "creationDateAsc", label: "Old first" },
    ];


    return <>
            <button className={`${styles.selectModeBtn} ${isSelectMode ? styles.active : ""}`} onClick={toggleSelectMode}>Select...</button>
            <select className={styles.select} value={sortBy} onChange={(e) => setSortBy(e.target.value)} >
                {sortMap.map((s) => ( <option key={s.sortkey} value={s.sortkey}>{s.label}</option> ))}
            </select>
            {isSelectMode && (
                            <>
                            <button onClick={() => onBulkDelete()}>Delete</button>
                            {onBulkRestore && (
                                <button onClick={(e) => { onBulkRestore(); e.stopPropagation();}} >Restore</button>
                            )}
                            </>
            )}
        </>

}