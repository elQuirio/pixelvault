import styles from './SearchBar.module.css';

type SearchBarProps = {
    value: string;
    setValue: React.Dispatch<React.SetStateAction<string>>
}

export function SearchBar({value, setValue}: SearchBarProps) {
    
    
    return (<div className={styles.searchBarWrapper}>
                <input className={styles.searchBarInput} type="text" value={value} placeholder= 'Search...' onChange={(e) => setValue(e.target.value)}/>
            </div>)
}