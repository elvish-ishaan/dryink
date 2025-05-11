import { createClient } from 'redis';

export const redisPublisher = createClient({
    username: 'default',
    password: 'FexKS6v9RAmJMTsucwzpQAx808fRwoCG',
    socket: {
        host: 'redis-15484.c305.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 15484
    }
});

async function connectRedis() {
    redisPublisher.on('error', err => console.log('Redis Client Error', err));
    await redisPublisher.connect();
}

connectRedis();