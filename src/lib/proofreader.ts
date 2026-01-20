import Anthropic from "@anthropic-ai/sdk";
import { TranscriptPage, TranscriptError, ErrorType } from "@/types";
import { chunkToText } from "./parser";

const SYSTEM_PROMPT = `You are an expert proofreader for court deposition transcripts. Your job is to identify errors in the transcript text.

Types of errors to look for:
1. TYPOS - Missing letters, wrong letters, transposed letters (e.g., "cheeking" → "checking", "haves" → "have")
2. GRAMMAR - Subject-verb agreement, tense errors (e.g., "we ever needs" → "we ever need")
3. SPELLING - Misspelled words
4. PUNCTUATION - Missing periods, wrong punctuation (e.g., "MR," → "MR.")
5. MISSING_WORD - Words that appear to be missing (e.g., "that you money in" → "that you put money in")
6. EXTRA_WORD - Duplicate or unnecessary words (e.g., "the he e-mail" → "the e-mail")
7. UNTRANSLATED_STENO - Steno codes that weren't translated (e.g., "/PWURGS", "(/REPBLDZ)")
8. INCONSISTENCY - Names or addresses that don't match earlier references

IMPORTANT GUIDELINES:
- Court transcripts record SPOKEN words, so grammatically incorrect speech by witnesses is NOT an error
- Only flag clear transcription/typing errors, not witness speech patterns
- Q. and A. indicate Question and Answer - these are standard formatting
- Speaker labels like "MR. SMITH:", "THE WITNESS:", etc. are standard
- Be conservative - only flag errors you are confident about
- Include a confidence score (0.0-1.0) for each error

For each error found, provide:
- pageNumber: The page number where the error occurs
- lineNumber: The line number (1-25) where the error occurs
- errorText: The exact erroneous text
- correction: The suggested correction
- errorType: One of: typo, grammar, spelling, punctuation, missing_word, extra_word, untranslated_steno, inconsistency, other
- confidence: 0.0 to 1.0 confidence score

Respond with a JSON array of errors. If no errors found, respond with an empty array [].`;

const USER_PROMPT_TEMPLATE = `Please proofread the following court transcript pages and identify any errors.

TRANSCRIPT:
{transcript}

Respond ONLY with a valid JSON array of error objects. Example format:
[
  {
    "pageNumber": 52,
    "lineNumber": 20,
    "errorText": "if we ever needs funds",
    "correction": "if we ever need funds",
    "errorType": "grammar",
    "confidence": 0.95
  }
]

If no errors are found, respond with: []`;

export async function proofreadChunk(
  client: Anthropic,
  pages: TranscriptPage[]
): Promise<TranscriptError[]> {
  const transcriptText = chunkToText(pages);
  const userPrompt = USER_PROMPT_TEMPLATE.replace("{transcript}", transcriptText);

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    system: SYSTEM_PROMPT,
  });

  // Extract text content from response
  const responseText = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("");

  // Parse JSON response
  try {
    // Handle markdown code blocks if present
    let jsonStr = responseText.trim();
    if (jsonStr.startsWith("```json")) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith("```")) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith("```")) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const errors = JSON.parse(jsonStr) as TranscriptError[];

    // Validate and normalize error types
    return errors.map((error) => ({
      ...error,
      errorType: normalizeErrorType(error.errorType),
      confidence: Math.min(1, Math.max(0, error.confidence || 0.8)),
    }));
  } catch (e) {
    console.error("Failed to parse proofreading response:", responseText);
    return [];
  }
}

function normalizeErrorType(type: string): ErrorType {
  const normalized = type.toLowerCase().replace(/[^a-z_]/g, "");
  const validTypes: ErrorType[] = [
    "typo",
    "grammar",
    "spelling",
    "punctuation",
    "missing_word",
    "extra_word",
    "untranslated_steno",
    "inconsistency",
    "other",
  ];

  if (validTypes.includes(normalized as ErrorType)) {
    return normalized as ErrorType;
  }

  // Map common variations
  if (normalized.includes("typo") || normalized.includes("mistype")) return "typo";
  if (normalized.includes("gram")) return "grammar";
  if (normalized.includes("spell")) return "spelling";
  if (normalized.includes("punct")) return "punctuation";
  if (normalized.includes("missing")) return "missing_word";
  if (normalized.includes("extra") || normalized.includes("duplicate")) return "extra_word";
  if (normalized.includes("steno") || normalized.includes("untrans")) return "untranslated_steno";
  if (normalized.includes("inconsist")) return "inconsistency";

  return "other";
}
