import { useState, type ReactNode, type FormEvent } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { NativeSelect } from './ui/native-select';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from './ui/table';
import { PageHeading } from './PageHeading';
import { ArrowLeftIcon, ArrowRightIcon, SearchIcon } from './icons';
import { go } from '../lib/routes';
import { downloadExcel, downloadPdf } from '../lib/exports';

export function WorkspacePage({ title, description, action, children }: { title: string; description: ReactNode; action?: ReactNode; children: ReactNode }) {
  return <div className="page-content workflow-page"><PageHeading title={title} description={description} action={action} /><div className="workflow-preview-label"><Badge className="demo-badge">Sample data</Badge><span>Changes stay in this browser.</span></div>{children}</div>;
}
export function Field({ label, name, value, onChange, options, type = 'text', required = false, readOnly = false, hint }: { label: string; name: string; value: string; onChange: (value: string) => void; options?: {value:string;label:string}[]; type?: string; required?: boolean; readOnly?: boolean; hint?: string }) {
  return <div className="workflow-field"><label htmlFor={name}>{label}{required && <span aria-hidden="true"> *</span>}</label>{options ? <NativeSelect id={name} value={value} required={required} onChange={event => onChange(event.target.value)}><option value="">Select {label.toLowerCase()}</option>{options.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</NativeSelect> : type === 'textarea' ? <Textarea id={name} value={value} required={required} readOnly={readOnly} onChange={event => onChange(event.target.value)} rows={4} /> : <Input id={name} value={value} type={type} required={required} readOnly={readOnly} onChange={event => onChange(event.target.value)} step={type === 'number' ? '0.01' : undefined} />}{hint && <p>{hint}</p>}</div>;
}
export function FormCard({ title, children, onSubmit, submitLabel = 'Save changes', back, error }: { title: string; children: ReactNode; onSubmit: (event: FormEvent<HTMLFormElement>) => void; submitLabel?: string; back: string; error?: string }) {
  return <Card className="editor-card"><h2>{title}</h2><form onSubmit={onSubmit}><div className="workflow-form-grid">{children}</div>{error && <p className="form-error" role="alert">{error}</p>}<div className="form-actions"><Button variant="outline" onClick={() => go(back)}>Cancel</Button><Button type="submit">{submitLabel}</Button></div></form></Card>;
}
export function Message({ children, error = false }: { children: ReactNode; error?: boolean }) { return <p className={error ? 'form-error' : 'success-message'} role={error ? 'alert' : 'status'}>{children}</p>; }
export function Status({ children, kind = 'neutral' }: { children: ReactNode; kind?: 'success'|'warning'|'neutral' }) { return <Badge className={`${kind}-badge`}>{children}</Badge>; }
export function SearchField({ value, onChange, label = 'Search records' }: { value: string; onChange: (value: string) => void; label?: string }) { return <div className="record-search"><SearchIcon /><Input aria-label={label} type="search" placeholder={label} value={value} onChange={event => onChange(event.target.value)} /></div>; }
export function BackButton({ path, label = 'Back' }: { path: string; label?: string }) { return <Button variant="outline" onClick={() => go(path)}><ArrowLeftIcon />{label}</Button>; }
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) { return <div className="workflow-empty"><h2>{title}</h2>{description && <p>{description}</p>}{action}</div>; }

export interface Column<T> { title: string; cell: (row: T) => ReactNode; className?: string; }
export function Records<T extends {id:string}>({ rows, columns, empty = 'No records match these filters.', pageSize = 12 }: { rows: T[]; columns: Column<T>[]; empty?: string; pageSize?: number }) {
  const [page, setPage] = useState(1);
  const total = Math.max(1, Math.ceil(rows.length / pageSize)); const current = Math.min(page, total);
  return <Card className="records-card"><Table><TableHeader><TableRow>{columns.map(column => <TableHead key={column.title} scope="col" className={column.className}>{column.title}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.slice((current - 1) * pageSize, current * pageSize).map(row => <TableRow key={row.id}>{columns.map(column => <TableCell key={column.title} className={column.className}>{column.cell(row)}</TableCell>)}</TableRow>)}{!rows.length && <TableRow><TableCell colSpan={columns.length}><EmptyState title={empty} /></TableCell></TableRow>}</TableBody></Table><div className="records-pagination"><span>{rows.length} {rows.length === 1 ? 'record' : 'records'}{rows.length > pageSize && ` · Page ${current} of ${total}`}</span>{rows.length > pageSize && <div><Button variant="ghost" size="sm" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous page"><ArrowLeftIcon /></Button><Button variant="ghost" size="sm" disabled={current === total} onClick={() => setPage(current + 1)} aria-label="Next page"><ArrowRightIcon /></Button></div>}</div></Card>;
}
export function Confirm({ open, onClose, title, description, onConfirm, label = 'Confirm', destructive = false }: { open: boolean; onClose: () => void; title: string; description: string; onConfirm: () => void; label?: string; destructive?: boolean }) {
  const [error, setError] = useState('');
  return <Dialog open={open} onOpenChange={value => { if (!value) { setError(''); onClose(); } }}><DialogContent className="workflow-dialog"><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader>{error && <Message error>{error}</Message>}<div className="form-actions"><Button variant="outline" onClick={()=>{setError('');onClose();}}>Cancel</Button><Button variant={destructive ? 'destructive' : 'default'} onClick={() => { try { onConfirm(); setError(''); onClose(); } catch (err) { setError(err instanceof Error ? err.message : 'Could not complete this change.'); } }}>{label}</Button></div></DialogContent></Dialog>;
}
export function ExportButtons({ title, headers, rows }: { title: string; headers: string[]; rows: unknown[][] }) {
  const [busy, setBusy] = useState(''); const [error, setError] = useState('');
  async function download(kind: 'pdf'|'excel') { setBusy(kind); setError(''); try { await (kind === 'pdf' ? downloadPdf : downloadExcel)(title, headers, rows); } catch { setError('Export failed. Please try again.'); } finally { setBusy(''); } }
  return <div className="export-controls"><Button variant="outline" disabled={!!busy} onClick={() => download('pdf')}>{busy === 'pdf' ? 'Preparing PDF…' : 'Download PDF'}</Button><Button variant="outline" disabled={!!busy} onClick={() => download('excel')}>{busy === 'excel' ? 'Preparing Excel…' : 'Export Excel'}</Button>{error && <Message error>{error}</Message>}</div>;
}
