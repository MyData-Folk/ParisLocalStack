import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import type { StorageProvider, UploadParams, UploadResult } from "./provider.js";

export function createS3Provider(options: {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicBaseUrl: string;
}): StorageProvider {
  const client = new S3Client({
    endpoint: options.endpoint,
    region: options.region,
    credentials: {
      accessKeyId: options.accessKeyId,
      secretAccessKey: options.secretAccessKey
    },
    forcePathStyle: true
  });

  const publicBaseUrl = options.publicBaseUrl.replace(/\/$/, "");

  return {
    async upload(params: UploadParams): Promise<UploadResult> {
      const filename = `${params.hotelId}/${Date.now()}-${params.originalName.replace(/[^a-zA-Z0-9._-]/g, "-")}`;

      await client.send(new PutObjectCommand({
        Bucket: options.bucket,
        Key: filename,
        Body: params.buffer,
        ContentType: params.mimeType
      }));

      return {
        filename,
        originalName: params.originalName,
        mimeType: params.mimeType,
        size: params.buffer.length,
        url: `${publicBaseUrl}/${filename}`,
        storageProvider: "s3"
      };
    },

    async delete(filename: string): Promise<void> {
      await client.send(new DeleteObjectCommand({
        Bucket: options.bucket,
        Key: filename
      }));
    }
  };
}