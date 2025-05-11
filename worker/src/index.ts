import express from "express";
import { redisSubscriber } from "./configs/redis";
import { generateVideo } from "./core/operation";
import { uploadToS3 } from "./configs/s3Config";
import fs from 'fs'


const app = express();

app.use(express.json())

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const taskQueueKey = 'tasks';
const completionChannel = 'task_completion';

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

      //delete the whole directory form local storage
      await new Promise((resolve, reject) => {
        fs.unlink(videoPath, (err) => {
          if (err) {
            reject(err);
          } else {
            resolve("file deleted successfully");
          }
        });
      });
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

app.listen( 5001, () => {
  console.log(`Server is running on port 5001`);
});

