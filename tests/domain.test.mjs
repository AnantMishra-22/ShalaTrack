import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import ts from 'typescript';
const urls = new Map();
function moduleUrl(url) {
  if (urls.has(url.href)) return urls.get(url.href);
  const source = readFileSync(url, 'utf8');
  let code = ts.transpileModule(source, {compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
  code = code.replace(/from ['"](\.[^'"]+)['"]/g, (_, specifier) => `from '${moduleUrl(new URL(specifier + '.ts', url))}'`);
  code = code.replace(/import\(['"](exceljs|jspdf)['"]\)/g, (_, name) => `import('${import.meta.resolve(name)}')`);
  const result = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
  urls.set(url.href,result); return result;
}
async function sourceModule(path) { return import(moduleUrl(new URL(path,import.meta.url))); }
const domain = await sourceModule('../src/domain/dashboard.ts');
const catalog = await sourceModule('../src/data/pages.ts');
const operations = await sourceModule('../src/domain/operations.ts');
const {createDemoState} = await sourceModule('../src/data/seed.ts');
const exportsModule = await sourceModule('../src/lib/exports.ts');

test('school summaries reconcile and isolate tenants', () => {
  const summary=domain.summarizeAttendance(domain.demoSessions,'maplewood');
  assert.deepEqual([summary.due,summary.submitted,summary.pending,summary.marked,summary.present,summary.absent,summary.late,summary.percentage],[24,22,2,550,521,26,3,'95.3']);
});
test('unsubmitted periods are never counted as absent', () => {
  const summary=domain.summarizeAttendance(domain.demoSessions.filter(row=>row.status==='pending'),'maplewood');
  assert.equal(summary.marked,0);assert.equal(summary.absent,0);assert.equal(summary.percentage,null);
});
test('submitted sample period counts reconcile', () => {
  for(const row of domain.demoSessions.filter(row=>row.status==='submitted')) assert.equal(row.present+row.absent+row.late,row.rosterSize);
});
test('39 original pages and four additions have unique routes', () => {
  assert.equal(catalog.originalPages.length,39);assert.equal(catalog.addedPages.length,4);
  assert.equal(new Set(catalog.pages.map(page=>page.path)).size,43);
  assert.equal(catalog.originalPages.filter(page=>page.path.startsWith('teacher-screens/')).length,11);
});
test('seeded individual marks match frozen school rosters and dashboard totals', () => {
  const state=createDemoState();assert.equal(state.students.filter(row=>row.schoolId==='maplewood').length,200);
  for(const session of state.sessions){
    assert.equal(session.rosterIds.length,new Set(session.rosterIds).size);
    assert.ok(session.rosterIds.every(studentId=>state.students.some(student=>student.id===studentId&&student.schoolId===session.schoolId)));
    if(session.status!=='submitted'){assert.deepEqual(session.marks,[]);continue;}
    operations.validateMarks(session,session.marks);
    for(const key of ['present','absent','late']) assert.equal(session[key],session.marks.filter(mark=>mark.status===key).length);
  }
});
test('attendance requires complete unique marks and excludes excused students', () => {
  const session={rosterIds:['a','b','c'],version:0};
  assert.throws(()=>operations.validateMarks(session,[{studentId:'a',status:'present'}]),/every student/);
  assert.throws(()=>operations.validateMarks(session,Array.from({length:3},()=>({studentId:'a',status:'absent'}))),/roster/);
  assert.throws(()=>operations.validateMarks(session,['a','b','c'].map(studentId=>({studentId,status:''}))),/valid attendance/);
  operations.applyMarks(session,[{studentId:'a',status:'present'},{studentId:'b',status:'late'},{studentId:'c',status:'excused'}],'10:40 AM');
  assert.equal(session.rosterSize,2);assert.equal(session.absent,0);assert.equal(session.version,1);assert.equal(session.status,'submitted');
});
test('payments allocate exact paise and reject overpayment or other-school accounts', () => {
  const state=createDemoState();const student=state.students.find(row=>row.schoolId==='maplewood');
  const balance=operations.accountBalance(state,'maplewood',student.id,'2026-27');assert.equal(balance,1500000);
  const allocations=operations.allocatePayment(state,'maplewood',student.id,'2026-27',12345,'');
  assert.equal(allocations.reduce((sum,row)=>sum+row.amountPaise,0),12345);
  assert.throws(()=>operations.allocatePayment(state,'maplewood',student.id,'2026-27',balance+1,''),/exceeds/);
  assert.throws(()=>operations.allocatePayment(state,'maplewood',student.id,'2026-27',1.5,''),/decimal/);
  assert.throws(()=>operations.allocatePayment(state,'riverdale',student.id,'2026-27',100,''),/exceeds/);
});
test('noncash payments require references and balanced allocations', () => {
  const payment={amountPaise:10000,method:'UPI',reference:'',allocations:[{installmentId:'x',amountPaise:10000}]};
  assert.throws(()=>operations.validatePayment(payment),/reference/);
  assert.throws(()=>operations.validatePayment({...payment,reference:'x',allocations:[{installmentId:'a',amountPaise:11000},{installmentId:'b',amountPaise:-1000}]}),/positive/);
  operations.validatePayment({...payment,reference:'SAMPLE-UPI-001'});operations.validatePayment({...payment,method:'Cash'});
  assert.throws(()=>operations.validatePayment({...payment,reference:'x',allocations:[]}),/allocations/);
});
test('reversal restores installment availability and account balance', () => {
  const state=createDemoState();const payment=state.payments.find(row=>row.schoolId==='maplewood');
  const before=operations.accountBalance(state,payment.schoolId,payment.studentId,payment.year);
  const installmentId=payment.allocations[0].installmentId;const dueBefore=operations.installmentBalance(state,installmentId,payment.schoolId);
  state.reversals.push({schoolId:payment.schoolId,paymentId:payment.id,amountPaise:payment.amountPaise});
  state.ledger.push({schoolId:payment.schoolId,studentId:payment.studentId,year:payment.year,amountPaise:payment.amountPaise});
  assert.equal(operations.accountBalance(state,payment.schoolId,payment.studentId,payment.year),before+payment.amountPaise);
  assert.equal(operations.installmentBalance(state,installmentId,payment.schoolId),dueBefore+payment.allocations[0].amountPaise);
  assert.equal(operations.accountBalance(state,'riverdale',payment.studentId,payment.year),0);
});
test('QR validation rejects expired, wrong-school and superseded tokens', () => {
  const challenges=[{schoolId:'maplewood',token:'sample-token',expiresAt:5000}];
  assert.equal(operations.validateQr(' sample-token ','maplewood',challenges,4999),challenges[0]);
  assert.throws(()=>operations.validateQr('sample-token','maplewood',challenges,5000),/expired/);
  assert.throws(()=>operations.validateQr('sample-token','riverdale',challenges,4000),/school/);
  assert.throws(()=>operations.validateQr('old-token','maplewood',challenges,4000),/current/);
});
test('Excel export round-trips with formula-like input stored as text', async () => {
  const bytes=await exportsModule.createExcelBuffer('Sample report',['Student','Value'],[['=SUM(A1:A2)',123],['Aarav','@sample']]);
  const {default:ExcelJS}=await import('exceljs');const workbook=new ExcelJS.Workbook();await workbook.xlsx.load(bytes);
  const sheet=workbook.getWorksheet('School report');assert.equal(sheet.getRow(4).getCell(1).value,"'=SUM(A1:A2)");assert.equal(sheet.getRow(5).getCell(2).value,"'@sample");assert.equal(sheet.rowCount,5);
});
test('PDF export paginates long content into a real PDF', async () => {
  const doc=await exportsModule.createPdfDocument('Maplewood receipt',['Particular','Details'],[['Amount','INR 1,234.50'],['Long notice','School notice '.repeat(1200)]]);
  assert.ok(doc.getNumberOfPages()>1);const bytes=Buffer.from(doc.output('arraybuffer'));assert.equal(bytes.subarray(0,5).toString(),'%PDF-');assert.ok(bytes.length>2000);
});

const parity = await sourceModule('../src/domain/parity.ts');
test('class teacher receives a new class without a subject assignment',()=>{
  const state=createDemoState();state.classes.push({id:'new-class',schoolId:'maplewood',teacherId:'maplewood-teacher-12',status:'active',year:'2027-28',grade:'11 - MPC',section:'A'});
  assert.ok(parity.teacherClassIds(state,'maplewood','maplewood-teacher-12',true).has('new-class'));
  assert.ok(!parity.teacherClassIds(state,'riverdale','maplewood-teacher-12',true).has('new-class'));
});
test('reassigning a subject replaces the selected mapping and preserves other class assignments',()=>{
  const state=createDemoState();const old=state.assignments[0],other=state.assignments.find(row=>row.subjectId===old.subjectId&&row.classId!==old.classId);
  const before=structuredClone(other),count=state.assignments.length,oldClass=old.classId;
  state.classes.push({id:'new-class',schoolId:old.schoolId,status:'active'});
  parity.replaceTeachingAssignment(state,old.schoolId,old.subjectId,old.id,'new-class',old.teacherId,'unused');
  assert.equal(state.assignments.length,count);assert.equal(old.classId,'new-class');assert.deepEqual(other,before);
  assert.ok(!state.slots.some(row=>row.schoolId===old.schoolId&&row.classId===oldClass&&row.subjectId===old.subjectId&&row.teacherId===old.teacherId));
});
test('payable setup credits the discount exactly once and refuses another setup',()=>{
  const state=parity.migrateWorkspace(createDemoState()),student=state.students[0];
  const account={id:'setup',schoolId:student.schoolId,studentId:student.id,year:'2026-27',discountType:'percentage',discountValue:10,discountPaise:150000,paidAtSetup:500000};
  parity.savePayableSetup(state,account,'credit','entry','2026-11-02');
  assert.equal(operations.accountBalance(state,student.schoolId,student.id,'2026-27'),1350000);
  assert.throws(()=>parity.savePayableSetup(state,{...account,id:'duplicate'},'credit2','entry2','now'),/already set/);
  assert.equal(state.concessions.length,1);
});
test('zero-discount setup unlocks an account without creating a ledger credit',()=>{
  const state=parity.migrateWorkspace(createDemoState()),student=state.students[0],count=state.ledger.length;
  parity.savePayableSetup(state,{id:'setup',schoolId:student.schoolId,studentId:student.id,year:'2026-27',discountType:'none',discountValue:0,discountPaise:0,paidAtSetup:500000},'credit','entry','now');
  assert.equal(state.feeAccounts.length,1);assert.equal(state.ledger.length,count);
});
test('migration preserves old credits, locks them and adds future years without closing the current year',()=>{
  const state=createDemoState();delete state.feeAccounts;state.concessions.push({id:'existing-credit',schoolId:'maplewood',studentId:state.students[0].id,year:'2026-27',amountPaise:12345});
  const migrated=parity.migrateWorkspace(state),again=parity.migrateWorkspace(migrated);
  assert.equal(again.feeAccounts.length,1);assert.equal(again.feeAccounts[0].discountPaise,12345);
  assert.equal(again.years.find(row=>row.schoolId==='maplewood'&&row.label==='2027-28').status,'planned');
  assert.equal(again.years.find(row=>row.schoolId==='maplewood'&&row.label==='2026-27').status,'current');
});

const feeOverview = await sourceModule('../src/domain/feeOverview.ts');
test('class overview combines sections and reconciles school, class and student totals',()=>{
  const state=createDemoState();state.classes.find(row=>row.id==='maplewood-class-2').grade='1';state.classes.find(row=>row.id==='maplewood-class-2').section='B';
  const result=feeOverview.classFeeOverview(state,'maplewood','2026-27');
  const group=result.groups.find(row=>row.grade==='1');assert.equal(group.students,50);assert.deepEqual(group.sections,['A','B']);
  assert.deepEqual(feeOverview.totalFees(result.groups),result.totals);
  assert.deepEqual(feeOverview.totalFees(group.accounts),feeOverview.totalFees([group]));
  assert.equal(result.totals.net,result.totals.collected+result.totals.outstanding);
  assert.equal(result.totals.students,200);
});
test('overview applies discounts once, subtracts reversals and isolates years/schools',()=>{
  const state=parity.migrateWorkspace(createDemoState()),student=state.students[0];
  parity.savePayableSetup(state,{id:'setup',schoolId:student.schoolId,studentId:student.id,year:'2026-27',discountType:'amount',discountValue:1000,discountPaise:100000,paidAtSetup:500000},'credit','entry','now');
  const payment=state.payments.find(row=>row.studentId===student.id);state.reversals.push({id:'reversal',schoolId:student.schoolId,paymentId:payment.id,amountPaise:payment.amountPaise});state.ledger.push({id:'reversal-ledger',schoolId:student.schoolId,studentId:student.id,year:'2026-27',amountPaise:payment.amountPaise});
  const result=feeOverview.classFeeOverview(state,'maplewood','2026-27'),account=result.accounts.find(row=>row.id===student.id);
  assert.equal(account.collected,0);assert.equal(account.discount,100000);assert.equal(account.net,1900000);assert.equal(account.outstanding,1900000);
  assert.equal(result.totals.net,result.totals.collected+result.totals.outstanding);
  assert.equal(feeOverview.classFeeOverview(state,'riverdale','2026-27').totals.discount,0);
  assert.equal(feeOverview.classFeeOverview(state,'maplewood','2027-28').totals.students,0);
});
test('fully discounted fees are paid without dividing by zero; unassessed fees stay distinct',()=>{
  const full={gross:10000,discount:10000,net:0,collected:0,outstanding:0,students:1};
  assert.equal(feeOverview.feeStatus(full),'Paid');assert.equal(feeOverview.collectionRate(full),100);
  const empty={gross:0,discount:0,net:0,collected:0,outstanding:0,students:1};
  assert.equal(feeOverview.feeStatus(empty),'Not assessed');assert.equal(feeOverview.collectionRate(empty),0);
});
