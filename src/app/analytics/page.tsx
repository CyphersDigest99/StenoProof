"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { loadSessions, getAggregateStats, ProofreadingSession } from "@/lib/storage";
import { ErrorType } from "@/types";

const ERROR_TYPE_LABELS: Record<ErrorType, string> = {
  typo: "Typos",
  grammar: "Grammar",
  spelling: "Spelling",
  punctuation: "Punctuation",
  missing_word: "Missing Words",
  extra_word: "Extra Words",
  untranslated_steno: "Untranslated Steno",
  inconsistency: "Inconsistency",
  needs_review: "Needs Review",
  other: "Other",
};

export default function AnalyticsPage() {
  const [sessions, setSessions] = useState<ProofreadingSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadedSessions = loadSessions();
    setSessions(loadedSessions);
    setIsLoading(false);
  }, []);

  const stats = getAggregateStats(sessions);

  // Get recent sessions for the chart (last 8)
  const recentSessions = sessions.slice(0, 8).reverse();

  // Calculate max errors for chart scaling
  const maxErrors = recentSessions.length > 0
    ? Math.max(...recentSessions.map((s) => s.totalErrors), 1)
    : 1;

  // Get error breakdown sorted by count
  const errorBreakdown = Object.entries(stats.errorsByType)
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  const totalErrorsForPercentage = errorBreakdown.reduce((sum, [, count]) => sum + count, 0) || 1;

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatFullDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#1abc9c] border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-[#2c3e50] text-white flex flex-col">
        <div className="p-6 bg-[#1a252f]">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-[#1abc9c]">Steno</span>Proof
          </h1>
          <p className="text-xs text-gray-400 mt-1">AI Transcript Proofreading</p>
        </div>

        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#34495e] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <span>Dashboard</span>
            </Link>
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#34495e] transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>History</span>
              {sessions.length > 0 && (
                <span className="ml-auto text-xs bg-[#1abc9c] text-white px-2 py-0.5 rounded-full">
                  {sessions.length}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1a252f] text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Analytics</span>
            </div>
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

        <div className="p-4 border-t border-[#34495e]">
          <p className="text-xs text-gray-500 text-center">
            Compatible with CaseCatalyst,<br />Eclipse, ProCAT & more
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-[#f5f7fa]">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Analytics</h1>
              <p className="text-gray-500 mt-1">Track your progress and identify patterns</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-auto">
          {sessions.length === 0 ? (
            /* Empty State */
            <div className="max-w-xl mx-auto">
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">No Analytics Yet</h2>
                <p className="text-gray-500 mb-6">
                  Process some transcripts to start seeing your analytics data here.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[#1abc9c] hover:bg-[#16a085] text-white rounded-lg font-medium transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload Transcript
                </Link>
              </div>
            </div>
          ) : (
            <>
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-6 mb-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalPages.toLocaleString()}</p>
                  <p className="text-sm text-gray-500">Pages Processed</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalErrors}</p>
                  <p className="text-sm text-gray-500">Total Errors Found</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{stats.errorRate.toFixed(2)}%</p>
                  <p className="text-sm text-gray-500">Error Rate</p>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-gray-800">{stats.totalTranscripts}</p>
                  <p className="text-sm text-gray-500">Transcripts Reviewed</p>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-3 gap-6 mb-6">
                {/* Error Trend Chart */}
                <div className="col-span-2 bg-white rounded-xl shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Errors by Session</h3>
                    <p className="text-sm text-gray-400">Last {recentSessions.length} transcripts</p>
                  </div>
                  <div className="p-6">
                    {recentSessions.length > 0 ? (
                      <div className="flex items-end justify-between h-48 gap-4">
                        {recentSessions.map((session, i) => (
                          <div key={session.id} className="flex-1 flex flex-col items-center gap-2">
                            <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: "160px" }}>
                              <div
                                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1abc9c] to-[#1abc9c]/70 rounded-t-lg transition-all duration-500"
                                style={{ height: `${(session.totalErrors / maxErrors) * 100}%` }}
                              />
                              <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-medium text-gray-600">
                                {session.totalErrors}
                              </div>
                            </div>
                            <p className="text-xs text-gray-400 truncate max-w-full" title={formatDate(session.timestamp)}>
                              {formatDate(session.timestamp)}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-gray-400">
                        No data yet
                      </div>
                    )}
                  </div>
                </div>

                {/* Error Types Breakdown */}
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-800">Error Types</h3>
                  </div>
                  <div className="p-6">
                    {errorBreakdown.length > 0 ? (
                      <div className="space-y-4">
                        {errorBreakdown.slice(0, 6).map(([type, count]) => {
                          const percentage = Math.round((count / totalErrorsForPercentage) * 100);
                          return (
                            <div key={type}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700">
                                  {ERROR_TYPE_LABELS[type as ErrorType] || type}
                                </span>
                                <span className="text-sm text-gray-500">{count}</span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2">
                                <div
                                  className="bg-[#1abc9c] h-2 rounded-full transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-gray-400">
                        No errors recorded
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Transcripts */}
              <div className="bg-white rounded-xl shadow-sm">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-800">Recent Transcripts</h3>
                  <Link href="/" className="text-sm text-[#1abc9c] hover:underline">
                    View all
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                        <th className="px-6 py-3">File Name</th>
                        <th className="px-6 py-3">Date</th>
                        <th className="px-6 py-3">Pages</th>
                        <th className="px-6 py-3">Errors</th>
                        <th className="px-6 py-3">Error Rate</th>
                        <th className="px-6 py-3">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {sessions.slice(0, 10).map((session) => {
                        const errorRate = session.pagesProcessed > 0
                          ? ((session.totalErrors / session.pagesProcessed) * 100).toFixed(2)
                          : "0.00";
                        return (
                          <tr key={session.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-[#1abc9c]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <svg className="w-4 h-4 text-[#1abc9c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <span className="font-medium text-gray-800 truncate max-w-[200px]">
                                  {session.fileName}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {formatFullDate(session.timestamp)}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                              {session.pagesProcessed}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                session.totalErrors === 0
                                  ? "bg-green-100 text-green-800"
                                  : session.totalErrors < 5
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}>
                                {session.totalErrors}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {errorRate}%
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {(session.processingTime / 1000).toFixed(1)}s
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
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
