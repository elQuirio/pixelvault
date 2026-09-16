import styles from './SearchBar.module.css';
import { X } from 'lucide-react';

type SearchBarProps = {
    value: string;
    setValue: React.Dispatch<React.SetStateAction<string>>
}

export function SearchBar({value, setValue}: SearchBarProps) {
    
    
    return (<div className={styles.searchBarWrapper}>
                <div className={styles.inputWrapper}>
                    <input className={styles.searchBarInput} type="text" value={value} placeholder= 'Search...' onChange={(e) => setValue(e.target.value)}/>
                    {value && <button className={styles.clearButton} onClick={() => setValue('')} aria-label="Clear search" title="Clear search"><X/></button>}
                </div>
            </div>)
}