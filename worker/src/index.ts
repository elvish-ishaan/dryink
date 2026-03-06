import express from "express";
import { Worker } from 'bullmq';
import { connection } from "./configs/redis";
import { generateVideo } from "./core/operation";
import { uploadToGcp } from "./configs/gcpStorage";
import fs from 'fs-extra';
import path from "path";
import prisma from "./configs/prismaclient";
import { logger } from "./lib/logger";

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5001;

app.get("/", (req, res) => {
  res.send("Hello World!");
});

enum JobStatus {
  PENDING = "pending",
  FAILED = "failed",
  COMPLETED = "completed",
}

const worker = new Worker('tasks', async (job) => {
  const jobData = job.data;
  logger.info({ jobId: jobData.jobId }, 'Processing job');

  try {
    const videoPath = await generateVideo({
      htmlContent: jobData.response,
      fps: jobData.fps || 24,
      videoName: 'output.mp4',
    });

    const uploadedObjUrl = await uploadToGcp(videoPath, `${jobData.jobId}.mp4`);

    if (!uploadedObjUrl) {
      throw new Error('Upload to GCP returned null/undefined URL');
    }

    const folderToDlt = path.dirname(videoPath);
    logger.info({ folderToDlt }, 'Deleting temp folder');
    await fs.remove(folderToDlt);

    await prisma.job.update({
      where: { id: jobData.jobId },
      data: { status: JobStatus.COMPLETED, genUrl: uploadedObjUrl },
    });

    await prisma.chat.update({
      where: { id: jobData.chatId },
      data: { responce: jobData.response, genUrl: uploadedObjUrl },
    });

    logger.info({ jobId: jobData.jobId }, 'Job completed');
  } catch (error) {
    logger.error(error, `Job ${jobData.jobId} failed`);

    await prisma.job.update({
      where: { id: jobData.jobId },
      data: { status: JobStatus.FAILED },
    });

    throw error;
  }
}, { connection });

worker.on('failed', (job, err) => {
  logger.error(err, `BullMQ job ${job?.id} failed`);
});

logger.info('Worker started. Waiting for tasks...');

app.listen(PORT, () => {
  logger.info(`Server running at ${PORT}`);
});
