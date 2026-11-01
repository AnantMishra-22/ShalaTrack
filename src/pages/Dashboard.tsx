import { useRef, useState } from 'react';

import { PageHeading } from '../components/PageHeading';

import { Card } from '../components/ui/card';

import { StatCard } from '../components/ui/stat-card';

import { Button } from '../components/ui/button';

import { Badge } from '../components/ui/badge';

import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '../components/ui/table';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';

import { ArrowRightIcon, BellIcon, BookIcon, CalendarCheckIcon, CandlestickChartIcon, CheckCircleIcon, GraduationCapIcon, GroupIcon, UserIcon, WalletIcon } from '../components/icons';

import { summarizeAttendance, type DemoSchool, type PeriodSession } from '../domain/dashboard';

import { pageHref } from '../data/pages';

import { useWorkspace } from '../data/WorkspaceStore';

import { money } from '../domain/model';



const modules = [

  { title: 'Students', detail: 'Profiles & enrollment', path: 'students.html', icon: GroupIcon },

  { title: 'Teachers', detail: 'Staff & assignments', path: 'teachers.html', icon: UserIcon },

  { title: 'Classes', detail: 'Classes & sections', path: 'classses.html', icon: GraduationCapIcon },

  { title: 'Subjects', detail: 'Subjects & teaching', path: 'subjects.html', icon: BookIcon },

  { title: 'Fees', detail: 'Collections & receipts', path: 'fee-dashboard.html', icon: WalletIcon },

  { title: 'Reports', detail: 'Registers & summaries', path: 'reports.html', icon: CandlestickChartIcon },

  { title: 'Notices', detail: 'Keep your team informed', path: 'notices.html', icon: BellIcon },

  { title: 'WhatsApp', detail: 'Parent announcements', path: 'whatsapp.html', icon: BookIcon },

];



