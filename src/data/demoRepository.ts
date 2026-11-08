import { demoSessions, schools, summarizeAttendance, type DemoSchool, type PeriodSession, type SchoolRole } from '../domain/dashboard';

export interface PreviewSession { role: SchoolRole; name: string; email: string; schoolId?: string; }
export interface SchoolRepository {
  listSchools(): Promise<DemoSchool[]>;
  listAttendance(schoolId: string): Promise<PeriodSession[]>;
}
// Replace this adapter with the agreed API later. No database SDK, tokens or network calls.
export const demoRepository: SchoolRepository = {
  async listSchools() { return structuredClone(schools); },
  async listAttendance(schoolId) { return structuredClone(demoSessions.filter(row => row.schoolId === schoolId)); },
};
export { summarizeAttendance };

const SESSION_KEY = 'shalatrack-redesign-preview-session-v1';
export function loadPreviewSession(): PreviewSession | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (value && ['admin', 'teacher'].includes(value.role) && typeof value.name === 'string' && typeof value.email === 'string') return value;
  } catch { /* Corrupt or unavailable local storage must not prevent preview use. */ }
  return null;
}
export function savePreviewSession(value: PreviewSession | null) {
  try {
    if (value) sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
    else sessionStorage.removeItem(SESSION_KEY);
  } catch { /* In-memory session remains available when browser storage is disabled. */ }
}
