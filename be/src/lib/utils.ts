import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { s3Client } from "../configs/s3Client";

export async function getS3SignedUrl(bucket: string, key: string, expiresInSeconds: number = 3600, downloadable: boolean = true) {
    try {
      // Create a GetObjectCommand to specify the S3 object
      const getObjectCommandparams = downloadable ? {
        Bucket: bucket,
        Key: key,
        ResponseContentDisposition: `attachment`,
      } :
      {
        Bucket: bucket,
        Key: key,
        expiresInSeconds: expiresInSeconds,
      }
  
      const command = new GetObjectCommand(getObjectCommandparams);
      const url = await getSignedUrl(s3Client, command, {  expiresIn : expiresInSeconds });

      return url;
  
    } catch (error) {
      console.error("Error getting signed URL:", error);
      throw error;
    }
  }
  