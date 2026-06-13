const API_BASE = "http://localhost:3000";

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
};

export type PhotosResponse = {
  photos: Photo[];
};

export async function uploadFiles(files: File[]) {
  const formData = new FormData();
  files.forEach((f) => formData.append("file", f));

  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<UploadResponse>;
}

export async function getPhotos() {
  const res = await fetch(`${API_BASE}/photos`, {
    method: "GET",
  });

  if (!res.ok) {
    throw new Error(`Error fetching files: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<PhotosResponse>;
}
