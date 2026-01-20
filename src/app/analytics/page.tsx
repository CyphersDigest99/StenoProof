"use client";

import { useState } from "react";
import Link from "next/link";

// Mock data for demo
const mockWeeklyData = [
  { week: "Week 1", errors: 42, pages: 320 },
  { week: "Week 2", errors: 38, pages: 285 },
  { week: "Week 3", errors: 35, pages: 310 },
  { week: "Week 4", errors: 29, pages: 290 },
  { week: "Week 5", errors: 31, pages: 340 },
  { week: "Week 6", errors: 24, pages: 305 },
  { week: "Week 7", errors: 22, pages: 325 },
  { week: "Week 8", errors: 18, pages: 298 },
];

const mockCommonErrors = [
  { type: "Missing letters", count: 89, percentage: 28, trend: "down" },
  { type: "your/you confusion", count: 54, percentage: 17, trend: "down" },
  { type: "Subject-verb agreement", count: 41, percentage: 13, trend: "same" },
  { type: "Punctuation (MR./MR,)", count: 38, percentage: 12, trend: "down" },
  { type: "Repeated words", count: 29, percentage: 9, trend: "up" },
  { type: "Missing words", count: 24, percentage: 8, trend: "down" },
  { type: "Untranslated steno", count: 19, percentage: 6, trend: "down" },
  { type: "Other", count: 22, percentage: 7, trend: "same" },
];

const mockRecentTranscripts = [
  { name: "Johnson v. State - Vol 3", date: "Jan 19, 2026", pages: 187, errors: 12, status: "complete" },
  { name: "Davi Deposition - Vol 2", date: "Jan 19, 2026", pages: 254, errors: 42, status: "complete" },
  { name: "Davi Deposition - Vol 1", date: "Jan 18, 2026", pages: 103, errors: 27, status: "complete" },
  { name: "Martinez Hearing", date: "Jan 17, 2026", pages: 89, errors: 8, status: "complete" },
  { name: "Thompson Trial Day 4", date: "Jan 16, 2026", pages: 312, errors: 31, status: "complete" },
];

const mockInsights = [
  {
    title: "Great improvement!",
    description: "Your error rate dropped 34% over the last 8 weeks.",
    icon: "trending_down",
    color: "green",
  },
  {
    title: "Watch for: Missing letters",
    description: "Words like 'be' often appear as 'b' or 'e'. Consider adding a dictionary entry.",
    icon: "lightbulb",
    color: "yellow",
  },
  {
    title: "Consistency improving",
    description: "Punctuation errors (MR./MR,) decreased 45% this month.",
    icon: "check_circle",
    color: "blue",
  },
];

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");

  // Calculate max for chart scaling
  const maxErrors = Math.max(...mockWeeklyData.map((d) => d.errors));
  const totalErrors = mockWeeklyData.reduce((sum, d) => sum + d.errors, 0);
  const totalPages = mockWeeklyData.reduce((sum, d) => sum + d.pages, 0);
  const avgErrorRate = ((totalErrors / totalPages) * 100).toFixed(2);

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
            <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#34495e] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>History</span>
              <span className="ml-auto text-xs bg-[#1abc9c] text-white px-2 py-0.5 rounded-full">Soon</span>
            </a>
            <Link
              href="/analytics"
              className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[#1a252f] text-white"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Analytics</span>
            </Link>
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
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              {(["week", "month", "year"] as const).map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    timeRange === range
                      ? "bg-white text-gray-800 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {range.charAt(0).toUpperCase() + range.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 overflow-auto">
          {/* Demo Banner */}
          <div className="bg-gradient-to-r from-[#1abc9c] to-[#16a085] text-white rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold">Demo Data</p>
                <p className="text-sm text-white/80">This shows sample analytics. Your real data will appear here after processing transcripts.</p>
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">+12%</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{totalPages.toLocaleString()}</p>
              <p className="text-sm text-gray-500">Pages Processed</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">-34%</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{totalErrors}</p>
              <p className="text-sm text-gray-500">Total Errors</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">-0.05</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{avgErrorRate}%</p>
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
              <p className="text-2xl font-bold text-gray-800">47</p>
              <p className="text-sm text-gray-500">Transcripts Reviewed</p>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-3 gap-6 mb-6">
            {/* Error Trend Chart */}
            <div className="col-span-2 bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Error Trend</h3>
                <p className="text-sm text-gray-400">Last 8 weeks</p>
              </div>
              <div className="p-6">
                <div className="flex items-end justify-between h-48 gap-4">
                  {mockWeeklyData.map((data, i) => (
                    <div key={i} className="flex-1 flex flex-col items-center gap-2">
                      <div className="w-full bg-gray-100 rounded-t-lg relative" style={{ height: "160px" }}>
                        <div
                          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[#1abc9c] to-[#1abc9c]/70 rounded-t-lg transition-all duration-500"
                          style={{ height: `${(data.errors / maxErrors) * 100}%` }}
                        />
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-sm font-medium text-gray-600">
                          {data.errors}
                        </div>
                      </div>
                      <p className="text-xs text-gray-400">{data.week.replace("Week ", "W")}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Insights */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Insights</h3>
              </div>
              <div className="p-4 space-y-3">
                {mockInsights.map((insight, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-lg ${
                      insight.color === "green"
                        ? "bg-green-50"
                        : insight.color === "yellow"
                        ? "bg-yellow-50"
                        : "bg-blue-50"
                    }`}
                  >
                    <p className={`font-medium text-sm ${
                      insight.color === "green"
                        ? "text-green-700"
                        : insight.color === "yellow"
                        ? "text-yellow-700"
                        : "text-blue-700"
                    }`}>
                      {insight.title}
                    </p>
                    <p className={`text-xs mt-1 ${
                      insight.color === "green"
                        ? "text-green-600"
                        : insight.color === "yellow"
                        ? "text-yellow-600"
                        : "text-blue-600"
                    }`}>
                      {insight.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-3 gap-6">
            {/* Common Errors */}
            <div className="col-span-2 bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800">Most Common Errors</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {mockCommonErrors.map((error, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <div className="w-8 text-center">
                        <span className="text-sm font-medium text-gray-400">#{i + 1}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">{error.type}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{error.count}</span>
                            {error.trend === "down" && (
                              <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                              </svg>
                            )}
                            {error.trend === "up" && (
                              <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                            )}
                            {error.trend === "same" && (
                              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-[#1abc9c] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${error.percentage}%` }}
                          />
                        </div>
                      </div>
                      <div className="w-12 text-right">
                        <span className="text-sm text-gray-400">{error.percentage}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Transcripts */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">Recent</h3>
                <a href="#" className="text-sm text-[#1abc9c] hover:underline">View all</a>
              </div>
              <div className="divide-y divide-gray-50">
                {mockRecentTranscripts.slice(0, 4).map((transcript, i) => (
                  <div key={i} className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-800 truncate">{transcript.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-400">{transcript.date}</span>
                      <span className="text-xs text-gray-500">{transcript.errors} errors</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
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
