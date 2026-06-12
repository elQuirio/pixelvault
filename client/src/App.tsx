import { useState } from "react";
import { UploadArea } from "./components/UploadArea/UploadArea";
import { PhotoGrid } from "./components/PhotoGrid/PhotoGrid";
import { uploadFiles } from './api/upload';

function App() {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  async function handleUploadFiles(newFiles: File[]) {
    setIsUploading(true);
    setFiles((prev) => [...prev, ...newFiles]);

    try{
      const res = await uploadFiles(newFiles);
      console.log('Uploaded:', res);
    }
    catch (err) {
      console.error('Upload failed:', err);
    }
    finally {
      setIsUploading(false);
    }
  }

  return (
    <main className="main-container">
      <h1>PixelVault</h1>
      <UploadArea onFilesSelected={handleUploadFiles} />
      {isUploading && <p className="status">Uploading...</p>}
      <PhotoGrid files={files}/>
    </main>
  );
}

export default App;
