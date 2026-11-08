import { useRef, useState, type FormEvent } from 'react';
import { useWorkspace } from '../data/WorkspaceStore';
import { DEMO_DAY, type DemoSchool } from '../domain/dashboard';
import { accountBalance, allocatePayment, installmentBalance, validatePayment } from '../domain/operations';
import { assessStudentPlan, eligibleForPlan, matchesService, serviceLabel, serviceOptions } from '../domain/studentServices';
import { StudentServiceDetails } from '../components/StudentServices';
import { savePayableSetup } from '../domain/parity';
import { classLabel, money, id, type Payment, type FeeAccount } from '../domain/model';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { NativeSelect } from '../components/ui/native-select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { WorkspacePage, Records, Field, Message, Confirm, EmptyState, Status } from '../components/workspace';
import { go, parameter } from '../lib/routes';
import { ReceiptDialog } from './FeePages';

function toPaise(value: string) {
  const number = Number(value), result = Math.round(number * 100);
  if (!Number.isFinite(number) || !Number.isSafeInteger(result) || Math.abs(number * 100 - result) > 0.000001) throw new Error('Enter a valid amount with at most two decimal places.');
  return result;
}
export function FeeCollectionPage({ school }: { school: DemoSchool }) {
  const { state, commit } = useWorkspace();
  const [studentId, setStudentId] = useState(parameter('student'));
  const [year, setYear] = useState(parameter('year') || state.years.find(row=>row.schoolId===school.id&&row.status==='current')?.label || '2026-27');
  const [service,setService]=useState(parameter('service')||'all');
  const [query, setQuery] = useState(''), [search, setSearch] = useState('');
  const [discountType, setDiscountType] = useState<FeeAccount['discountType']>('none'), [discountValue, setDiscountValue] = useState('0');
  const [amount, setAmount] = useState(''), [method, setMethod] = useState(''), [reference, setReference] = useState(''), [date, setDate] = useState(DEMO_DAY), [category, setCategory] = useState('');
  const [error, setError] = useState(''), [message, setMessage] = useState(''), [confirm, setConfirm] = useState(false), [receiptId, setReceiptId] = useState(''), [installmentId, setInstallmentId] = useState('');
  const paymentId = useRef(id('payment'));
  const student = state.students.find(row=>row.id===studentId&&row.schoolId===school.id);
  const account = state.feeAccounts.find(row=>row.schoolId===school.id&&row.studentId===studentId&&row.year===year);
  const assessments = state.assessments.filter(row=>row.schoolId===school.id&&row.studentId===studentId&&row.year===year);
  const activePayments = state.payments.filter(row=>row.schoolId===school.id&&row.studentId===studentId&&row.year===year&&!state.reversals.some(item=>item.schoolId===school.id&&item.paymentId===row.id));
  const assessed = assessments.reduce((sum,row)=>sum+row.amountPaise,0), paid = activePayments.reduce((sum,row)=>sum+row.amountPaise,0);
  const balance = accountBalance(state, school.id, studentId, year);
  const savedDiscount = state.concessions.filter(row=>row.schoolId===school.id&&row.studentId===studentId&&row.year===year).reduce((sum,row)=>sum+row.amountPaise,0);
  const pending = Math.max(0, assessed-paid);
  const parsedDiscount = Number(discountValue);
  const proposedDiscount = discountType==='none'?0:discountType==='percentage'?Math.round(pending*parsedDiscount/100):Math.round(parsedDiscount*100);
  const discount = account ? savedDiscount : Number.isFinite(proposedDiscount)?proposedDiscount:0;
  const openYear = state.years.some(row=>row.schoolId===school.id&&row.label===year&&row.status==='current');
  const results = state.students.filter(row=>row.schoolId===school.id&&row.status==='active'&&matchesService(row,service)&&`${row.name} ${row.admissionNumber}`.toLowerCase().includes(search.toLowerCase()));
  const selectedInstallments = assessments.find(row=>row.id===installmentId);
  function clearPayment() { setAmount('');setMethod('');setReference('');setCategory(''); }
  function selectStudent(value: string) {setStudentId(value);setDiscountType('none');setDiscountValue('0');setError('');setMessage('');clearPayment();}
  function assertCurrent() {if(!openYear)throw new Error('Fee collection is available only for the current academic year.');}
  function setup(event: FormEvent) {
    event.preventDefault();setError('');
    try {
      assertCurrent();if(!student||!assessments.length)throw new Error('Assign class fees before setting the payable amount.');
      if(!Number.isFinite(parsedDiscount)||parsedDiscount<0||(discountType==='percentage'&&parsedDiscount>100))throw new Error('Enter a valid discount; percentage cannot exceed 100.');
      const value=discountType==='amount'?toPaise(discountValue):proposedDiscount;
      commit(school.id,'Student payable amount set',student.name,draft=>{
        savePayableSetup(draft,{id:id('fee-account'),schoolId:school.id,studentId,year,discountType,discountValue:discountType==='none'?0:parsedDiscount,discountPaise:value,paidAtSetup:paid},id('concession'),id('ledger'),new Date().toISOString());
      });
      setAmount(((balance-value)/100).toFixed(2));setMessage('Payable amount saved. The discount is locked and will not be applied again.');
    }catch(err){setError((err as Error).message);}
  }
  function assignFees() {
    try{assertCurrent();if(!student)return;
      commit(school.id,'Class fees assigned',student.name,draft=>{
        const plans=draft.feePlans.filter(row=>row.schoolId===school.id&&row.classId===student.classId&&row.year===year&&eligibleForPlan(student,row));
        if(!plans.length)throw new Error('Create a fee structure for this class and year first.');
        const latest=new Map<string,typeof plans[number]>();for(const plan of plans)if((latest.get(plan.category)?.version||0)<plan.version)latest.set(plan.category,plan);
        for(const plan of latest.values())assessStudentPlan(draft,school.id,studentId,plan,id,new Date().toISOString());
      });setMessage('Class fees assigned. Any saved discount remains unchanged.');
    }catch(err){setError((err as Error).message);}
  }
  function recordPayment() {
    if(!student)throw new Error('Select a student.');assertCurrent();
    const saved=commit(school.id,'Manual fee payment recorded',student.name,draft=>{
      const existing=draft.payments.find(row=>row.schoolId===school.id&&row.id===paymentId.current);if(existing)return existing.id;
      if(!draft.feeAccounts.some(row=>row.schoolId===school.id&&row.studentId===studentId&&row.year===year))throw new Error('Set the student payable amount first.');
      if(!category||!date)throw new Error('Choose a fee category and payment date.');
      const value=toPaise(amount),allocations=allocatePayment(draft,school.id,studentId,year,value,category);
      const sequence=1+Math.max(0,...draft.payments.filter(row=>row.schoolId===school.id&&row.year===year).map(row=>Number(row.receiptNumber.split('/').at(-1))||0));
      const payment:Payment={id:paymentId.current,schoolId:school.id,studentId,year,amountPaise:value,method,reference:reference.trim(),paymentDate:date,recordedAt:new Date().toISOString(),receiptNumber:`${school.initials}/${year}/${String(sequence).padStart(4,'0')}`,studentName:student.name,admissionNumber:student.admissionNumber,className:classLabel(draft.classes.find(row=>row.id===student.classId)),allocations,category,service:assessments.find(row=>row.category===category)?.service||'all',assessedPaise:assessed,previousPaidPaise:paid,discountPaise:savedDiscount,balancePaise:accountBalance(draft,school.id,studentId,year)-value};
      validatePayment(payment);draft.payments.push(payment);draft.ledger.push({id:id('ledger'),schoolId:school.id,studentId,year,amountPaise:-value,kind:'payment',sourceId:payment.id,at:payment.recordedAt});return payment.id;
    });setReceiptId(saved);clearPayment();setMessage('Payment recorded and sample receipt issued.');
  }
  function categoryPaid(installmentIds: string[]) {return activePayments.flatMap(row=>row.allocations).filter(row=>installmentIds.includes(row.installmentId)).reduce((sum,row)=>sum+row.amountPaise,0);}
  return <WorkspacePage title="Collect student fee" description="Search a student, review assigned fees, set the payable amount and record a manual payment." action={<Button variant="outline" onClick={()=>go('fee-history.html')}>Payment history</Button>}>
    <div className="fee-collection-layout">
      <Card className="fee-search-panel"><div className="fee-panel-heading"><h2>Search student</h2><p>Find a student by name or admission number.</p></div><form onSubmit={event=>{event.preventDefault();setSearch(query);}}><Input aria-label="Student name or admission number" placeholder="Name or admission number" value={query} onChange={event=>setQuery(event.target.value)} /><Field label="Student service" name="collection-service" value={service} onChange={setService} options={serviceOptions} /><Button type="submit">Search student</Button></form><div className="fee-search-results" aria-label="Student search results">{results.slice(0,40).map(row=><button key={row.id} className={`fee-student-result ${row.id===studentId?'is-selected':''}`} onClick={()=>selectStudent(row.id)}><span><strong>{row.name}</strong><small>Admission No: {row.admissionNumber} · {classLabel(state.classes.find(item=>item.id===row.classId))} · {serviceLabel(row)}</small></span><span>{row.id===studentId?'Selected':'Select'}</span></button>)}{!results.length&&<EmptyState title="No students found" />}<p className="subtle-note">{results.length>40?'Showing the first 40 matches. Narrow your search.':`${results.length} students found`}</p></div></Card>
      <div className="fee-detail-column">{!student?<Card className="fee-detail-card"><EmptyState title="Select a student to collect fees" description="Their assigned fees, installments and payable amount will appear here." /></Card>:<>
        <Card className="fee-detail-card"><div className="fee-panel-heading fee-heading-actions"><div><h2>Student fee account</h2><p>Fees assigned according to the student’s class.</p></div><Button variant="outline" size="sm" onClick={assignFees}>Assign class fees</Button></div>
          <div className="fee-student-profile"><div><small>Student name</small><strong>{student.name}</strong></div><div><small>Admission number</small><strong>{student.admissionNumber}</strong></div><div><small>Class</small><strong>{classLabel(state.classes.find(row=>row.id===student.classId))}</strong></div><div><label htmlFor="collection-year">Academic year</label><NativeSelect id="collection-year" value={year} onChange={e=>{setYear(e.target.value);setError('');setMessage('');clearPayment();setDiscountType('none');setDiscountValue('0');}}>{state.years.filter(row=>row.schoolId===school.id).map(row=><option key={row.id}>{row.label}</option>)}</NativeSelect></div></div>
          <div className="fee-service-profile"><StudentServiceDetails student={student} /><Button variant="link" onClick={()=>go('student-details.html',{id:student.id})}>View student details</Button></div><div className="fee-panel-heading"><h2>Fee details</h2><p>Review category balances and installment schedules.</p></div>
          <Records rows={assessments} pageSize={Math.max(1,assessments.length)} columns={[{title:'Fee description',cell:row=><div className="record-identity"><strong>{row.category}</strong><small>{row.service==='hostel'?'Hostel fee':row.service==='transport'?'Transport fee':'General fee'}</small></div>},{title:'Payment type',cell:row=>row.installments.length===1?'Full payment':'Installment'},{title:'Installments',cell:row=><Button variant="link" size="sm" onClick={()=>setInstallmentId(row.id)}>{row.installments.length} · View</Button>},{title:'Status',cell:row=>{const paid=categoryPaid(row.installments.map(item=>item.id));return <Status kind={paid>=row.amountPaise?'success':'warning'}>{paid>=row.amountPaise?'Paid':paid?'Partial':'Pending'}</Status>;}},{title:'Amount',cell:row=>money(row.amountPaise)}]} />
          <dl className="fee-original-totals"><div><dt>Total fee</dt><dd>{money(assessed)}</dd></div><div><dt>Already paid</dt><dd>{money(paid)}</dd></div><div><dt>Pending before discount</dt><dd>{money(pending)}</dd></div><div className="discount-total"><dt>Discount</dt><dd>{money(Math.max(0,discount))}</dd></div><div className="payable-total"><dt>Payable now</dt><dd>{money(account?balance:Math.max(0,pending-discount))}</dd></div></dl>
        </Card>
        {error&&<Message error>{error}</Message>}{message&&<Message>{message}</Message>}
        <Card className="fee-stage"><div className="fee-stage-header"><span>1</span><div><h2>Set student payable amount</h2><p>Apply the student-level discount first and save the final payable balance.</p></div>{account&&<Status kind="success">Saved</Status>}</div><form onSubmit={setup}><fieldset disabled={!!account||!openYear}><div className="workflow-form-grid"><Field label="Discount type" name="discount-type" value={account?.discountType||discountType} onChange={value=>setDiscountType(value as FeeAccount['discountType'])} options={[{value:'none',label:'No discount'},{value:'amount',label:'Fixed amount (INR)'},{value:'percentage',label:'Percentage (%)'}]} /><Field label="Discount value" name="discount-value" type="number" value={account?String(account.discountValue):discountValue} onChange={setDiscountValue} /></div><div className="form-actions"><Button type="submit">{account?'Payable amount set':'Set payable amount'}</Button></div></fieldset><p className="subtle-note">{account?'Discount already set for this student. It is retained for future collections and will not be requested or applied again.':'Save the payable amount, including a zero discount, to unlock fee collection.'}</p></form></Card>
        <Card className="fee-stage"><div className="fee-stage-header"><span>2</span><div><h2>Collect fee</h2><p>Collect payment only after the student’s payable amount has been set.</p></div></div>{(!account||!openYear||balance<=0)&&<p className="fee-collection-locked" role="status">{!openYear?'This year is not current. Its payment collection is locked.':!account?'Set the student’s payable amount in Step 1 to start fee collection.':'No pending fee remains for this student.'}</p>}<form onSubmit={event=>{event.preventDefault();setError('');paymentId.current=id('payment');setConfirm(true);}}><fieldset disabled={!account||!openYear||balance<=0}><div className="workflow-form-grid"><Field label="Amount to collect (INR)" name="payment-amount" type="number" value={amount} onChange={setAmount} required /><Field label="Payment mode" name="payment-method" value={method} onChange={setMethod} options={['Cash','UPI','Bank'].map(value=>({value,label:value==='Bank'?'Bank transfer':value}))} required /><Field label="Fee category" name="payment-category" value={category} onChange={setCategory} options={assessments.map(row=>({value:row.category,label:row.category}))} required /><Field label="Transaction / reference ID" name="payment-reference" value={reference} onChange={setReference} required={method!==''&&method!=='Cash'} /><Field label="Payment date" name="payment-date" type="date" value={date} onChange={setDate} required /></div><div className="form-actions"><Button variant="outline" onClick={clearPayment}>Clear</Button><Button type="submit">Collect payment</Button></div></fieldset></form><p className="subtle-note">Manual sample records only. No money is transferred or bank settlement verified.</p></Card>
      </>}</div>
    </div>
    <Confirm open={confirm} onClose={()=>setConfirm(false)} title="Collect this payment?" description={`${money(Math.round(Number(amount||0)*100))} for ${student?.name||'the selected student'} by ${method}. A sample receipt and ledger record will be saved.`} label="Collect payment & issue receipt" onConfirm={recordPayment} />
    <ReceiptDialog school={school} payment={state.payments.find(row=>row.schoolId===school.id&&row.id===receiptId)} onClose={()=>setReceiptId('')} />
    <Dialog open={!!installmentId} onOpenChange={open=>{if(!open)setInstallmentId('');}}><DialogContent className="workflow-dialog wide-dialog"><DialogHeader><DialogTitle>{selectedInstallments?.category} installments</DialogTitle><DialogDescription>Scheduled amounts and balances after recorded payments. Student-level discounts are shown in the account totals.</DialogDescription></DialogHeader>{selectedInstallments&&<Records rows={selectedInstallments.installments.map((row,index)=>({...row,index:index+1}))} columns={[{title:'Installment',cell:row=>row.index},{title:'Due date',cell:row=>row.due},{title:'Amount',cell:row=>money(row.amountPaise)},{title:'Remaining',cell:row=>money(installmentBalance(state,row.id,school.id))}]} />}</DialogContent></Dialog>
  </WorkspacePage>;
}
