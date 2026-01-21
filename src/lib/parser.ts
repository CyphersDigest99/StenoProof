import { ParsedTranscript, TranscriptPage, TranscriptLine } from "@/types";

/**
 * Parses a court transcript from CAT software.
 *
 * Format expected:
 * - Lines numbered 1-25 on the left (e.g., "         1        Q. Text here")
 * - Page number right-aligned after line 25 (e.g., "                                                                       1")
 * - The page number has 40+ spaces of indentation
 */
export function parseTranscript(
  text: string,
  fileName: string
): ParsedTranscript {
  // Normalize line endings (Windows CRLF -> LF) and split
  const normalizedText = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalizedText.split("\n");
  const pages: TranscriptPage[] = [];

  let currentPage: TranscriptPage | null = null;
  let currentPageLines: TranscriptLine[] = [];
  let currentPageRaw: string[] = [];
  let lastDetectedPageNum = 0;

  console.log(`Parsing transcript: ${fileName}, ${lines.length} total lines`);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check if this is a PAGE NUMBER (right-aligned standalone number)
    // Page numbers have 40+ leading spaces and are just a number
    const pageNum = extractPageNumber(line, trimmed);

    if (pageNum !== null && pageNum > lastDetectedPageNum) {
      // Found a new page marker
      console.log(`Found page marker: ${pageNum} at line ${i + 1}`);

      // Save previous page if it has content
      if (currentPage && currentPageLines.length > 0) {
        currentPage.lines = currentPageLines;
        currentPage.rawText = currentPageRaw.join("\n");
        pages.push(currentPage);
        console.log(`Saved page ${currentPage.pageNumber} with ${currentPageLines.length} lines`);
      }

      // The page number marks the END of a page, so this content belonged to this page number
      // Create the page with this number
      if (currentPage === null) {
        // First page - the content we've been collecting belongs to this page
        currentPage = {
          pageNumber: pageNum,
          lines: currentPageLines,
          rawText: currentPageRaw.join("\n"),
        };
        pages.push(currentPage);
        console.log(`Saved first page ${pageNum} with ${currentPageLines.length} lines`);
      }

      // Reset for next page
      currentPageLines = [];
      currentPageRaw = [];
      currentPage = {
        pageNumber: pageNum + 1, // Next page will be pageNum + 1
        lines: [],
        rawText: "",
      };
      lastDetectedPageNum = pageNum;
      continue;
    }

    // Check if this is a CONTENT LINE (starts with line number 1-25)
    const lineInfo = parseContentLine(line);
    if (lineInfo) {
      // If we don't have a current page yet, create one (implicit first page)
      if (currentPage === null) {
        currentPage = {
          pageNumber: 1,
          lines: [],
          rawText: "",
        };
      }
      currentPageLines.push(lineInfo);
    }

    // Add to raw text for context
    if (currentPage !== null || trimmed.length > 0) {
      currentPageRaw.push(line);
    }
  }

  // Don't forget the last page
  if (currentPage && currentPageLines.length > 0) {
    currentPage.lines = currentPageLines;
    currentPage.rawText = currentPageRaw.join("\n");
    // Only add if it's a real page with content
    if (!pages.find(p => p.pageNumber === currentPage!.pageNumber)) {
      pages.push(currentPage);
      console.log(`Saved final page ${currentPage.pageNumber} with ${currentPageLines.length} lines`);
    }
  }

  // Renumber pages sequentially based on detected page markers
  // The page count should match the highest page number we detected
  const totalPages = lastDetectedPageNum > 0 ? lastDetectedPageNum : pages.length;

  // Calculate total lines
  const totalLines = pages.reduce((sum, page) => sum + page.lines.length, 0);

  // If no pages were detected, treat as plain text
  if (pages.length === 0 && text.trim().length > 0) {
    console.log("No court transcript structure detected - treating as plain text");
    return createPlainTextPages(text, fileName);
  }

  console.log(`Final result: ${pages.length} pages, ${totalLines} lines parsed`);

  return {
    pages,
    totalPages,
    totalLines,
    metadata: {
      fileName,
      processedAt: new Date().toISOString(),
    },
  };
}

