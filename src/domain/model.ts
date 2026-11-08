import type { PeriodSession } from './dashboard';
export type RecordStatus = 'active' | 'archived';
export interface Owned { id: string; schoolId: string; }
export type StudentService = 'all'|'hostel'|'transport';
export interface HostelDetails { enrolled:boolean; building:string; room:string; admittedOn:string; }
export interface TransportDetails { enrolled:boolean; route:string; stop:string; vehicle:string; startsOn:string; }
export interface Student extends Owned { admissionNumber: string; name: string; gender: string; classId: string; guardianName: string; phone: string; consent: boolean; status: RecordStatus; hostel?: HostelDetails; transport?: TransportDetails; }
export interface Teacher extends Owned { employeeCode: string; name: string; gender: string; email: string; phone: string; status: RecordStatus; invitation: 'invited' | 'accepted'; }
export interface ClassSection extends Owned { grade: string; section: string; year: string; teacherId: string; status: RecordStatus; }
export interface Subject extends Owned { name: string; code: string; status: RecordStatus; }
export interface Assignment extends Owned { classId: string; subjectId: string; teacherId: string; }
export interface Year extends Owned { label: string; starts: string; ends: string; status: 'current' | 'planned' | 'closed'; }
export interface Slot extends Owned { classId: string; subjectId: string; teacherId: string; weekday: string; period: number; }
export type MarkStatus = 'present' | 'absent' | 'late' | 'excused';
export interface Mark { studentId: string; status: MarkStatus; }
export interface AttendanceSession extends PeriodSession { classId: string; schoolDate: string; teacherId: string; subjectId: string; rosterIds: string[]; marks: Mark[]; version: number; }
export interface Correction extends Owned { sessionId: string; baseVersion: number; changes: Mark[]; reason: string; requestedBy: string; status: 'pending' | 'approved' | 'rejected'; approvedBy?: string; }
export interface QrChallenge extends Owned { token: string; expiresAt: number; }
export interface CheckIn extends Owned { teacherId: string; schoolDate: string; status: 'present' | 'absent'; at: string; method: 'sample_qr' | 'sample_record'; }
export interface FeePlan extends Owned { appliesTo?: StudentService; classId: string; year: string; category: string; amountPaise: number; installments: { due: string; amountPaise: number }[]; paymentMethod: string; version: number; }
export interface Assessment extends Owned { service?: StudentService; studentId: string; year: string; planId: string; category: string; amountPaise: number; installments: { id: string; due: string; amountPaise: number }[]; }
export interface FeeAccount extends Owned { studentId: string; year: string; discountType: 'none'|'amount'|'percentage'; discountValue: number; discountPaise: number; paidAtSetup: number; }
export interface Concession extends Owned { studentId: string; year: string; amountPaise: number; reason: string; }
export interface Allocation { installmentId: string; amountPaise: number; }
export interface Payment extends Owned { studentId: string; year: string; amountPaise: number; method: string; reference: string; paymentDate: string; recordedAt: string; receiptNumber: string; studentName: string; admissionNumber: string; className: string; allocations: Allocation[]; assessedPaise?: number; previousPaidPaise?: number; discountPaise?: number; balancePaise?: number; category?: string; service?: StudentService; }
export interface Reversal extends Owned { paymentId: string; amountPaise: number; reason: string; at: string; }
export interface LedgerEntry extends Owned { studentId: string; year: string; amountPaise: number; kind: 'assessment' | 'payment' | 'concession' | 'reversal'; sourceId: string; at: string; }
export interface Notice extends Owned { title: string; body: string; audience: 'all_teachers' | 'selected_teachers'; teacherIds: string[]; publishedAt: string; author: string; }
export interface Delivery extends Owned { studentId?: string; phone: string; title: string; message: string; dedupeKey: string; at: string; state: 'simulated'; }
export interface Audit extends Owned { action: string; detail: string; at: string; }
export interface DemoState {
  schema: 2; students: Student[]; teachers: Teacher[]; classes: ClassSection[]; subjects: Subject[]; assignments: Assignment[]; years: Year[]; slots: Slot[];
  sessions: AttendanceSession[]; corrections: Correction[]; challenges: QrChallenge[]; checkIns: CheckIn[];
  feeAccounts: FeeAccount[]; feePlans: FeePlan[]; assessments: Assessment[]; concessions: Concession[]; payments: Payment[]; reversals: Reversal[]; ledger: LedgerEntry[];
  notices: Notice[]; deliveries: Delivery[]; audit: Audit[];
}
export const classLabel = (item?: ClassSection) => item ? `Class ${item.grade} ${item.section}` : 'Unassigned';
export const money = (paise: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(paise / 100);
export const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
