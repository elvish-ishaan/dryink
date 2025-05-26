import { createClient } from 'redis';

export const redisSubscriber = createClient({
    url: process.env.REDIS_URL as string,
});

async function connectRedis() {
    redisSubscriber.on('error', err => console.log('Redis Client Error', err));
    await redisSubscriber.connect();
}

connectRedis();