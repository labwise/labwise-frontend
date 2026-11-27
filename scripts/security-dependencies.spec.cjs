'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const http = require('node:http');
const P = process.env.LW_FRONTEND_ROOT || path.resolve(__dirname,'..');
const req = Module.createRequire(path.join(P, 'package.json'));
const ts = req('typescript');
function compile(relative) {
  const filename=path.join(P,relative);
  const m=new Module(filename,module);m.filename=filename;m.paths=Module._nodeModulePaths(path.dirname(filename));
  m._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true,target:ts.ScriptTarget.ES2020}}).outputText,filename);
  return m.exports;
}
test('patched Zod rejects oversize arrays before parsing untrusted elements',()=>{
  const {z}=req('zod');let parsed=0;
  const schema=z.array(z.preprocess(v=>{parsed++;return v;},z.string())).max(1);
  assert.equal(schema.safeParse(Array(1000).fill('fixture')).success,false);
  assert.equal(parsed,0);
});
test('actual registration schema still validates all normal fields and password confirmation',()=>{
  const filename=path.join(P,'src/app/(auth)/register/page.tsx');const code=fs.readFileSync(filename,'utf8');
  const ast=ts.createSourceFile(filename,code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let expression;
  function walk(n){if(ts.isVariableDeclaration(n)&&n.name.getText(ast)==='schema')expression=n.initializer.getText(ast);ts.forEachChild(n,walk);}walk(ast);assert.ok(expression);
  const {z}=req('zod');const schema=Function('z','return ('+expression+')')(z);
  const fixture={name:'Fixture',email:'fixture@example.invalid',password:'FixtureOnly123!',passwordConfirm:'FixtureOnly123!',phone:'01000000000',otpCode:'000000',postalCode:'00000',address:'fixture-only'};
  assert.equal(schema.safeParse(fixture).success,true);
  for(const patch of [{password:''},{passwordConfirm:'different'},{email:'invalid'},{otpCode:'0'},{phone:''}])assert.equal(schema.safeParse({...fixture,...patch}).success,false);
});
test('patched Tiptap mergeAttributes does not inherit executable prototype attributes',()=>{
  const {mergeAttributes}=req('@tiptap/core');
  const result=mergeAttributes(JSON.parse('{"__proto__":{"onclick":"FIXTURE_NEVER_EXECUTED"},"class":"fixture"}'));
  assert.equal(result.onclick,undefined);assert.equal(result.class,'fixture');
  assert.equal(Object.prototype.onclick,undefined);
});
test('actual Axios API sends stored auth, refreshes once on 401 and replays to loopback only',async()=>{
  let refresh=0,requests=0;const headers=[];
  const server=http.createServer((q,r)=>{q.resume();r.setHeader('Content-Type','application/json');
    if(q.url==='/api/auth/refresh'){refresh++;r.end(JSON.stringify({accessToken:'FIXTURE_NEW_ACCESS'}));return;}
    requests++;headers.push(q.headers.authorization);
    if(q.headers.authorization!=='Bearer FIXTURE_NEW_ACCESS'){r.statusCode=401;r.end('{}');return;}r.end(JSON.stringify({ok:true}));
  });
  await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
  const axios=req('axios');const saved=axios.defaults.baseURL;axios.defaults.baseURL=base;
  const previousWindow=globalThis.window,previousStorage=globalThis.localStorage;
  globalThis.window={location:{pathname:'/',href:base+'/'}};
  const data=new Map();globalThis.localStorage={getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k),clear:()=>data.clear()};
  localStorage.setItem('accessToken' ,'FIXTURE_OLD_ACCESS');localStorage.setItem('refreshToken','FIXTURE_REFRESH');
  try{const {api}=compile('src/lib/api.ts');api.defaults.baseURL=base+'/api';
    const result=await api.get('/fixture');assert.equal(result.data.ok,true);assert.equal(refresh,1);assert.equal(requests,2);
    assert.deepEqual(headers,['Bearer FIXTURE_OLD_ACCESS','Bearer FIXTURE_NEW_ACCESS']);assert.equal(localStorage.getItem('accessToken'),'FIXTURE_NEW_ACCESS');
  }finally{axios.defaults.baseURL=saved;localStorage.clear();if(previousWindow===undefined)delete globalThis.window;else globalThis.window=previousWindow;if(previousStorage===undefined)delete globalThis.localStorage;else globalThis.localStorage=previousStorage;await new Promise(r=>server.close(r));}
});
test('sharp native image processing works with benign SVG and produces expected PNG',async()=>{
  const sharp=req('sharp');const output=await sharp(Buffer.from('<svg width="8" height="8" xmlns="http://www.w3.org/2000/svg"><rect width="8" height="8" fill="blue"/></svg>')).resize(16,16).png().toBuffer();
  const meta=await sharp(output).metadata();assert.equal(meta.format,'png');assert.equal(meta.width,16);assert.equal(meta.height,16);
});
test('typography override keeps normal selector AST behavior',()=>{
  const parser=req('postcss-selector-parser');for(const selector of ['.prose > :where(h1,h2):not(:where(.not-prose *))','a[href^="https://"]:hover','@media','.x\\:y > p + p'])
    assert.equal(parser().processSync(selector),selector);
});
