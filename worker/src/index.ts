import express from "express";
import { redisSubscriber } from "./configs/redis";
import { generateVideo } from "./core/operation";
import { uploadToS3 } from "./configs/s3Config";
import fs from 'fs'
import path from "path";
import prisma from "./configs/prismaclient";


const app = express();

app.use(express.json())

const PORT = process.env.PORT || 5001;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const taskQueueKey = 'tasks';

enum JobStatus {
    PENDING = "pending",
    FAILED = "failed",
    COMPLETED = "completed",
}

async function startWorker() {
      try {
        //get the job when available
        redisSubscriber.subscribe(taskQueueKey, async (job) => {
          const jobData = JSON.parse(job);
          console.log(jobData, 'getting job data')
          //generating video
          const videoPath = await generateVideo({
            htmlContent: jobData.response,
            width: jobData.width || 800,
            height: jobData.height || 720,
            fps: jobData.fps || 30,  // Frames per second
            frameCount: jobData.frameCount || 100,  // Number of frames to render FIX IT LATER  
            videoName: 'output.mp4',
          });
          
          //upload the video to s3
          const uploadedObjUrl = await uploadToS3(videoPath, `${jobData.jobId}.mp4`);
          if(!uploadedObjUrl){
            console.log('error in uploading to s3')
          }
          
          //remove the whole directory from local storage
          //go back to one level then remove the directory
          const folderToDlt = path.dirname(videoPath)
          console.log(folderToDlt, 'folder to delete')
          try {
            fs.rm(folderToDlt, { recursive: true }, (err) => {
              if (err) {
                console.error(`Error deleting folder ${folderToDlt}:`, err);
              } else {
                console.log(`Successfully deleted folder: ${folderToDlt}`);
              }
            });
          }catch{
            console.log('error in deleting folder')
          }
          //update the job status to completed in db
          const updatedJob = await prisma.job.update({
            where: {
              id: jobData.jobId,
            },
            data: {
              status: JobStatus.COMPLETED,
              genUrl: uploadedObjUrl,
            }
          })
          //update the chat also
          await prisma.chat.update({
            where: {
              id: jobData.chatId,
            },
            data: {
              responce: jobData.response,
              genUrl: uploadedObjUrl,
            }
          })
        });
      } catch (error) {
        console.error('Error processing task:', error);
      }
}

console.log('Worker started. Waiting for tasks...');
startWorker().catch(console.error);

app.listen( PORT, () => {
  console.log(`Server running at ${PORT}`);
});

