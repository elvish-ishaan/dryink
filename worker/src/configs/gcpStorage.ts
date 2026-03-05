import { Storage } from "@google-cloud/storage";
import { config } from "dotenv";
import fs from "fs";

config();

const storage = new Storage({
  projectId: process.env.GCP_PROJECT_ID,
  keyFilename: process.env.GCP_KEY_FILE,
});

const bucket = storage.bucket(process.env.GCP_BUCKET_NAME as string);

export const uploadToGcp = async (filePath: string, fileName: string) => {
  const fileStream = fs.createReadStream(filePath);
  try {
    const file = bucket.file(fileName);
    await new Promise<void>((resolve, reject) => {
      fileStream
        .pipe(file.createWriteStream({ contentType: "video/mp4" }))
        .on("error", reject)
        .on("finish", resolve);
    });
    const url = `https://storage.googleapis.com/${process.env.GCP_BUCKET_NAME}/${fileName}`;
    return url;
  } catch (error) {
    console.log(error, "error in uploading to gcp");
  }
};
