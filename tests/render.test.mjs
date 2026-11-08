// Node server-render smoke checks. These do not run a browser or prove visual layout.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
const storage = new Map();
globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
globalThis.window={location:{hash:'',search:''}};
const server=await createServer({cacheDir:`.tools/render-cache-${process.pid}`,optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,watch:null},appType:'custom'});
try {
  const {renderRoute}=await server.ssrLoadModule('/tests/render-harness.tsx');
  const {pages}=await server.ssrLoadModule('/src/data/pages.ts');
  test('all 46 route components render their primary heading without runtime errors',()=>{
    for(const page of pages){
      window.location.hash=`#/${page.path}`;
      const html=renderRoute(page.path);
      assert.match(html,/<h1[ >]/,page.path);
      assert.doesNotMatch(html,/Page not found/,page.path);
      if(page.path.startsWith('edit-'))assert.match(html,/Record not found/,page.path);
    }
  });
  test('record editors render existing school records and their save actions',()=>{
    for(const [kind,id] of [['student','maplewood-student-1'],['teacher','maplewood-teacher-1'],['class','maplewood-class-1'],['subject','maplewood-subject-1']]){
      const path=`edit-${kind}.html`;window.location.hash=`#/${path}?id=${id}`;
      const html=renderRoute(path);assert.doesNotMatch(html,/Record not found/,path);assert.match(html,/Save changes/,path);
    }
  });
  test('original fee stages and restored directory/register controls render',()=>{
    window.location.hash='#/fee-collection.html?student=maplewood-student-1&year=2026-27';
    const fee=renderRoute('fee-collection.html');
    for(const label of ['Search student','Fee details','Payment type','Pending before discount','Set student payable amount','Collect fee','Discount type'])assert.ok(fee.includes(label),label);
    assert.match(fee,/<fieldset disabled="">/);
    for(const kind of ['student','teacher','class']){
      window.location.hash=`#/${kind}-reports.html`;const report=renderRoute(`${kind}-reports.html`);
      assert.ok(report.includes(kind==='student'?'Parent mobile':kind==='teacher'?'Assigned subjects':'Academic year'));
    }
    window.location.hash='#/teacher-screens/reports.html';assert.ok(renderRoute('teacher-screens/reports.html').includes('Attendance register'));
    window.location.hash='#/add-class.html';const editor=renderRoute('add-class.html');assert.ok(editor.includes('11 - MPC'));assert.ok(editor.includes('2027-28'));
  });
  test('fee dashboard defaults to cumulative classes and drills down to student accounts',()=>{
    window.location.hash='#/fee-dashboard.html';const overview=renderRoute('fee-dashboard.html');
    assert.ok(overview.includes('Class-wise fee overview'));assert.ok(overview.includes('View Class 1 students'));assert.ok(overview.includes('Total fee assigned'));
    assert.ok(!overview.includes('ST0001'));
    window.location.hash='#/fee-dashboard.html?class=1&year=2026-27';const detail=renderRoute('fee-dashboard.html');
    assert.ok(detail.includes('Student fees'));assert.ok(detail.includes('All classes'));assert.ok(detail.includes('ST0001'));assert.ok(detail.includes('Open account'));
    assert.ok(!detail.includes('ST0026'));
  });
  test('hostel and transport pages, student details and service fee controls render',()=>{
    for(const service of ['hostel','transport']){
      window.location.hash=`#/${service}-students.html`;
      const html=renderRoute(`${service}-students.html`);assert.ok(html.includes(service==='hostel'?'Hostel / room':'Route / stop'));assert.ok(html.includes('ST0001'));
      window.location.hash=`#/add-student.html?service=${service}`;const add=renderRoute('add-student.html');assert.ok(add.includes(service==='hostel'?'hostel-building':'transport-route'));
    }
    window.location.hash='#/student-details.html?id=maplewood-student-1';const detail=renderRoute('student-details.html');assert.ok(detail.includes('North hostel'));assert.ok(detail.includes('Route A'));
    window.location.hash='#/fee-structure.html?service=hostel';const plans=renderRoute('fee-structure.html');assert.ok(plans.includes('fee-plan-service-filter'));assert.ok(plans.includes('Hostel fees'));
    window.location.hash='#/fee-collection.html?student=maplewood-student-1';assert.ok(renderRoute('fee-collection.html').includes('North hostel'));
    window.location.hash='#/fee-dashboard.html?service=hostel&class=1';assert.ok(renderRoute('fee-dashboard.html').includes('Services'));
  });
} finally { await server.close(); }

