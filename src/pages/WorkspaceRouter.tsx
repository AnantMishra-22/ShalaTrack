import type { DemoSchool } from '../domain/dashboard';
import type { PreviewSession } from '../data/demoRepository';
import { ServiceStudentsPage, StudentDetailsPage } from './StudentServicePages';
import { EntityEditor, EntityList, type EntityKind } from './RecordsPages';
import { TimetablePage, AcademicYearsPage, AssignedClassesPage, AssignedSubjectsPage } from './AcademicPages';
import { StudentAttendancePage, CorrectionsPage, AttendanceHistoryPage, TeacherAttendancePage, QrDisplayPage, SelfAttendancePage, AbsentAlertsPage } from './AttendancePages';
import { FeeDashboardPage, FeeStructurePage, FeeCollectionPage, FeeHistoryPage } from './FeePages';
import { NoticesPage, CreateNoticePage, NoticeDetailsPage, BroadcastPage } from './CommunicationPages';
import { ReportsHub, ReportPage, TeacherReportsPage } from './ReportPages';
import { ProfilePage, TeacherDashboard } from './ProfilePages';
import { WorkspacePage, EmptyState, BackButton } from '../components/workspace';

export function WorkspaceRouter({path,school,session,teacherId,onSignOut}:{path:string;school:DemoSchool;session:PreviewSession;teacherId:string;onSignOut:()=>void}){
  const teacher=session.role==='teacher';
  if(teacher&&!path.startsWith('teacher-screens/'))return <WorkspacePage title="Teacher workspace" description="This page is for school administrators." action={<BackButton path="teacher-screens/teacher-dashboard.html" label="Teacher overview" />}><EmptyState title="Use your assigned teacher pages" description="Administrator actions are available in the separate admin preview." /></WorkspacePage>;
  const editor=path.match(/^(add|edit)-(student|teacher|class|subject)\.html$/);
  if(editor)return <EntityEditor kind={editor[2] as EntityKind} edit={editor[1]==='edit'} school={school} />;
  switch(path){
    case 'hostel-students.html':return <ServiceStudentsPage school={school} service="hostel" />;
    case 'transport-students.html':return <ServiceStudentsPage school={school} service="transport" />;
    case 'student-details.html':return <StudentDetailsPage school={school} />;
    case 'students.html':return <EntityList kind="student" school={school} />;
    case 'teachers.html':return <EntityList kind="teacher" school={school} />;
    case 'classses.html':return <EntityList kind="class" school={school} />;
    case 'subjects.html':return <EntityList kind="subject" school={school} />;
    case 'timetable':return <TimetablePage school={school} />;
    case 'academic-years':return <AcademicYearsPage school={school} />;
    case 'attendance.html':return <TeacherAttendancePage school={school} />;
    case 'attendance-corrections':return <CorrectionsPage school={school} />;
    case 'qr-display':return <QrDisplayPage school={school} />;
    case 'fee-dashboard.html':return <FeeDashboardPage school={school} />;
    case 'fee-structure.html':return <FeeStructurePage school={school} />;
    case 'fee-collection.html':return <FeeCollectionPage school={school} />;
    case 'fee-history.html':return <FeeHistoryPage school={school} />;
    case 'notices.html':return <NoticesPage school={school} />;
    case 'create-notice.html':return <CreateNoticePage school={school} />;
    case 'whatsapp.html':return <BroadcastPage school={school} />;
    case 'reports.html':return <ReportsHub school={school} />;
    case 'student-reports.html':return <ReportPage school={school} kind="student" />;
    case 'teacher-reports.html':return <ReportPage school={school} kind="teacher" />;
    case 'class-reports.html':return <ReportPage school={school} kind="class" />;
    case 'attendance-reports.html':return <ReportPage school={school} kind="attendance" />;
    case 'profile.html':return <ProfilePage school={school} session={session} onSignOut={onSignOut} />;
    case 'teacher-screens/teacher-dashboard.html':return <TeacherDashboard school={school} teacherId={teacherId} />;
    case 'teacher-screens/assigned-classes.html':return <AssignedClassesPage school={school} teacherId={teacherId} />;
    case 'teacher-screens/assigned-subjects.html':return <AssignedSubjectsPage school={school} teacherId={teacherId} />;
    case 'teacher-screens/student-attendance.html':return <StudentAttendancePage school={school} teacherId={teacherId} />;
    case 'teacher-screens/self-attendance.html':return <SelfAttendancePage school={school} teacherId={teacherId} />;
    case 'teacher-screens/attendance-history.html':return <AttendanceHistoryPage school={school} teacherId={teacherId} />;
    case 'teacher-screens/absent-alerts.html':return <AbsentAlertsPage school={school} teacherId={teacherId} />;
    case 'teacher-screens/reports.html':return <TeacherReportsPage school={school} teacherId={teacherId} />;
    case 'teacher-screens/teacher-notices.html':return <NoticesPage school={school} teacherId={teacherId} />;
    case 'teacher-screens/notice-details.html':return <NoticeDetailsPage school={school} teacherId={teacher?teacherId:undefined} />;
    case 'teacher-screens/teacher-profile.html':return <ProfilePage school={school} session={session} teacherId={teacherId} onSignOut={onSignOut} />;
    default:return <WorkspacePage title="Page not found" description="Choose a page from the school navigation." action={<BackButton path={teacher?'teacher-screens/teacher-dashboard.html':'admin.html'} label="Overview" />}><EmptyState title="This destination is not available" /></WorkspacePage>;
  }
}
