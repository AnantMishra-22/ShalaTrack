import { useState, type FormEvent } from 'react';
import { useWorkspace } from '../data/WorkspaceStore';
import { classLabel, id, type Student, type Teacher, type ClassSection, type Subject } from '../domain/model';
import type { DemoSchool } from '../domain/dashboard';
import { go, parameter } from '../lib/routes';
import { Button } from '../components/ui/button';
import { NativeSelect } from '../components/ui/native-select';
import { PlusIcon } from '../components/icons';
import { WorkspacePage, Records, SearchField, Status, Field, FormCard, Confirm, BackButton, EmptyState, Message } from '../components/workspace';

export type EntityKind = 'student'|'teacher'|'class'|'subject';
const config = {
  student: { plural: 'Students', path: 'students.html', description: 'Student profiles, enrollment and guardian details.' },
  teacher: { plural: 'Teachers', path: 'teachers.html', description: 'Your team and their teaching assignments.' },
  class: { plural: 'Classes', path: 'classses.html', description: 'Class sections, academic years and class teachers.' },
  subject: { plural: 'Subjects', path: 'subjects.html', description: 'Subjects and the teachers assigned to them.' },
};
export function EntityList({ kind, school }: { kind: EntityKind; school: DemoSchool }) {
  const { state } = useWorkspace(); const [search, setSearch] = useState(''); const [status, setStatus] = useState('active'); const [classFilter, setClassFilter] = useState('');
  const classes = state.classes.filter(row => row.schoolId === school.id);
  const teachers = state.teachers.filter(row => row.schoolId === school.id);
  const assignments = state.assignments.filter(row => row.schoolId === school.id);
  let rows: {id:string;title:string;subtitle:string;group:string;extra:string;status:string;classIds:string[]}[] = [];
  if (kind === 'student') rows = state.students.filter(row => row.schoolId === school.id).map(row => ({ id:row.id, title:row.name, subtitle:row.admissionNumber, group:classLabel(classes.find(item=>item.id===row.classId)), extra:`${row.guardianName} · ${row.phone}`, status:row.status, classIds:[row.classId] }));
  if (kind === 'teacher') rows = teachers.map(row => ({ id:row.id, title:row.name, subtitle:row.employeeCode, group:row.email, extra:row.phone, status:row.status, classIds:assignments.filter(item=>item.teacherId===row.id).map(item=>item.classId) }));
  if (kind === 'class') rows = classes.map(row => ({ id:row.id, title:classLabel(row), subtitle:row.year, group:teachers.find(item=>item.id===row.teacherId)?.name || 'Not assigned', extra:`${state.students.filter(item=>item.schoolId===school.id&&item.classId===row.id&&item.status==='active').length} students`, status:row.status, classIds:[row.id] }));
  if (kind === 'subject') rows = state.subjects.filter(row=>row.schoolId===school.id).map(row => { const assigned=assignments.filter(item=>item.subjectId===row.id); return {id:row.id,title:row.name,subtitle:row.code,group:`${new Set(assigned.map(item=>item.classId)).size} classes`,extra:`${new Set(assigned.map(item=>item.teacherId)).size} teachers`,status:row.status,classIds:assigned.map(item=>item.classId)}; });
  const total = rows.length; const active = rows.filter(row=>row.status==='active').length;
  const filtered = rows.filter(row => (!status||row.status===status)&&(!classFilter||row.classIds.includes(classFilter))&&`${row.title} ${row.subtitle} ${row.group} ${row.extra}`.toLowerCase().includes(search.toLowerCase()));
  return <WorkspacePage title={config[kind].plural} description={config[kind].description} action={<Button onClick={()=>go(`add-${kind}.html`)}><PlusIcon />Add {kind}</Button>}>
    <div className="inline-summary"><span><strong>{active}</strong> active {config[kind].plural.toLowerCase()}</span><span>{total-active} archived</span></div>
    <div className="records-toolbar"><SearchField value={search} onChange={setSearch} label={`Search ${config[kind].plural.toLowerCase()}`} />{(kind==='student'||kind==='subject')&&<NativeSelect aria-label="Class filter" value={classFilter} onChange={e=>setClassFilter(e.target.value)}><option value="">All classes</option>{classes.map(row=><option key={row.id} value={row.id}>{classLabel(row)}</option>)}</NativeSelect>}<NativeSelect aria-label="Record status" value={status} onChange={e=>setStatus(e.target.value)}><option value="active">Active</option><option value="archived">Archived</option><option value="">All statuses</option></NativeSelect></div>
    <Records rows={filtered} columns={[
      {title:kind==='class'?'Class':kind==='subject'?'Subject':'Name',cell:row=><div className="record-identity"><strong>{row.title}</strong><small>{row.subtitle}</small></div>},
      {title:kind==='student'?'Class':kind==='teacher'?'Email':kind==='class'?'Class teacher':'Classes',cell:row=>row.group},
      {title:kind==='student'?'Guardian':kind==='teacher'?'Mobile':kind==='class'?'Enrollment':'Teachers',cell:row=>row.extra,className:'hide-on-phone'},
      {title:'Status',cell:row=><Status kind={row.status==='active'?'success':'neutral'}>{row.status==='active'?'Active':'Archived'}</Status>,className:'hide-on-phone'},
      {title:'Actions',cell:row=><Button variant="outline" size="sm" onClick={()=>go(`edit-${kind}.html`,{id:row.id})}>Edit</Button>},
    ]} />
  </WorkspacePage>;
}

