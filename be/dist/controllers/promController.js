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
exports.handlePrompt = void 0;
const genai_1 = require("@google/genai");
const prompts_1 = require("../lib/prompts");
const redisConfig_1 = require("../configs/redisConfig");
const uuid_1 = require("uuid");
const utils_1 = require("../lib/utils");
var JobStatus;
(function (JobStatus) {
    JobStatus["PENDING"] = "pending";
    JobStatus["COMPLETED"] = "completed";
})(JobStatus || (JobStatus = {}));
const handlePrompt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        //get the prompt from the request body
        const { prompt, height, width, fps, frameCount } = req.body;
        if (!prompt || !height || !width || !fps || !frameCount) {
            return res.json({
                sucess: false,
                message: 'all parameters are required'
            });
        }
        //sanitize the prompt
        //call llm(gemini) to generate the response
        const ai = new genai_1.GoogleGenAI({ apiKey: process.env.LLM_API_KEY });
        const response = yield ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                systemInstruction: prompts_1.systemPrompt,
            },
        });
        console.log(response.text);
        //pushing to redis channel
        const jobData = {
            jobId: (0, uuid_1.v4)(),
            status: JobStatus.PENDING,
            response: response.text,
            height: height,
            width: width,
            fps: fps,
            frameCount: frameCount,
        };
        try {
            const taskQueueKey = 'tasks';
            yield redisConfig_1.redisPublisher.lPush(taskQueueKey, JSON.stringify(jobData));
            // Subscribe to job completion channel
            let result;
            const channel = `job:done:${jobData.jobId}`;
            yield redisConfig_1.redisPublisher.subscribe(channel, (message) => {
                result = JSON.parse(message);
                console.log(` Job ${jobData.jobId} completed:`, result);
                // Optionally unsubscribe after receiving the message
                redisConfig_1.redisPublisher.unsubscribe(channel);
            });
        }
        catch (error) {
            console.log(error, 'error in publishing to redis');
        }
        //returnig pre-signed url of the video
        const signedUrl = yield (0, utils_1.getS3SignedUrl)(process.env.AWS_BUCKET, `${jobData.jobId}.mp4`);
        //returning the response
        return res.json({
            sucess: true,
            data: signedUrl
        });
    }
    catch (error) {
        return res.status(500).json({
            sucess: false,
            message: 'internal server error'
        });
    }
});
exports.handlePrompt = handlePrompt;
