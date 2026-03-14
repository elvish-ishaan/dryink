'use client';

import { sanitizeAnimationCode } from '@/lib/sanitizeCode';

interface AnimationIframeProps {
  htmlCode: string;
}

export default function AnimationIframe({ htmlCode }: AnimationIframeProps) {
  return (
    <iframe
      srcDoc={sanitizeAnimationCode(htmlCode)}
      sandbox="allow-scripts"
      className="w-full aspect-video border-0"
      title="Animation Preview"
    />
  );
}
