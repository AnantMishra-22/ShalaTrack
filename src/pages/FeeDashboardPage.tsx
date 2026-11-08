import { useEffect, useRef, useState } from 'react';
import { useWorkspace } from '../data/WorkspaceStore';
import type { DemoSchool } from '../domain/dashboard';
import { serviceOptions } from '../domain/studentServices';
import { money } from '../domain/model';
import { classFeeOverview, collectionRate, type FeeStatus, type FeeTotals } from '../domain/feeOverview';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table,TableHeader,TableBody,TableRow,TableHead,TableCell } from '../components/ui/table';
import { Field, SearchField, Status, Records } from '../components/workspace';
import { PlusIcon, WalletIcon, CheckCircleIcon, GroupIcon, ArrowRightIcon, ArrowLeftIcon } from '../components/icons';
import { go, parameter } from '../lib/routes';

function FeeBadge({status}:{status:FeeStatus}) {return <Status kind={status==='Paid'?'success':status==='Not assessed'?'neutral':'warning'}>{status}</Status>;}
function CollectionBar({total}:{total:FeeTotals}) {const rate=collectionRate(total);return <div className="class-fee-progress"><strong>{rate.toFixed(1)}%</strong><progress aria-label="Fee collection percentage" value={rate} max={100} /></div>;}
export function FeeDashboardPage({school}:{school:DemoSchool}) {
  const {state}=useWorkspace();
  const currentYear=state.years.find(row=>row.schoolId===school.id&&row.status==='current')?.label||'2026-27';
  const [service,setService]=useState(parameter('service')||'all');
  const [year,setYear]=useState(parameter('year')||currentYear);
  const [search,setSearch]=useState(parameter('search')),[category,setCategory]=useState(parameter('category')),[status,setStatus]=useState(parameter('status'));
  const [studentSearch,setStudentSearch]=useState(''),[studentStatus,setStudentStatus]=useState('');
  const selectedGrade=parameter('class');
  const detailHeading=useRef<HTMLHeadingElement>(null);
  useEffect(()=>{if(selectedGrade){detailHeading.current?.focus({preventScroll:true});detailHeading.current?.scrollIntoView({block:'start'});}},[selectedGrade]);
  const {groups,totals}=classFeeOverview(state,school.id,year,service);
  const selected=groups.find(row=>row.grade===selectedGrade);
  const rows=groups.filter(row=>(!search||`Class ${row.grade} ${row.sections.join(' ')}`.toLowerCase().includes(search.toLowerCase()))&&(!category||row.accounts.some(account=>account.categories.includes(category)))&&(!status||row.status===status));
  const students=(selected?.accounts||[]).filter(row=>`${row.name} ${row.admissionNumber} ${row.section}`.toLowerCase().includes(studentSearch.toLowerCase())&&(!studentStatus||row.status===studentStatus));
  const parameters=(grade?:string)=>({year,...(service!=='all'?{service}:{}),...(grade?{class:grade}:{}),...(search?{search}:{}),...(category?{category}:{}),...(status?{status}:{})});
  const openClass=(grade:string)=>go('fee-dashboard.html',parameters(grade));
  const rate=collectionRate(totals),pendingRate=totals.net>0?Math.max(0,100-rate):0;
  const categories=[...new Set(state.assessments.filter(row=>row.schoolId===school.id&&row.year===year).map(row=>row.category))].sort();
  const statuses:FeeStatus[]=['Paid','Partial','Pending','Not assessed'];
  return <div className="page-content workflow-page class-fee-dashboard">
    <header className="fee-dashboard-banner"><div><span className="fee-dashboard-eyebrow">{school.name} · {year}</span><h1 tabIndex={-1}>Fee dashboard</h1><p>Class-wise fee overview based on assigned fees, student discounts and recorded payments.</p></div><Button onClick={()=>go('fee-collection.html',{year,service})}><PlusIcon />Record payment</Button></header>
    <div className="fee-dashboard-sample">Fictional sample data · Changes stay in this browser.</div>
    <section className="class-fee-metrics" aria-label="School fee totals">
      <Card><div><p>Total fee assigned</p><span><WalletIcon /></span></div><strong>{money(totals.net)}</strong><small>After student discounts</small></Card>
      <Card><div><p>Total collected</p><span><CheckCircleIcon /></span></div><strong>{money(totals.collected)}</strong><small>{rate.toFixed(1)}% collected · net of reversals</small><progress aria-label="School fees collected" max={100} value={rate} /></Card>
      <Card><div><p>Outstanding</p><span aria-hidden="true">!</span></div><strong>{money(totals.outstanding)}</strong><small>{pendingRate.toFixed(1)}% pending</small><progress aria-label="School fees pending" max={100} value={pendingRate} /></Card>
      <Card><div><p>Total students</p><span><GroupIcon /></span></div><strong>{totals.students}</strong><small>Student accounts for {year}</small></Card>
    </section>
    <Card className="class-fee-overview"><div className="class-fee-section-heading"><div><h2 ref={detailHeading} tabIndex={-1}>{selectedGrade?`Class ${selectedGrade} · Student fees`:'Class-wise fee overview'}</h2><p>{selectedGrade?'Individual balances reconcile to the class totals. Open a student to collect fees or review their account.':'One cumulative row per class, combining its sections. Click a class to view its students.'}</p></div>{selectedGrade&&<Button variant="outline" onClick={()=>go('fee-dashboard.html',parameters())}><ArrowLeftIcon />All classes</Button>}</div>
      {!selectedGrade?<>
        <div className="class-fee-filters"><SearchField value={search} onChange={setSearch} label="Search classes or sections" /><Field label="Student service" name="overview-service" value={service} onChange={setService} options={serviceOptions} /><Field label="Academic year" name="overview-year" value={year} onChange={value=>{setYear(value);setCategory('');}} options={state.years.filter(row=>row.schoolId===school.id).map(row=>({value:row.label,label:row.label}))} /><Field label="Classes with fee category" name="overview-category" value={category||'all'} onChange={value=>setCategory(value==='all'?'':value)} options={[{value:'all',label:'All categories'},...categories.map(value=>({value,label:value}))]} /><Field label="Class payment status" name="overview-status" value={status||'all'} onChange={value=>setStatus(value==='all'?'':value)} options={[{value:'all',label:'All statuses'},...statuses.map(value=>({value,label:value}))]} /><Button variant="outline" onClick={()=>{setSearch('');setCategory('');setStatus('');}}>Refresh</Button></div>
        <p className="class-fee-filter-note">Category filters find classes with that fee category. Each row shows the complete class account; summary cards reflect the selected year and student service.</p>
        <div className="class-fee-table"><Table><TableHeader><TableRow>{['Class','Total students','Total fee (net)','Discount','Collected','Outstanding','Collection %','Status'].map(title=><TableHead scope="col" key={title}>{title}</TableHead>)}</TableRow></TableHeader><TableBody>{rows.map(row=><TableRow key={row.id} className="class-fee-clickable" onClick={event=>{if(!(event.target as HTMLElement).closest('button,a'))openClass(row.grade);}}><TableCell><Button variant="link" aria-label={`View Class ${row.grade} students`} onClick={()=>openClass(row.grade)}><span className="class-fee-name">Class {row.grade}<small>{row.sections.length} {row.sections.length===1?'section':'sections'} · {row.sections.join(', ')}</small></span><ArrowRightIcon /></Button></TableCell><TableCell>{row.students}</TableCell><TableCell title={`Gross assigned: ${money(row.gross)}`}>{money(row.net)}</TableCell><TableCell>{money(row.discount)}</TableCell><TableCell>{money(row.collected)}</TableCell><TableCell>{money(row.outstanding)}</TableCell><TableCell><CollectionBar total={row} /></TableCell><TableCell><FeeBadge status={row.status} /></TableCell></TableRow>)}{!rows.length&&<TableRow><TableCell colSpan={8}><div className="workflow-empty"><h2>No classes match these filters</h2><p>Try another class, fee category or payment status.</p></div></TableCell></TableRow>}</TableBody></Table></div>
      </>:selected?<>
        <div className="class-fee-drilldown-summary"><span><strong>{selected.students}</strong> students</span><span>Net fee <strong>{money(selected.net)}</strong></span><span>Discount <strong>{money(selected.discount)}</strong></span><span>Collected <strong>{money(selected.collected)}</strong></span><span>Outstanding <strong>{money(selected.outstanding)}</strong></span></div>
        <div className="records-toolbar"><SearchField value={studentSearch} onChange={setStudentSearch} label="Search students, admission or section" /><Field label="Student payment status" name="student-fee-status" value={studentStatus||'all'} onChange={value=>setStudentStatus(value==='all'?'':value)} options={[{value:'all',label:'All statuses'},...statuses.map(value=>({value,label:value}))]} /></div>
        <Records rows={students} columns={[{title:'Student',cell:row=><div className="record-identity"><strong>{row.name}</strong><small>{row.admissionNumber}</small></div>},{title:'Section',cell:row=>row.section},{title:'Services',cell:row=>row.services},{title:'Total fee (net)',cell:row=>money(row.net)},{title:'Discount',cell:row=>money(row.discount)},{title:'Collected',cell:row=>money(row.collected)},{title:'Outstanding',cell:row=>money(row.outstanding)},{title:'Status',cell:row=><FeeBadge status={row.status} />},{title:'Actions',cell:row=><Button variant="outline" size="sm" onClick={()=>go('fee-collection.html',{student:row.id,year,service})}>Open account<ArrowRightIcon /></Button>}]} />
      </>:<div className="workflow-empty"><h2>Class not available for this academic year</h2><p>Return to all classes to choose another class.</p></div>}
    </Card>
    <Card className="class-fee-summary"><h2>Fee summary</h2><p>Totals for {serviceOptions.find(row=>row.value===service)?.label.toLowerCase()} from the same assessment, discount, payment and ledger records used by Fee Collection.</p><div><span>Gross assigned: <strong>{money(totals.gross)}</strong></span><span>Discount: <strong>{money(totals.discount)}</strong></span><span>Net payable: <strong>{money(totals.net)}</strong></span><span>Collected: <strong>{money(totals.collected)}</strong></span><span>Outstanding: <strong>{money(totals.outstanding)}</strong></span></div><div className="section-links"><Button variant="outline" onClick={()=>go('fee-structure.html')}>Fee structures</Button><Button variant="outline" onClick={()=>go('fee-history.html')}>Payment history</Button></div></Card>
  </div>;
}
