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
exports.generateVideo = generateVideo;
const puppeteer_1 = __importDefault(require("puppeteer"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
const os_1 = require("os");
const child_process_1 = require("child_process");
function generateVideo(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const { htmlContent, width = 800, height = 600, fps = 30, frameCount = 500, videoName = 'output.mp4', } = opts;
        const jobId = `job-${Date.now()}`;
        const baseDir = path_1.default.join((0, os_1.tmpdir)(), jobId);
        const htmlPath = path_1.default.join(baseDir, 'render.html');
        const framesDir = path_1.default.join(baseDir, 'frames');
        const outputPath = path_1.default.join(baseDir, videoName);
        try {
            yield fs_extra_1.default.ensureDir(baseDir);
            yield fs_extra_1.default.ensureDir(framesDir);
            const rawHtml = htmlContent.replace(/^```html\s*/, '').replace(/```$/, '');
            yield fs_extra_1.default.outputFile(htmlPath, rawHtml);
            const browser = yield puppeteer_1.default.launch({ headless: true });
            const page = yield browser.newPage();
            yield page.setViewport({ width, height });
            yield page.goto(`file://${htmlPath}`);
            console.log('Starting frame capture...');
            for (let i = 0; i < frameCount; i++) {
                const filename = path_1.default.join(framesDir, `frame_${String(i).padStart(4, '0')}.png`);
                yield page.evaluate((frameNum) => {
                    // @ts-ignore
                    if (typeof window.setFrame === 'function') {
                        // @ts-ignore
                        window.setFrame(frameNum);
                    }
                }, i);
                yield page.screenshot({ path: filename });
                console.log(`Captured frame ${i + 1}/${frameCount}`);
            }
            yield browser.close();
            console.log('Generating video with FFmpeg...');
            yield runFFmpeg(framesDir, outputPath, fps);
            console.log(`Video saved to ${outputPath}`);
            return outputPath; // Let the caller handle cleanup & upload
        }
        catch (err) {
            console.error('Error during video generation:', err);
            throw err;
        }
    });
}
function runFFmpeg(framesDir, outputPath, fps) {
    return new Promise((resolve, reject) => {
        const ffmpeg = (0, child_process_1.spawn)(ffmpeg_static_1.default, [
            '-y',
            '-framerate', String(fps),
            '-i', path_1.default.join(framesDir, 'frame_%04d.png'),
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-crf', '18',
            '-preset', 'slow',
            '-profile:v', 'high',
            outputPath,
        ]);
        ffmpeg.stdout.on('data', (data) => {
            console.log(`FFmpeg stdout: ${data}`);
        });
        ffmpeg.stderr.on('data', (data) => {
            console.log(`FFmpeg stderr: ${data}`);
        });
        ffmpeg.on('close', (code) => {
            if (code === 0)
                resolve();
            else
                reject(new Error(`FFmpeg process exited with code ${code}`));
        });
        ffmpeg.on('error', (err) => {
            reject(err);
        });
    });
}
