export interface Topic {
  name: string;
  sentiment: number; // -1 to 1
}

export interface AnalysisResult {
  summary: string;
  topics: Topic[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

export interface ProductSearchResult {
  name: string;
  url: string;
}
