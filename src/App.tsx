import { UploadArea } from "./components/UploadArea/UploadArea";
import { PhotoGrid } from "./components/PhotoGrid/PhotoGrid";
import { useState } from "react";

function App() {
  const [files, setFiles] = useState<File[]>([]);

  return (
    <main className="main-container">
      <h1>PixelVault</h1>
      <UploadArea onFilesSelected={(files) => setFiles((prev) => [...prev, ...files])} />
      <PhotoGrid files={files}/>
    </main>
  );
}

export default App;
