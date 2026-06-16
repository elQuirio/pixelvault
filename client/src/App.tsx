import { useState, useEffect } from "react";
import { UploadArea } from "./components/UploadArea/UploadArea";
import { PhotoGrid } from "./components/PhotoGrid/PhotoGrid";
import { uploadFiles, getPhotos } from './api/upload';
import type { Photo } from "./api/upload";
import { deletePhoto } from "./api/upload";

function App() {
  const [files, setFiles] = useState<Photo[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  useEffect(() => {
    getPhotos().then((res) => {
      setFiles(res.photos);
    })

  }, [])



  async function handleUploadFiles(newFiles: File[]) {
    setIsUploading(true);
    try{
      await uploadFiles(newFiles);
      const res = await getPhotos()
      console.log('Uploaded:', res);
      setFiles(res.photos);
    }
    catch (err) {
      console.error('Upload failed:', err);
    }
    finally {
      setIsUploading(false);
    }
  }

  async function handleDeletePhoto(id: string) {
    await deletePhoto(id);
    setFiles(files.filter(f => f.id !== id));
  }

  return (
    <main className="main-container">
      <h1>PixelVault</h1>
      <UploadArea onFilesSelected={handleUploadFiles} />
      {isUploading && <p className="status">Uploading...</p>}
      <PhotoGrid files={files} handleDeletePhoto={handleDeletePhoto} />
    </main>
  );
}

export default App;
