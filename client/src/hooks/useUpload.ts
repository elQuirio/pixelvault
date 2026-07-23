import { uploadOne } from "../api/upload.ts";
import { useState } from "react";
import { useToast } from "../context/useToast.tsx";

type useUploadProps = {
    onComplete?: () => void;
}

export function useUpload({onComplete}: useUploadProps) {
    const [done, setDone] = useState(0);
    const [total, setTotal] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const { showToast } = useToast();

    async function uploadFiles(newFiles: File[], parentId: string|null ) {
        setTotal(newFiles.length);
        setDone(0);
        setIsUploading(true);
        try {

          const promises = newFiles.map((f) => {
            return uploadOne(f, parentId).then((c) => {
              setDone(p => p+1);
              return c;
            })
          });
    
          await Promise.allSettled(promises);
          onComplete?.();
        } catch (err) {
          console.error("Upload failed:", err);
          showToast('Upload fallito', 'error');
        } finally {
          setIsUploading(false);
        }
      }

      return { done, total, isUploading, uploadFiles }
      
}