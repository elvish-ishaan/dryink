import { Request, Response } from "express";
import { modifySketchSystemPrompt, newSystemPrompt, systemPrompt, userPromptEnhancerSystemPrompt } from "../lib/prompts";
import { redisPublisher } from "../configs/redisConfig";
import { v4 as uuidv4 } from 'uuid';
import { getS3SignedUrl } from "../lib/utils";
import prisma from "../client/prismaClient";
import { generateText } from 'ai';
import { openai } from "@ai-sdk/openai";



enum JobStatus {
    PENDING = "pending",
    COMPLETED = "completed",
    FAILED = "failed",
}

interface JobData {
  jobId: string,
  chatId: string,
  status: JobStatus,
  response?: string | null,
  height?: number,
  width?: number,
  fps?: number, 
  frameCount?: number,
}

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

    console.log('generating main response from code gen model............')
    const startTime = Date.now();
    const response = await generateText({
      model: openai(process.env.LLM_MODEL!),
      prompt: prompt,
      system: newSystemPrompt,
      temperature: 0.3
    })
    const endTime = Date.now();
    console.log('time taken:', endTime - startTime)
    console.log('response generated........')

    //init a job for user
    const job = await prisma.job.create({
      data: {
        userId: req.user?.id,
        status: JobStatus.PENDING,
      }
    })

    if(!job){
      res.status(500).json({
        success: false,
        message: 'Unable to create job'
      })
      return
    }

    //update the other meta data to db
    let chatSession;
    let chat;
    try {
      //first find the user
      const user = await prisma.user.findUnique({
        where: {
          email: req.user?.email,
        },
        include:{
          chatSessions: {
            include: {
              chats: true
            }
          }
        }
      });
      if(!user){
        res.status(401).json({
          success: false,
          message: 'User not found',
        });
        return
      }

      //create a new chat session
      chatSession = await prisma.chatSession.create({
        data: {
          userId: user?.id,
        },
      });

      //create a new chat
      chat = await prisma.chat.create({
        data: {
          chatSessionId: chatSession.id,
          prompt,
          responce: response.text as string,
        },
      });
    
    } catch (error) {
      console.log(error,'getting error in database operation in handlePrompt')
    }

    if(!chatSession){
      res.status(500).json({
        success: false,
        message: 'Unable to create chat session'
      })
      return
    }

    if(!chat){
      res.status(500).json({
        success: false,
        message: 'Unable to create chat'
      })
      return
    }
    
    //return jobid to user immediately
    res.json({
      success: true,
      data: {
        chatSessionId: chatSession?.id,
        jobId: job?.id,
        prompt: prompt,
        genRes: response.text,
      },
    });

    //create a job for redis
    const jobData: JobData = {
      jobId: job.id,
      chatId: chat?.id,
      status: JobStatus.PENDING,
      response: response.text,
      height,
      width,
      fps,
      frameCount,
    };

    //now publish the job to redis
    console.log('job published...........');
    // Push job to queue
    await redisPublisher.publish('tasks', JSON.stringify(jobData));

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
  try {
    const { followUprompt, previousGenRes, height, width, fps, frameCount, chatSessionId } = req.body;

    if (!followUprompt || !previousGenRes || !height || !width || !fps || !frameCount || !chatSessionId) {
      res.status(400).json({
        success: false,
        message: 'All parameters are required',
      });
      return
    }

    // const response = await ai.models.generateContent({
    //   model: process.env.LLM_MODEL as string,
    //   contents: modifySketchSystemPrompt + followUprompt + previousGenRes as string,
    //   config: {
    //     systemInstruction: newSystemPrompt, 
    //   },
    // });
    const response = await generateText({
      model: openai(process.env.LLM_MODEL!),
      prompt: modifySketchSystemPrompt + followUprompt + previousGenRes,
      system: newSystemPrompt
    })

    //init a job for user
    const job = await prisma.job.create({
      data: {
        userId: req.user?.id,
        status: JobStatus.PENDING,
      }
    })

    if(!job){
      res.status(500).json({
        success: false,
        message: 'Unable to create job'
      })
      return
    }

    // Create follow-up chat
    const chat = await prisma.chat.create({
      data: {
        chatSessionId: chatSessionId,
        prompt: followUprompt,
        responce: response.text as string,
      },
    });

    if(!chat){
      res.status(500).json({
        success: false,
        message: 'Unable to create chat'
      })
      return
    }

    // //return jobid to user immediately
    res.json({
      success: true,
      data: {
        chatSessionId: chatSessionId,
        jobId: job?.id,
        prompt: followUprompt,
        genRes: response.text,
      },
    });

    //init job
    const jobData: JobData = {
      jobId: job.id,
      chatId: chat?.id,
      status: JobStatus.PENDING,
      response: response.text,
      height,
      width,
      fps,
      frameCount,
    };

    //now publish the job to redis
    console.log('follow up job published...........');
    await redisPublisher.publish('tasks', JSON.stringify(jobData));

  } catch (error) {
    console.error('handleFollowUpPrompt error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
    return
  }
};

// --- Get Job Status ---
export const handleJobStatus = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;

    if (!jobId) {
      res.status(400).json({
        success: false,
        message: 'Missing jobId',
      });
      return;
    }

    const job = await prisma.job.findFirst({
      where: {
        id: jobId,
      },
      
    });

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found',
      });
      return;
    }

    if(job.status === 'pending'){ 
      res.json({
        success: false,
        message: 'job pending',
        data: {
          status: job.status
        }
      });
      return;
    }

    //send res with job status and genUrl
    res.json({
      success: true,
      data: {
        status: job.status,
        genUrl: job.genUrl,
      }
    });
    return
  } catch (error) {
    console.error('handleJobStatus error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
    return;
  }
};