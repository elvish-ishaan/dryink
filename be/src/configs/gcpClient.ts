import { Storage } from "@google-cloud/storage";
import { config } from "dotenv";

config();

export const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE,
});

export const gcpBucket = storage.bucket(process.env.GCP_BUCKET_NAME as string);
