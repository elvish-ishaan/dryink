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
  PROCESSING = "processing",
  FAILED = "failed",
  COMPLETED = "completed",
}

const worker = new Worker('video-export', async (job) => {
  const jobData = job.data;
  logger.info({ jobId: jobData.jobId }, 'Processing export job');

  await prisma.job.update({
    where: { id: jobData.jobId },
    data: { status: JobStatus.PROCESSING },
  });

  let lastReportedProgress = 0;

  const onProgress = (rendered: number, total: number) => {
    const progress = Math.round((rendered / total) * 100);
    if (progress - lastReportedProgress >= 5) {
      lastReportedProgress = progress;
      prisma.job.update({
        where: { id: jobData.jobId },
        data: { progress },
      }).catch((err: Error) => logger.error(err, 'Progress update failed'));
    }
  };

  try {
    const videoPath = await generateVideo(
      {
        htmlContent: jobData.code,
        fps: jobData.fps || 24,
        videoName: 'output.mp4',
      },
      onProgress
    );

    const uploadedObjUrl = await uploadToGcp(videoPath, `${jobData.jobId}.mp4`);

    if (!uploadedObjUrl) {
      throw new Error('Upload to GCP returned null/undefined URL');
    }

    const folderToDlt = path.dirname(videoPath);
    logger.info({ folderToDlt }, 'Deleting temp folder');
    await fs.remove(folderToDlt);

    await prisma.job.update({
      where: { id: jobData.jobId },
      data: { status: JobStatus.COMPLETED, genUrl: uploadedObjUrl, progress: 100 },
    });

    await prisma.chat.update({
      where: { id: jobData.chatId },
      data: { genUrl: uploadedObjUrl },
    });

    logger.info({ jobId: jobData.jobId }, 'Export job completed');
  } catch (error) {
    logger.error(error, `Job ${jobData.jobId} failed`);

    await prisma.job.update({
      where: { id: jobData.jobId },
      data: { status: JobStatus.FAILED },
    });

    throw error;
  }
}, { connection });

worker.on('failed', (job, err: Error) => {
  logger.error(err, `BullMQ job ${job?.id} failed`);
});

logger.info('Worker started. Waiting for export tasks...');

app.listen(PORT, () => {
  logger.info(`Server running at ${PORT}`);
});
