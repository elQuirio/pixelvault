import styles from './StorageStats.module.css';
import { formatSize } from "../../helpers/helpers";
import type { StorageDetails } from '../../types/types';


export function StorageStats({stats}: {stats: StorageDetails | null}) {

    if (!stats) return <div></div>;

    return <div>
                <div className={styles.cards}>
                    <div className={styles.card}>
                        <span>Total used</span>
                        <span>{formatSize(stats.totalSize)}</span>
                    </div>
                    <div className={styles.card}>
                        <span>Trash size</span>
                        <span>{formatSize(stats.binSize)}</span>
                    </div>
                    <div className={styles.card}>
                        <span>Duplicates size</span>
                        <span>{formatSize(stats.duplicateSize)}</span>
                    </div>
                </div>

                <section className={styles.section}>
                <h3 className={styles.sectionTitle}>By type</h3>
                {stats.itemTypeSize.map((t) => (
                    <div key={t.itemType} className={styles.row}>
                        <span className={styles.rowLabel}>{t.itemType}</span>
                        <div className={styles.bar}>
                            <div className={styles.barFill} style={{ width: `${(t.itemTypeSize / stats.totalSize) * 100}%` }} />
                        </div>
                        <span className={styles.rowValue}>{formatSize(t.itemTypeSize)}</span>
                    </div>
                ))}
                </section>

                <section className={styles.section}>
                <h3 className={styles.sectionTitle}>Largest folders</h3>
                {stats.topFiveFolders.map((f) => (
                    <div key={f.id} className={styles.row}>
                        <span className={styles.rowLabel}>{f.name}</span>
                        <div className={styles.bar}>
                            <div className={styles.barFill} style={{ width: `${(f.size / stats.totalSize) * 100}%` }} />
                        </div>
                        <span className={styles.rowValue}>{formatSize(f.size)}</span>
                    </div>
                ))}
                </section>
            </div>
}