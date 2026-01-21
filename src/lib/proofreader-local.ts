import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { TranscriptPage, TranscriptError, ErrorType } from "@/types";
import { chunkToText } from "./parser";

const execAsync = promisify(exec);

const PROOFREAD_PROMPT = `Proofread this court transcript for errors. List each error as:
Page X, Line Y: "error" should be "correction" (type)

Find typos, grammar errors, extra words, and unclear text.

TRANSCRIPT:
`;

export async function proofreadWithClaudeCode(
  pages: TranscriptPage[]
): Promise<TranscriptError[]> {
  const transcriptText = chunkToText(pages);
  const fullPrompt = PROOFREAD_PROMPT + transcriptText;

  // Write prompt to temp file (handles large transcripts better than command line args)
  const tempFile = join(tmpdir(), `stenoproof-${Date.now()}.txt`);

  try {
    await writeFile(tempFile, fullPrompt, "utf-8");

    console.log("Calling Claude Code CLI...");
    console.log("Processing pages:", pages.map(p => p.pageNumber).join(", "));
    console.log("Transcript text preview (first 500 chars):", transcriptText.substring(0, 500));
    console.log("Full prompt length:", fullPrompt.length);

    // Call Claude Code CLI with the prompt file
    // Using -p flag for print mode (non-interactive)
    const { stdout, stderr } = await execAsync(
      `cat "${tempFile}" | claude -p`,
      {
        maxBuffer: 1024 * 1024 * 50, // 50MB buffer for large responses
        timeout: 300000, // 5 minute timeout per chunk (increased for reliability)
      }
    );

    if (stderr) {
      console.error("Claude Code stderr:", stderr);
    }

    // Parse the JSON response from Claude Code output
    const responseText = stdout.trim();
    console.log("Raw response length:", responseText.length);
    console.log("Response preview:", responseText.substring(0, 300));

    // Handle empty response
    if (responseText.length === 0) {
      console.error("Claude returned empty response - may be rate limited or prompt issue");
      console.error("stderr was:", stderr || "(empty)");
      throw new Error("Claude returned empty response");
    }

    // Try to extract JSON array - handle markdown code blocks
    let jsonStr = responseText;
    let errors: TranscriptError[] = [];

    // Remove markdown code blocks if present
    const codeBlockMatch = responseText.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
      console.log("Extracted from code block:", jsonStr.substring(0, 200));
      try {
        errors = JSON.parse(jsonStr);
      } catch (e) {
        console.log("Code block wasn't valid JSON");
      }
    }

    // Try to find raw JSON array
    if (errors.length === 0) {
      const jsonMatch = responseText.match(/\[\s*\{[\s\S]*?\}\s*\]/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
        console.log("Found JSON array:", jsonStr.substring(0, 200));
        try {
          errors = JSON.parse(jsonStr);
        } catch (e) {
          console.log("JSON array wasn't valid");
        }
      }
    }

    // Fallback: Parse markdown format like "**Page 1, Line 2**: "lettder" → "letter" (typo)"
    if (errors.length === 0 && responseText.includes("Page")) {
      console.log("Attempting to parse markdown format...");
      const markdownErrors = parseMarkdownErrors(responseText);
      if (markdownErrors.length > 0) {
        errors = markdownErrors;
        console.log(`Parsed ${errors.length} errors from markdown format`);
      }
    }

    if (errors.length === 0) {
      if (responseText.includes("[]") || responseText.toLowerCase().includes("no errors")) {
        console.log("No errors found");
        return [];
      }
      console.log("Could not parse response");
      console.log("Full response:", responseText);
      return [];
    }

    console.log(`Found ${errors.length} errors`);

    return errors.map((error) => ({
      pageNumber: error.pageNumber || pages[0]?.pageNumber || 1,
      lineNumber: error.lineNumber || 1,
      errorText: error.errorText || "",
      correction: error.correction || "",
      errorType: normalizeErrorType(error.errorType || "other"),
      confidence: Math.min(1, Math.max(0, error.confidence || 0.8)),
    }));
  } catch (error) {
    console.error("Claude Code execution error:", error);
    throw error;
  } finally {
    // Clean up temp file
    try {
      await unlink(tempFile);
    } catch {}
  }
}

/**
 * Parse markdown-formatted error list from Claude
 * Handles multiple formats:
 * - "**Page 1, Line 2**: "lettder" → "letter" (typo)"
 * - Markdown tables: | 1 | 2 | "lettder" | "letter" | typo |
 */
