'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { BACKEND_BASE_URL } from '@/lib/constants';

interface ExportProgressBarProps {
  jobId: string;
  token: string;
  onComplete: (url: string) => void;
}

export default function ExportProgressBar({ jobId, token, onComplete }: ExportProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const url = `${BACKEND_BASE_URL}/export/${jobId}/progress?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    esRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'error') {
          toast.error(data.message || 'Export failed');
          es.close();
          return;
        }

        if (data.type === 'progress') {
          setProgress(data.progress ?? 0);

          if (data.status === 'completed' && data.genUrl) {
            es.close();
            onComplete(data.genUrl);
          } else if (data.status === 'failed') {
            toast.error('Video export failed');
            es.close();
          }
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      toast.error('Lost connection to export progress stream');
      es.close();
    };

    return () => {
      es.close();
    };
  }, [jobId, token, onComplete]);

  return (
    <div className="w-full max-w-3xl mt-3 px-1">
      <div className="flex justify-between text-xs text-neutral-400 mb-1">
        <span>Exporting video...</span>
        <span>{progress}%</span>
      </div>
      <div className="w-full bg-neutral-700 rounded-full h-1.5">
        <div
          className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
