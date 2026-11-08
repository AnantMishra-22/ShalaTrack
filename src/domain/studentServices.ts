import type { DemoState, FeePlan, Student, StudentService, Payment, Assessment } from './model';
export type ServiceFilter = StudentService|'both'|'neither';
export const serviceOptions = [{value:'all',label:'All students'},{value:'hostel',label:'Hostel students'},{value:'transport',label:'Transport students'},{value:'both',label:'Hostel + transport'},{value:'neither',label:'Neither service'}];
export function matchesService(student:Pick<Student,'hostel'|'transport'>,filter:string) {
  const hostel=!!student.hostel?.enrolled,transport=!!student.transport?.enrolled;
  return filter==='hostel'?hostel:filter==='transport'?transport:filter==='both'?hostel&&transport:filter==='neither'?!hostel&&!transport:true;
}
export function serviceLabel(student:Pick<Student,'hostel'|'transport'>) {
  return student.hostel?.enrolled?(student.transport?.enrolled?'Hostel + transport':'Hostel'):student.transport?.enrolled?'Transport':'Neither service';
}
export function validateStudentServices(student:Pick<Student,'hostel'|'transport'>) {
  if(student.hostel?.enrolled&&(!student.hostel.building.trim()||!student.hostel.admittedOn))throw new Error('Enter the hostel/building and hostel admission date.');
  if(student.transport?.enrolled&&(!student.transport.route.trim()||!student.transport.stop.trim()||!student.transport.startsOn))throw new Error('Enter the transport route, stop and start date.');
}
export function eligibleForPlan(student:Student,plan:FeePlan) {return student.status==='active'&&student.schoolId===plan.schoolId&&student.classId===plan.classId&&matchesService(student,plan.appliesTo||'all');}
export function assessStudentPlan(state:DemoState,schoolId:string,studentId:string,plan:FeePlan,makeId:(prefix:string)=>string,at:string) {
  const student=state.students.find(row=>row.schoolId===schoolId&&row.id===studentId);
  if(!student||plan.schoolId!==schoolId||!eligibleForPlan(student,plan))return false;
  if(!state.years.some(row=>row.schoolId===schoolId&&row.label===plan.year&&row.status!=='closed'))throw new Error('This academic year is closed or unavailable.');
  if(state.assessments.some(row=>row.schoolId===schoolId&&row.studentId===studentId&&row.year===plan.year&&row.category===plan.category))return false;
  const assessment={id:makeId('assessment'),schoolId,studentId,year:plan.year,planId:plan.id,category:plan.category,service:plan.appliesTo||'all' as StudentService,amountPaise:plan.amountPaise,installments:plan.installments.map(row=>({...row,id:makeId('installment')}))};
  state.assessments.push(assessment);state.ledger.push({id:makeId('ledger'),schoolId,studentId,year:plan.year,amountPaise:assessment.amountPaise,kind:'assessment',sourceId:assessment.id,at});return true;
}

export function paymentServices(payment:Payment,assessments:Assessment[]):string[] {
  if(payment.service)return [payment.service];
  const installmentIds=new Set(payment.allocations.map(row=>row.installmentId));
  const services=assessments.filter(row=>row.schoolId===payment.schoolId&&row.studentId===payment.studentId&&row.year===payment.year&&row.installments.some(item=>installmentIds.has(item.id))).map(row=>row.service||'all');
  return [...new Set(services.length?services:['all'])];
}
