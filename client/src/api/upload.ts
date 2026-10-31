import { API_BASE } from "../config/api";
import type { UploadResponse } from '../types/types.ts';


export async function uploadOne(file: File, parentId: string | null = null) {
  const formData = new FormData();
  formData.append("file", file);
  const params = new URLSearchParams();
  if (parentId) params.set('parentId', parentId);

  const res = await fetch(`${API_BASE}/upload?${params}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<UploadResponse>;
}
