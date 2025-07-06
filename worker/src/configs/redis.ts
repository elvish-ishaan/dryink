import { createClient} from 'redis'

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
export const redisSubscriber = createClient({   
    url: REDIS_URL,
});

async function connectRedis() {
    redisSubscriber.on('error', err => console.log('Redis Client Error', err));
    await redisSubscriber.connect();
    console.log('Redis worker Client Connected');
}

connectRedis();