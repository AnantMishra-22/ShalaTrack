import { useState } from 'react';
import { useWorkspace } from '../data/WorkspaceStore';
import type { DemoSchool } from '../domain/dashboard';
import { classLabel } from '../domain/model';
import { WorkspacePage, Records, Field, SearchField, ExportButtons, Status } from '../components/workspace';

export function DirectoryReportPage({school,kind}:{school:DemoSchool;kind:'student'|'teacher'|'class'}) {
  const {state}=useWorkspace();
  const [search,setSearch]=useState(''),[gender,setGender]=useState('all'),[classId,setClassId]=useState('all'),[year,setYear]=useState('all');
  const classes=state.classes.filter(row=>row.schoolId===school.id),students=state.students.filter(row=>row.schoolId===school.id),teachers=state.teachers.filter(row=>row.schoolId===school.id),assignments=state.assignments.filter(row=>row.schoolId===school.id);
  const headers=kind==='student'?['Admission no.','Student','Gender','Class','Guardian','Parent mobile']:kind==='teacher'?['Employee code','Teacher','Gender','Email','Mobile','Assigned classes','Assigned subjects','Status']:['Class','Academic year','Class teacher','Students','Subjects','Status'];
  let rows:{id:string;cells:string[];gender:string;classIds:string[];year:string}[]=[];
  if(kind==='student')rows=students.map(row=>({id:row.id,cells:[row.admissionNumber,row.name,row.gender,classLabel(classes.find(item=>item.id===row.classId)),row.guardianName,row.phone],gender:row.gender,classIds:[row.classId],year:classes.find(item=>item.id===row.classId)?.year||''}));
  if(kind==='teacher')rows=teachers.map(row=>{const ownClasses=classes.filter(item=>item.teacherId===row.id||assignments.some(a=>a.teacherId===row.id&&a.classId===item.id));const ownSubjects=state.subjects.filter(item=>item.schoolId===school.id&&assignments.some(a=>a.teacherId===row.id&&a.subjectId===item.id));return{id:row.id,cells:[row.employeeCode,row.name,row.gender,row.email,row.phone,ownClasses.map(classLabel).join(', ')||'Unassigned',ownSubjects.map(item=>item.name).join(', ')||'Unassigned',row.status],gender:row.gender,classIds:ownClasses.map(item=>item.id),year:''};});
  if(kind==='class')rows=classes.map(row=>({id:row.id,cells:[classLabel(row),row.year,teachers.find(item=>item.id===row.teacherId)?.name||'Unassigned',String(students.filter(item=>item.classId===row.id&&item.status==='active').length),String(new Set(assignments.filter(item=>item.classId===row.id).map(item=>item.subjectId)).size),row.status],gender:'',classIds:[row.id],year:row.year}));
  const filtered=rows.filter(row=>(gender==='all'||row.gender.toLowerCase()===gender)&&(classId==='all'||row.classIds.includes(classId))&&(year==='all'||row.year===year)&&row.cells.join(' ').toLowerCase().includes(search.toLowerCase()));
  const title=`${kind[0].toUpperCase()+kind.slice(1)} reports`;
  return <WorkspacePage title={title} description={`${kind==='class'?'Class':'School '+kind} directory, original filters and downloadable records.`} action={<ExportButtons title={`${school.name} ${title}`} headers={headers} rows={filtered.map(row=>row.cells)} />}>
    <div className="inline-summary"><span><strong>{rows.length}</strong> {kind==='class'?'classes':`${kind}s`}</span>{kind!=='class'&&<><span><strong>{rows.filter(row=>row.gender.toLowerCase()==='male').length}</strong> male</span><span><strong>{rows.filter(row=>row.gender.toLowerCase()==='female').length}</strong> female</span></>}<span>{filtered.length} matching records</span></div>
    <div className="report-filters"><SearchField value={search} onChange={setSearch} label={`Search ${kind} directory`} />{kind!=='class'&&<Field label="Gender" name="directory-gender" value={gender} onChange={setGender} options={[{value:'all',label:'All genders'},...['Male','Female','Other','Prefer not to say'].map(label=>({value:label.toLowerCase(),label}))]} />}<Field label="Class" name="directory-class" value={classId} onChange={setClassId} options={[{value:'all',label:'All classes'},...classes.map(row=>({value:row.id,label:`${classLabel(row)} (${row.year})`}))]} />{kind!=='teacher'&&<Field label="Academic year" name="directory-year" value={year} onChange={setYear} options={[{value:'all',label:'All academic years'},...state.years.filter(row=>row.schoolId===school.id).map(row=>({value:row.label,label:row.label}))]} />}</div>
    <Records rows={filtered} columns={headers.map((title,index)=>({title,cell:(row:typeof rows[number])=>title==='Status'?<Status>{row.cells[index]}</Status>:row.cells[index]}))} />
  </WorkspacePage>;
}
