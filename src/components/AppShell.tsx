import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Brand } from './Brand';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarItem, SidebarProvider } from './ui/sidebar';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Notification } from './ui/notification';
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from './ui/command';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { ArrowDownIcon, ArrowLeftIcon, ArrowRightIcon, BellIcon, BookIcon, BookStackIcon, CalendarIcon, CalendarCheckIcon, CandlestickChartIcon, GraduationCapIcon, GroupIcon, HomeIcon, MenuIcon, SearchIcon, UserIcon, WalletIcon, CheckIcon } from './icons';
import type { DemoSchool } from '../domain/dashboard';
import type { PreviewSession } from '../data/demoRepository';
import { pages } from '../data/pages';
import type { Notice } from '../domain/model';

const navigation = [
  { label: 'Overview', path: 'admin.html', icon: HomeIcon, group: 'main' },
  { label: 'Students', path: 'students.html', icon: GroupIcon, group: 'main' },
  { label: 'Teachers', path: 'teachers.html', icon: UserIcon, group: 'main' },
  { label: 'Classes', path: 'classses.html', icon: GraduationCapIcon, group: 'main' },
  { label: 'Subjects', path: 'subjects.html', icon: BookIcon, group: 'main' },
  { label: 'Timetable', path: 'timetable', icon: CalendarIcon, group: 'main' },
  { label: 'Attendance', path: 'attendance.html', icon: CalendarCheckIcon, group: 'main' },
  { label: 'Fees', path: 'fee-dashboard.html', icon: WalletIcon, group: 'school' },
  { label: 'Reports', path: 'reports.html', icon: CandlestickChartIcon, group: 'school' },
  { label: 'Notices', path: 'notices.html', icon: BellIcon, group: 'school' },
  { label: 'WhatsApp', path: 'whatsapp.html', icon: BookStackIcon, group: 'school' },
];

