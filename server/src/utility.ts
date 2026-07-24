import { unlink } from "node:fs/promises";
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from 'ffprobe-static';
ffmpeg.setFfprobePath(ffprobeStatic.path);

export async function safeUnlink(path: string) {
  try {
    await unlink(path);
  } catch (err) {
    const e = err as NodeJS.ErrnoException;
    if (e.code !== "ENOENT") throw err;
  }
}



export function isUuid(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
}

export async function probeVideo(filepath: string): Promise<ffmpeg.FfprobeData | null> {

  return new Promise((resolve) => {
    ffmpeg.ffprobe(filepath, (err, data) => {
      resolve(err ? null : data); 
    })
  })
}