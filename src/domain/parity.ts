import type { DemoState, FeeAccount } from './model';

export function migrateWorkspace(state: DemoState): DemoState {
  state.feeAccounts ||= [];
  for (const schoolId of new Set(state.classes.map(row => row.schoolId))) {
    for (const start of [2027, 2028]) {
      const label = `${start}-${String(start + 1).slice(2)}`;
      if (!state.years.some(row => row.schoolId === schoolId && row.label === label)) state.years.push({ id: `${schoolId}-year-${label}`, schoolId, label, starts: `${start}-06-01`, ends: `${start + 1}-04-30`, status: 'planned' });
    }
    // Existing demo concessions are preserved as a locked setup, never charged twice.
    for (const credit of state.concessions.filter(row => row.schoolId === schoolId)) {
      if (state.feeAccounts.some(row => row.schoolId === schoolId && row.studentId === credit.studentId && row.year === credit.year)) continue;
      const total = state.concessions.filter(row => row.schoolId === schoolId && row.studentId === credit.studentId && row.year === credit.year).reduce((sum,row) => sum + row.amountPaise,0);
      state.feeAccounts.push({id:`${credit.id}-setup`,schoolId,studentId:credit.studentId,year:credit.year,discountType:'amount',discountValue:total/100,discountPaise:total,paidAtSetup:0});
    }
  }
  return state;
}
export function teacherClassIds(state: DemoState, schoolId: string, teacherId: string, homeroomOnly = false) {
  const ids = state.classes.filter(row => row.schoolId === schoolId && row.teacherId === teacherId && row.status === 'active').map(row => row.id);
  return new Set(homeroomOnly ? ids : [...ids, ...state.assignments.filter(row => row.schoolId === schoolId && row.teacherId === teacherId).map(row => row.classId)]);
}
export function replaceTeachingAssignment(state: DemoState, schoolId: string, subjectId: string, assignmentId: string, classId: string, teacherId: string, newId: string) {
  const old = state.assignments.find(row => row.id === assignmentId && row.schoolId === schoolId && row.subjectId === subjectId);
  if (state.assignments.some(row => row.schoolId === schoolId && row.subjectId === subjectId && row.classId === classId && row.id !== old?.id)) throw new Error('This subject already has an assignment for that class. Select that assignment to edit it.');
  if (old) {
    const slots = state.slots.filter(row => row.schoolId === schoolId && row.classId === old.classId && row.subjectId === subjectId && row.teacherId === old.teacherId);
    if (old.classId === classId) {
      for (const slot of slots) {
        if (state.slots.some(row => row.schoolId === schoolId && row.id !== slot.id && row.weekday === slot.weekday && row.period === slot.period && row.teacherId === teacherId)) throw new Error('The new teacher has a timetable conflict. Adjust the timetable first.');
        slot.teacherId = teacherId;
      }
    } else {
      const ids = new Set(slots.map(row => row.id));
      state.slots = state.slots.filter(row => !ids.has(row.id));
    }
    old.classId = classId; old.teacherId = teacherId;
  } else state.assignments.push({id:newId,schoolId,subjectId,classId,teacherId});
}
export function savePayableSetup(state: DemoState, account: FeeAccount, creditId: string, ledgerId: string, at: string) {
  if (state.feeAccounts.some(row => row.schoolId === account.schoolId && row.studentId === account.studentId && row.year === account.year)) throw new Error('The payable amount is already set. Its discount cannot be applied again.');
  const outstanding = state.ledger.filter(row => row.schoolId === account.schoolId && row.studentId === account.studentId && row.year === account.year).reduce((sum,row)=>sum+row.amountPaise,0);
  if (!Number.isSafeInteger(account.discountPaise) || account.discountPaise < 0 || account.discountPaise > outstanding) throw new Error('Discount cannot exceed the pending fee.');
  state.feeAccounts.push(account);
  if (account.discountPaise) {
    state.concessions.push({id:creditId,schoolId:account.schoolId,studentId:account.studentId,year:account.year,amountPaise:account.discountPaise,reason:'Student payable amount setup'});
    state.ledger.push({id:ledgerId,schoolId:account.schoolId,studentId:account.studentId,year:account.year,amountPaise:-account.discountPaise,kind:'concession',sourceId:creditId,at});
  }
}
