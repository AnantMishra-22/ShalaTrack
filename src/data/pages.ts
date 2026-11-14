export interface PageDefinition {
  path: string;
  title: string;
  group: 'Access' | 'People' | 'Academics' | 'Attendance' | 'Fees' | 'Communication' | 'Reports' | 'Account' | 'Teacher';
  features: string[];
  stage: 'built' | 'planned';
}
const page = (path: string, title: string, group: PageDefinition['group'], features: string[], stage: PageDefinition['stage'] = 'built'): PageDefinition => ({ path, title, group, features, stage });

export const originalPages: PageDefinition[] = [
  page('index.html', 'Sign in', 'Access', ['Admin and teacher roles', 'Email and password', 'Password visibility'], 'built'),
  page('admin.html', 'School overview', 'Access', ['School overview', 'Student attendance', 'Module shortcuts', 'Teacher attendance', 'Recent activity'], 'built'),
  page('students.html', 'Students', 'People', ['Student search', 'Class filter', 'Student count', 'Hostel and transport filters', 'Student details', 'Add and edit student']),
  page('add-student.html', 'Add student', 'People', ['Admission number', 'Name and gender', 'Separate class and section selection', 'Guardian name and mobile', 'Hostel and transport enrollment details', 'Validation']),
  page('edit-student.html', 'Edit student', 'People', ['Edit student and service details', 'Save changes', 'Archive and restore confirmation']),
  page('teachers.html', 'Teachers', 'People', ['Teacher search', 'Active teachers', 'Add and edit teacher']),
  page('add-teacher.html', 'Add teacher', 'People', ['Employee code', 'Name and gender', 'Mobile and email', 'Account invitation replacing administrator-set passwords']),
  page('edit-teacher.html', 'Edit teacher', 'People', ['Edit teacher details', 'Reset invitation', 'Archive and restore confirmation']),
  page('classses.html', 'Classes', 'Academics', ['Class and section search', 'Academic year', 'Class teacher', 'Student count', 'Add and edit class']),
  page('add-class.html', 'Add class', 'Academics', ['Grade', 'Section', 'Academic year', 'Class teacher']),
  page('edit-class.html', 'Edit class', 'Academics', ['Edit class', 'Save changes', 'Archive confirmation; preserve history']),
  page('subjects.html', 'Subjects', 'Academics', ['Subject search', 'Code', 'Class', 'Teacher assignment', 'Add and edit subject']),
  page('add-subject.html', 'Add subject', 'Academics', ['Name', 'Code', 'Class and section', 'Assigned teacher', 'Save subject']),
  page('edit-subject.html', 'Edit subject', 'Academics', ['Edit subject', 'Save changes', 'Archive and restore confirmation']),
  page('attendance.html', 'Teacher attendance', 'Attendance', ['Attendance date', 'Teacher statuses', 'Refresh', 'QR verification context']),
  page('fee-dashboard.html', 'Fee overview', 'Fees', ['School fee summary cards', 'Cumulative class totals across sections', 'Student drill-down and fee accounts', 'Category, service and status filters', 'Record payment']),
  page('fee-structure.html', 'Fee structure', 'Fees', ['Academic year', 'Class and fee category', 'Service-specific eligibility', 'Payment schedule', 'Installments', 'Fee totals']),
  page('fee-collection.html', 'Collect fees', 'Fees', ['Student lookup and service filter', 'Hostel and transport profile', 'One-time payable setup and locked discount', 'Category allocations', 'Cash, UPI and bank reference', 'Payment date', 'Print receipt']),
  page('fee-history.html', 'Fee history', 'Fees', ['Search', 'Class, payment mode and date filters', 'Payment details and service filter', 'Receipt lookup']),
  page('notices.html', 'Notices', 'Communication', ['Notice list', 'Audience', 'Published date', 'Create notice']),
  page('create-notice.html', 'Create notice', 'Communication', ['Title and message', 'All or selected teachers', 'Publish confirmation']),
  page('whatsapp.html', 'WhatsApp broadcast', 'Communication', ['Subject and message', 'Recipient count', 'Message preview', 'Send confirmation', 'Delivery results']),
  page('reports.html', 'Reports', 'Reports', ['Report categories', 'School totals', 'Links to detailed reports']),
  page('attendance-reports.html', 'Attendance reports', 'Reports', ['Search and status filters', 'Period attendance coverage', 'PDF and Excel exports']),
  page('class-reports.html', 'Class reports', 'Reports', ['Class search and filter', 'Academic-year filter', 'Class summaries', 'PDF and Excel exports']),
  page('student-reports.html', 'Student reports', 'Reports', ['Student directory', 'Gender and class filters', 'Guardian contacts', 'PDF and Excel export']),
  page('teacher-reports.html', 'Teacher reports', 'Reports', ['Teacher directory', 'Gender and class filters', 'Contact and assignment details', 'PDF and Excel exports']),
  page('profile.html', 'School profile', 'Account', ['School details', 'Administrator identity', 'Sign out']),
  page('teacher-screens/teacher-dashboard.html', 'Teacher dashboard', 'Teacher', ['Assigned classes and subjects', 'Attendance shortcuts', 'Notices', 'Profile']),
  page('teacher-screens/assigned-classes.html', 'Assigned classes', 'Teacher', ['Class search', 'Class roster', 'Attendance shortcut']),
  page('teacher-screens/assigned-subjects.html', 'Assigned subjects', 'Teacher', ['Subject search', 'Classes', 'Teaching assignment']),
  page('teacher-screens/self-attendance.html', 'My attendance', 'Teacher', ['Arrival check-in', 'Rotating QR scan replacing self-selected status', 'Verification result']),
  page('teacher-screens/student-attendance.html', 'Student attendance', 'Teacher', ['Class, date and period selection', 'Student search', 'Mark all present or absent', 'Explicit roster validation', 'Submit confirmation']),
  page('teacher-screens/attendance-history.html', 'Attendance history', 'Teacher', ['Search', 'Class and period history', 'Submission details']),
  page('teacher-screens/absent-alerts.html', 'Absence alerts', 'Teacher', ['Class and student search', 'Refresh', 'Individual and bulk simulation', 'Progress and notification status']),
  page('teacher-screens/reports.html', 'Teacher reports', 'Teacher', ['Class selection', 'Daily PDF', 'Monthly register preview and export', 'Period coverage']),
  page('teacher-screens/teacher-notices.html', 'Teacher notices', 'Teacher', ['Authorized notice list', 'Notice dialog', 'Notice details']),
  page('teacher-screens/notice-details.html', 'Notice details', 'Teacher', ['Full notice', 'Audience and date', 'Back navigation', 'Print']),
  page('teacher-screens/teacher-profile.html', 'Teacher profile', 'Teacher', ['Profile details', 'Assigned subjects and classes', 'Sign out']),
];
export const addedPages: PageDefinition[] = [
  page('hostel-students.html','Hostel students','People',['Hostel enrollment','Class and building filters','Rooms and admission dates','Fee account links']),
  page('transport-students.html','Transport students','People',['Transport enrollment','Class and route filters','Stops and vehicles','Fee account links']),
  page('student-details.html','Student details','People',['Guardian details','Hostel and transport details','Edit enrollment','Fee account links']),
  page('timetable', 'Timetable', 'Academics', ['Academic year', 'Period slots', 'Teacher assignments', 'Schedule conflicts']),
  page('academic-years', 'Academic years', 'Academics', ['Current year', 'Year dates', 'Closed-year history']),
  page('attendance-corrections', 'Attendance corrections', 'Attendance', ['Requested changes', 'Reasons', 'Approval and revision history']),
  page('qr-display', 'School check-in screen', 'Attendance', ['Rotating QR challenge', 'Expiry', 'Sample display status; production registration pending']),
];
export const pages = [...originalPages, ...addedPages];
export const pageHref = (path: string) => `#/${path}`;
