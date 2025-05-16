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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const redis_1 = require("./configs/redis");
const operation_1 = require("./core/operation");
const s3Config_1 = require("./configs/s3Config");
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.get("/", (req, res) => {
    res.send("Hello World!");
});
const taskQueueKey = 'tasks';
const completionChannel = 'task_completion';
var JobStatus;
(function (JobStatus) {
    JobStatus["PENDING"] = "pending";
    JobStatus["COMPLETED"] = "completed";
})(JobStatus || (JobStatus = {}));
function startWorker() {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            try {
                // Use brpop to block until a task is available
                const result = yield redis_1.redisSubscriber.brPop(taskQueueKey, 0);
                if (result) {
                    const jobData = JSON.parse(result.element);
                    //generating video
                    const videoPath = yield (0, operation_1.generateVideo)({
                        htmlContent: jobData.response,
                        width: jobData.width || 800,
                        height: jobData.height || 720,
                        fps: jobData.fps || 30, // Frames per second
                        frameCount: jobData.frameCount || 100, // Number of frames to render FIX IT LATER  
                        videoName: 'output.mp4',
                    });
                    //upload the video to s3
                    const uploadedObjUrl = yield (0, s3Config_1.uploadToS3)(videoPath, `${jobData.jobId}.mp4`);
                    //delete the whole directory form local storage
                    yield new Promise((resolve, reject) => {
                        fs_1.default.unlink(videoPath, (err) => {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve("file deleted successfully");
                            }
                        });
                    });
                    //return the job to  redis channel
                    const completionInfo = {
                        taskId: jobData.jobId,
                        status: JobStatus.COMPLETED,
                        outputFileLink: uploadedObjUrl,
                    };
                    console.log('adding completion to reids channel');
                    // Publish result
                    yield redis_1.redisSubscriber.publish(`job:done:${completionInfo.taskId}`, JSON.stringify(completionInfo));
                }
            }
            catch (error) {
                console.error('Error processing task:', error);
            }
        }
    });
}
console.log('Worker started. Waiting for tasks...');
startWorker().catch(console.error);
app.listen(5001, () => {
    console.log(`Server is running on port 5001`);
});
