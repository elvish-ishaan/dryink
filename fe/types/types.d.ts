type PromptStatus = 'pending' | 'completed' | 'canceled';

interface PromptItem {
    prompt: string;
    status: PromptStatus;
    videoUrl?: string;
    timestamp: number;
    genRes?: string;
  }


  interface AnimatedPromptInputProps {
    prompt: string;
    setPrompt: React.Dispatch<React.SetStateAction<string>>;
    errors: ErrorState; // use full type
    setErrors: React.Dispatch<React.SetStateAction<ErrorState>>;
    loading: boolean;
  }
  
  export type ErrorState = {
    prompt: string;
    width: string;
    height: string;
    frameCount: string;
  };