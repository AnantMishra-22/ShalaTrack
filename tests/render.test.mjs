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
  test('all 43 route components render their primary heading without runtime errors',()=>{
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
} finally { await server.close(); }

