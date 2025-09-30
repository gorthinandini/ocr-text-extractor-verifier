export interface FormData {
  [key: string]: string;
}

export interface VerificationResult {
  [key: string]: {
    match: boolean;
    reason?: string; // Reason for mismatch, provided by AI
  };
}

export interface ImageQualityReport {
  isGoodQuality: boolean;
  score: number; // A score from 0 to 100 representing the quality for OCR
  feedback: string[]; // An array of human-readable feedback points
}
