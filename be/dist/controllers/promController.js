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
exports.handleFollowUpPrompt = exports.handlePrompt = void 0;
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
// --- Redis Wait Helper ---
const waitForJobCompletion = (jobId) => {
    return new Promise((resolve, reject) => {
        const channel = `job:done:${jobId}`;
        const handleMessage = (message) => {
            try {
                const result = JSON.parse(message);
                redisConfig_1.redisPublisher.unsubscribe(channel);
                resolve(result);
            }
            catch (err) {
                reject(err);
            }
        };
        redisConfig_1.redisPublisher.subscribe(channel, handleMessage);
    });
};
// --- Main Prompt Handler ---
const handlePrompt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { prompt, height, width, fps, frameCount } = req.body;
        if (!prompt || !height || !width || !fps || !frameCount) {
            return res.status(400).json({
                success: false,
                message: 'All parameters are required',
            });
        }
        //call prompt ehancer model for propmpt optimization
        // const promptOptModel = new GoogleGenAI({ apiKey: process.env.LLM_API_KEY });
        // const promptEnhancerResponse = await promptOptModel.models.generateContent({
        //   model: process.env.LLM_MODEL_SEC as string,
        //   contents: prompt as string,
        //   config: {
        //     systemInstruction: userPromptEnhancerSystemPrompt,
        //   },
        // });
        // const optimisedPromptRes = promptEnhancerResponse.text;
        // console.log('promptEnhancerResponse', optimisedPromptRes)
        console.log('generating main responce from code gen model............');
        const startTime = Date.now();
        const ai = new genai_1.GoogleGenAI({ apiKey: process.env.LLM_API_KEY });
        const response = yield ai.models.generateContent({
            model: process.env.LLM_MODEL,
            contents: prompt,
            config: {
                temperature: 0.3,
                systemInstruction: prompts_1.newSystemPrompt,
            },
        });
        const endTime = Date.now();
        console.log('time taken:', endTime - startTime);
        console.log('response generated........');
        const jobData = {
            jobId: (0, uuid_1.v4)(),
            status: JobStatus.PENDING,
            response: response.text,
            height,
            width,
            fps,
            frameCount,
        };
        console.log('pushing job to queue...........');
        // Push job to queue
        yield redisConfig_1.redisPublisher.lPush('tasks', JSON.stringify(jobData));
        console.log('waiting to finish........');
        // Wait for job to complete via Redis pub/sub
        const result = yield waitForJobCompletion(jobData.jobId);
        console.log('getting result........');
        if (result.status === JobStatus.COMPLETED) {
            const signedUrl = yield (0, utils_1.getS3SignedUrl)(process.env.AWS_BUCKET, `${jobData.jobId}.mp4`);
            console.log('sending responce.................');
            return res.json({
                success: true,
                data: {
                    signedUrl,
                    prompt,
                    genRes: response.text,
                }
            });
        }
        else {
            return res.status(500).json({
                success: false,
                message: 'Job failed or incomplete',
            });
        }
    }
    catch (error) {
        console.error('handlePrompt error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.handlePrompt = handlePrompt;
// --- Follow-up Prompt Handler ---
const handleFollowUpPrompt = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { followUprompt, previousGenRes, height, width, fps, frameCount } = req.body;
        if (!followUprompt || !previousGenRes || !height || !width || !fps || !frameCount) {
            return res.status(400).json({
                success: false,
                message: 'All parameters are required',
            });
        }
        const ai = new genai_1.GoogleGenAI({ apiKey: process.env.LLM_API_KEY });
        const response = yield ai.models.generateContent({
            model: process.env.LLM_MODEL,
            contents: prompts_1.modifySketchSystemPrompt + followUprompt + previousGenRes,
            config: {
                systemInstruction: prompts_1.newSystemPrompt,
            },
        });
        const jobData = {
            jobId: (0, uuid_1.v4)(),
            status: JobStatus.PENDING,
            response: response.text,
            height,
            width,
            fps,
            frameCount,
        };
        yield redisConfig_1.redisPublisher.lPush('tasks', JSON.stringify(jobData));
        const result = yield waitForJobCompletion(jobData.jobId);
        if (result.status === JobStatus.COMPLETED) {
            const signedUrl = yield (0, utils_1.getS3SignedUrl)(process.env.AWS_BUCKET, `${jobData.jobId}.mp4`);
            return res.json({
                success: true,
                data: {
                    signedUrl,
                    followUprompt,
                    genRes: response.text,
                }
            });
        }
        else {
            return res.status(500).json({
                success: false,
                message: 'Job failed or incomplete',
            });
        }
    }
    catch (error) {
        console.error('handleFollowUpPrompt error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error',
        });
    }
});
exports.handleFollowUpPrompt = handleFollowUpPrompt;
