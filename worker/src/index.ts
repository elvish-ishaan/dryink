import express from "express";
import { redisSubscriber } from "./configs/redis";
import { generateVideo } from "./core/operation";
import { uploadToS3 } from "./configs/s3Config";
import fs from 'fs'
import path from "path";


const app = express();

app.use(express.json())

const PORT = process.env.PORT || 5001;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const taskQueueKey = 'tasks';

enum JobStatus {
    PENDING = "pending",
    COMPLETED = "completed",
}

async function startWorker() {
    while (true) {
      try {
        // Use brpop to block until a task is available
        const result = await redisSubscriber.brPop(taskQueueKey, 0)

        if(result){
          const jobData = JSON.parse(result.element);                    
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
    } catch (error) {
      console.error(`Error deleting folder ${folderToDlt}:`, error);
    }
      //return the job to  redis channel
      const completionInfo = {
        taskId: jobData.jobId,
        status: JobStatus.COMPLETED,
        outputFileLink: uploadedObjUrl,
      };
      
      console.log('adding completion to reids channel')
      // Publish result
      await redisSubscriber.publish(`job:done:${completionInfo.taskId}`, JSON.stringify(completionInfo));
        }
      } catch (error) {
        console.error('Error processing task:', error);
      }
    }
}

console.log('Worker started. Waiting for tasks...');
startWorker().catch(console.error);

app.listen( PORT, () => {
  console.log(`Server running at ${PORT}`);
});

