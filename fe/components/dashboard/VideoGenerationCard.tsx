import { Download, Redo2, Undo2 } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { useRef } from "react";

interface VideoGenerationCardProps {
    currentVideoUrl: string | null;
    currentResponse: string;
    prompt: string;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    loading: boolean;
}

export default function VideoGenerationCard({
    currentVideoUrl,
    prompt,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    loading
}: VideoGenerationCardProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);

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
                                onClick={onUndo} 
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
                                onClick={onRedo} 
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
                            {prompt}
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
    );
}
