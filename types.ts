export interface BatchItem {
  id: string;
  original: string;
  generated: string | null;
  status: 'idle' | 'processing' | 'success' | 'error';
  errorMessage?: string;
}

export interface GenerationState {
  isBatchProcessing: boolean;
}

export enum AspectRatio {
  SQUARE = "1:1",
  PORTRAIT = "3:4",
  LANDSCAPE = "4:3",
  WIDE = "16:9"
}

export interface ImageConfig {
  promptAdjustment: string;
  aspectRatio: AspectRatio;
}