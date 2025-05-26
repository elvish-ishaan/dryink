import { createClient } from 'redis';

export const redisPublisher = createClient({
    url:  "rediss://default:AUHMAAIjcDE4YTJkZmI4ZDNmODk0MGViOGQ4MDQ2ZjRmYWQ0NTYwZnAxMA@composed-cobra-16844.upstash.io:6379"
});

async function connectRedis() {
    redisPublisher.on('error', err => console.log('Redis Client Error', err));
    await redisPublisher.connect();
}

connectRedis();