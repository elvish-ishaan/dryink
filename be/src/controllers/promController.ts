import { Request, Response } from "express";
import { modifySketchSystemPrompt, newSystemPrompt } from "../lib/prompts";
import { taskQueue } from "../configs/queueConfig";
import { v4 as uuidv4 } from 'uuid';
import { getGcpSignedUrl } from "../lib/utils";
import prisma from "../client/prismaClient";
import { generateText } from 'ai';
import { createOpenAI } from "@ai-sdk/openai";
import { logger } from "../lib/logger";

const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY!,
});

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

function validateLlmResponse(text: string): boolean {
  return text.includes('```html') && text.includes('setFrame');
}

// --- Main Prompt Handler ---
export const handlePrompt = async (req: Request, res: Response) => {
  try {
    const { prompt, height, width, fps, frameCount, model } = req.body;

    if (!prompt || !height || !width || !fps || !frameCount) {
      res.status(400).json({
        success: false,
        message: 'All parameters are required',
      });
      return;
    }

    logger.info('Generating main response from code gen model');
    const startTime = Date.now();
    const response = await generateText({
      model: openrouter(model || process.env.LLM_MODEL!),
      prompt: prompt,
      system: newSystemPrompt,
      temperature: 0.3
    });
    logger.info({ ms: Date.now() - startTime }, 'Response generated');

    if (!validateLlmResponse(response.text)) {
      logger.warn('LLM response failed validation');
      res.status(422).json({
        success: false,
        message: 'LLM did not return valid animation code',
      });
      return;
    }

    // Init a job for user
    const job = await prisma.job.create({
      data: {
        userId: req.user?.id,
        status: JobStatus.PENDING,
      }
    });

    if (!job) {
      res.status(500).json({
        success: false,
        message: 'Unable to create job'
      });
      return;
    }

    let chatSession;
    let chat;
    try {
      const user = await prisma.user.findUnique({
        where: { email: req.user?.email },
        include: { chatSessions: { include: { chats: true } } }
      });

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      chatSession = await prisma.chatSession.create({
        data: { userId: user?.id },
      });

      chat = await prisma.chat.create({
        data: {
          chatSessionId: chatSession.id,
          prompt,
          responce: response.text as string,
        },
      });
    } catch (error) {
      logger.error(error, 'Database error in handlePrompt');
    }

    if (!chatSession) {
      res.status(500).json({
        success: false,
        message: 'Unable to create chat session'
      });
      return;
    }

    if (!chat) {
      res.status(500).json({
        success: false,
        message: 'Unable to create chat'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        chatSessionId: chatSession?.id,
        jobId: job?.id,
        prompt: prompt,
        genRes: response.text,
      },
    });

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

    logger.info({ jobId: job.id }, 'Publishing job to queue');
    await taskQueue.add('video-gen', jobData);

  } catch (error) {
    logger.error(error, 'handlePrompt error');
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
    return;
  }
};

// --- Follow-up Prompt Handler ---
export const handleFollowUpPrompt = async (req: Request, res: Response) => {
  try {
    const { followUprompt, previousGenRes, height, width, fps, frameCount, chatSessionId, model } = req.body;

    if (!followUprompt || !previousGenRes || !height || !width || !fps || !frameCount || !chatSessionId) {
      res.status(400).json({
        success: false,
        message: 'All parameters are required',
      });
      return;
    }

    const response = await generateText({
      model: openrouter(model || process.env.LLM_MODEL!),
      prompt: modifySketchSystemPrompt + followUprompt + previousGenRes,
      system: newSystemPrompt
    });

    if (!validateLlmResponse(response.text)) {
      logger.warn('LLM follow-up response failed validation');
      res.status(422).json({
        success: false,
        message: 'LLM did not return valid animation code',
      });
      return;
    }

    const job = await prisma.job.create({
      data: {
        userId: req.user?.id,
        status: JobStatus.PENDING,
      }
    });

    if (!job) {
      res.status(500).json({
        success: false,
        message: 'Unable to create job'
      });
      return;
    }

    const chat = await prisma.chat.create({
      data: {
        chatSessionId: chatSessionId,
        prompt: followUprompt,
        responce: response.text as string,
      },
    });

    if (!chat) {
      res.status(500).json({
        success: false,
        message: 'Unable to create chat'
      });
      return;
    }

    res.json({
      success: true,
      data: {
        chatSessionId: chatSessionId,
        jobId: job?.id,
        prompt: followUprompt,
        genRes: response.text,
      },
    });

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

    logger.info({ jobId: job.id }, 'Publishing follow-up job to queue');
    await taskQueue.add('video-gen', jobData);

  } catch (error) {
    logger.error(error, 'handleFollowUpPrompt error');
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
    return;
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
      where: { id: jobId },
    });

    if (!job) {
      res.status(404).json({
        success: false,
        message: 'Job not found',
      });
      return;
    }

    if (job.status === 'pending') {
      res.json({
        success: false,
        message: 'job pending',
        data: { status: job.status }
      });
      return;
    }

    res.json({
      success: true,
      data: {
        status: job.status,
        genUrl: job.genUrl,
      }
    });
    return;
  } catch (error) {
    logger.error(error, 'handleJobStatus error');
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
    return;
  }
};
