import styles from './Breadcrumb.module.css';

type BreadcrumbProps = {
    path: {id: string|null, name: string}[];
    onNavigate: (id: string|null) => void;
}


export function Breadcrumb({path, onNavigate} : BreadcrumbProps) {


    return <div className={styles.breadcrumbWrapper}>
                {path.map((p, i) => {
                    if (i === path.length-1) {
                        return <div className={`${styles.crumb} ${styles.current}`} key={p.id ?? 'home'} onClick={() => onNavigate(p.id)}>{p.name}</div>
                    } else {
                        return <button className={styles.crumb} key={p.id ?? 'home'} onClick={() => onNavigate(p.id)}>{p.name}</button>
                    }
                })}
            </div>
}