// Node server-render smoke checks. These do not run a browser or prove visual layout.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'vite';
const storage = new Map();
globalThis.localStorage={getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value)};
globalThis.window={location:{hash:'',search:''}};
const server=await createServer({cacheDir:'.vite-test-cache',optimizeDeps:{noDiscovery:true,include:[]},server:{middlewareMode:true,watch:null},appType:'custom'});
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
} finally { await server.close(); }

