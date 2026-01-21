export interface TranscriptPage {
  pageNumber: number;
  lines: TranscriptLine[];
  rawText: string;
}

export interface TranscriptLine {
  lineNumber: number;
  content: string;
  speaker?: string; // Q., A., MR. SMITH:, etc.
}

export interface ParsedTranscript {
  pages: TranscriptPage[];
  totalPages: number;
  totalLines: number;
  metadata: {
    fileName: string;
    processedAt: string;
    isGenericText?: boolean;
    detectedFormat?: string;
  };
}

export interface TranscriptError {
  pageNumber: number;
  lineNumber: number;
  errorText: string;
  correction: string;
  errorType: ErrorType;
  confidence: number; // 0-1, how confident the model is
  context?: string; // surrounding text for context
}

export type ErrorType =
  | "typo"
  | "grammar"
  | "spelling"
  | "punctuation"
  | "missing_word"
  | "extra_word"
  | "untranslated_steno"
  | "inconsistency"
  | "needs_review"
  | "other";

export interface ProofreadingResult {
  errors: TranscriptError[];
  summary: {
    totalErrors: number;
    byType: Record<ErrorType, number>;
    byPage: Record<number, number>;
  };
  processingTime: number;
  pagesProcessed: number;
}

export interface ProofreadingRequest {
  transcript: string;
  fileName: string;
}

export interface ProofreadingResponse {
  success: boolean;
  result?: ProofreadingResult;
  error?: string;
}
