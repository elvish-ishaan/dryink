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
const execa_1 = require("execa");
const ffmpeg_static_1 = __importDefault(require("ffmpeg-static"));
const os_1 = require("os");
function generateVideo(opts) {
    return __awaiter(this, void 0, void 0, function* () {
        const { htmlContent, width = 800, height = 600, fps = 30, frameCount = 500, videoName = 'output.mp4', } = opts;
        const jobId = `job-${Date.now()}`;
        const baseDir = path_1.default.join((0, os_1.tmpdir)(), jobId);
        const htmlPath = path_1.default.join(baseDir, 'render.html');
        const framesDir = path_1.default.join(baseDir, 'frames');
        const outputPath = path_1.default.join(baseDir, videoName);
        yield fs_extra_1.default.ensureDir(baseDir);
        yield fs_extra_1.default.ensureDir(framesDir);
        // Extract clean HTML
        const rawHtml = htmlContent.replace(/^```html\s*/, '').replace(/```$/, '');
        yield fs_extra_1.default.outputFile(htmlPath, rawHtml);
        const browser = yield puppeteer_1.default.launch({ headless: true });
        const page = yield browser.newPage();
        yield page.setViewport({ width, height });
        yield page.goto(`file://${htmlPath}`);
        console.log('Starting frame capture...');
        for (let i = 0; i < frameCount; i++) {
            const filename = path_1.default.join(framesDir, `frame_${String(i).padStart(4, '0')}.png`);
            // Optionally: call a window.setFrame(i) if defined
            yield page.evaluate((frameNum) => {
                // @ts-ignore
                if (typeof window.setFrame === 'function') {
                    // @ts-ignore
                    window.setFrame(frameNum);
                }
            }, i);
            yield page.screenshot({ path: filename });
            //break loop when the diff between the last two frames is equal to zero (no movement)
            console.log(`Captured frame ${i} → ${filename}`);
        }
        yield browser.close();
        console.log('Generating video with FFmpeg...');
        yield (0, execa_1.execa)(ffmpeg_static_1.default, [
            '-y',
            '-framerate', String(fps),
            '-i', path_1.default.join(framesDir, 'frame_%04d.png'),
            '-c:v', 'libx264',
            '-pix_fmt', 'yuv420p',
            '-crf', '18', // Better quality
            '-preset', 'slow', // Better compression
            '-profile:v', 'high', // High profile
            outputPath,
        ]);
        console.log(`Video saved to ${outputPath}`);
        return outputPath;
    });
}
