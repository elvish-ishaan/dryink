import { createClient } from 'redis';

const REDIS_URL = "rediss://default:AUHMAAIjcDE4YTJkZmI4ZDNmODk0MGViOGQ4MDQ2ZjRmYWQ0NTYwZnAxMA@composed-cobra-16844.upstash.io:6379"
export const redisPublisher = createClient({
    url:  REDIS_URL,
});

async function connectRedis() {
    console.log( !process.env.REDIS_URL,'redis url')
    redisPublisher.on('error', err => console.log('Redis Client Error', err));
    await redisPublisher.connect();
    console.log('Redis Client Connected');
}

connectRedis();