import styles from './Gauge.module.css';

type GaugeProps = {
    done: number,
    total: number
}

export function Gauge({done, total}: GaugeProps) {

    const fraction = total === 0 ? 0 : done/total;
    const C = 314;
    const offset = C * (1 - fraction);

 return <svg width="120" height="120">
            <circle className={styles.baseCircle} cx="60" cy="60" r="50" />
            <circle className={styles.fillingCircle} cx="60" cy="60" r="50"  strokeDasharray={C} strokeDashoffset={offset}/>
            <text className={styles.innerText} x="60" y="60" >{done}/{total}</text>
        </svg>
}