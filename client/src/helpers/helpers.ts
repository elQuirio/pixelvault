
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