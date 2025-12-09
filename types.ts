export interface BlueprintSpec {
  material: string;
  weight: string;
  dimensions: string;
  engineeringAnalysis: string;
}

export interface ForgeHistoryItem {
  id: string;
  prompt: string;
  timestamp: number;
  specs?: BlueprintSpec;
  imageUrl?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export enum AppMode {
  FORGE = 'FORGE',
  REVERSE_ENGINEER = 'REVERSE_ENGINEER',
  ASSISTANT = 'ASSISTANT'
}
