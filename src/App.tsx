import { useEffect, useState } from 'react';
import { AppShell } from './components/AppShell';
import Dashboard from './pages/Dashboard';
import { Login } from './pages/Login';
import { WorkspaceRouter } from './pages/WorkspaceRouter';
import { WorkspaceStore, useWorkspace } from './data/WorkspaceStore';
import { loadPreviewSession, savePreviewSession, type PreviewSession } from './data/demoRepository';
import { pages } from './data/pages';
import { schools as fixtures, DEMO_DAY } from './domain/dashboard';
import { go } from './lib/routes';
import { Confirm, Message } from './components/workspace';

function currentRoute(){const hash=window.location.hash.replace(/^#\/?/,'');const direct=decodeURIComponent(window.location.pathname).replace(/^\//,'');return hash||(pages.some(page=>page.path===direct)?direct+window.location.search:'admin.html');}
const defaultPreview:PreviewSession={role:'admin',name:'Aditi Sharma',email:'admin@maplewood.example'};
export default function App(){return <WorkspaceStore><PreviewApp /></WorkspaceStore>;}
function PreviewApp(){
  const {state,reset,storageWarning}=useWorkspace();const [route,setRoute]=useState(currentRoute);const path=route.split('?')[0];const [session,setSession]=useState<PreviewSession|null>(()=>loadPreviewSession()||defaultPreview);const [schoolId,setSchoolId]=useState('maplewood');const [resetOpen,setResetOpen]=useState(false);
  useEffect(()=>{const handler=()=>setRoute(currentRoute());window.addEventListener('hashchange',handler);return()=>window.removeEventListener('hashchange',handler);},[]);
  useEffect(()=>{document.title=`ShalaTrack · ${pages.find(page=>page.path===path)?.title||'School overview'}`;},[path]);
  function enter(value:PreviewSession){const teacher=state.teachers.find(row=>row.schoolId===schoolId&&row.email.toLowerCase()===value.email.toLowerCase());const next={...value,name:value.role==='teacher'?teacher?.name||state.teachers.find(row=>row.schoolId===schoolId)?.name||value.name:value.name};savePreviewSession(next);setSession(next);go(next.role==='admin'?'admin.html':'teacher-screens/teacher-dashboard.html');}
  function signOut(){savePreviewSession(null);setSession(null);go('index.html');}
  if(path==='index.html'||!session)return <Login onEnter={enter} />;
  const schools=fixtures.map(fixture=>{const activeTeachers=state.teachers.filter(row=>row.schoolId===fixture.id&&row.status==='active');const teacherIds=new Set(activeTeachers.map(row=>row.id));return{...fixture,students:state.students.filter(row=>row.schoolId===fixture.id&&row.status==='active').length,teachers:activeTeachers.length,classes:state.classes.filter(row=>row.schoolId===fixture.id&&row.status==='active').length,teacherPresent:state.checkIns.filter(row=>row.schoolId===fixture.id&&teacherIds.has(row.teacherId)&&row.schoolDate===DEMO_DAY&&row.status==='present').length,teacherAbsent:state.checkIns.filter(row=>row.schoolId===fixture.id&&teacherIds.has(row.teacherId)&&row.schoolDate===DEMO_DAY&&row.status==='absent').length};});
  const school=schools.find(row=>row.id===schoolId)!;const teacherProfile=state.teachers.find(row=>row.schoolId===schoolId&&row.email.toLowerCase()===session.email.toLowerCase())||state.teachers.find(row=>row.schoolId===schoolId);const teacherId=teacherProfile?.id||'';const year=state.years.find(row=>row.schoolId===schoolId&&row.status==='current')?.label||'2026-27';
  const visibleNotices=state.notices.filter(row=>row.schoolId===schoolId&&(session.role==='admin'||row.audience==='all_teachers'||row.teacherIds.includes(teacherId))).sort((a,b)=>b.publishedAt.localeCompare(a.publishedAt));
  return <><AppShell path={path} school={school} schools={schools} session={session} onSignOut={signOut} onSchoolChange={value=>{setSchoolId(value);go(session.role==='admin'?'admin.html':'teacher-screens/teacher-dashboard.html');}} onReset={()=>setResetOpen(true)} academicYear={year} notices={visibleNotices}>
    {storageWarning&&<Message error>Browser storage is unavailable. Your sample changes will last only for this session.</Message>}
    {session.role==='teacher'&&teacherProfile?.status==='archived'?<div className="page-content"><h1>Teacher profile archived</h1><p>This sample account is inactive. Use another sample teacher account or restore the profile in the administrator preview.</p></div>:path==='admin.html'&&session.role==='admin'?<Dashboard key={school.id} school={school} sessions={state.sessions.filter(row=>row.schoolId===schoolId&&row.schoolDate===DEMO_DAY)} onNoticeOpen={()=>go('teacher-screens/notice-details.html',{id:visibleNotices[0]?.id||''})} />:<WorkspaceRouter key={`${schoolId}:${route}`} path={path} school={school} session={session} teacherId={teacherId} onSignOut={signOut} />}
  </AppShell><Confirm open={resetOpen} onClose={()=>setResetOpen(false)} title="Reset the sample workspace?" description="This resets only the redesign’s fictional records for both sample schools. Original files, original browser-session keys and Firebase remain untouched." label="Reset fictional data" onConfirm={()=>{reset();go(session.role==='admin'?'admin.html':'teacher-screens/teacher-dashboard.html');}} /></>;
}
