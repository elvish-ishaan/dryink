import { createClient} from 'redis'

const REDIS_URL = "rediss://default:AXv3AAIjcDE1Y2RhYzU0NGMxMTc0ZTMzYjRlNjZlMGFkYmZhZWM0MnAxMA@settling-mammal-31735.upstash.io:6379"
export const redisSubscriber = createClient({   
    url: REDIS_URL,
});

async function connectRedis() {
    redisSubscriber.on('error', err => console.log('Redis Client Error', err));
    await redisSubscriber.connect();
    console.log('Redis worker Client Connected');
}

connectRedis();