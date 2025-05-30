import { createClient } from 'redis';

export const redisPublisher = createClient({
    url:  process.env.REDIS_URL as string,
});

async function connectRedis() {
    console.log( !process.env.REDIS_URL,'redis url')
    redisPublisher.on('error', err => console.log('Redis Client Error', err));
    await redisPublisher.connect();
    console.log('Redis Client Connected');
}

//connectRedis();