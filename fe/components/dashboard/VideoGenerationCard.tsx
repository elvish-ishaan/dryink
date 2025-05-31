import { Download, Redo2, Undo2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { useRef, useState } from "react";
import { PromptItem } from "@/types/types";
import { toast } from "sonner";


export default function VideoGenerationCard() {
    const [currentResponse, setCurrentResponse] = useState<string>('');
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [loading, setLoading] = useState(false);
    const [prompt, setPrompt] = useState('');  
    const [videoHistory, setVideoHistory] = useState<{
        urls: { url: string; prompt: string; genRes: string }[];
        currentIndex: number;
      }>({
        urls: [],
        currentIndex: -1,
      });
    
      // Validation errors
    const [currentVideoUrl, setCurrentVideoUrl] = useState<string | null>(null);
    const canUndo = videoHistory.currentIndex > 0;
    const canRedo = videoHistory.currentIndex < videoHistory.urls.length - 1;

    const handleUndo = () => {
        if (videoHistory.currentIndex <= 0) {
          toast("No more history to undo");
          return;
        }
        
        const newIndex = videoHistory.currentIndex - 1;
        const historyItem = videoHistory.urls[newIndex];
        
        setVideoHistory(prev => ({
          ...prev,
          currentIndex: newIndex
        }));
        
        setCurrentVideoUrl(historyItem.url);
        setPrompt(historyItem.prompt);
        setCurrentResponse(historyItem.genRes);
      };
    
      const handleRedo = () => {
        if (videoHistory.currentIndex >= videoHistory.urls.length - 1) {
          toast("No more history to redo");
          return;
        }
        
        const newIndex = videoHistory.currentIndex + 1;
        const historyItem = videoHistory.urls[newIndex];
        
        setVideoHistory(prev => ({
          ...prev,
          currentIndex: newIndex
        }));
        
        setCurrentVideoUrl(historyItem.url);
        setPrompt(historyItem.prompt);
        setCurrentResponse(historyItem.genRes);
      };
    
    
      const handleDownload = () => {
        if (!currentVideoUrl) return;
        const a = document.createElement('a');
        a.href = currentVideoUrl;
        a.download = 'generated-video.mp4';
        a.click();
      };
    
  return (
    <Card className="flex bg-neutral-800 flex-col items-center justify-center overflow-hidden h-full">
          <CardContent className="flex flex-col items-center justify-center w-full h-full p-4 gap-3">
            {loading ? (
              <Skeleton className="w-full max-w-3xl aspect-video rounded-md" />
            ) : currentVideoUrl ? (
              <>
                <div className="w-full max-w-3xl overflow-hidden rounded-md shadow-lg">
                  <video
                    ref={videoRef}
                    key={currentVideoUrl}
                    src={currentVideoUrl}
                    controls
                    autoPlay
                    className="w-full"
                  />
                </div>
                <div className="flex gap-2 w-full max-w-3xl justify-center">
                  <Button 
                    onClick={handleUndo} 
                    variant="outline" 
                    size="sm"
                    disabled={!canUndo}
                    className={!canUndo ? "opacity-50" : ""}
                  >
                    <Undo2 className="w-4 h-4 mr-1" />
                    Undo
                  </Button>
                  <Button onClick={handleDownload} variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button 
                    onClick={handleRedo} 
                    variant="outline" 
                    size="sm"
                    disabled={!canRedo}
                    className={!canRedo ? "opacity-50" : ""}
                  >
                    <Redo2 className="w-4 h-4 mr-1" />
                    Redo
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground text-center mt-1">
                  {videoHistory.currentIndex + 1} of {videoHistory.urls.length} generations
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full">
                <p className="text-muted-foreground text-sm">Generated video will appear here</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Enter a prompt and adjust parameters to generate a video
                </p>
              </div>
            )}
          </CardContent>
        </Card>
  )
}
