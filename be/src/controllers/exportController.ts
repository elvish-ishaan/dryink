import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../client/prismaClient";
import { videoExportQueue } from "../configs/queueConfig";
import { logger } from "../lib/logger";

enum JobStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
}

export const handleExportRequest = async (req: Request, res: Response) => {
  try {
    const { chatId, fps } = req.body;

    if (!chatId) {
      res.status(400).json({ success: false, message: 'chatId is required' });
      return;
    }

    const chat = await prisma.chat.findFirst({
      where: { id: chatId },
      include: { chatSession: true },
    });

    if (!chat) {
      res.status(404).json({ success: false, message: 'Chat not found' });
      return;
    }

    if (chat.chatSession.userId !== req.user?.id) {
      res.status(403).json({ success: false, message: 'Forbidden' });
      return;
    }

    // Return existing completed job immediately
    const completedJob = await prisma.job.findFirst({
      where: { chatId, status: JobStatus.COMPLETED },
    });
    if (completedJob?.genUrl) {
      res.json({ success: true, data: { genUrl: completedJob.genUrl } });
      return;
    }

    // Return existing active job so client can attach to SSE
    const activeJob = await prisma.job.findFirst({
      where: { chatId, status: { in: [JobStatus.PENDING, JobStatus.PROCESSING] } },
    });
    if (activeJob) {
      res.json({ success: true, data: { jobId: activeJob.id } });
      return;
    }

    // Create new export job
    const job = await prisma.job.create({
      data: {
        userId: req.user?.id,
        status: JobStatus.PENDING,
        progress: 0,
        chatId,
      },
    });

    await videoExportQueue.add('video-export', {
      jobId: job.id,
      chatId,
      code: chat.responce,
      fps: fps || 24,
    });

    logger.info({ jobId: job.id, chatId }, 'Export job queued');
    res.json({ success: true, data: { jobId: job.id } });
  } catch (error) {
    logger.error(error, 'handleExportRequest error');
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const handleExportProgress = async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const token = req.query.token as string;

  if (!token) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }

  try {
    jwt.verify(token, process.env.JWT_SECRET!);
  } catch {
    res.status(401).json({ success: false, message: 'Invalid token' });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const poll = async () => {
    try {
      const job = await prisma.job.findFirst({ where: { id: jobId } });

      if (!job) {
        send({ type: 'error', message: 'Job not found' });
        res.end();
        clearInterval(interval);
        return;
      }

      send({ type: 'progress', progress: job.progress, status: job.status, genUrl: job.genUrl });

      if (job.status === JobStatus.COMPLETED || job.status === JobStatus.FAILED) {
        res.end();
        clearInterval(interval);
      }
    } catch (error) {
      logger.error(error, 'SSE poll error');
      send({ type: 'error', message: 'Internal error' });
      res.end();
      clearInterval(interval);
    }
  };

  const interval = setInterval(poll, 1500);

  req.on('close', () => {
    clearInterval(interval);
  });

  poll();
};
