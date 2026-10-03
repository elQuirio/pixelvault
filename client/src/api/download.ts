import { API_BASE } from "../config/api";


export function downloadOne({url} : {url: string}) {
    const a = document.createElement('a');
    a.href = API_BASE + url + '?download=1';
    document.body.appendChild(a);
    a.click();
    a.remove();
}