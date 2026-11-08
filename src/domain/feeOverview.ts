import { matchesService, serviceLabel } from './studentServices';
import type { DemoState } from './model';
export type FeeStatus = 'Paid'|'Partial'|'Pending'|'Not assessed';
export interface FeeTotals { gross:number; discount:number; net:number; collected:number; outstanding:number; students:number; }
export interface StudentFeeAccount extends FeeTotals { id:string; name:string; admissionNumber:string; grade:string; section:string; classId:string; categories:string[]; status:FeeStatus; services:string; }
export interface ClassFeeGroup extends FeeTotals { id:string; grade:string; sections:string[]; accounts:StudentFeeAccount[]; status:FeeStatus; }
export function feeStatus(total:FeeTotals):FeeStatus { return total.gross===0?'Not assessed':total.outstanding<=0?'Paid':total.collected>0?'Partial':'Pending'; }
export function collectionRate(total:FeeTotals) { return total.net>0?Math.min(100,Math.max(0,total.collected/total.net*100)):total.gross>0?100:0; }
export function totalFees(accounts:FeeTotals[]):FeeTotals { return accounts.reduce((sum,row)=>({gross:sum.gross+row.gross,discount:sum.discount+row.discount,net:sum.net+row.net,collected:sum.collected+row.collected,outstanding:sum.outstanding+row.outstanding,students:sum.students+row.students}),{gross:0,discount:0,net:0,collected:0,outstanding:0,students:0}); }
export function classFeeOverview(state:DemoState,schoolId:string,year:string,service:string='all') {
  const accounts:StudentFeeAccount[]=[];
  const groups=new Map<string,ClassFeeGroup>();
  const schoolClasses=state.classes.filter(row=>row.schoolId===schoolId&&row.year===year);
  for(const row of schoolClasses) if(!groups.has(row.grade)) groups.set(row.grade,{id:row.grade,grade:row.grade,sections:[],accounts:[],...totalFees([]),status:'Not assessed'});
  for(const student of state.students.filter(row=>row.schoolId===schoolId&&matchesService(row,service))) {
    const assessments=state.assessments.filter(row=>row.schoolId===schoolId&&row.studentId===student.id&&row.year===year);
    const ledger=state.ledger.filter(row=>row.schoolId===schoolId&&row.studentId===student.id&&row.year===year);
    const current=schoolClasses.find(row=>row.id===student.classId);
    if(!assessments.length&&!ledger.length&&(!current||student.status==='archived'))continue;
    // Historical liabilities stay with the assessment's class/year after a pupil moves.
    const assessmentClassId=state.feePlans.find(row=>row.schoolId===schoolId&&row.id===assessments[0]?.planId)?.classId;
    const schoolClass=schoolClasses.find(row=>row.id===assessmentClassId)||current;
    const gross=assessments.reduce((sum,row)=>sum+row.amountPaise,0);
    const discount=state.concessions.filter(row=>row.schoolId===schoolId&&row.studentId===student.id&&row.year===year).reduce((sum,row)=>sum+row.amountPaise,0);
    const collected=state.payments.filter(row=>row.schoolId===schoolId&&row.studentId===student.id&&row.year===year).reduce((sum,row)=>sum+row.amountPaise-state.reversals.filter(item=>item.schoolId===schoolId&&item.paymentId===row.id).reduce((n,item)=>n+item.amountPaise,0),0);
    const total={gross,discount,net:gross-discount,collected,outstanding:ledger.reduce((sum,row)=>sum+row.amountPaise,0),students:1};
    const account:StudentFeeAccount={...total,id:student.id,name:student.name,admissionNumber:student.admissionNumber,grade:schoolClass?.grade||'Unassigned',section:schoolClass?.section||'—',classId:schoolClass?.id||student.classId,services:serviceLabel(student),categories:[...new Set(assessments.map(row=>row.category))],status:feeStatus(total)};
    accounts.push(account);
    let group=groups.get(account.grade);
    if(!group){group={id:account.grade,grade:account.grade,sections:[],accounts:[],...totalFees([]),status:'Not assessed'};groups.set(account.grade,group);}
    group.accounts.push(account);
  }
  for(const group of groups.values()) {
    Object.assign(group,totalFees(group.accounts));
    group.sections=[...new Set([...schoolClasses.filter(row=>row.grade===group.grade).map(row=>row.section),...group.accounts.map(row=>row.section)])].sort();
    group.status=feeStatus(group);
  }
  return {accounts,groups:[...groups.values()].filter(row=>service==='all'||row.students>0).sort((a,b)=>a.grade.localeCompare(b.grade,'en',{numeric:true})),totals:totalFees(accounts)};
}
