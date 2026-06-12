const API_BASE = 'http://localhost:3000';

type UploadedFile = {
    id: string,
    originalName: string,
    size: number
};

type UploadResponse = {
    uploaded: UploadedFile[],
};

export async function uploadFiles(files: File[]) {
    const formData = new FormData();
    files.forEach((f) => formData.append('file', f));

    const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
    })

    if (!res.ok) {
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
    }

    return res.json() as Promise<UploadResponse>;
};