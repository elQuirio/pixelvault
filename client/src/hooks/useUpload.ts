import { uploadOne } from "../api/upload.ts";
import { useState } from "react";

type useUploadProps = {
    onComplete?: () => void;
}

export function useUpload({onComplete}: useUploadProps) {
    const [done, setDone] = useState(0);
    const [total, setTotal] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

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
        } finally {
          setIsUploading(false);
        }
      }

      return {
        done,
        total,
        isUploading,
        uploadFiles
      }

}