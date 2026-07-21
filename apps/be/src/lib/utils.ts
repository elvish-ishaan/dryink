import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET_NAME } from "../configs/r2Client";

export async function getR2SignedUrl(key: string, expiresInSeconds: number = 3600, downloadable: boolean = true) {
    try {
      const command = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: key,
        ...(downloadable && {
          ResponseContentDisposition: `attachment; filename="${key}"`,
        }),
      });
      const url = await getSignedUrl(r2Client, command, {
        expiresIn: expiresInSeconds,
      });
      return url;
    } catch (error) {
      console.error("Error getting signed URL:", error);
      throw error;
    }
}
