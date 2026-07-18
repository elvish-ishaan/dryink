const redisUrl = new URL(process.env.REDIS_URL || 'redis://localhost:6379');

export const connection = {
  host: redisUrl.hostname,
  port: parseInt(redisUrl.port || '6379'),
  maxRetriesPerRequest: null as null,
};
