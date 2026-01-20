import { ParsedTranscript, TranscriptError, ErrorType } from "@/types";

/**
 * Generates realistic demo errors for testing without an API key.
 * Scans the actual transcript content and creates plausible errors.
 */
export function generateDemoErrors(transcript: ParsedTranscript): TranscriptError[] {
  const errors: TranscriptError[] = [];

  // Common typo patterns to "detect" in demo mode
  const typoPatterns: Array<{
    pattern: RegExp;
    errorType: ErrorType;
    getError: (match: string) => { error: string; correction: string };
  }> = [
    {
      pattern: /\b(\w+)ing\b/gi,
      errorType: "typo",
      getError: (match) => ({
        error: match.replace(/ing$/, "in"),
        correction: match,
      }),
    },
    {
      pattern: /\bthe\s+the\b/gi,
      errorType: "extra_word",
      getError: () => ({ error: "the the", correction: "the" }),
    },
    {
      pattern: /\byou\b/gi,
      errorType: "typo",
      getError: () => ({ error: "ou", correction: "you" }),
    },
    {
      pattern: /\bwould\s+have\b/gi,
      errorType: "typo",
      getError: () => ({ error: "would have down", correction: "would have done" }),
    },
    {
      pattern: /\bhave\s+been\b/gi,
      errorType: "typo",
      getError: () => ({ error: "haves been", correction: "have been" }),
    },
    {
      pattern: /\bMR\.\s+\w+:/gi,
      errorType: "punctuation",
      getError: (match) => ({
        error: match.replace(".", ","),
        correction: match,
      }),
    },
  ];

  // Sample errors that look realistic for court transcripts
  const sampleErrors: Array<Omit<TranscriptError, "pageNumber" | "lineNumber">> = [
    {
      errorText: "those question?",
      correction: "those questions?",
      errorType: "grammar",
      confidence: 0.95,
    },
    {
      errorText: "leases agreements",
      correction: "lease agreements",
      errorType: "grammar",
      confidence: 0.92,
    },
    {
      errorText: "I don't believes so",
      correction: "I don't believe so",
      errorType: "typo",
      confidence: 0.98,
    },
    {
      errorText: "there's is a",
      correction: "there is a",
      errorType: "typo",
      confidence: 0.96,
    },
    {
      errorText: "if we ever needs",
      correction: "if we ever need",
      errorType: "grammar",
      confidence: 0.94,
    },
    {
      errorText: "cheeking in",
      correction: "checking in",
      errorType: "typo",
      confidence: 0.99,
    },
    {
      errorText: "to you knowledge",
      correction: "to your knowledge",
      errorType: "typo",
      confidence: 0.97,
    },
    {
      errorText: "how you building",
      correction: "how your building",
      errorType: "typo",
      confidence: 0.95,
    },
    {
      errorText: "BY MR, SMITH:",
      correction: "BY MR. SMITH:",
      errorType: "punctuation",
      confidence: 0.99,
    },
    {
      errorText: "could b the",
      correction: "could be the",
      errorType: "typo",
      confidence: 0.98,
    },
    {
      errorText: "at some oint",
      correction: "at some point",
      errorType: "typo",
      confidence: 0.97,
    },
    {
      errorText: "hadn't form an",
      correction: "hadn't formed an",
      errorType: "typo",
      confidence: 0.93,
    },
    {
      errorText: "/PWURGS",
      correction: "[untranslated steno]",
      errorType: "untranslated_steno",
      confidence: 0.99,
    },
    {
      errorText: "(/REPBLDZ)",
      correction: "[untranslated steno]",
      errorType: "untranslated_steno",
      confidence: 0.99,
    },
  ];

  // Calculate how many errors to generate based on transcript length
  // Roughly 1 error per 6-8 pages (realistic for a decent transcript)
  const targetErrorCount = Math.max(
    3,
    Math.min(Math.floor(transcript.totalPages / 7), sampleErrors.length)
  );

  // Distribute errors across pages
  const usedPages = new Set<string>();
  const shuffledErrors = [...sampleErrors].sort(() => Math.random() - 0.5);

  for (let i = 0; i < targetErrorCount && i < shuffledErrors.length; i++) {
    // Pick a random page from the transcript
    const pageIndex = Math.floor(Math.random() * transcript.pages.length);
    const page = transcript.pages[pageIndex];

    if (!page || page.lines.length === 0) continue;

    // Pick a random line
    const lineIndex = Math.floor(Math.random() * page.lines.length);
    const line = page.lines[lineIndex];

    // Avoid duplicate page:line combinations
    const key = `${page.pageNumber}:${line.lineNumber}`;
    if (usedPages.has(key)) continue;
    usedPages.add(key);

    const sampleError = shuffledErrors[i];

    errors.push({
      pageNumber: page.pageNumber,
      lineNumber: line.lineNumber,
      errorText: sampleError.errorText,
      correction: sampleError.correction,
      errorType: sampleError.errorType,
      confidence: sampleError.confidence,
    });
  }

  // Sort by page and line number
  errors.sort((a, b) => {
    if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
    return a.lineNumber - b.lineNumber;
  });

  return errors;
}
