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
