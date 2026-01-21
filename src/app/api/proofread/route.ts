import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parseTranscript, chunkTranscript } from "@/lib/parser";
import { proofreadChunk } from "@/lib/proofreader";
import { proofreadWithClaudeCode } from "@/lib/proofreader-local";
import { generateHtmlReport } from "@/lib/report-generator";
import { generateDemoErrors } from "@/lib/demo-mode";
import { ProofreadingResult, TranscriptError, ErrorType, ParsedTranscript } from "@/types";

// Allow large file uploads (up to 50MB for big transcripts)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Read file content
    const text = await file.text();
    const fileName = file.name;

    // Parse transcript
    const parsed = parseTranscript(text, fileName);

    console.log("=== PARSING RESULTS ===");
    console.log(`Total pages: ${parsed.pages.length}`);
    console.log(`Total lines: ${parsed.totalLines}`);
    parsed.pages.slice(0, 3).forEach(p => {
      console.log(`Page ${p.pageNumber}: ${p.lines.length} lines, rawText length: ${p.rawText.length}`);
      if (p.lines.length > 0) {
        console.log(`  First line: ${p.lines[0].lineNumber}: ${p.lines[0].content.substring(0, 60)}...`);
      }
    });

    if (parsed.pages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Could not parse transcript. Please ensure it's in standard court transcript format." },
        { status: 400 }
      );
    }

    // Determine which mode to use:
    // 1. USE_CLAUDE_CODE=true → Use local Claude Code CLI (uses your Claude Max subscription)
    // 2. ANTHROPIC_API_KEY set → Use Anthropic API directly
    // 3. Neither → Demo mode with sample errors
    const useClaudeCode = process.env.USE_CLAUDE_CODE === "true";
    const apiKey = process.env.ANTHROPIC_API_KEY;

    let allErrors: TranscriptError[] = [];

    if (useClaudeCode) {
      // Local mode: use Claude Code CLI (your $100/month subscription)
      console.log("Using Claude Code CLI for proofreading...");
      const chunks = chunkTranscript(parsed, 5); // Smaller chunks for more thorough checking
      let failedChunks = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const pageRange = `${chunk[0]?.pageNumber}-${chunk[chunk.length - 1]?.pageNumber}`;
        console.log(`Processing chunk ${i + 1}/${chunks.length} (pages ${pageRange})...`);

        try {
          const chunkErrors = await proofreadWithClaudeCode(chunk);
          allErrors.push(...chunkErrors);
        } catch (chunkError) {
          // Log error but continue with other chunks
          console.error(`Chunk ${i + 1} failed (pages ${pageRange}):`, chunkError);
          failedChunks++;
          // Continue processing other chunks instead of failing completely
        }
      }

      if (failedChunks > 0) {
        console.warn(`${failedChunks}/${chunks.length} chunks failed to process`);
      }
    } else if (apiKey) {
      // Production mode: use Claude API
      const client = new Anthropic({ apiKey });
      const chunks = chunkTranscript(parsed, 15);
      let failedChunks = 0;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const pageRange = `${chunk[0]?.pageNumber}-${chunk[chunk.length - 1]?.pageNumber}`;
        console.log(`Processing chunk ${i + 1}/${chunks.length} (pages ${pageRange})...`);

        try {
          const chunkErrors = await proofreadChunk(client, chunk);
          allErrors.push(...chunkErrors);
        } catch (chunkError) {
          console.error(`Chunk ${i + 1} failed (pages ${pageRange}):`, chunkError);
          failedChunks++;
        }
      }

      if (failedChunks > 0) {
        console.warn(`${failedChunks}/${chunks.length} chunks failed to process`);
      }
    } else {
      // Demo mode: generate realistic sample errors
      await simulateProcessingDelay(parsed.totalPages);
      allErrors = generateDemoErrors(parsed);
    }

    // Add context to grammar errors for clarity
    allErrors = allErrors.map(error => {
      if (error.errorType === "grammar" && error.correction) {
        // If error and correction are single words, add context from original line
        const errorWords = error.errorText.trim().split(/\s+/);
        const correctionWords = error.correction.trim().split(/\s+/);

        if (errorWords.length === 1 && correctionWords.length === 1) {
          // Find the original line to get context
          const page = parsed.pages.find(p => p.pageNumber === error.pageNumber);
          if (page) {
            const line = page.lines.find(l => l.lineNumber === error.lineNumber);
            if (line && line.content) {
              // Find the error word in the line and get surrounding context
              const content = line.content;
              const errorWord = error.errorText.trim();
              const idx = content.toLowerCase().indexOf(errorWord.toLowerCase());

              if (idx !== -1) {
                // Get a few words before the error for context
                const before = content.substring(0, idx).trim().split(/\s+/).slice(-2).join(' ');
                const after = content.substring(idx + errorWord.length).trim().split(/\s+/).slice(0, 1).join(' ');

                // Update correction to include context
                if (before) {
                  error.correction = `${before} ${error.correction}${after ? ' ' + after : ''}`.trim();
                }
              }
            }
          }
        }
      }
      return error;
    });

    // Build summary
    const byType: Record<ErrorType, number> = {
      typo: 0,
      grammar: 0,
      spelling: 0,
      punctuation: 0,
      missing_word: 0,
      extra_word: 0,
      untranslated_steno: 0,
      inconsistency: 0,
      needs_review: 0,
      other: 0,
    };

    const byPage: Record<number, number> = {};

    for (const error of allErrors) {
      byType[error.errorType] = (byType[error.errorType] || 0) + 1;
      byPage[error.pageNumber] = (byPage[error.pageNumber] || 0) + 1;
    }

    const result: ProofreadingResult = {
      errors: allErrors,
      summary: {
        totalErrors: allErrors.length,
        byType,
        byPage,
      },
      processingTime: Date.now() - startTime,
      pagesProcessed: parsed.totalPages,
    };

    // Generate HTML report
    const htmlReport = generateHtmlReport(result, fileName);

    return NextResponse.json({
      success: true,
      result,
      htmlReport,
    });
  } catch (error) {
    console.error("Proofreading error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "An error occurred",
      },
      { status: 500 }
    );
  }
}

// Simulate realistic processing time for demo mode
async function simulateProcessingDelay(pageCount: number): Promise<void> {
  // Roughly 50ms per page to simulate processing
  const delay = Math.min(pageCount * 50, 5000); // Cap at 5 seconds
  return new Promise((resolve) => setTimeout(resolve, delay));
}
