"use client";

import { useState, useCallback } from "react";
import { ProofreadingResult, ErrorType } from "@/types";

type Status = "idle" | "uploading" | "processing" | "complete" | "error";

const ERROR_TYPE_COLORS: Record<ErrorType, string> = {
  typo: "bg-red-100 text-red-700",
  grammar: "bg-orange-100 text-orange-700",
  spelling: "bg-yellow-100 text-yellow-700",
  punctuation: "bg-blue-100 text-blue-700",
  missing_word: "bg-purple-100 text-purple-700",
  extra_word: "bg-pink-100 text-pink-700",
  untranslated_steno: "bg-gray-100 text-gray-700",
  inconsistency: "bg-indigo-100 text-indigo-700",
  other: "bg-gray-100 text-gray-700",
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState<ProofreadingResult | null>(null);
  const [htmlReport, setHtmlReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".txt")) {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Please upload a .txt file");
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.name.endsWith(".txt")) {
        setFile(selectedFile);
        setError(null);
      } else {
        setError("Please upload a .txt file");
      }
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setStatus("uploading");
    setProgress("Uploading transcript...");
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      setStatus("processing");
      setProgress("Analyzing transcript for errors...");

      const response = await fetch("/api/proofread", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to process transcript");
      }

      setResult(data.result);
      setHtmlReport(data.htmlReport);
      setStatus("complete");
      setProgress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStatus("error");
      setProgress("");
    }
  };

  const downloadReport = () => {
    if (!htmlReport || !file) return;

    const blob = new Blob([htmlReport], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name.replace(".txt", "_errors.html");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFile(null);
    setStatus("idle");
    setProgress("");
    setResult(null);
    setHtmlReport(null);
    setError(null);
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2c3e50] text-white flex flex-col">
        {/* Logo */}
        <div className="p-6 bg-[#1a252f]">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-[#1abc9c]">Steno</span>Proof
          </h1>
          <p className="text-xs text-gray-400 mt-1">AI Transcript Proofreading</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1a252f] text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span className="font-medium">Dashboard</span>
            </a>
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#34495e] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>History</span>
              <span className="ml-auto text-xs bg-[#1abc9c] text-white px-2 py-0.5 rounded-full">Soon</span>
            </a>
            <a href="/analytics" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#34495e] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>Analytics</span>
            </a>
          </div>

          <div className="mt-8">
            <p className="px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Support</p>
            <div className="mt-3 space-y-1">
              <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Help Center</span>
              </a>
              <a href="#" className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Contact</span>
              </a>
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-[#34495e]">
          <p className="text-xs text-gray-500 text-center">
            Compatible with CaseCatalyst,<br />Eclipse, ProCAT & more
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Top Banner */}
        <div className="bg-[#1abc9c] text-white px-6 py-3 flex items-center justify-between">
          <p className="text-sm">
            <span className="font-semibold">Demo Mode</span> — Upload any transcript to see how StenoProof works
          </p>
          <button className="text-white/80 hover:text-white">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-8 overflow-auto">
          {status === "idle" && (
            <div className="max-w-4xl mx-auto">
              {/* Welcome Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Welcome to StenoProof</h2>
                <p className="text-gray-500">Upload your transcript file to get started with AI-powered proofreading.</p>
              </div>

              {/* Upload Card */}
              <div className="bg-white rounded-xl shadow-sm p-8">
                <h3 className="text-lg font-semibold text-gray-800 mb-6 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[#1abc9c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Transcript
                </h3>

                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => document.getElementById("fileInput")?.click()}
                  className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all ${
                    file
                      ? "border-[#1abc9c] bg-[#1abc9c]/5"
                      : "border-gray-200 hover:border-[#1abc9c] hover:bg-gray-50"
                  }`}
                >
                  <input
                    id="fileInput"
                    type="file"
                    accept=".txt"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {file ? (
                    <div>
                      <div className="w-16 h-16 mx-auto mb-4 bg-[#1abc9c]/10 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#1abc9c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-lg font-medium text-gray-800">{file.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                      <button
                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
                        className="mt-3 text-sm text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Remove file
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      </div>
                      <p className="text-lg text-gray-600">Drop your transcript here</p>
                      <p className="text-sm text-gray-400 mt-1">or click to browse</p>
                      <p className="text-xs text-gray-400 mt-4">Supports .txt files from CaseCatalyst, Eclipse, and other CAT software</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSubmit}
                  disabled={!file}
                  className={`mt-6 w-full py-4 rounded-xl font-semibold text-white transition-all ${
                    file
                      ? "bg-[#1abc9c] hover:bg-[#16a085] shadow-lg shadow-[#1abc9c]/25"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  Start Proofreading
                </button>

                {/* Privacy Note */}
                <div className="mt-6 flex items-start gap-3 text-sm text-gray-500">
                  <svg className="w-5 h-5 text-[#1abc9c] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <p><strong>Privacy First:</strong> Your files are processed in memory only and never stored. We take confidentiality seriously.</p>
                </div>
              </div>
            </div>
          )}

          {(status === "uploading" || status === "processing") && (
            <div className="max-w-xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 relative">
                  <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                  <div className="absolute inset-0 border-4 border-[#1abc9c] rounded-full border-t-transparent animate-spin"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Processing Transcript</h3>
                <p className="text-gray-500">{progress}</p>
                <p className="text-sm text-gray-400 mt-4">This may take a moment for large files</p>
              </div>
            </div>
          )}

          {status === "complete" && result && (
            <div className="max-w-5xl mx-auto">
              {/* Success Header */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#1abc9c]/10 rounded-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-[#1abc9c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold text-gray-800">Proofreading Complete</h2>
                    <p className="text-gray-500 text-sm">{file?.name}</p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={downloadReport}
                      className="px-5 py-2.5 bg-[#1abc9c] hover:bg-[#16a085] text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download Report
                    </button>
                    <button
                      onClick={resetForm}
                      className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                    >
                      New File
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Pages</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{result.pagesProcessed}</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Errors Found</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{result.summary.totalErrors}</p>
                    </div>
                    <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Time</p>
                      <p className="text-3xl font-bold text-gray-800 mt-1">{(result.processingTime / 1000).toFixed(1)}s</p>
                    </div>
                    <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Results Cards */}
              <div className="grid grid-cols-3 gap-6">
                {/* Errors Table */}
                <div className="col-span-2 bg-white rounded-xl shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">Errors Found</h3>
                  </div>
                  <div className="p-6">
                    {result.errors.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 bg-green-50 rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <p className="text-gray-600 font-medium">No errors found!</p>
                        <p className="text-gray-400 text-sm mt-1">This transcript looks clean.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                              <th className="pb-3">Location</th>
                              <th className="pb-3">Error</th>
                              <th className="pb-3">Correction</th>
                              <th className="pb-3">Type</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50">
                            {result.errors.slice(0, 10).map((error, i) => (
                              <tr key={i} className="text-sm">
                                <td className="py-3 font-mono text-gray-600">{error.pageNumber}:{error.lineNumber}</td>
                                <td className="py-3 text-red-600">"{error.errorText}"</td>
                                <td className="py-3 text-green-600">"{error.correction}"</td>
                                <td className="py-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${ERROR_TYPE_COLORS[error.errorType]}`}>
                                    {error.errorType.replace(/_/g, " ")}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {result.errors.length > 10 && (
                          <p className="text-center text-sm text-gray-400 mt-4">
                            + {result.errors.length - 10} more errors in full report
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary by Type */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">By Type</h3>
                  </div>
                  <div className="p-6">
                    <div className="space-y-3">
                      {Object.entries(result.summary.byType)
                        .filter(([, count]) => count > 0)
                        .sort(([, a], [, b]) => b - a)
                        .map(([type, count]) => (
                          <div key={type} className="flex items-center justify-between">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${ERROR_TYPE_COLORS[type as ErrorType]}`}>
                              {type.replace(/_/g, " ")}
                            </span>
                            <span className="font-semibold text-gray-700">{count}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="max-w-xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-6 bg-red-50 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h3>
                <p className="text-red-500 mb-6">{error}</p>
                <button
                  onClick={resetForm}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="px-8 py-4 border-t border-gray-100 bg-white">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <p>StenoProof &copy; 2026</p>
            <p>Made for court reporters</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
