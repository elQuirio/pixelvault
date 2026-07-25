import { unlink } from "node:fs/promises";
import { join } from "node:path";
import ffmpeg from "fluent-ffmpeg";
import ffprobeStatic from 'ffprobe-static';
import ffmpegStatic from 'ffmpeg-static';
import sharp from "sharp";

ffmpeg.setFfprobePath(ffprobeStatic.path);
ffmpeg.setFfmpegPath(ffmpegStatic!);


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


export async function generateVideoThumbnail(filepath: string, fileUuid: string, thumbnailDir: string): Promise<void> {
  const tempFrame = join(thumbnailDir, `${fileUuid}_frame.png`);

  await new Promise<void>((resolve, reject) => {
    ffmpeg(filepath)
      .on('end', () => resolve())
      .on('error', (err) => reject(err))
      .screenshots({
        timestamps: ['50%'],
        filename: `${fileUuid}_frame.png`,
        folder: thumbnailDir,
      });
  });

  await sharp(tempFrame)
    .resize(200, 200, { fit: 'cover' })
    .webp({ quality: 80 })
    .toFile(join(thumbnailDir, `${fileUuid}.webp`));

  await safeUnlink(tempFrame);
}