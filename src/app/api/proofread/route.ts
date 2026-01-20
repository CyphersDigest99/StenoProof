import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { parseTranscript, chunkTranscript } from "@/lib/parser";
import { proofreadChunk } from "@/lib/proofreader";
import { generateHtmlReport } from "@/lib/report-generator";
import { generateDemoErrors } from "@/lib/demo-mode";
import { ProofreadingResult, TranscriptError, ErrorType, ParsedTranscript } from "@/types";

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

    if (parsed.pages.length === 0) {
      return NextResponse.json(
        { success: false, error: "Could not parse transcript. Please ensure it's in standard court transcript format." },
        { status: 400 }
      );
    }

    // Check for API key - if not present, use demo mode
    const apiKey = process.env.ANTHROPIC_API_KEY;
    const isDemoMode = !apiKey;

    let allErrors: TranscriptError[] = [];

    if (isDemoMode) {
      // Demo mode: generate realistic sample errors
      await simulateProcessingDelay(parsed.totalPages);
      allErrors = generateDemoErrors(parsed);
    } else {
      // Production mode: use Claude API
      const client = new Anthropic({ apiKey });
      const chunks = chunkTranscript(parsed, 15);

      for (const chunk of chunks) {
        const chunkErrors = await proofreadChunk(client, chunk);
        allErrors.push(...chunkErrors);
      }
    }

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
