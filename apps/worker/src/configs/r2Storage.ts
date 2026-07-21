import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { config } from "dotenv";
import fs from "fs";

config();

const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,
  },
  forcePathStyle: true,
});

export const uploadToR2 = async (filePath: string, fileName: string) => {
  const fileStream = fs.createReadStream(filePath);
  try {
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: fileStream,
      ContentType: "video/mp4",
    });
    const data = await r2Client.send(command);
    if (data.$metadata.httpStatusCode !== 200) {
      throw new Error("Failed to upload file to R2");
    }
    const url = `${process.env.R2_PUBLIC_URL}/${fileName}`;
    return url;
  } catch (error) {
    throw error;
  }
};
