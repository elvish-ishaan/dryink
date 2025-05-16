import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '../ui/button';

  interface AudioRecorderProps {
    setStartVideo: React.Dispatch<React.SetStateAction<boolean>>;
    previewAudioStart: boolean;
  }

const AudioRecorder = ({setStartVideo, previewAudioStart}: AudioRecorderProps) => {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);


  const startRecording = async () => { 
    try {
        setStartVideo(true)
        //getting permission of microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event: BlobEvent) => {
        console.log(event,'getting event from media recorder')
        chunks.push(event.data);
      };
      //when the recording done
      recorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
      };

      recorder.start();

      setAudioChunks(chunks);
      setIsRecording(true);
    } catch (err) {
        toast('Microphone access denied');
      console.error('Microphone access denied:', err);
    }
  };

  const stopRecording = () => {
    setStartVideo(false)
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  useEffect(() => {
    console.log(audioChunks, 'getting audio chunks')
  }, [audioChunks])

  //handling audio merge
  const handleAudioMerge = () => {
    //send video url and audio buffer/blob to backend
    
  }

  useEffect(() => {
    if (previewAudioStart) {
      const audio = document.querySelector('audio') as HTMLAudioElement;
      audio.play();
    }
  }, [previewAudioStart])

  return (
    <div className="p-4 space-y-4 border rounded-lg shadow-md w-full max-w-md mx-auto">
      <h2 className="text-lg font-semibold">Add Audio overlay</h2>
      <div className=" flex justify-between space-x-2">
        <Button
        className=' bg-green-600'
          onClick={startRecording}
          disabled={isRecording}>
          Start
        </Button>
        <Button
        className=' bg-red-500'
          onClick={stopRecording}
          disabled={!isRecording}
        >
          Stop
        </Button>
        <Button onClick={ handleAudioMerge }>Merge Audio</Button>
      </div>

      {audioUrl && (
        <div className="space-y-2">
          <audio controls src={audioUrl}></audio>
        </div>
      )}
    </div>
  );
};

export default AudioRecorder;
