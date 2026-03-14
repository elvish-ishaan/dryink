import { Download, Undo2, Redo2, ExternalLink } from "lucide-react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { useRef } from "react";
import { toast } from "sonner";
import Loader from "../loaders/Loader";
import { BACKEND_BASE_URL } from "@/lib/constants";
import { useSession } from "next-auth/react";
import AnimationIframe from "./AnimationIframe";
import ExportProgressBar from "./ExportProgressBar";

interface VideoGenerationCardProps {
    currentVideoUrl: string | null;
    currentResponse: string;
    prompt: string;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    loading: boolean;
    // Hybrid rendering props
    animationCode?: string;
    exportJobId?: string | null;
    onExportRequest?: () => void;
    onExportComplete?: (url: string) => void;
}

export default function VideoGenerationCard({
    currentVideoUrl,
    prompt,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    loading,
    animationCode,
    exportJobId,
    onExportRequest,
    onExportComplete,
}: VideoGenerationCardProps) {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const { data: session } = useSession();

    const handleDownload = async () => {
        if (!currentVideoUrl) return;
        const filename = currentVideoUrl.split('/').pop();
        if (!filename) {
            toast.error('Failed to download video');
            return;
        }
        try {
            const token = (session?.user as { accessToken?: string })?.accessToken;
            const res = await fetch(
                `${BACKEND_BASE_URL}/sessions/download?key=${encodeURIComponent(filename)}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            if (!data.success) throw new Error();
            window.location.href = data.url;
        } catch {
            toast.error('Failed to download video');
        }
    };

    const token = (session?.user as { accessToken?: string })?.accessToken ?? '';

    return (
        <Card className="flex bg-neutral-800 rounded-none flex-col h-full">
            <CardContent className="flex flex-col w-full h-full p-2 items-center justify-center">
                {loading ? (
                    <div className="flex flex-col gap-10 items-center">
                        <Loader />
                        <span className="text-neutral-300 font-semibold">
                            Generating animation...
                        </span>
                    </div>
                ) : animationCode ? (
                    <>
                        <div className="w-full max-w-3xl">
                            <AnimationIframe htmlCode={animationCode} />
                        </div>

                        {exportJobId && onExportComplete ? (
                            <ExportProgressBar
                                jobId={exportJobId}
                                token={token}
                                onComplete={onExportComplete}
                            />
                        ) : currentVideoUrl ? (
                            <div className="mt-3">
                                <a
                                    href={currentVideoUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                    Watch Exported Video
                                </a>
                            </div>
                        ) : (
                            <div className="flex gap-2 w-full max-w-3xl justify-center mt-2">
                                <Button
                                    onClick={onUndo}
                                    variant="outline"
                                    size="sm"
                                    disabled={!canUndo}
                                >
                                    <Undo2 className="w-4 h-4 mr-1" />
                                    Previous
                                </Button>
                                {onExportRequest && (
                                    <Button onClick={onExportRequest} variant="outline" size="sm">
                                        <Download className="w-4 h-4 mr-1" />
                                        Download Video
                                    </Button>
                                )}
                                <Button
                                    onClick={onRedo}
                                    variant="outline"
                                    size="sm"
                                    disabled={!canRedo}
                                >
                                    <Redo2 className="w-4 h-4 mr-1" />
                                    Next
                                </Button>
                            </div>
                        )}

                        <div className="text-xs text-muted-foreground text-center mt-1 max-w-3xl">
                            {prompt}
                        </div>
                    </>
                ) : currentVideoUrl ? (
                    // Legacy sessions: show video player
                    <>
                        <div className="w-full max-w-3xl">
                            <video
                                ref={videoRef}
                                key={currentVideoUrl}
                                src={currentVideoUrl}
                                controls
                                autoPlay
                                playsInline
                                className="w-full aspect-video"
                                onError={(e) => {
                                    console.error('Video error:', e);
                                    toast.error('Error loading video');
                                }}
                            />
                        </div>

                        <div className="flex gap-2 w-full max-w-3xl justify-center mt-2">
                            <Button
                                onClick={onUndo}
                                variant="outline"
                                size="sm"
                                disabled={!canUndo}
                            >
                                <Undo2 className="w-4 h-4 mr-1" />
                                Previous
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
                            >
                                <Redo2 className="w-4 h-4 mr-1" />
                                Next
                            </Button>
                        </div>

                        <div className="text-xs text-muted-foreground text-center mt-1 max-w-3xl">
                            {prompt}
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full">
                        <p className="text-neutral-200 text-sm">Generated animation will appear here</p>
                        <p className="text-xs text-neutral-300 mt-1">
                            Enter a prompt and adjust parameters to generate an animation
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
