export type AttendanceStatus = 'submitted' | 'pending';
export type SchoolRole = 'admin' | 'teacher';
export interface PeriodSession {
  id: string;
  schoolId: string;
  className: string;
  teacher: string;
  subject: string;
  period: number;
  rosterSize: number;
  status: AttendanceStatus;
  present: number;
  absent: number;
  late: number;
  submittedAt?: string;
}
export interface DemoSchool {
  id: string;
  name: string;
  initials: string;
  location: string;
  students: number;
  teachers: number;
  classes: number;
  teacherPresent: number;
  teacherAbsent: number;
}

export function summarizeAttendance(sessions: readonly PeriodSession[], schoolId: string) {
  const scoped = sessions.filter(session => session.schoolId === schoolId);
  const submitted = scoped.filter(session => session.status === 'submitted');
  const total = submitted.reduce((sum, session) => ({
    present: sum.present + session.present,
    absent: sum.absent + session.absent,
    late: sum.late + session.late,
    marked: sum.marked + session.rosterSize,
  }), { present: 0, absent: 0, late: 0, marked: 0 });
  return {
    ...total,
    percentage: total.marked ? ((total.present + total.late) / total.marked * 100).toFixed(1) : null,
    submitted: submitted.length,
    due: scoped.length,
    pending: scoped.length - submitted.length,
  };
}

export const DEMO_DAY = '2026-11-02';
export const DEMO_TIME = '10:35 AM';
export const schools: DemoSchool[] = [
  { id: 'maplewood', name: 'Maplewood Public School', initials: 'MP', location: 'Pune, Maharashtra', students: 200, teachers: 12, classes: 8, teacherPresent: 10, teacherAbsent: 1 },
  { id: 'riverdale', name: 'Riverdale Academy', initials: 'RA', location: 'Nashik, Maharashtra', students: 180, teachers: 10, classes: 8, teacherPresent: 9, teacherAbsent: 0 },
];
const teachers = ['Kavya Rao', 'Arjun Desai', 'Meera Shah', 'Rohan Kulkarni', 'Ananya Joshi', 'Nikhil Patil', 'Sara Thomas', 'Dev Menon'];
const subjects = ['English', 'Mathematics', 'Science', 'Social studies', 'Hindi', 'English', 'Mathematics', 'Science'];
export const demoSessions: PeriodSession[] = schools.flatMap((school, schoolIndex) =>
  Array.from({ length: 24 }, (_, index) => {
    const classIndex = index % 8;
    const period = Math.floor(index / 8) + 1;
    const submitted = index < (schoolIndex ? 23 : 22);
    const rosterSize = schoolIndex ? (classIndex < 4 ? 23 : 22) : 25;
    const absent = submitted ? (index < 4 ? 2 : 1) : 0;
    const late = submitted && index < 3 ? 1 : 0;
    return {
      id: `${school.id}-2026-11-02-p${period}-class${classIndex + 1}`,
      schoolId: school.id,
      className: `Class ${classIndex + 1} A`,
      teacher: teachers[classIndex], subject: subjects[classIndex], period, rosterSize,
      status: submitted ? 'submitted' : 'pending',
      present: submitted ? rosterSize - absent - late : 0,
      absent, late,
      submittedAt: submitted ? `10:${String(21 + classIndex).padStart(2, '0')} AM` : undefined,
    } satisfies PeriodSession;
  }),
);
