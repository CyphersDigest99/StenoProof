import { ProofreadingResult, ErrorType } from "@/types";

const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  typo: "Typos",
  grammar: "Grammar",
  spelling: "Spelling",
  punctuation: "Punctuation",
  missing_word: "Missing Words",
  extra_word: "Extra/Duplicate Words",
  untranslated_steno: "Untranslated Steno",
  inconsistency: "Inconsistencies",
  other: "Other",
};

export function generateHtmlReport(
  result: ProofreadingResult,
  fileName: string
): string {
  const sortedErrors = [...result.errors].sort((a, b) => {
    if (a.pageNumber !== b.pageNumber) return a.pageNumber - b.pageNumber;
    return a.lineNumber - b.lineNumber;
  });

  const errorRows = sortedErrors
    .map(
      (error) => `
        <tr>
          <td>${error.pageNumber}:${error.lineNumber}</td>
          <td>"${escapeHtml(error.errorText)}"</td>
          <td>"${escapeHtml(error.correction)}"</td>
          <td>${ERROR_TYPE_LABELS[error.errorType] || error.errorType}</td>
        </tr>`
    )
    .join("");

  const summaryByType = Object.entries(result.summary.byType)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a)
    .map(
      ([type, count]) => `
        <tr>
          <td>${ERROR_TYPE_LABELS[type as ErrorType] || type}</td>
          <td>${count}</td>
        </tr>`
    )
    .join("");

  const processingTimeSeconds = (result.processingTime / 1000).toFixed(1);

  return `<!DOCTYPE html>
<html>
<head>
    <title>Proofreading Report - ${escapeHtml(fileName)}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 40px auto;
            padding: 20px;
            line-height: 1.5;
        }
        h1 {
            text-align: center;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        h2 {
            margin-top: 30px;
            color: #333;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
        }
        .meta {
            text-align: center;
            color: #666;
            margin-bottom: 20px;
        }
        .stats {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin: 20px 0;
            padding: 15px;
            background: #f5f5f5;
            border-radius: 8px;
        }
        .stat {
            text-align: center;
        }
        .stat-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
        }
        .stat-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11pt;
        }
        th, td {
            border: 1px solid #333;
            padding: 8px 10px;
            text-align: left;
        }
        th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        tr:nth-child(even) {
            background-color: #fafafa;
        }
        .summary-table {
            width: 50%;
        }
        .summary-table td:last-child {
            text-align: center;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            font-style: italic;
            color: #666;
            padding-top: 20px;
            border-top: 1px solid #ccc;
        }
        .no-errors {
            text-align: center;
            padding: 40px;
            color: #28a745;
            font-size: 18px;
        }
        @media print {
            body { margin: 20px; }
            table { font-size: 10pt; }
            .stats { background: #f5f5f5 !important; -webkit-print-color-adjust: exact; }
        }
    </style>
</head>
<body>
    <h1>Transcript Proofreading Report</h1>
    <p class="meta">${escapeHtml(fileName)}</p>

    <div class="stats">
        <div class="stat">
            <div class="stat-value">${result.pagesProcessed}</div>
            <div class="stat-label">Pages</div>
        </div>
        <div class="stat">
            <div class="stat-value">${result.summary.totalErrors}</div>
            <div class="stat-label">Errors Found</div>
        </div>
        <div class="stat">
            <div class="stat-value">${processingTimeSeconds}s</div>
            <div class="stat-label">Processing Time</div>
        </div>
    </div>

    ${
      result.errors.length === 0
        ? '<div class="no-errors">No errors found in this transcript.</div>'
        : `
    <h2>Errors Found</h2>
    <table>
        <tr>
            <th>Page:Line</th>
            <th>Error</th>
            <th>Correction</th>
            <th>Type</th>
        </tr>
        ${errorRows}
    </table>

    <h2>Summary by Error Type</h2>
    <table class="summary-table">
        <tr>
            <th>Error Type</th>
            <th>Count</th>
        </tr>
        ${summaryByType}
    </table>
    `
    }

    <div class="footer">
        Report generated by StenoProof<br>
        ${new Date().toLocaleString()}
    </div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
