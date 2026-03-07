import { Request, Response } from "express";
import { modifySketchSystemPrompt, newSystemPrompt } from "../lib/prompts";
import { taskQueue } from "../configs/queueConfig";
import { v4 as uuidv4 } from 'uuid';
import { getGcpSignedUrl } from "../lib/utils";
import prisma from "../client/prismaClient";
import OpenAI from "openai";
import { logger } from "../lib/logger";

let _openrouter: OpenAI | null = null;
function getOpenRouter(): OpenAI {
  if (!_openrouter) {
    _openrouter = new OpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey: process.env.OPENROUTER_API_KEY!,
    });
  }
  return _openrouter;
}

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
  fps?: number,
}

function parseStructuredResponse(raw: string, defaultMessage = 'Animation generated!'): { code: string; message: string } {
  const messageMatch = raw.match(/<MESSAGE>([\s\S]*?)<\/MESSAGE>/);
  const codeMatch = raw.match(/<CODE>([\s\S]*?)<\/CODE>/);
  return {
    message: messageMatch?.[1]?.trim() || defaultMessage,
    code: codeMatch?.[1]?.trim() ?? '',
  };
}

function validateLlmResponse(text: string): boolean {
  return text.includes('setFrame') && text.includes('getTotalFrames');
}

// --- Main Prompt Handler ---
export const handlePrompt = async (req: Request, res: Response) => {
  try {
    const { prompt, fps, model } = req.body;

    const resolvedModel = (model && model.trim()) || process.env.LLM_MODEL;
    if (!prompt || !fps || !resolvedModel) {
      res.status(400).json({
        success: false,
        message: !resolvedModel ? 'No model selected and LLM_MODEL env var is not set' : 'All parameters are required',
      });
      return;
    }

    // Credit check
    const userCredits = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { credits: true },
    });
    if (!userCredits || userCredits.credits <= 0) {
      res.status(402).json({
        success: false,
        message: 'Insufficient credits. Please purchase more to continue.',
        code: 'INSUFFICIENT_CREDITS',
      });
      return;
    }

    logger.info('Generating main response from code gen model');
    const startTime = Date.now();
    const completion = await getOpenRouter().chat.completions.create({
      model: resolvedModel,
      messages: [
        { role: 'system', content: newSystemPrompt },
        { role: 'user', content: prompt },
      ],
    });
    logger.info({ ms: Date.now() - startTime }, 'Response generated');

    const rawResponse = completion.choices[0].message.content ?? '';
    const { code: responseText, message: llmMessage } = parseStructuredResponse(rawResponse);

    if (!validateLlmResponse(responseText)) {
      logger.warn('LLM response failed validation');
      res.status(422).json({
        success: false,
        message: 'LLM did not return valid animation code',
      });
      return;
    }

    // Init a job and deduct credit atomically
    const [job] = await prisma.$transaction([
      prisma.job.create({
        data: { userId: req.user?.id, status: JobStatus.PENDING },
      }),
      prisma.user.update({
        where: { id: req.user?.id },
        data: { credits: { decrement: 1 } },
      }),
    ]);

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
          responce: responseText,
          message: llmMessage,
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
        genRes: responseText,
        message: llmMessage,
      },
    });

    const jobData: JobData = {
      jobId: job.id,
      chatId: chat?.id,
      status: JobStatus.PENDING,
      response: responseText,
      fps,
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
    const { followUprompt, previousGenRes, fps, chatSessionId, model } = req.body;

    const resolvedModel = (model && model.trim()) || process.env.LLM_MODEL;
    if (!followUprompt || !previousGenRes || !fps || !chatSessionId || !resolvedModel) {
      res.status(400).json({
        success: false,
        message: !resolvedModel ? 'No model selected and LLM_MODEL env var is not set' : 'All parameters are required',
      });
      return;
    }

    // Credit check
    const userCredits = await prisma.user.findUnique({
      where: { id: req.user?.id },
      select: { credits: true },
    });
    if (!userCredits || userCredits.credits <= 0) {
      res.status(402).json({
        success: false,
        message: 'Insufficient credits. Please purchase more to continue.',
        code: 'INSUFFICIENT_CREDITS',
      });
      return;
    }

    const followUpCompletion = await getOpenRouter().chat.completions.create({
      model: resolvedModel,
      messages: [
        { role: 'system', content: modifySketchSystemPrompt },
        { role: 'user', content: `Instruction: ${followUprompt}\n\nExisting code to modify:\n${previousGenRes}` },
      ],
    });

    const rawFollowUpResponse = followUpCompletion.choices[0].message.content ?? '';
    const { code: followUpResponseText, message: followUpMessage } = parseStructuredResponse(rawFollowUpResponse, 'Animation updated!');

    if (!validateLlmResponse(followUpResponseText)) {
      logger.warn('LLM follow-up response failed validation');
      res.status(422).json({
        success: false,
        message: 'LLM did not return valid animation code',
      });
      return;
    }

    const [job] = await prisma.$transaction([
      prisma.job.create({
        data: { userId: req.user?.id, status: JobStatus.PENDING },
      }),
      prisma.user.update({
        where: { id: req.user?.id },
        data: { credits: { decrement: 1 } },
      }),
    ]);

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
        responce: followUpResponseText,
        message: followUpMessage,
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
        genRes: followUpResponseText,
        message: followUpMessage,
      },
    });

    const jobData: JobData = {
      jobId: job.id,
      chatId: chat?.id,
      status: JobStatus.PENDING,
      response: followUpResponseText,
      fps,
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
