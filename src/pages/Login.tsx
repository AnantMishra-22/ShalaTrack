import { useState, type FormEvent } from 'react';
import { Brand } from '../components/Brand';
import { EyeIcon, EyeClosedIcon, ArrowRightIcon, ShieldCheckIcon, GraduationCapIcon, GroupIcon, CalendarCheckIcon, WalletIcon } from '../components/icons';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';
import type { PreviewSession } from '../data/demoRepository';
import type { SchoolRole } from '../domain/dashboard';

export function Login({ onEnter }: { onEnter: (session: PreviewSession) => void }) {
  const [role, setRole] = useState<SchoolRole>('admin');
  const [email, setEmail] = useState('admin@maplewood.example');
  const [password, setPassword] = useState('preview123');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [errorField, setErrorField] = useState<'email' | 'password'>('email');
  function submit(event: FormEvent) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setErrorField('email'); setError('Enter a valid email address.'); return; }
    if (password.length < 6) { setErrorField('password'); setError('Use a sample password with at least 6 characters.'); return; }
    setError('');
    try { onEnter({ role, email: email.trim(), name: role === 'admin' ? 'Aditi Sharma' : 'Kavya Rao' }); } catch(err) { setErrorField('email');setError((err as Error).message); }
  }
  return <main className="login-page">
    <div className="login-story">
      <Brand />
      <div className="login-story-content">
        <span className="story-symbol"><GraduationCapIcon /></span>
        <h2>A little less admin.<br />A little more school.</h2>
        <p>One place for your people, periods and payments.</p>
        <div className="login-preview-card" aria-hidden="true">
          <div className="login-preview-top"><span className="mini-school">MP</span><span>Maplewood Public School<small>School workspace</small></span><span className="decorative-dots">•••</span></div>
          <div className="preview-stat"><span>Attendance today</span><strong>95.3<span>%</span></strong><div className="preview-bars">{[70, 90, 76, 96, 85, 93, 95].map((height, i) => <i key={i} style={{ height: `${height}%` }} />)}</div></div>
          <div className="preview-shortcuts"><span><GroupIcon />Students</span><span><CalendarCheckIcon />Attendance</span><span><WalletIcon />Fees</span></div>
        </div>
      </div>
      <span className="login-story-footer">A calmer school day starts here.</span>
    </div>
    <div className="login-form-side">
      <div className="login-top-note"><Badge className="demo-badge">Design preview</Badge><span>Fictional data only</span></div>
      <div className="login-form-wrap">
        <div className="mobile-login-brand"><Brand /></div>
        <h1>Welcome back</h1><p className="login-intro">Open your school workspace.</p>
        <Tabs value={role} onValueChange={value => { setRole(value as SchoolRole); setEmail(value === 'admin' ? 'admin@maplewood.example' : 'teacher1@maplewood.example'); setError(''); }}>
          <TabsList className="login-role-tabs" aria-label="Preview account role"><TabsTrigger value="admin">School admin</TabsTrigger><TabsTrigger value="teacher">Teacher</TabsTrigger></TabsList>
        </Tabs>
        <form onSubmit={submit} noValidate className="login-form">
          <div className="form-field"><label htmlFor="email">Email address</label><Input id="email" type="email" autoComplete="off" spellCheck={false} value={email} onChange={event => { setEmail(event.target.value); if (errorField === 'email') setError(''); }} aria-invalid={!!error && errorField === 'email'} aria-describedby={error && errorField === 'email' ? 'login-error' : 'preview-privacy'} /></div>
          <div className="form-field"><label htmlFor="password">Password</label><div className="password-field"><Input id="password" type={visible ? 'text' : 'password'} autoComplete="off" value={password} onChange={event => { setPassword(event.target.value); if (errorField === 'password') setError(''); }} aria-invalid={!!error && errorField === 'password'} aria-describedby={error && errorField === 'password' ? 'login-error' : undefined} /><Button variant="ghost" size="icon" className="password-reveal" aria-label={visible ? 'Hide password' : 'Show password'} aria-pressed={visible} onClick={() => setVisible(!visible)}>{visible ? <EyeClosedIcon /> : <EyeIcon />}</Button></div></div>
          {error && <p id="login-error" role="alert" className="field-error">{error}</p>}
          <Button type="submit" className="login-submit">Open {role === 'admin' ? 'admin' : 'teacher'} preview<ArrowRightIcon /></Button>
          <p id="preview-privacy" className="preview-privacy"><ShieldCheckIcon />Use sample details only. Nothing is sent.</p>
        </form>
      </div>
      <p className="login-bottom-note">ShalaTrack frontend preview</p>
    </div>
  </main>;
}
