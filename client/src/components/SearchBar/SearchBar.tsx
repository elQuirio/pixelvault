import type { KeyboardEvent } from 'react';
import styles from './SearchBar.module.css';
import { X, LoaderCircle } from 'lucide-react';

type SearchBarProps = {
    value: string;
    setValue: (val: string) => void;
    runSemanticSearch?: () => void;
    isSemantic?: boolean;
    isSemanticLoading?: boolean;
}

export function SearchBar({value, setValue, runSemanticSearch, isSemantic, isSemanticLoading}: SearchBarProps) {

    const handleOnKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            runSemanticSearch?.();
        } 
    }
    
    return (<div className={styles.searchBarWrapper}>
                <div className={styles.inputWrapper}>
                    <input className={styles.searchBarInput} type="text" value={value} placeholder= 'Search...' onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => handleOnKeyDown(e)}/>
                    {value && <button className={styles.clearButton} onClick={() => setValue('')} aria-label="Clear search" title="Clear search"><X/></button>}
                </div>
                {runSemanticSearch && <button className={`${styles.semanticSearchButton} ${isSemantic ? styles.active : ''}`}  aria-label="Semantic search" onClick={runSemanticSearch} disabled={isSemanticLoading}>{isSemanticLoading ? <LoaderCircle className={styles.searchSpinner}/> : 'Semantic search'}</button>}
            </div>)
}