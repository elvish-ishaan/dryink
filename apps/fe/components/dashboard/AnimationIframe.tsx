'use client';

import { sanitizeAnimationCode } from '@/lib/sanitizeCode';
import { useRef, useState } from 'react';
import { CornerUpLeft, Maximize2, Pause, Play } from 'lucide-react';
import { Button } from '../ui/button';

interface AnimationIframeProps {
  htmlCode: string;
  onReply?: () => void;
}

export default function AnimationIframe({ htmlCode, onReply }: AnimationIframeProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);

  const togglePlay = () => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(isPlaying ? 'pause' : 'play', '*');
    setIsPlaying((prev) => !prev);
  };

  const handleFullscreen = () => {
    iframeRef.current?.requestFullscreen();
  };

  return (
    <div className="relative w-full h-full bg-black group">
      <iframe
        ref={iframeRef}
        srcDoc={sanitizeAnimationCode(htmlCode)}
        sandbox="allow-scripts"
        className="w-full h-full border-0"
        title="Animation Preview"
        scrolling="no"
        allowFullScreen
      />
      <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {onReply && (
          <Button
            size="icon"
            variant="secondary"
            className="h-8 w-8 bg-black/60 hover:bg-black/80 border-0"
            onClick={onReply}
            title="Reply to this animation"
          >
            <CornerUpLeft className="h-4 w-4" />
          </Button>
        )}
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 bg-black/60 hover:bg-black/80 border-0"
          onClick={togglePlay}
        >
          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </Button>
        <Button
          size="icon"
          variant="secondary"
          className="h-8 w-8 bg-black/60 hover:bg-black/80 border-0"
          onClick={handleFullscreen}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
