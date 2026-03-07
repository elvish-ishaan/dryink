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
  errors: ErrorState;
  setErrors: React.Dispatch<React.SetStateAction<ErrorState>>;
  loading: boolean;
}

export type ErrorState = {
  prompt: string;
  width: string;
  height: string;
  frameCount: string;
};

interface Chat {
  id: string;
  chatSessionId: string;
  prompt: string;
  responce: string;
  message: string | null;
  genUrl: string | null;
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'sent' | 'pending' | 'failed';
}

interface VideoEntry {
  url: string;
  prompt: string;
}
