import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { modifySketchSystemPrompt, systemPrompt } from "../lib/prompts";
import { redisPublisher } from "../configs/redisConfig";
import { v4 as uuidv4 } from 'uuid';
import { getS3SignedUrl } from "../lib/utils";

enum JobStatus {
    PENDING = "pending",
    COMPLETED = "completed",
}

interface JobData {
  jobId: string,
  status: JobStatus,
  response?: string | null,
  height?: number,
  width?: number,
  fps?: number, 
  frameCount?: number,
}

// --- Redis Wait Helper ---
const waitForJobCompletion = (jobId: string): Promise<JobData> => {
  return new Promise((resolve, reject) => {
    const channel = `job:done:${jobId}`;

    const handleMessage = (message: string) => {
      try {
        const result = JSON.parse(message);
        redisPublisher.unsubscribe(channel);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    redisPublisher.subscribe(channel, handleMessage);
  });
};

// --- Main Prompt Handler ---
export const handlePrompt = async (req: Request, res: Response) => {
  try {
    const { prompt, height, width, fps, frameCount } = req.body;

    if (!prompt || !height || !width || !fps || !frameCount) {
      return res.status(400).json({
        success: false,
        message: 'All parameters are required',
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt as string,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const jobData: JobData = {
      jobId: uuidv4(),
      status: JobStatus.PENDING,
      response: response.text,
      height,
      width,
      fps,
      frameCount,
    };

    console.log('pushing job to queue...........');
    // Push job to queue
    await redisPublisher.lPush('tasks', JSON.stringify(jobData));
    console.log('waiting to finish........')
    // Wait for job to complete via Redis pub/sub
    const result = await waitForJobCompletion(jobData.jobId);
    console.log('getting result........')

    if (result.status === JobStatus.COMPLETED) {
      const signedUrl = await getS3SignedUrl(
        process.env.AWS_BUCKET as string,
        `${jobData.jobId}.mp4`
      );
      console.log('sending responce.................')
      return res.json({
        success: true,
        data: {
          signedUrl,
          prompt,
          genRes: response.text,
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Job failed or incomplete',
      });
    }

  } catch (error) {
    console.error('handlePrompt error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

// --- Follow-up Prompt Handler ---
export const handleFollowUpPrompt = async (req: Request, res: Response) => {
  try {
    const { followUprompt, previousGenRes, height, width, fps, frameCount } = req.body;

    if (!followUprompt || !previousGenRes || !height || !width || !fps || !frameCount) {
      return res.status(400).json({
        success: false,
        message: 'All parameters are required',
      });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: modifySketchSystemPrompt + followUprompt + previousGenRes as string,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const jobData: JobData = {
      jobId: uuidv4(),
      status: JobStatus.PENDING,
      response: response.text,
      height,
      width,
      fps,
      frameCount,
    };

    await redisPublisher.lPush('tasks', JSON.stringify(jobData));

    const result = await waitForJobCompletion(jobData.jobId);

    if (result.status === JobStatus.COMPLETED) {
      const signedUrl = await getS3SignedUrl(
        process.env.AWS_BUCKET as string,
        `${jobData.jobId}.mp4`
      );
      return res.json({
        success: true,
        data: {
          signedUrl,
          followUprompt,
          genRes: response.text,
        }
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Job failed or incomplete',
      });
    }

  } catch (error) {
    console.error('handleFollowUpPrompt error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};
