import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { systemPrompt } from "../lib/prompts";
import { redisPublisher } from "../configs/redisConfig";
import { v4 as uuidv4 } from 'uuid';
import { getS3SignedUrl } from "../lib/utils";


enum JobStatus {
    PENDING = "pending",
    COMPLETED = "completed",
}

interface JObData {
  jobId: string,
  status: JobStatus,
  response?: string | null,
  height?: number,
  width?: number,
  fps?: number, 
  frameCount?: number,
}


export const handlePrompt = async (req: Request, res: Response) => {
  try {
      //get the prompt from the request body
      const { prompt, height, width, fps, frameCount } = req.body;
      if(!prompt || !height || !width || !fps || !frameCount){
        return res.json({
          sucess: false,
          message: 'all parameters are required'
        })
      }
      //sanitize the prompt
  
      //call llm(gemini) to generate the response
      const ai = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY });
      const response = await ai.models.generateContent({
          model: "gemini-2.0-flash",
          contents: prompt as string,
          config: {
            systemInstruction: systemPrompt,
          },
        });
        console.log(response.text);
  
        //pushing to redis channel
        const jobData: JObData = {
          jobId: uuidv4(),
          status: JobStatus.PENDING,
          response: response.text,
          height: height,
          width: width,
          fps: fps,
          frameCount: frameCount,
        };
  
        try {
      
            const taskQueueKey = 'tasks';
            await redisPublisher.lPush(taskQueueKey, JSON.stringify(jobData));
  
            // Subscribe to job completion channel
            let result;
            const channel = `job:done:${jobData.jobId}`;
            await redisPublisher.subscribe(channel, (message) => {
               result = JSON.parse(message);
              console.log(` Job ${jobData.jobId} completed:`, result);
              // Optionally unsubscribe after receiving the message
              redisPublisher.unsubscribe(channel);
            });
        } catch (error) {
          console.log(error,'error in publishing to redis')
        }
  
        //returnig pre-signed url of the video
        const signedUrl = await getS3SignedUrl(process.env.AWS_BUCKET as string, `${jobData.jobId}.mp4`);
  
        //returning the response
        return res.json({
          sucess: true,
          data: signedUrl
        })
  } catch (error) {
    return res.status(500).json({
      sucess: false,
      message: 'internal server error'
    })  
  }
}