function parseMarkdownErrors(text: string): TranscriptError[] {
  const errors: TranscriptError[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    let pageNum: number | null = null;
    let lineNum: number | null = null;
    let errorText: string | null = null;
    let correction: string | null = null;
    let errorType: string = "other";

    // Format 1: Markdown table row: | 1 | 2 | "lettder" | "letter" | typo |
    const tableMatch = line.match(/\|\s*(\d+)\s*\|\s*(\d+)\s*\|\s*"?([^"|]+)"?\s*\|\s*"?([^"|]+)"?\s*\|\s*([^|]+)\s*\|?/);
    if (tableMatch) {
      pageNum = parseInt(tableMatch[1]);
      lineNum = parseInt(tableMatch[2]);
      errorText = tableMatch[3].trim().replace(/^"|"$/g, '');
      correction = tableMatch[4].trim().replace(/^"|"$/g, '');
      errorType = tableMatch[5].trim();
    }

    // Format 2: Page X, Line Y: "error" should be "correction" (type)
    // Or: **Page X, Line Y**: "error" -> "correction" (type)
    if (!pageNum) {
      const locationMatch = line.match(/Page\s+(\d+),?\s*Line\s+(\d+)/i);
      if (locationMatch) {
        pageNum = parseInt(locationMatch[1]);
        lineNum = parseInt(locationMatch[2]);

        // Try multiple patterns for error/correction extraction
        const patterns = [
          /[""]([^""]+)[""]\s*(?:should be|->|→|=>)\s*[""]([^""]+)[""]/i,
          /["']([^"']+)["']\s*(?:should be|->|→|=>)\s*["']([^"']+)["']/i,
          /"([^"]+)"\s*(?:should be|->|→|=>)\s*"([^"]+)"/i,
        ];

        for (const pattern of patterns) {
          const errorMatch = line.match(pattern);
          if (errorMatch) {
            errorText = errorMatch[1];
            correction = errorMatch[2];
            const typeMatch = line.match(/\(([^)]+)\)\s*$/);
            errorType = typeMatch ? typeMatch[1] : "other";
            break;
          }
        }

        // If no match yet, try to extract just quoted text
        if (!errorText) {
          const quotedMatch = line.match(/[""]([^""]+)[""]/);
          if (quotedMatch) {
            errorText = quotedMatch[1];
            correction = "Needs review";
            errorType = "needs_review";
          }
        }
      }
    }

    // Skip if we didn't extract valid data
    if (!pageNum || !lineNum || !errorText) continue;

    // Skip header rows
    if (errorText.toLowerCase() === 'error' || errorText === '---') continue;

    // Avoid duplicates
    const existing = errors.find(e =>
      e.pageNumber === pageNum &&
      e.lineNumber === lineNum &&
      e.errorText === errorText
    );

    if (!existing) {
      errors.push({
        pageNumber: pageNum,
        lineNumber: lineNum,
        errorText: errorText.trim(),
        correction: (correction || "Needs review").trim(),
        errorType: normalizeErrorType(errorType),
        confidence: errorType === "needs_review" ? 0.6 : 0.9,
      });
    }
  }

  return errors;
}

function normalizeErrorType(type: string): ErrorType {
  const normalized = String(type).toLowerCase().replace(/[^a-z_]/g, "");
  const validTypes: ErrorType[] = [
    "typo", "grammar", "spelling", "punctuation",
    "missing_word", "extra_word", "untranslated_steno",
    "inconsistency", "needs_review", "other",
  ];

  if (validTypes.includes(normalized as ErrorType)) {
    return normalized as ErrorType;
  }

  if (normalized.includes("typo") || normalized.includes("mistype") || normalized.includes("doubled")) return "typo";
  if (normalized.includes("gram")) return "grammar";
  if (normalized.includes("spell")) return "spelling";
  if (normalized.includes("punct")) return "punctuation";
  if (normalized.includes("missing")) return "missing_word";
  if (normalized.includes("extra") || normalized.includes("duplicate")) return "extra_word";
  if (normalized.includes("steno") || normalized.includes("untrans") || normalized.includes("mistrans")) return "untranslated_steno";
  if (normalized.includes("inconsist")) return "inconsistency";
  if (normalized.includes("review") || normalized.includes("awkward") || normalized.includes("unclear") || normalized.includes("clunky")) return "needs_review";

  return "other";
}