export function AppShell({ children, path, school, schools, onSchoolChange, session, onSignOut, onReset, academicYear, notices }: {
  children: ReactNode; path: string; school: DemoSchool; schools: DemoSchool[];
  onSchoolChange: (id: string) => void; session: PreviewSession; onSignOut: () => void; onReset: () => void; academicYear: string; notices: Notice[];
}) {
  const [mobileNav, setMobileNav] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [read, setRead] = useState(false);
  const mainRef = useRef<HTMLElement>(null);
  const lastPath = useRef(path);
  const teacher = session.role === 'teacher';
  const links = teacher ? [
    { label: 'Overview', path: 'teacher-screens/teacher-dashboard.html', icon: HomeIcon, group: 'main' },
    { label: 'My classes', path: 'teacher-screens/assigned-classes.html', icon: GroupIcon, group: 'main' },
    { label: 'My subjects', path: 'teacher-screens/assigned-subjects.html', icon: BookIcon, group: 'main' },
    { label: 'Student attendance', path: 'teacher-screens/student-attendance.html', icon: CalendarCheckIcon, group: 'main' },
    { label: 'My check-in', path: 'teacher-screens/self-attendance.html', icon: CalendarIcon, group: 'main' },
    { label: 'Attendance history', path: 'teacher-screens/attendance-history.html', icon: BookStackIcon, group: 'school' },
    { label: 'Absence alerts', path: 'teacher-screens/absent-alerts.html', icon: BellIcon, group: 'school' },
    { label: 'Reports', path: 'teacher-screens/reports.html', icon: CandlestickChartIcon, group: 'school' },
    { label: 'Notices', path: 'teacher-screens/teacher-notices.html', icon: BellIcon, group: 'school' },
  ] : navigation;
  const allowedPages = pages.filter(page => teacher ? page.group === 'Teacher' : page.group !== 'Teacher');
  const go = (next: string) => { window.location.hash = `/${next}`; setMobileNav(false); setSearchOpen(false); };
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); setSearchOpen(open => !open); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
  useEffect(() => {
    if (lastPath.current !== path) {
      lastPath.current = path;
      mainRef.current?.querySelector<HTMLElement>('h1')?.focus();
      window.scrollTo(0, 0);
    }
  }, [path]);

  const active = (item: string) => path === item || (item === 'students.html' && /^(add|edit)-student/.test(path)) || (item === 'teachers.html' && /^(add|edit)-teacher/.test(path)) || (item === 'classses.html' && /^(add|edit)-class/.test(path)) || (item === 'subjects.html' && /^(add|edit)-subject/.test(path)) || (item === 'fee-dashboard.html' && path.startsWith('fee-')) || (item === 'reports.html' && path.endsWith('-reports.html')) || (item === 'notices.html' && path === 'create-notice.html') || (item === 'attendance.html' && ['attendance-corrections','qr-display'].includes(path));
  const navContent = <>
    <SidebarHeader className="app-sidebar-header"><Brand homePath={teacher ? 'teacher-screens/teacher-dashboard.html' : 'admin.html'} /></SidebarHeader>
    <div className="school-switcher-wrap">
      <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="school-switcher" disabled={teacher} aria-label={`Switch school, current school ${school.name}`}><span className="school-avatar">{school.initials}</span><span className="school-switcher-text">{school.name}<small>{school.location}</small></span><ArrowDownIcon /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="school-switcher-menu"><DropdownMenuLabel>Sample schools</DropdownMenuLabel>{schools.map(item => <DropdownMenuItem key={item.id} onSelect={() => { onSchoolChange(item.id); setMobileNav(false); }}><span className="school-option">{item.name}</span>{school.id === item.id && <CheckIcon className="menu-check" />}</DropdownMenuItem>)}</DropdownMenuContent>
      </DropdownMenu>
    </div>
    <SidebarContent className="app-sidebar-content"><nav aria-label={teacher ? 'Teacher navigation' : 'School navigation'}>{['main', 'school'].map(group => <SidebarGroup key={group} className="app-nav-group">{group === 'school' && <SidebarGroupLabel>School tools</SidebarGroupLabel>}{links.filter(item => item.group === group).map(item => <SidebarItem key={item.path} icon={<item.icon />} active={active(item.path)} aria-current={active(item.path) ? 'page' : undefined} onClick={() => go(item.path)} className="app-nav-item">{item.label}{item.path === 'notices.html' && <span className="nav-count">{notices.length}</span>}</SidebarItem>)}</SidebarGroup>)}</nav></SidebarContent>
    <SidebarFooter className="app-sidebar-footer"><div className="preview-mode"><span />Sample workspace</div><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="profile-trigger" aria-label="Open account menu"><span className="profile-avatar">{teacher ? 'KR' : 'AS'}</span><span className="profile-text">{session.name}<small>{teacher ? 'Teacher' : 'School administrator'}</small></span><ArrowDownIcon /></Button></DropdownMenuTrigger><DropdownMenuContent side="top" align="start" className="account-menu"><DropdownMenuLabel>{session.email}</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => go(teacher ? 'teacher-screens/teacher-profile.html' : 'profile.html')}><UserIcon />Profile</DropdownMenuItem><DropdownMenuItem onSelect={onReset}>Reset sample data</DropdownMenuItem><DropdownMenuItem onSelect={onSignOut}><ArrowLeftIcon />Sign out of preview</DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter>
  </>;

  return <SidebarProvider><div className="app-shell"><a href="#main-content" className="skip-link">Skip to content</a><Sidebar className="app-sidebar desktop-sidebar" aria-label="School sidebar">{navContent}</Sidebar>
    <Dialog open={mobileNav} onOpenChange={setMobileNav}><DialogContent className="mobile-nav-dialog"><DialogHeader className="sr-only"><DialogTitle>School navigation</DialogTitle><DialogDescription>Choose a school page.</DialogDescription></DialogHeader><Sidebar className="app-sidebar mobile-sidebar">{navContent}</Sidebar></DialogContent></Dialog>
    <div className="app-workspace"><header className="app-topbar"><div className="topbar-start"><Button variant="ghost" size="icon" className="mobile-menu-button" onClick={() => setMobileNav(true)} aria-label="Open navigation" aria-expanded={mobileNav}><MenuIcon /></Button><div className="breadcrumb"><span>{teacher ? 'Teacher workspace' : 'School workspace'}</span><ArrowRightIcon /><strong>{pages.find(page => page.path === path)?.title || 'Overview'}</strong></div></div><div className="topbar-actions"><Button variant="ghost" className="global-search" onClick={() => setSearchOpen(true)} aria-label="Find a page"><SearchIcon /><span>Find a page</span><kbd>Ctrl K</kbd></Button><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="academic-year" aria-label={`Academic year ${academicYear}`}>{academicYear}<ArrowDownIcon /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuLabel>Academic year</DropdownMenuLabel><DropdownMenuItem onSelect={() => !teacher && go('academic-years')}><CheckIcon />{academicYear} (current)</DropdownMenuItem>{!teacher && <><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => go('academic-years')}>Manage academic years</DropdownMenuItem></>}</DropdownMenuContent></DropdownMenu><span className="topbar-divider" /><Popover><PopoverTrigger asChild><Button variant="ghost" size="icon" className="notification-trigger" aria-label={read ? 'Notifications' : `Notifications, ${notices.length} notices`} onClick={() => setRead(true)}><BellIcon />{!read && <i className="unread-dot" />}</Button></PopoverTrigger><PopoverContent align="end" className="notifications-popover"><h2>School updates</h2>{notices.length ? notices.slice(0,3).map(notice => <Notification key={notice.id} className="school-notification" title={notice.title} description={notice.body.slice(0,90)} icon={<BellIcon />} action={<Button variant="link" onClick={() => go(`teacher-screens/notice-details.html?id=${encodeURIComponent(notice.id)}`)}>Read notice<ArrowRightIcon /></Button>} />) : <p className="subtle-note">No notices for your workspace.</p>}</PopoverContent></Popover></div></header>
    <main id="main-content" className="main-content" ref={mainRef}>{children}</main>
    </div>
    <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}><CommandInput placeholder="Search pages…" aria-label="Search school pages" /><CommandList><CommandEmpty>No matching pages.</CommandEmpty><CommandGroup heading="School pages">{allowedPages.filter(page => page.path !== 'index.html').map(page => <CommandItem key={page.path} value={`${page.title} ${page.group} ${page.path}`} onSelect={() => go(page.path)}><span>{page.title}</span>{page.stage === 'planned' && <span className="search-stage">Upcoming</span>}</CommandItem>)}</CommandGroup></CommandList></CommandDialog>

  </div></SidebarProvider>;
}
