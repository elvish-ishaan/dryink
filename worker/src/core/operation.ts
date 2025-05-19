import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import ffmpegPath from 'ffmpeg-static';
import { tmpdir } from 'os';
import { spawn } from 'child_process';

interface RenderHTMLToVideoOptions {
  htmlContent: string;
  width?: number;
  height?: number;
  fps?: number;
  frameCount?: number;
  videoName?: string; // defaults to "output.mp4"
}

export async function generateVideo(opts: RenderHTMLToVideoOptions): Promise<string> {
  const {
    htmlContent,
    width = 800,
    height = 600,
    fps = 30,
    frameCount = 500,
    videoName = 'output.mp4',
  } = opts;

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

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.goto(`file://${htmlPath}`);

    console.log('Starting frame capture...');
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
      console.log(`Captured frame ${i + 1}/${frameCount}`);
    }
    await browser.close();

    console.log('Generating video with FFmpeg...');
    await runFFmpeg(framesDir, outputPath, fps);
    console.log(`Video saved to ${outputPath}`);

    return outputPath; // Let the caller handle cleanup & upload
  } catch (err) {
    console.error('Error during video generation:', err);
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

    ffmpeg.stdout.on('data', (data) => {
      console.log(`FFmpeg stdout: ${data}`);
    });

    ffmpeg.stderr.on('data', (data) => {
      console.log(`FFmpeg stderr: ${data}`);
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
