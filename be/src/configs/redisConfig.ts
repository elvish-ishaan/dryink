import Redis from 'ioredis';
import { createClient } from 'redis';

const REDIS_URL = "rediss://default:AcgVAAIjcDE0YmI3MTE0YmEyNTk0NGE4YWFmODIxMDExMDczMjJlY3AxMA@amazing-piranha-51221.upstash.io:6379";
export const redisPublisher = createClient({
    url:  REDIS_URL,
});

// export const redisPublisher = new Redis(REDIS_URL);

async function connectRedis() {
    redisPublisher.on('error', err => console.log('Redis Client Error', err));
    await redisPublisher.connect();
    console.log('Redis Client Connected');
}

connectRedis();