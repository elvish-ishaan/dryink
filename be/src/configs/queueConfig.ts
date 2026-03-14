import { Queue } from 'bullmq';
import { logger } from '../lib/logger';

const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');

export const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || '6379'),
  maxRetriesPerRequest: null as null,
};

export const taskQueue = new Queue('tasks', { connection });
export const videoExportQueue = new Queue('video-export', { connection });

logger.info({ host: connection.host, port: connection.port }, 'BullMQ queue initialized');
