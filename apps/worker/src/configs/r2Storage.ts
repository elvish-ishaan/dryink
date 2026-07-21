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

export const uploadToS3 = async (filePath: string, fileName: string) => {
  // Create a readable stream from the file path
  const fileStream = fs.createReadStream(filePath);
  try {
    const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET,
        Key: fileName,
        Body: fileStream,
        ContentType: 'video/mp4',
      });
      const data = await s3Client.send(command);
      if(data.$metadata.httpStatusCode !== 200){
        throw new Error('Failed to upload file to S3');
      }
      //return the public url of the uploaded file
      const url = `https://${process.env.AWS_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
      return url
  } catch (error) {
    console.log(error,'error in uploading to s3')
  }
};