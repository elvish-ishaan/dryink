import { createClient } from 'redis';

const REDIS_URL = "rediss://default:AUHMAAIjcDE4YTJkZmI4ZDNmODk0MGViOGQ4MDQ2ZjRmYWQ0NTYwZnAxMA@composed-cobra-16844.upstash.io:6379"
export const redisSubscriber = createClient({
    url:  REDIS_URL,
});

async function connectRedis() {
    redisSubscriber.on('error', err => console.log('Redis Client Error', err));
    await redisSubscriber.connect();
    console.log('Redis worker Client Connected');
}

connectRedis();