import Redis from 'ioredis';
import { createClient } from 'redis';

//for dev use local host
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
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