import puppeteer from 'puppeteer';
import fs from 'fs-extra';
import path from 'path';
import { execa } from 'execa';
import ffmpegPath from 'ffmpeg-static';
import { tmpdir } from 'os';

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

    // Extract clean HTML
    const rawHtml = htmlContent.replace(/^```html\s*/, '').replace(/```$/, '');
    await fs.outputFile(htmlPath, rawHtml);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width, height });
    await page.goto(`file://${htmlPath}`);

    console.log('Starting frame capture...');

    for (let i = 0; i < frameCount; i++) {
      const filename = path.join(framesDir, `frame_${String(i).padStart(4, '0')}.png`);

      // Optionally: call a window.setFrame(i) if defined
      await page.evaluate((frameNum) => {
        // @ts-ignore
        if (typeof window.setFrame === 'function') {
          // @ts-ignore
          window.setFrame(frameNum);
        }
      }, i);

      await page.screenshot({ path: filename });

      //break loop when the diff between the last two frames is equal to zero (no movement)
      //
      //

      console.log(`Captured frame ${i} → ${filename}`);
    }

    await browser.close();

    console.log('Generating video with FFmpeg...');
    if (!ffmpegPath) {
      throw new Error('FFmpeg path not found. Ensure ffmpeg-static is installed.');
    }
    await execa(ffmpegPath, [
      '-y',
      '-framerate', String(fps),
      '-i', path.join(framesDir, 'frame_%04d.png'),
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-crf', '18',          // Better quality
      '-preset', 'slow',       // Better compression
      '-profile:v', 'high',    // High profile
      outputPath,
    ]);

    console.log(`Video saved to ${outputPath}`);
    return outputPath;

  } catch (error) {
    console.error('Error during video generation:', error);
    throw error; // Re-throw the error to be handled by the caller
  } finally {
    // Clean up temporary directory
    await fs.remove(baseDir).catch((err) => console.error('Error removing temporary directory:', err));
  }
}