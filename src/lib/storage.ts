import { ProofreadingResult, ErrorType } from "@/types";

export interface ProofreadingSession {
  id: string;
  fileName: string;
  timestamp: string;
  pagesProcessed: number;
  totalErrors: number;
  processingTime: number;
  errorsByType: Record<ErrorType, number>;
}

const STORAGE_KEY = "stenoproof_sessions";

export function saveSessions(sessions: ProofreadingSession[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
}

export function loadSessions(): ProofreadingSession[] {
  if (typeof window === "undefined") return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addSession(
  fileName: string,
  result: ProofreadingResult
): ProofreadingSession {
  const sessions = loadSessions();
  const newSession: ProofreadingSession = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    fileName,
    timestamp: new Date().toISOString(),
    pagesProcessed: result.pagesProcessed,
    totalErrors: result.summary.totalErrors,
    processingTime: result.processingTime,
    errorsByType: result.summary.byType,
  };

  // Keep last 100 sessions
  const updatedSessions = [newSession, ...sessions].slice(0, 100);
  saveSessions(updatedSessions);
  return newSession;
}

export function clearSessions(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

// Aggregate stats from all sessions
export function getAggregateStats(sessions: ProofreadingSession[]) {
  if (sessions.length === 0) {
    return {
      totalPages: 0,
      totalErrors: 0,
      totalTranscripts: 0,
      errorRate: 0,
      errorsByType: {} as Record<ErrorType, number>,
    };
  }

  const totalPages = sessions.reduce((sum, s) => sum + s.pagesProcessed, 0);
  const totalErrors = sessions.reduce((sum, s) => sum + s.totalErrors, 0);

  // Aggregate errors by type
  const errorsByType: Record<string, number> = {};
  sessions.forEach((session) => {
    Object.entries(session.errorsByType).forEach(([type, count]) => {
      errorsByType[type] = (errorsByType[type] || 0) + count;
    });
  });

  return {
    totalPages,
    totalErrors,
    totalTranscripts: sessions.length,
    errorRate: totalPages > 0 ? (totalErrors / totalPages) * 100 : 0,
    errorsByType: errorsByType as Record<ErrorType, number>,
  };
}