export default function Dashboard({ school, sessions, onNoticeOpen }: { school: DemoSchool; sessions: PeriodSession[]; onNoticeOpen: () => void }) {

  const { state } = useWorkspace();

  const latestPayment = state.payments.filter(row => row.schoolId === school.id).sort((a,b) => b.recordedAt.localeCompare(a.recordedAt))[0];

  const latestNotice = state.notices.filter(row => row.schoolId === school.id).sort((a,b) => b.publishedAt.localeCompare(a.publishedAt))[0];

  const latestSession = sessions.filter(row => row.schoolId === school.id && row.status === 'submitted').at(-1);

  const [period, setPeriod] = useState('3');

  const [filter, setFilter] = useState('all');

  const [selected, setSelected] = useState<PeriodSession | null>(null);

  const recordsRef = useRef<HTMLElement>(null);

  const summary = summarizeAttendance(sessions, school.id);

  const rows = sessions.filter(row => row.schoolId === school.id && row.period === Number(period) && (filter !== 'pending' || row.status === 'pending'));

  const checkInPending = school.teachers - school.teacherPresent - school.teacherAbsent;

  function reviewPending() {

    setPeriod('3'); setFilter('pending');

    recordsRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });

    recordsRef.current?.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true });

  }

  return <div className="page-content dashboard-page">

    <PageHeading title="School overview" description={<>Monday, 2 November 2026<span className="heading-separator">/</span>Good morning, Aditi.</>} action={<Button onClick={reviewPending}><CalendarCheckIcon />Review attendance<ArrowRightIcon /></Button>} />

    <div className="sample-note"><Badge className="demo-badge">Sample data</Badge><span>{school.name}</span><span className="snapshot-time">Snapshot at 10:35 AM</span></div>



    <section className="overview-summary" aria-label="School overview metrics">

      <Card className="attendance-summary"><div className="attendance-summary-main"><div className="attendance-ring" style={{ '--attendance': summary.percentage || '0' } as React.CSSProperties}><CalendarCheckIcon /></div><div><p className="metric-label">Attendance today</p><div className="attendance-value">{summary.percentage || '—'}<span>{summary.percentage ? '%' : ''}</span></div><p className="metric-caption">Across {summary.marked} marked student-periods</p></div></div><div className="attendance-breakdown"><span><i className="status-dot success-dot" />{summary.present} present</span><span><i className="status-dot absent-dot" />{summary.absent} absent</span><span><i className="status-dot warning-dot" />{summary.late} late</span></div></Card>

      <div className="school-counts"><StatCard label="Students" value={school.students} icon={<GroupIcon />} className="school-stat" /><StatCard label="Teachers" value={school.teachers} icon={<UserIcon />} className="school-stat" /><StatCard label="Classes" value={school.classes} icon={<GraduationCapIcon />} className="school-stat" /></div>

    </section>



    <section className="workspace-section" aria-labelledby="workspace-title"><div className="section-heading"><h2 id="workspace-title">Your school workspace</h2><span>Everything, in its place.</span></div><div className="module-grid">{modules.map(module => <Card key={module.path} className="module-card"><Button asChild variant="ghost" className="module-link"><a href={pageHref(module.path)}><span className="module-icon"><module.icon /></span><span className="module-copy"><strong>{module.title}</strong><span>{module.detail}</span></span><ArrowRightIcon className="module-arrow" /></a></Button></Card>)}</div></section>



    <div className="dashboard-lower-grid">

      <section className="attendance-section" aria-labelledby="attendance-title" ref={recordsRef}><div className="section-heading"><div className="section-title-group"><h2 id="attendance-title" tabIndex={-1}>Period attendance</h2><Badge className="neutral-badge">{summary.submitted}/{summary.due} due periods submitted</Badge></div><Select value={period} onValueChange={setPeriod}><SelectTrigger className="period-select" aria-label="Attendance period"><SelectValue /></SelectTrigger><SelectContent>{['1', '2', '3'].map(value => <SelectItem key={value} value={value}>Period {value}</SelectItem>)}</SelectContent></Select></div>

        <Card className="attendance-table-card"><div className="table-toolbar"><span className="table-subtitle">Class submissions</span><div className="table-filters" role="group" aria-label="Attendance submission filter"><Button variant="ghost" size="sm" aria-pressed={filter === 'all'} className={filter === 'all' ? 'filter-active' : ''} onClick={() => setFilter('all')}>All classes</Button><Button variant="ghost" size="sm" aria-pressed={filter === 'pending'} className={filter === 'pending' ? 'filter-active' : ''} onClick={() => setFilter('pending')}>Pending{period === '3' && <span className="filter-count">{summary.pending}</span>}</Button></div></div>

          <Table className="attendance-table"><TableHeader><TableRow><TableHead scope="col">Class</TableHead><TableHead scope="col" className="teacher-column">Teacher</TableHead><TableHead scope="col">Attendance</TableHead><TableHead scope="col">Submission</TableHead><TableHead scope="col" className="action-column"><span className="sr-only">Details</span></TableHead></TableRow></TableHeader><TableBody>{rows.map(row => <TableRow key={row.id}><TableCell><span className="class-name">{row.className}</span><span className="class-subject">{row.subject}</span></TableCell><TableCell className="teacher-column"><span className="teacher-name">{row.teacher}</span></TableCell><TableCell><span className="row-attendance">{row.status === 'submitted' ? `${row.present + row.late}/${row.rosterSize}` : '—'}</span></TableCell><TableCell><Badge className={row.status === 'submitted' ? 'success-badge' : 'warning-badge'}>{row.status === 'submitted' ? <CheckCircleIcon /> : <span className="status-dot warning-dot" />}{row.status === 'submitted' ? 'Submitted' : 'Pending'}</Badge></TableCell><TableCell className="action-column"><Button variant="ghost" size="icon" className="row-action" aria-label={`View ${row.className} period ${row.period} details`} onClick={() => setSelected(row)}><ArrowRightIcon /></Button></TableCell></TableRow>)}{rows.length === 0 && <TableRow><TableCell colSpan={5}><div className="table-empty"><CheckCircleIcon /><strong>All classes have submitted.</strong><span>No pending submissions for period {period}.</span></div></TableCell></TableRow>}</TableBody></Table>

          <div className="table-footnote"><span><i className="status-dot warning-dot" />Pending means unmarked, not absent.</span><span>{rows.length} {rows.length === 1 ? 'class' : 'classes'}</span></div>

        </Card>

        <p className="attendance-definition">Attendance includes present and late marks. Periods not yet submitted are excluded.</p>

      </section>

      <div className="dashboard-right-column"><section aria-labelledby="teacher-attendance-title"><div className="section-heading"><h2 id="teacher-attendance-title">Teacher check-in</h2></div><Card className="teacher-checkin-card"><div className="checkin-heading"><span className="checkin-icon"><UserIcon /></span><span><strong>{school.teacherPresent}<span>/{school.teachers}</span></strong><small>teachers checked in</small></span><Button asChild variant="ghost" size="icon" aria-label="View teacher attendance"><a href={pageHref('attendance.html')}><ArrowRightIcon /></a></Button></div><div className="checkin-bar" role="img" aria-label={`${school.teacherPresent} present, ${school.teacherAbsent} absent, ${checkInPending} not checked in`}><i className="checkin-present" style={{ flex: school.teacherPresent }} />{school.teacherAbsent > 0 && <i className="checkin-absent" style={{ flex: school.teacherAbsent }} />}{checkInPending > 0 && <i className="checkin-pending" style={{ flex: checkInPending }} />}</div><dl className="checkin-legend"><div><dt><i className="status-dot success-dot" />Present</dt><dd>{school.teacherPresent}</dd></div><div><dt><i className="status-dot absent-dot" />Absent</dt><dd>{school.teacherAbsent}</dd></div><div><dt><i className="status-dot neutral-dot" />Not checked in</dt><dd>{checkInPending}</dd></div></dl><Button asChild variant="outline" className="qr-link"><a href={pageHref('qr-display')}>Open school QR screen<ArrowRightIcon /></a></Button></Card></section>

      <section aria-labelledby="recent-activity-title"><div className="section-heading"><h2 id="recent-activity-title">Recent activity</h2></div><Card className="activity-card"><div className="activity-item"><span className="activity-symbol"><CalendarCheckIcon /></span><div><p><strong>{latestSession?.className || 'No class'}</strong> {latestSession ? 'submitted attendance' : 'submissions yet'}</p><span>Period {latestSession?.period || '—'} <span className="activity-time">{latestSession?.submittedAt}</span></span></div></div><div className="activity-item"><span className="activity-symbol"><WalletIcon /></span><div><p>Fee receipt recorded</p><span>{latestPayment ? money(latestPayment.amountPaise) : 'No payments yet'} <span className="activity-time">{latestPayment?.paymentDate}</span></span></div></div><div className="activity-item"><span className="activity-symbol"><BellIcon /></span><div><Button variant="link" className="activity-notice-link" onClick={onNoticeOpen}>{latestNotice?.title || 'School notices'}</Button><span>{latestNotice?.audience === 'all_teachers' ? 'All teachers' : 'Selected teachers'}</span></div></div></Card></section>

      </div>

    </div>

    <Dialog open={!!selected} onOpenChange={open => { if (!open) setSelected(null); }}><DialogContent className="attendance-detail-dialog">{selected && <><DialogHeader><DialogTitle>{selected.className} attendance</DialogTitle><DialogDescription>Period {selected.period}, Monday 2 November 2026</DialogDescription></DialogHeader><Badge className={selected.status === 'submitted' ? 'success-badge' : 'warning-badge'}>{selected.status === 'submitted' ? 'Submitted' : 'Pending submission'}</Badge><dl className="session-detail-list"><div><dt>Teacher</dt><dd>{selected.teacher}</dd></div><div><dt>Subject</dt><dd>{selected.subject}</dd></div><div><dt>Students on roster</dt><dd>{selected.rosterSize}</dd></div>{selected.status === 'submitted' ? <><div><dt>Present</dt><dd>{selected.present}</dd></div><div><dt>Absent</dt><dd>{selected.absent}</dd></div><div><dt>Late</dt><dd>{selected.late}</dd></div><div><dt>Submitted at</dt><dd>{selected.submittedAt}</dd></div></> : <div><dt>Attendance</dt><dd>Not marked</dd></div>}</dl><p className="subtle-note">Sample record. No real school data is connected.</p><Button onClick={() => setSelected(null)}>Close details</Button></>}</DialogContent></Dialog>

  </div>;

}

