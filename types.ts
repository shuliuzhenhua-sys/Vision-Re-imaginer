
export interface Rotation {
  x: number;
  y: number;
}

export interface GeneratedResult {
  imageUrl: string;
  prompt: string;
  timestamp: number;
  rotation: Rotation;
}

export interface AppState {
  originalImage: string | null;
  currentRotation: Rotation;
  isGenerating: boolean;
  history: GeneratedResult[];
  error: string | null;
  lastPrompt: string | null;
}
