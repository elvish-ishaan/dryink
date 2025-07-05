import { createClient} from 'redis'

const REDIS_URL = "rediss://default:AcgVAAIjcDE0YmI3MTE0YmEyNTk0NGE4YWFmODIxMDExMDczMjJlY3AxMA@amazing-piranha-51221.upstash.io:6379";
export const redisSubscriber = createClient({   
    url: REDIS_URL,
});

async function connectRedis() {
    redisSubscriber.on('error', err => console.log('Redis Client Error', err));
    await redisSubscriber.connect();
    console.log('Redis worker Client Connected');
}

connectRedis();