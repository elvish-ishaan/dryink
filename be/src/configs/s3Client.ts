import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { config } from "dotenv";
import fs from 'fs'

config();

export const s3Client = new S3Client({
  region: process.env.AWS_REGION as string,
  credentials: {
    accessKeyId: process.env.S3_BUCKET_ACCESS_KEY as string,
    secretAccessKey: process.env.S3_BUCKET_SECRET_KEY as string,
  },
});