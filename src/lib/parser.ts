import { ParsedTranscript, TranscriptPage, TranscriptLine } from "@/types";

/**
 * Parses a court transcript in standard format:
 * - Page numbers right-aligned on their own line
 * - Line numbers 1-25 left-aligned
 * - Content follows line numbers
 */
export function parseTranscript(
  text: string,
  fileName: string
): ParsedTranscript {
  const lines = text.split("\n");
  const pages: TranscriptPage[] = [];

  let currentPage: TranscriptPage | null = null;
  let currentPageLines: TranscriptLine[] = [];
  let currentPageRaw: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if this is a page number (standalone number, typically right-aligned)
    const pageNumberMatch = trimmed.match(/^(\d+)$/);
    if (pageNumberMatch && parseInt(pageNumberMatch[1]) > 0) {
      const potentialPageNum = parseInt(pageNumberMatch[1]);

      // Heuristic: page numbers are usually > current page and < 1000
      // Also check if the previous line was mostly empty (page break)
      const prevLine = i > 0 ? lines[i - 1].trim() : "";
      const isLikelyPageNumber =
        potentialPageNum < 1000 &&
        (prevLine === "" || prevLine.length < 10) &&
        (pages.length === 0 || potentialPageNum > pages[pages.length - 1].pageNumber);

      if (isLikelyPageNumber) {
        // Save previous page if exists
        if (currentPage) {
          currentPage.lines = currentPageLines;
          currentPage.rawText = currentPageRaw.join("\n");
          pages.push(currentPage);
        }

        // Start new page
        currentPage = {
          pageNumber: potentialPageNum,
          lines: [],
          rawText: "",
        };
        currentPageLines = [];
        currentPageRaw = [];
        continue;
      }
    }

    // Check if this is a content line (starts with line number 1-25)
    const lineMatch = line.match(/^\s*(\d{1,2})\s+(.*)$/);
    if (lineMatch) {
      const lineNum = parseInt(lineMatch[1]);
      const content = lineMatch[2];

      if (lineNum >= 1 && lineNum <= 25) {
        // Extract speaker if present
        const speakerMatch = content.match(/^(Q\.|A\.|MR\.\s+\w+:|MS\.\s+\w+:|THE\s+\w+:)/i);

        currentPageLines.push({
          lineNumber: lineNum,
          content: content,
          speaker: speakerMatch ? speakerMatch[1] : undefined,
        });
      }
    }

    // Add to raw text regardless
    if (currentPage) {
      currentPageRaw.push(line);
    }
  }

  // Don't forget the last page
  if (currentPage) {
    currentPage.lines = currentPageLines;
    currentPage.rawText = currentPageRaw.join("\n");
    pages.push(currentPage);
  }

  // Calculate total lines
  const totalLines = pages.reduce((sum, page) => sum + page.lines.length, 0);

  return {
    pages,
    totalPages: pages.length,
    totalLines,
    metadata: {
      fileName,
      processedAt: new Date().toISOString(),
    },
  };
}

/**
 * Chunks a parsed transcript into segments for API processing
 * Respects page boundaries for accurate line number reporting
 */
export function chunkTranscript(
  transcript: ParsedTranscript,
  pagesPerChunk: number = 10
): TranscriptPage[][] {
  const chunks: TranscriptPage[][] = [];

  for (let i = 0; i < transcript.pages.length; i += pagesPerChunk) {
    chunks.push(transcript.pages.slice(i, i + pagesPerChunk));
  }

  return chunks;
}

/**
 * Converts a chunk of pages back to text for API processing
 */
export function chunkToText(pages: TranscriptPage[]): string {
  return pages
    .map((page) => {
      const header = `\n--- PAGE ${page.pageNumber} ---\n`;
      const content = page.lines
        .map((line) => `${line.lineNumber}: ${line.content}`)
        .join("\n");
      return header + content;
    })
    .join("\n");
}
