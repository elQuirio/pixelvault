import type { Item } from "../types/types";

const units = ['B','KB', 'MB', 'GB', 'TB'];

export function formatSize(fileSize: number) {
    let size = fileSize ?? 0;
    const l = units.length -1;

    for (let i=0; i<=l; i++) {
        if (size < 1000 || i===l) {
            return `${size.toFixed(2)} ${units[i]}`;
        }
        size = size / 1000;
    }
}

export function getVideoDuration(item: Item) {
    const format = item.metadata?.format as {duration?: number } | undefined;
    const duration = format?.duration;

    if (typeof duration !== 'number' || !Number.isFinite(duration)) return null;

    return  Math.floor(duration);
}

export function formatDuration(duration: number): string {
    const h = Math.floor(duration / 3600);
    const m = Math.floor((duration % 3600) / 60);
    const s = duration % 60;

    const ss = String(s).padStart(2, '0');
    if (h === 0) return `${m}:${ss}`;
    return `${h}:${String(m).padStart(2, '0')}:${ss}`;
}