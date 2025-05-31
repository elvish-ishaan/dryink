import { Request, Response } from "express";
import { GoogleGenAI } from "@google/genai";
import { modifySketchSystemPrompt, newSystemPrompt, systemPrompt, userPromptEnhancerSystemPrompt } from "../lib/prompts";
import { redisPublisher } from "../configs/redisConfig";
import { v4 as uuidv4 } from 'uuid';
import { getS3SignedUrl } from "../lib/utils";
import OpenAI from "openai";
import { prisma } from "../client/prismaClient";

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
       res.status(400).json({
        success: false,
        message: 'All parameters are required',
      });
      return
    }

    console.log('generating main responce from code gen model............')
    const startTime = Date.now();
    const ai = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.LLM_MODEL as string,
      contents: prompt as string,
      config: {
        temperature: 0.3,
        systemInstruction: newSystemPrompt,
      },
    });
    const endTime = Date.now();
    console.log('time taken:', endTime - startTime)
    console.log('response generated........')


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
        `${jobData.jobId}.mp4`,
      );

      try {
        //first find the user
     const user = await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },
        include:{
          chatSessions: {
            include: {
              chats: true
            }
          }
        }
      });
      console.log('init user', user)

      //create a new chat session
      const chatSession = await prisma.chatSession.create({
        data: {
          userId: req.user.id,
        },
      });
      console.log('created chat session', chatSession)

      //create a new chat
      const chat = await prisma.chat.create({
        data: {
          chatSessionId: chatSession.id,
          prompt,
          responce: response.text as string,
          genUrl: signedUrl,
        },
      });
      console.log('created chat', chat)
 
      console.log('sending responce.................')
      res.json({
        success: true,
        data: {
          chatSessionId: chatSession.id,
          signedUrl,
          prompt,
          genRes: response.text,
        }
      });
      return
      } catch (error) {
        console.log(error,'getting error in database operation in handlePrompt')
      }
    } else {
      res.status(500).json({
        success: false,
        message: 'Job failed or incomplete',
      });
      return
    }

  } catch (error) {
    console.error('handlePrompt error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
    return
  }
};

// --- Follow-up Prompt Handler ---
export const handleFollowUpPrompt = async (req: Request, res: Response) => {
  console.log(req.body,'this is req body is follow up controller')
  try {
    const { followUprompt, previousGenRes, height, width, fps, frameCount, chatSessionId } = req.body;

    if (!followUprompt || !previousGenRes || !height || !width || !fps || !frameCount) {
      res.status(400).json({
        success: false,
        message: 'All parameters are required',
      });
      return
    }

    const ai = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY });
    const response = await ai.models.generateContent({
      model: process.env.LLM_MODEL as string,
      contents: modifySketchSystemPrompt + followUprompt + previousGenRes as string,
      config: {
        systemInstruction: newSystemPrompt, 
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

      // Create follow-up chat
      const chat = await prisma.chat.create({
        data: {
          chatSessionId: chatSessionId,
          prompt: followUprompt,
          responce: response.text as string,
          genUrl: signedUrl,
        },
      });

      //show updated user with updated chat
      const updatedUser = await prisma.user.findFirst({
        where: {  id: req.user.id },
        include: {
          chatSessions: {
            include: {
              chats: true
            }
          }
        },
      })
      console.log(updatedUser,'this is updated user chats with follow up')

      //return response
      res.json({
        success: true,
        data: {
          signedUrl,
          followUprompt,
          genRes: response.text,
        }
      });
      return
    } else {
      res.status(500).json({
        success: false,
        message: 'Job failed or incomplete',
      });
      return
    }

  } catch (error) {
    console.error('handleFollowUpPrompt error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
    return
  }
};
