import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createDemoState } from './seed';
import { migrateWorkspace } from '../domain/parity';
import { id, type DemoState } from '../domain/model';
export const WORKSPACE_KEY = 'shalatrack-redesign-workspace-v2';
function valid(value: unknown): value is DemoState {
  if (!value || typeof value !== 'object') return false;
  const data = value as DemoState;
  return data.schema === 2 && ['students','teachers','classes','subjects','assignments','years','slots','sessions','corrections','challenges','checkIns','feePlans','assessments','concessions','payments','reversals','ledger','notices','deliveries','audit'].every(key => Array.isArray(data[key as keyof DemoState]));
}
function load() { try { const data: unknown = JSON.parse(localStorage.getItem(WORKSPACE_KEY) || 'null'); if (valid(data)) return migrateWorkspace(data); } catch { /* use a fresh isolated fixture */ } return migrateWorkspace(createDemoState()); }
function otherSchools(data: DemoState, schoolId: string) {
  return JSON.stringify(Object.entries(data).filter(([, rows]) => Array.isArray(rows)).map(([name, rows]) => [name, (rows as {schoolId:string}[]).filter(row => row.schoolId !== schoolId)]));
}
interface Store {
  state: DemoState;
  commit: <T>(schoolId: string, action: string, detail: string, operation: (draft: DemoState) => T) => T;
  reset: () => void;
  storageWarning: boolean;
}
const Context = createContext<Store | null>(null);
export function WorkspaceStore({ children }: { children: ReactNode }) {
  const [state, setState] = useState(load);
  const [storageWarning, setStorageWarning] = useState(false);
  const current = useRef(state);
  useEffect(() => {
    try { localStorage.setItem(WORKSPACE_KEY, JSON.stringify(state)); setStorageWarning(false); }
    catch { setStorageWarning(true); }
  }, [state]);
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key !== WORKSPACE_KEY || !event.newValue) return;
      try { const next: unknown = JSON.parse(event.newValue); if (valid(next)) { const migrated = migrateWorkspace(next); current.current = migrated; setState(migrated); } } catch { /* Ignore invalid external preview values. */ }
    };
    window.addEventListener('storage', handler); return () => window.removeEventListener('storage', handler);
  }, []);
  function commit<T>(schoolId: string, action: string, detail: string, operation: (draft: DemoState) => T): T {
    const previous = current.current;
    const draft = structuredClone(previous);
    const result = operation(draft);
    if (otherSchools(previous, schoolId) !== otherSchools(draft, schoolId)) throw new Error('This change references a different sample school.');
    draft.audit.unshift({ id: id('audit'), schoolId, action, detail, at: new Date().toISOString() });
    current.current = draft; setState(draft);
    return result;
  }
  function reset() { const next = migrateWorkspace(createDemoState()); current.current = next; setState(next); }
  return <Context.Provider value={{ state, commit, reset, storageWarning }}>{children}</Context.Provider>;
}
export function useWorkspace() { const value = useContext(Context); if (!value) throw new Error('Workspace provider is missing.'); return value; }
