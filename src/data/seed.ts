import { demoSessions, schools, DEMO_DAY } from '../domain/dashboard';
import { classLabel, type DemoState } from '../domain/model';

export function createDemoState(): DemoState {
  const state: DemoState = { schema: 2, students: [], teachers: [], classes: [], subjects: [], assignments: [], years: [], slots: [], sessions: [], corrections: [], challenges: [], checkIns: [], feeAccounts: [], feePlans: [], assessments: [], concessions: [], payments: [], reversals: [], ledger: [], notices: [], deliveries: [], audit: [] };
  const firstNames = ['Aarav', 'Ananya', 'Vihaan', 'Ishita', 'Arjun', 'Diya', 'Kabir', 'Myra', 'Aditya', 'Saanvi', 'Reyansh', 'Anika', 'Vivaan', 'Aanya', 'Ishaan', 'Kiara', 'Atharv', 'Riya', 'Dhruv', 'Tara'];
  const surnames = ['Sharma', 'Patel', 'Joshi', 'Rao', 'Desai', 'Shah', 'Kulkarni', 'Thomas', 'Menon', 'Patil'];
  const teacherNames = ['Kavya Rao', 'Arjun Desai', 'Meera Shah', 'Rohan Kulkarni', 'Ananya Joshi', 'Nikhil Patil', 'Sara Thomas', 'Dev Menon', 'Neha Sharma', 'Vikram Singh', 'Pooja Nair', 'Aman Verma'];
  const subjectNames = ['English', 'Mathematics', 'Science', 'Social studies', 'Hindi', 'Marathi', 'Computer science', 'Art'];
  for (const school of schools) {
    const s = school.id;
    state.years.push({ id: `${s}-year-current`, schoolId: s, label: '2026-27', starts: '2026-06-01', ends: '2027-04-30', status: 'current' }, { id: `${s}-year-old`, schoolId: s, label: '2025-26', starts: '2025-06-01', ends: '2026-04-30', status: 'closed' });
    for (let i = 0; i < school.teachers; i++) {
      state.teachers.push({ id: `${s}-teacher-${i + 1}`, schoolId: s, employeeCode: `T${String(i + 1).padStart(3, '0')}`, name: teacherNames[i], email: `teacher${i + 1}@${s}.example`, phone: `900001${String(i + 1).padStart(4, '0')}`, gender: i % 2 ? 'Male' : 'Female', status: 'active', invitation: 'accepted' });
      if (i < school.teacherPresent + school.teacherAbsent) state.checkIns.push({ id: `${s}-checkin-${i}`, schoolId: s, teacherId: `${s}-teacher-${i + 1}`, schoolDate: DEMO_DAY, status: i < school.teacherPresent ? 'present' : 'absent', at: `2026-11-02T0${i % 2 ? '3' : '2'}:45:00Z`, method: 'sample_record' });
    }
    for (let c = 0; c < 8; c++) {
      const classId = `${s}-class-${c + 1}`;
      state.classes.push({ id: classId, schoolId: s, grade: String(c + 1), section: 'A', year: '2026-27', teacherId: `${s}-teacher-${c + 1}`, status: 'active' });
      for (let sub = 0; sub < 8; sub++) {
        const subjectId = `${s}-subject-${sub + 1}`;
        if (!c) state.subjects.push({ id: subjectId, schoolId: s, name: subjectNames[sub], code: ['ENG', 'MATH', 'SCI', 'SOC', 'HIN', 'MAR', 'ICT', 'ART'][sub], status: 'active' });
        state.assignments.push({ id: `${s}-assignment-${c}-${sub}`, schoolId: s, classId, subjectId, teacherId: `${s}-teacher-${c + 1}` });
        for (const weekday of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) state.slots.push({ id: `${s}-slot-${c}-${sub}-${weekday}`, schoolId: s, classId, subjectId, teacherId: `${s}-teacher-${c + 1}`, weekday, period: sub + 1 });
      }
      for (const [category, amountPaise] of [['Tuition', 1800000], ['Activities', 200000]] as const) state.feePlans.push({ id: `${s}-plan-${c}-${category}`, schoolId: s, classId, year: '2026-27', category, amountPaise, paymentMethod: 'Any manual method', version: 1, installments: category === 'Tuition' ? [{ due: '2026-07-01', amountPaise: 900000 }, { due: '2026-11-01', amountPaise: 900000 }] : [{ due: '2026-07-01', amountPaise }] });
    }
    for (let i = 0; i < school.students; i++) {
      const classIndex = s === 'maplewood' ? Math.floor(i / 25) : (i < 92 ? Math.floor(i / 23) : 4 + Math.floor((i - 92) / 22));
      const studentId = `${s}-student-${i + 1}`;
      const student = { id: studentId, schoolId: s, admissionNumber: `ST${String(i + 1).padStart(4, '0')}`, name: `${firstNames[i % firstNames.length]} ${surnames[Math.floor(i / firstNames.length) % surnames.length]}`, gender: i % 2 ? 'Female' : 'Male', classId: `${s}-class-${classIndex + 1}`, guardianName: `${i % 2 ? 'Priya' : 'Rajesh'} ${surnames[Math.floor(i / firstNames.length) % surnames.length]}`, phone: `900000${String(i + 1).padStart(4, '0')}`, consent: i % 31 !== 0, status: 'active' as const };
      state.students.push({...student,hostel:{enrolled:i%8===0,building:i%16===0?'North hostel':'South hostel',room:`${100+i%20}`,admittedOn:'2026-06-01'},transport:{enrolled:i%5===0,route:i%10===0?'Route A':'Route B',stop:i%10===0?'Central stop':'Market stop',vehicle:i%10===0?'DEMO-BUS-01':'DEMO-BUS-02',startsOn:'2026-06-01'}});
      for (const plan of state.feePlans.filter(row => row.schoolId === s && row.classId === student.classId)) {
        const assessment = { id: `${studentId}-assessment-${plan.category}`, schoolId: s, studentId, year: '2026-27', planId: plan.id, category: plan.category, amountPaise: plan.amountPaise, installments: plan.installments.map((installment, index) => ({ ...installment, id: `${studentId}-${plan.category}-${index}` })) };
        state.assessments.push(assessment);
        state.ledger.push({ id: `${assessment.id}-ledger`, schoolId: s, studentId, year: '2026-27', amountPaise: assessment.amountPaise, kind: 'assessment', sourceId: assessment.id, at: '2026-06-01T04:00:00Z' });
      }
      if (i < 50) {
        const payment = { id: `${s}-payment-${i}`, schoolId: s, studentId, year: '2026-27', amountPaise: 500000, method: i % 2 ? 'UPI' : 'Cash', reference: i % 2 ? `SAMPLE-${i + 1}` : '', paymentDate: i === 0 ? DEMO_DAY : '2026-10-20', recordedAt: '2026-11-02T04:42:00Z', receiptNumber: `${school.initials}/26-27/${String(i + 1).padStart(4, '0')}`, studentName: student.name, admissionNumber: student.admissionNumber, className: classLabel(state.classes.find(row => row.id === student.classId)), allocations: [{ installmentId: `${studentId}-Tuition-0`, amountPaise: 500000 }] };
        state.payments.push(payment);
        state.ledger.push({ id: `${payment.id}-ledger`, schoolId: s, studentId, year: '2026-27', amountPaise: -payment.amountPaise, kind: 'payment', sourceId: payment.id, at: payment.recordedAt });
      }
    }
    state.notices.push({ id: `${s}-notice-1`, schoolId: s, title: 'Staff meeting', body: 'Please join the staff meeting at 3:30 PM in the library. We will review class schedules and upcoming school activities.', audience: 'all_teachers', teacherIds: [], publishedAt: '2026-11-02T04:10:00Z', author: 'Aditi Sharma' }, { id: `${s}-notice-2`, schoolId: s, title: 'Class register review', body: 'Please review your class register and confirm the guardian contact details by Friday.', audience: 'selected_teachers', teacherIds: [`${s}-teacher-1`], publishedAt: '2026-11-01T06:00:00Z', author: 'Aditi Sharma' });
  }
  for (const source of demoSessions) {
    const classNumber = Number(source.className.match(/\d+/)?.[0]);
    const classId = `${source.schoolId}-class-${classNumber}`;
    const rosterIds = state.students.filter(row => row.schoolId === source.schoolId && row.classId === classId).map(row => row.id);
    const marks = source.status === 'submitted' ? rosterIds.map((studentId, index) => ({ studentId, status: index < source.absent ? 'absent' as const : index < source.absent + source.late ? 'late' as const : 'present' as const })) : [];
    state.sessions.push({ ...source, classId, teacherId: `${source.schoolId}-teacher-${classNumber}`, subjectId: state.subjects.find(row=>row.schoolId===source.schoolId&&row.name===source.subject)?.id||'', schoolDate: DEMO_DAY, rosterIds, marks, version: source.status === 'submitted' ? 1 : 0 });
  }
  return state;
}
