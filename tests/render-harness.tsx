import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { WorkspaceStore } from '../src/data/WorkspaceStore';
import { WorkspaceRouter } from '../src/pages/WorkspaceRouter';
import Dashboard from '../src/pages/Dashboard';
import { AppShell } from '../src/components/AppShell';
import { Login } from '../src/pages/Login';
import { schools, demoSessions } from '../src/domain/dashboard';
export function renderRoute(path: string) {
  const school = schools[0];
  const session = {role: path.startsWith('teacher-screens/') ? 'teacher' as const : 'admin' as const, name:'Sample staff', email:'teacher1@maplewood.example'};
  const content = path==='admin.html' ? <Dashboard school={school} sessions={demoSessions} onNoticeOpen={()=>{}} /> : path==='index.html' ? <Login onEnter={()=>{}} /> : <WorkspaceRouter path={path} school={school} session={session} teacherId="maplewood-teacher-1" onSignOut={()=>{}} />;
  return renderToStaticMarkup(<WorkspaceStore>{path==='index.html'?content:<AppShell path={path} school={school} schools={schools} session={session} onSignOut={()=>{}} onSchoolChange={()=>{}} onReset={()=>{}} academicYear="2026-27" notices={[]}>{content}</AppShell>}</WorkspaceStore>);
}
