import fs from "fs";
import path from "path";
import type { StorageProvider, UploadParams, UploadResult } from "./provider.js";

export function createLocalProvider(options: { uploadDir: string }): StorageProvider {
  fs.mkdirSync(options.uploadDir, { recursive: true });

  return {
    async upload(params: UploadParams): Promise<UploadResult> {
      const filename = `${Date.now()}-${params.originalName.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
      const fullPath = path.join(options.uploadDir, filename);
      await fs.promises.writeFile(fullPath, params.buffer);

      return {
        filename,
        originalName: params.originalName,
        mimeType: params.mimeType,
        size: params.buffer.length,
        url: `/uploads/${filename}`,
        storageProvider: "local"
      };
    },

    async delete(filename: string): Promise<void> {
      const fullPath = path.join(options.uploadDir, filename);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }
  };
}