"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisPublisher = void 0;
const redis_1 = require("redis");
exports.redisPublisher = (0, redis_1.createClient)({
    username: 'default',
    password: 'FexKS6v9RAmJMTsucwzpQAx808fRwoCG',
    socket: {
        host: 'redis-15484.c305.ap-south-1-1.ec2.redns.redis-cloud.com',
        port: 15484
    }
});
function connectRedis() {
    return __awaiter(this, void 0, void 0, function* () {
        exports.redisPublisher.on('error', err => console.log('Redis Client Error', err));
        yield exports.redisPublisher.connect();
    });
}
connectRedis();
