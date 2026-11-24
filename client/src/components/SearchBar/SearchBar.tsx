import type { KeyboardEvent } from 'react';
import styles from './SearchBar.module.css';
import { X, LoaderCircle } from 'lucide-react';
import type { Tag } from '../../types/types';

type SearchBarProps = {
    value: string;
    setValue: (val: string) => void;
    runSemanticSearch?: () => void;
    isSemantic?: boolean;
    isSemanticLoading?: boolean;
    tags?: Tag[];
    userTags?: Tag[] | null;
    addSearchTag?: (tag: Tag) => void;
    removeSearchTag?: (tag: Tag) => void;
    clearSearch?: () => void;
    onFocus?: () => void;
}

export function SearchBar({value, setValue, runSemanticSearch, isSemantic, isSemanticLoading, tags, userTags, addSearchTag, removeSearchTag, clearSearch, onFocus }: SearchBarProps) {

    const handleOnKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            runSemanticSearch?.();
        }
    }

    const suggestedTags = (value.trim() !== '' && userTags) ? userTags.filter((ut) => ut.tagName.startsWith(value.trim().toLowerCase()) && !tags?.some((t) => t.tagId === ut.tagId)).slice(0,5) : [];
    
    const hasTags = tags !== undefined && tags.length > 0;

    return (<div className={styles.searchBarWrapper}>
                <div className={styles.searchRow}>
                    <div className={styles.inputWrapper}>
                        <input className={styles.searchBarInput} type="text" value={value} autoCapitalize='none' placeholder= 'Search...' onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => handleOnKeyDown(e)} onFocus={() => onFocus?.()}/>
                        {(value || hasTags) && <button className={styles.clearButton} onClick={() => clearSearch ? clearSearch() : setValue('')} aria-label="Clear search" title="Clear search"><X/></button>}
                    </div>
                    {runSemanticSearch && <button className={`${styles.semanticSearchButton} ${isSemantic ? styles.active : ''}`}  aria-label="Semantic search" onClick={() => runSemanticSearch()} disabled={isSemanticLoading}>{isSemanticLoading ? <LoaderCircle className={styles.searchSpinner}/> : 'Semantic search'}</button>}
                </div>
                {suggestedTags.length > 0 && addSearchTag &&
                        <div className={styles.tagsWrapper}>
                            {suggestedTags.map((st) => <button key={st.tagId} className={styles.suggestion} onClick={() => addSearchTag(st)}>{st.tagName}</button>)}
                        </div>}
                {hasTags && removeSearchTag &&
                        <div className={styles.chips}>{tags.map((i) => <div key={i.tagId} className={styles.tag}>{i.tagName}
                                                                            <button className={styles.removeButton} onClick={() => removeSearchTag(i)}>
                                                                                <X size={12} strokeWidth={3}/>
                                                                            </button>
                                                                        </div>)}
                        </div>}
            </div>
            )
}