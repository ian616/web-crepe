export interface InferPoint {
  idx: number
  pitchHz: number;
  pitchCents: number;
  pitchNotes: string;
  confidence: number;
  currentTime: number;
  latency: number;
}