export function EntityEditor({ kind, school, edit = false }: { kind: EntityKind; school: DemoSchool; edit?: boolean }) {
  const {state,commit}=useWorkspace(); const recordId=parameter('id')||parameter(`${kind}Id`);
  const collection=kind==='student'?state.students:kind==='teacher'?state.teachers:kind==='class'?state.classes:state.subjects;
  const record=collection.find(row=>row.schoolId===school.id&&row.id===recordId);
  const firstAssignment=state.assignments.find(row=>row.schoolId===school.id&&row.subjectId===recordId);
  const student=kind==='student'?record as Student|undefined:undefined; const teacher=kind==='teacher'?record as Teacher|undefined:undefined; const schoolClass=kind==='class'?record as ClassSection|undefined:undefined; const subject=kind==='subject'?record as Subject|undefined:undefined;
  const [values,setValues]=useState<Record<string,string>>({
    name:student?.name||teacher?.name||subject?.name||'', admissionNumber:student?.admissionNumber||'', gender:student?.gender||teacher?.gender||'', classId:student?.classId||firstAssignment?.classId||'', guardianName:student?.guardianName||'', phone:student?.phone||teacher?.phone||'', consent:student?.consent===false?'no':'yes', employeeCode:teacher?.employeeCode||'', email:teacher?.email||'', grade:schoolClass?.grade||'', section:schoolClass?.section||'A', year:schoolClass?.year||'2026-27', teacherId:schoolClass?.teacherId||firstAssignment?.teacherId||'', code:subject?.code||'',
  });
  const [error,setError]=useState(''); const [confirm,setConfirm]=useState(false); const [message,setMessage]=useState('');
  const change=(key:string)=>(value:string)=>{setValues(previous=>({...previous,[key]:value}));setError('');};
  const classes=state.classes.filter(row=>row.schoolId===school.id&&row.status==='active');
  const teachers=state.teachers.filter(row=>row.schoolId===school.id&&row.status==='active');
  const selectOptions=classes.map(row=>({value:row.id,label:`${classLabel(row)} (${row.year})`}));
  function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setError('');
    try{
      const value=Object.fromEntries(Object.entries(values).map(([key,text])=>[key,text.trim()]));
      if(kind!=='class'&&!value.name)throw new Error('Enter a name.');
      if((kind==='student'||kind==='teacher')&&value.phone&&!/^\+?\d{10,15}$/.test(value.phone.replace(/[\s-]/g,'')))throw new Error('Enter a mobile number with 10–15 digits.');
      commit(school.id,edit?`Updated ${kind}`:`Added ${kind}`,value.name||`Class ${value.grade} ${value.section}`,draft=>{
        const nextId=record?.id||id(kind); const status=record?.status||'active';
        if(kind==='student'){
          if(!value.admissionNumber)throw new Error('Enter an admission number.');
          if(draft.students.some(row=>row.schoolId===school.id&&row.admissionNumber.toLowerCase()===value.admissionNumber.toLowerCase()&&row.id!==nextId))throw new Error('This admission number is already in use.');
          if(!classes.some(row=>row.id===value.classId))throw new Error('Choose an active class and section.');
          const row:Student={id:nextId,schoolId:school.id,admissionNumber:value.admissionNumber,name:value.name,gender:value.gender,classId:value.classId,guardianName:value.guardianName,phone:value.phone,consent:value.consent==='yes',status};
          draft.students=draft.students.filter(item=>item.id!==nextId);draft.students.push(row);
        }
        if(kind==='teacher'){
          if(!value.employeeCode)throw new Error('Enter an employee code.');
          if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email))throw new Error('Enter a valid email address.');
          if(draft.teachers.some(row=>row.schoolId===school.id&&row.id!==nextId&&(row.employeeCode.toLowerCase()===value.employeeCode.toLowerCase()||row.email.toLowerCase()===value.email.toLowerCase())))throw new Error('The employee code or email is already in use.');
          const row:Teacher={id:nextId,schoolId:school.id,employeeCode:value.employeeCode,name:value.name,gender:value.gender,email:value.email.toLowerCase(),phone:value.phone,status,invitation:teacher?.invitation||'invited'};
          draft.teachers=draft.teachers.filter(item=>item.id!==nextId);draft.teachers.push(row);
        }
        if(kind==='class'){
          if(!value.grade||!value.section||!value.year)throw new Error('Choose a grade, section and academic year.');
          if(!teachers.some(row=>row.id===value.teacherId))throw new Error('Choose an active class teacher.');
          if(draft.classes.some(row=>row.schoolId===school.id&&row.id!==nextId&&row.year===value.year&&row.grade===value.grade&&row.section.toLowerCase()===value.section.toLowerCase()))throw new Error('This class and section already exist in the academic year.');
          const row:ClassSection={id:nextId,schoolId:school.id,grade:value.grade,section:value.section.toUpperCase(),year:value.year,teacherId:value.teacherId,status};
          draft.classes=draft.classes.filter(item=>item.id!==nextId);draft.classes.push(row);
        }
        if(kind==='subject'){
          if(!value.code)throw new Error('Enter a subject code.');
          if(draft.subjects.some(row=>row.schoolId===school.id&&row.id!==nextId&&row.code.toLowerCase()===value.code.toLowerCase()))throw new Error('This subject code is already in use.');
          if(!classes.some(row=>row.id===value.classId)||!teachers.some(row=>row.id===value.teacherId))throw new Error('Choose an active class and teacher.');
          const row:Subject={id:nextId,schoolId:school.id,name:value.name,code:value.code.toUpperCase(),status};
          draft.subjects=draft.subjects.filter(item=>item.id!==nextId);draft.subjects.push(row);
          const assignment=draft.assignments.find(item=>item.schoolId===school.id&&item.subjectId===nextId&&item.classId===value.classId);
          if(assignment)assignment.teacherId=value.teacherId;else draft.assignments.push({id:id('assignment'),schoolId:school.id,subjectId:nextId,classId:value.classId,teacherId:value.teacherId});
        }
      });
      go(config[kind].path);
    }catch(err){setError(err instanceof Error?err.message:'Could not save this record.');}
  }
  function archive(){if(!record)return;commit(school.id,record.status==='active'?`Archived ${kind}`:`Restored ${kind}`,values.name||classLabel(schoolClass),draft=>{
    if(kind==='class'&&record.status==='active'&&draft.students.some(row=>row.schoolId===school.id&&row.classId===record.id&&row.status==='active'))throw new Error('Move or archive the enrolled students before archiving this class.');
    const items=kind==='student'?draft.students:kind==='teacher'?draft.teachers:kind==='class'?draft.classes:draft.subjects;
    const row=items.find(item=>item.schoolId===school.id&&item.id===record.id);if(row)row.status=record.status==='active'?'archived':'active';
  });go(config[kind].path);}
  if(edit&&!record)return <WorkspacePage title={`Edit ${kind}`} description="The record is not available in this school." action={<BackButton path={config[kind].path} />}><EmptyState title="Record not found" /></WorkspacePage>;
  return <WorkspacePage title={`${edit?'Edit':'Add'} ${kind}`} description={kind==='teacher'?'Manage the profile. Invitations are simulated; no email is sent.':'Keep school records complete and up to date.'} action={<BackButton path={config[kind].path} />}>
    <FormCard title={`${kind[0].toUpperCase()+kind.slice(1)} details`} onSubmit={submit} back={config[kind].path} error={error} submitLabel={edit?'Save changes':kind==='teacher'?'Add teacher & simulate invitation':`Save ${kind}`}>
      {kind==='student'&&<Field label="Admission number" name="admissionNumber" value={values.admissionNumber} onChange={change('admissionNumber')} required />}
      {kind==='teacher'&&<Field label="Employee code" name="employeeCode" value={values.employeeCode} onChange={change('employeeCode')} required />}
      {kind!=='class'&&<Field label={kind==='subject'?'Subject name':'Full name'} name="name" value={values.name} onChange={change('name')} required />}
      {(kind==='student'||kind==='teacher')&&<Field label="Gender" name="gender" value={values.gender} onChange={change('gender')} options={['Female','Male','Other','Prefer not to say'].map(label=>({value:label,label}))} />}
      {(kind==='student'||kind==='subject')&&<Field label="Class and section" name="classId" value={values.classId} onChange={change('classId')} options={selectOptions} required />}
      {kind==='student'&&<><Field label="Guardian name" name="guardianName" value={values.guardianName} onChange={change('guardianName')} /><Field label="Guardian mobile" name="phone" value={values.phone} onChange={change('phone')} type="tel" /><Field label="Parent messaging permission" name="consent" value={values.consent} onChange={change('consent')} options={[{value:'yes',label:'Opted in (sample)'},{value:'no',label:'Do not message'}]} /></>}
      {kind==='teacher'&&<><Field label="Email address" name="email" value={values.email} onChange={change('email')} type="email" required /><Field label="Mobile" name="phone" value={values.phone} onChange={change('phone')} type="tel" /></>}
      {kind==='class'&&<><Field label="Grade" name="grade" value={values.grade} onChange={change('grade')} options={['Nursery','KG',...Array.from({length:12},(_,i)=>String(i+1))].map(label=>({value:label,label}))} required /><Field label="Section" name="section" value={values.section} onChange={change('section')} required /><Field label="Academic year" name="year" value={values.year} onChange={change('year')} options={state.years.filter(row=>row.schoolId===school.id&&row.status==='current').map(row=>({value:row.label,label:row.label}))} required /></>}
      {kind==='subject'&&<Field label="Subject code" name="code" value={values.code} onChange={change('code')} required />}
      {(kind==='class'||kind==='subject')&&<Field label={kind==='class'?'Class teacher':'Assigned teacher'} name="teacherId" value={values.teacherId} onChange={change('teacherId')} options={teachers.map(row=>({value:row.id,label:row.name}))} required />}
    </FormCard>
    {edit&&<div className="editor-secondary-actions"><Button variant="outline" onClick={()=>setConfirm(true)}>{record?.status==='active'?`Archive ${kind}`:`Restore ${kind}`}</Button>{kind==='teacher'&&<Button variant="outline" onClick={()=>{commit(school.id,'Invitation simulated',values.email,draft=>{const row=draft.teachers.find(item=>item.id===recordId&&item.schoolId===school.id);if(row)row.invitation='invited';});setMessage('Invitation reset simulated. No email was sent.');}}>Simulate reset invitation</Button>}{message&&<Message>{message}</Message>}</div>}
    <Confirm open={confirm} onClose={()=>setConfirm(false)} title={`${record?.status==='active'?'Archive':'Restore'} ${kind}?`} description={record?.status==='active'?'The profile will leave active lists. Attendance and fee history will be retained.':'The profile will return to active lists.'} label={record?.status==='active'?'Archive record':'Restore record'} onConfirm={archive} />
  </WorkspacePage>;
}
