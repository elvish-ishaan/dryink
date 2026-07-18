import { gcpBucket } from "../configs/gcpClient";

export async function getGcpSignedUrl(key: string, expiresInSeconds: number = 3600, downloadable: boolean = true) {
    try {
      const [url] = await gcpBucket.file(key).getSignedUrl({
        version: "v4",
        action: "read",
        expires: Date.now() + expiresInSeconds * 1000,
        ...(downloadable && {
          responseDisposition: "attachment",
        }),
      });
      return url;
    } catch (error) {
      console.error("Error getting signed URL:", error);
      throw error;
    }
}
