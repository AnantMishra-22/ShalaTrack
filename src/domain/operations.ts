import type { Allocation, AttendanceSession, DemoState, Mark, Payment } from './model';

export function validateMarks(session: AttendanceSession, marks: Mark[]) {
  if (marks.length !== session.rosterIds.length) throw new Error('Mark every student before submitting.');
  const seen = new Set<string>();
  for (const mark of marks) {
    if (!session.rosterIds.includes(mark.studentId) || seen.has(mark.studentId)) throw new Error('The attendance roster has changed. Reload this period.');
    if (!['present', 'absent', 'late', 'excused'].includes(mark.status)) throw new Error('Choose a valid attendance status.');
    seen.add(mark.studentId);
  }
}
export function applyMarks(session: AttendanceSession, marks: Mark[], time: string) {
  validateMarks(session, marks);
  session.marks = marks;
  session.present = marks.filter(mark => mark.status === 'present').length;
  session.absent = marks.filter(mark => mark.status === 'absent').length;
  session.late = marks.filter(mark => mark.status === 'late').length;
  // Excused marks are outside the eligible denominator.
  session.rosterSize = marks.filter(mark => mark.status !== 'excused').length;
  session.status = 'submitted'; session.submittedAt = time; session.version += 1;
}
export function accountBalance(state: DemoState, schoolId: string, studentId: string, year: string) {
  return state.ledger.filter(row => row.schoolId === schoolId && row.studentId === studentId && row.year === year).reduce((sum, row) => sum + row.amountPaise, 0);
}
export function installmentBalance(state: DemoState, installmentId: string, schoolId: string) {
  const assessment = state.assessments.find(row => row.schoolId === schoolId && row.installments.some(item => item.id === installmentId));
  if (!assessment) throw new Error('This installment does not belong to the selected school.');
  const installment = assessment.installments.find(row => row.id === installmentId)!;
  let paid = 0;
  for (const payment of state.payments.filter(row => row.schoolId === schoolId)) {
    const reversed = state.reversals.filter(row => row.schoolId === schoolId && row.paymentId === payment.id).reduce((sum, row) => sum + row.amountPaise, 0);
    // UI supports full reversals only, so original allocations are either wholly active or reversed.
    if (reversed < payment.amountPaise) paid += payment.allocations.filter(row => row.installmentId === installmentId).reduce((sum, row) => sum + row.amountPaise, 0);
  }
  return installment.amountPaise - paid;
}
export function allocatePayment(state: DemoState, schoolId: string, studentId: string, year: string, amount: number, category: string): Allocation[] {
  if (!Number.isSafeInteger(amount) || amount <= 0) throw new Error('Enter a positive amount with at most two decimal places.');
  if (amount > accountBalance(state, schoolId, studentId, year)) throw new Error('Payment exceeds the outstanding account balance.');
  const installments = state.assessments.filter(row => row.schoolId === schoolId && row.studentId === studentId && row.year === year && (!category || row.category === category)).flatMap(row => row.installments).sort((a, b) => a.due.localeCompare(b.due));
  let remaining = amount;
  const allocations: Allocation[] = [];
  for (const installment of installments) {
    const allocated = Math.min(remaining, installmentBalance(state, installment.id, schoolId));
    if (allocated > 0) allocations.push({ installmentId: installment.id, amountPaise: allocated });
    remaining -= allocated;
    if (!remaining) break;
  }
  if (remaining) throw new Error('Payment exceeds the pending amount for this fee category.');
  return allocations;
}
export function validatePayment(payment: Payment) {
  if (!Number.isSafeInteger(payment.amountPaise) || payment.amountPaise <= 0) throw new Error('Enter a valid payment amount.');
  if (!['Cash', 'UPI', 'Bank'].includes(payment.method)) throw new Error('Choose a payment method.');
  if (payment.method !== 'Cash' && !payment.reference.trim()) throw new Error('A bank or UPI reference is required.');
  if (payment.allocations.some(row => !Number.isSafeInteger(row.amountPaise) || row.amountPaise <= 0) || new Set(payment.allocations.map(row => row.installmentId)).size !== payment.allocations.length) throw new Error('Payment allocations must be positive, unique installment amounts.');
  if (payment.allocations.reduce((sum, row) => sum + row.amountPaise, 0) !== payment.amountPaise) throw new Error('Payment allocations do not match the payment amount.');
}
export function validateQr(token: string, schoolId: string, challenges: DemoState['challenges'], now: number) {
  const challenge = challenges.find(row => row.schoolId === schoolId && row.token === token.trim());
  if (!challenge) throw new Error('This QR code is not from this school’s current sample display.');
  if (challenge.expiresAt <= now) throw new Error('This QR code has expired. Scan the new code.');
  return challenge;
}
