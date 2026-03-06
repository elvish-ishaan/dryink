import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import ffmpegPath from 'ffmpeg-static';
import { tmpdir } from 'os';
import { spawn } from 'child_process';
import { logger } from '../lib/logger';

const MAX_FRAME_COUNT = 1440; // 60 seconds at 24 fps safety cap
const DEFAULT_WIDTH = 1920;
const DEFAULT_HEIGHT = 1080;

interface RenderHTMLToVideoOptions {
  htmlContent: string;
  fps?: number;
  videoName?: string;
}

export async function generateVideo(opts: RenderHTMLToVideoOptions): Promise<string> {
  const {
    htmlContent,
    fps = 24,
    videoName = 'output.mp4',
  } = opts;
  const width = DEFAULT_WIDTH;
  const height = DEFAULT_HEIGHT;

  const jobId = `job-${Date.now()}`;
  const baseDir = path.join(tmpdir(), jobId);
  const htmlPath = path.join(baseDir, 'render.html');
  const framesDir = path.join(baseDir, 'frames');
  const outputPath = path.join(baseDir, videoName);

  try {
    await fs.ensureDir(baseDir);
    await fs.ensureDir(framesDir);

    const rawHtml = htmlContent.replace(/^```html\s*/, '').replace(/```$/, '');
    await fs.outputFile(htmlPath, rawHtml);

    const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.goto(`file://${htmlPath}`);

    // Detect total frames from animation, capped at MAX_FRAME_COUNT
    const detectedFrames = await page.evaluate(() => {
      // @ts-ignore
      if (typeof window.getTotalFrames === 'function') {
        // @ts-ignore
        return Math.min(Math.max(1, Math.round(window.getTotalFrames())), 1440);
      }
      return 240; // fallback: 10s at 24fps
    });
    const frameCount = Math.min(detectedFrames, MAX_FRAME_COUNT);
    logger.info({ frameCount }, 'Detected animation frame count');

    logger.info('Starting frame capture');
    for (let i = 0; i < frameCount; i++) {
      const filename = path.join(framesDir, `frame_${String(i).padStart(4, '0')}.png`);
      await page.evaluate((frameNum) => {
        // @ts-ignore
        if (typeof window.setFrame === 'function') {
          // @ts-ignore
          window.setFrame(frameNum);
        }
      }, i);
      await page.screenshot({ path: filename });
      if ((i + 1) % 10 === 0) {
        logger.info(`Captured frame ${i + 1}/${frameCount}`);
      }
    }
    await browser.close();

    logger.info('Generating video with FFmpeg');
    await runFFmpeg(framesDir, outputPath, fps);
    logger.info({ outputPath }, 'Video saved');

    return outputPath;
  } catch (err) {
    logger.error(err, 'Error during video generation');
    throw err;
  }
}

function runFFmpeg(framesDir: string, outputPath: string, fps: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const ffmpeg = spawn(ffmpegPath!, [
      '-y',
      '-framerate', String(fps),
      '-i', path.join(framesDir, 'frame_%04d.png'),
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-crf', '18',
      '-preset', 'slow',
      '-profile:v', 'high',
      outputPath,
    ]);

    ffmpeg.stderr.on('data', (data) => {
      logger.debug(`FFmpeg: ${data}`);
    });

    ffmpeg.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`FFmpeg process exited with code ${code}`));
    });

    ffmpeg.on('error', (err) => {
      reject(err);
    });
  });
}
