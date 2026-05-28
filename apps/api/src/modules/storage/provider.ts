import { config } from "../../config.js";
import { createLocalProvider } from "./localProvider.js";
import { createS3Provider } from "./s3Provider.js";

export type UploadParams = {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
  hotelId: string;
};

export type UploadResult = {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  storageProvider: string;
};

export interface StorageProvider {
  upload(params: UploadParams): Promise<UploadResult>;
  delete(filename: string): Promise<void>;
}

let provider: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (provider) return provider;

  if (config.uploadProvider === "s3") {
    provider = createS3Provider({
      endpoint: config.s3Endpoint,
      region: config.s3Region,
      bucket: config.s3Bucket,
      accessKeyId: config.s3AccessKeyId,
      secretAccessKey: config.s3SecretAccessKey,
      publicBaseUrl: config.s3PublicBaseUrl
    });
  } else {
    provider = createLocalProvider({ uploadDir: config.uploadDir });
  }

  return provider;
}