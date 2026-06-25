import { API_BASE } from "../config/api";

type UploadedFile = {
  id: string;
  originalName: string;
  size: number;
  url: string;
};

type UploadResponse = {
  uploaded: UploadedFile[];
};

export type Photo = {
  id: string;
  url: string;
  thumbnail: string;
  originalName: string;
  size: number;
  createdAt: string;
};

export type PhotosResponse = {
  photos: Photo[];
};

export async function uploadFiles(files: File[]) {
  const formData = new FormData();
  files.forEach((f) => formData.append("file", f));

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    credentials: 'include',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<UploadResponse>;
}

export async function getPhotos(sortBy: string) {
  const res = await fetch(`${API_BASE}/photos?sortBy=${sortBy}`, {
    method: "GET",
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Error fetching files: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<PhotosResponse>;
}

export async function deletePhoto(id: string) {
  const res = await fetch(`${API_BASE}/photos/${id}`, {
    method: "DELETE",
    credentials: 'include',
  });

  if (!res.ok) {
    throw new Error(`Error deleting id: ${id}`);
  }
  return;
}

export async function deletePhotosBulk(ids: string[]) {
  const res = await fetch(`${API_BASE}/photos`, {
    method: "DELETE",
    headers: {'Content-type': 'application/json'},
    credentials: 'include',
    body: JSON.stringify({ ids: ids }),
  });

  if (!res.ok) {
    throw new Error(`Error deleting ids`);
  }

  return;
}
