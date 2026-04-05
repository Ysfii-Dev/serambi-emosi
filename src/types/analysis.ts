export interface EmotionProbability {
  name: string;
  value: number;
}

export interface AnalysisResponse {
  dominant_emotion: string;
  confidence: number;
  probabilities: EmotionProbability[];
}
