import { API_BASE } from "../config/api";


export async function downloadOne({url, fileName} : {url: string, fileName: string}): Promise<void> {

    const res = await fetch(`${API_BASE}${url}`, {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
    throw new Error(`Download failed: ${res.status} ${res.statusText}`);
    }

    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objectUrl);
}