/**
 * Extract page number - ONLY from right-aligned standalone numbers
 * Page numbers have significant leading whitespace (40+ spaces)
 */
function extractPageNumber(line: string, trimmed: string): number | null {
  // Must be a standalone number (just digits after trimming)
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }

  const num = parseInt(trimmed);

  // Page numbers are typically 1-9999
  if (num < 1 || num > 9999) {
    return null;
  }

  // Key check: must be RIGHT-ALIGNED (lots of leading whitespace)
  // Court transcripts typically have 40-70 spaces before the page number
  const leadingSpaces = line.length - line.trimStart().length;

  if (leadingSpaces >= 40) {
    return num;
  }

  return null;
}

/**
 * Parse a content line - extracts line number and content
 * Format: "         1        Q. Text here" or "    1    Text here"
 */
function parseContentLine(line: string): TranscriptLine | null {
  // Match: optional spaces, 1-2 digit number, 2+ spaces, then content
  // The line number is in the left margin (typically 1-25)
  const match = line.match(/^[\s]*(\d{1,2})[\s]{2,}(.+)$/);

  if (!match) {
    return null;
  }

  const lineNum = parseInt(match[1]);
  const content = match[2];

  // Court transcripts use line numbers 1-25
  if (lineNum < 1 || lineNum > 25) {
    return null;
  }

  // Must have actual content (not just whitespace)
  if (content.trim().length === 0) {
    return null;
  }

  // Extract speaker if present
  const speakerPatterns = [
    /^(Q\.|A\.)/i,                                    // Q. or A.
    /^(MR\.\s+\w+:|MS\.\s+\w+:|MRS\.\s+\w+:)/i,      // MR./MS./MRS. NAME:
    /^(THE\s+\w+:)/i,                                 // THE WITNESS:, THE COURT:
    /^(BY\s+MR\.\s+\w+:|BY\s+MS\.\s+\w+:)/i,         // BY MR. NAME:
  ];

  let speaker: string | undefined;
  for (const pattern of speakerPatterns) {
    const speakerMatch = content.match(pattern);
    if (speakerMatch) {
      speaker = speakerMatch[1];
      break;
    }
  }

  return {
    lineNumber: lineNum,
    content: content,
    speaker,
  };
}

/**
 * Fallback: create pages from plain text (non-transcript files)
 */
function createPlainTextPages(text: string, fileName: string): ParsedTranscript {
  const allLines = text.split("\n").filter(l => l.trim().length > 0);
  const linesPerPage = 25;
  const genericPages: TranscriptPage[] = [];

  for (let i = 0; i < allLines.length; i += linesPerPage) {
    const pageLines = allLines.slice(i, i + linesPerPage);
    const pageNumber = Math.floor(i / linesPerPage) + 1;

    genericPages.push({
      pageNumber,
      lines: pageLines.map((content, idx) => ({
        lineNumber: idx + 1,
        content: content.trim(),
      })),
      rawText: pageLines.join("\n"),
    });
  }

  console.log(`Created ${genericPages.length} virtual pages from plain text`);

  return {
    pages: genericPages,
    totalPages: genericPages.length,
    totalLines: allLines.length,
    metadata: {
      fileName,
      processedAt: new Date().toISOString(),
      isGenericText: true,
    },
  };
}

/**
 * Chunks a parsed transcript into segments for API processing
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

      let content: string;
      if (page.lines && page.lines.length > 0) {
        content = page.lines
          .map((line) => `${line.lineNumber}: ${line.content}`)
          .join("\n");
      } else {
        content = page.rawText || "";
      }

      return header + content;
    })
    .join("\n");
}
