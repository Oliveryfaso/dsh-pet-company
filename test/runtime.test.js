import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {Readable} from 'node:stream';
import {createRuntime as createActualRuntime} from '../src/runtime.js';
function createRuntime(ctx,initial,home,options={}) {return createActualRuntime(ctx,{provider:'external',...initial},home,{now:()=>new Date(2026,9,15,10).getTime(),...options});}
const state={sections:{workStatus:{counter:1,data:{state:'working'}}},pets:{main:{say:{counter:0,data:null}}}};
async function request(r,method,path,body,headers={}){
 const req=Readable.from(body===undefined?[]:[JSON.stringify(body)]);req.url='/dsh-pet-company/'+path;req.method=method;req.headers={host:'127.0.0.1:3080','content-type':'application/json',...headers};
 let code,data;await r.handle(req,{writeHead(c){code=c;},end(b){data=JSON.parse(b);}});return {code,data};
}
test('unavailable dependency stays silent and resumes without catch-up',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-test-'));let online=false,calls=0,t=0;
 const r=createRuntime({}, {}, dir,{now:()=>t,bridge:{state:async()=>{if(!online)throw Error('ECONNREFUSED');return state;},broadcast:async()=>{calls++;},close(){}}});
 try{await r.tick();assert.equal(r.status().available,false);assert.equal(calls,0);online=true;t=86400000;await r.tick();assert.equal(calls,0);assert.equal(r.status().available,true);}finally{r.stop();await rm(dir,{recursive:true});}
});
test('config saves atomically, reloads, rejects foreign origin and leaves corrupt file intact',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-test-'));const bridge={state:async()=>state,close(){}};
 const r=createRuntime({}, {}, dir,{bridge});await r.ready;
 try{
  let res=await request(r,'PUT','config',{enabled:false,petId:'a.b'});assert.equal(res.code,200);
  assert.equal(JSON.parse(await readFile(join(dir,'dsh-pet-company/config.v2.json'),'utf8')).petId,'a.b');
  const second=createRuntime({}, {}, dir,{bridge});await second.ready;assert.equal(second.status().config.enabled,false);second.stop();
  res=await request(r,'PUT','config',{enabled:true},{origin:'https://elsewhere.test'});assert.equal(res.code,400);assert.equal(r.status().config.enabled,false);
  assert.equal((await request(r,'POST','snooze',{minutes:60})).code,200);
  assert.equal((await request(r,'GET','not-found')).code,404);
  await writeFile(join(dir,'dsh-pet-company/config.v2.json'),'BROKEN');
  const third=createRuntime({}, {}, dir,{bridge});await third.ready;assert.equal(third.status().config.enabled,false);
  assert.equal((await request(third,'PUT','config',{})).code,409);assert.equal(await readFile(join(dir,'dsh-pet-company/config.v2.json'),'utf8'),'BROKEN');third.stop();
 }finally{r.stop();await rm(dir,{recursive:true});}
});
test('failed bubble does not count delivered and optional animation failure cannot resend',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-test-'));let t=new Date(2026,9,15,10).getTime(),calls=0;
 const r=createRuntime({}, {sitMinutes:1}, dir,{now:()=>t,bridge:{state:async()=>state,broadcast:async()=>{calls++;},animate:async()=>{throw Error('missing animation');},close(){}}});
 try{for(let i=0;i<7;i++){await r.tick();t+=15000;}assert.equal(calls,1);assert.equal(r.status().lastReminder.kind,'sitting');}finally{r.stop();await rm(dir,{recursive:true});}
});
test('dispose aborts bridge and prevents further ticks',async()=>{
 let closed=false,reads=0;const dir=await mkdtemp(join(tmpdir(),'dsh-test-'));
 const r=createRuntime({}, {}, dir,{bridge:{state:async()=>{reads++;return state;},close(){closed=true;}}});r.stop();await r.tick();assert.equal(reads,0);assert.equal(closed,true);await rm(dir,{recursive:true});
});

test('lost broadcast acknowledgement cannot replay late reminder every poll',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-test-'));let t=new Date(2026,9,15,23,40).getTime(),calls=0;
 const r=createRuntime({}, {quietStart:'00:00',quietEnd:'00:00'},dir,{now:()=>t,bridge:{state:async()=>state,broadcast:async()=>{calls++;throw Error('lost acknowledgement');},close(){}}});
 try{for(let i=0;i<12;i++){await r.tick();t+=15000;}assert.equal(calls,1);assert.equal(r.status().lastReminder,null);}finally{r.stop();await rm(dir,{recursive:true});}
});

test('manual test cannot interrupt pending question even when companion is disabled',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-test-'));let calls=0;
 const pending={...state,sections:{...state.sections,notify:{counter:1,data:{type:'question/requested'}}}};
 const r=createRuntime({}, {enabled:false},dir,{bridge:{state:async()=>pending,broadcast:async()=>{calls++;},close(){}}});
 try{await r.tick();const result=await request(r,'POST','test',{});assert.equal(result.code,409);assert.equal(calls,0);}finally{r.stop();await rm(dir,{recursive:true});}
});

test('configured fresh pet with no events remains available',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-test-'));let checked;
 const r=createRuntime({}, {petId:'fresh'},dir,{bridge:{state:async pet=>{checked=pet;return {sections:{workStatus:{counter:0,data:null}},pets:{}};},close(){}}});
 try{await r.tick();assert.equal(checked,'fresh');assert.equal(r.status().available,true);}finally{r.stop();await rm(dir,{recursive:true});}
});
test('desktop host access rejection is visible in status',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-test-'));
 const r=createRuntime({}, {},dir,{bridge:{state:async()=>{const error=Error('桌面宿主拒绝插件的本机 HTTP 请求（403）');error.code='DESKTOP_ACCESS_BLOCKED';throw error;},close(){}}});
 try{await r.tick();assert.equal(r.status().available,false);assert.match(r.status().reason,/桌面宿主/);}finally{r.stop();await rm(dir,{recursive:true});}
});

for(const code of ['PET_NOT_FOUND','DESKTOP_ACCESS_BLOCKED']) test('manual refresh immediately exposes '+code,async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-test-'));let missing=false,calls=0;
 const r=createRuntime({}, {},dir,{bridge:{state:async()=>{if(missing){const error=Error(code);error.code=code;throw error;}return state;},broadcast:async()=>{calls++;},close(){}}});
 try{await r.tick();assert.equal(r.status().available,true);missing=true;const res=await request(r,'POST','test',{});assert.equal(res.code,409);assert.equal(r.status().available,false);assert.equal(r.status().reason,code);assert.equal(calls,0);}finally{r.stop();await rm(dir,{recursive:true});}
});
test('pet deletion between fresh roster and broadcast immediately marks unavailable',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-test-'));
 const r=createRuntime({}, {},dir,{bridge:{state:async()=>state,broadcast:async()=>{const error=Error('找不到所选宠物');error.code='PET_NOT_FOUND';throw error;},close(){}}});
 try{await r.tick();const res=await request(r,'POST','test',{});assert.equal(res.code,409);assert.equal(r.status().available,false);assert.match(r.status().reason,/找不到/);}finally{r.stop();await rm(dir,{recursive:true});}
});

test('legacy config is read without modification; first save writes new home path',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-migration-'));await mkdir(join(dir,'dsh-companion'));
 const old=JSON.stringify({petId:'friend.with.dots',waterMinutes:95});await writeFile(join(dir,'dsh-companion/config.json'),old);
 const r=createRuntime({}, {},dir,{bridge:{close(){}}});
 try{await r.ready;assert.equal(r.status().config.petId,'friend.with.dots');assert.equal(r.status().config.waterMinutes,95);
 assert.equal((await request(r,'PUT','config',{...r.status().config,waterMinutes:96})).code,200);
 assert.equal(JSON.parse(await readFile(join(dir,'dsh-pet-company/config.v2.json'),'utf8')).waterMinutes,96);
 assert.equal(await readFile(join(dir,'dsh-companion/config.json'),'utf8'),old);
 }finally{r.stop();await rm(dir,{recursive:true});}
});
test('new config wins; corrupt new config never falls back to legacy',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-migration-'));await mkdir(join(dir,'dsh-companion'));await mkdir(join(dir,'dsh-pet-company'));
 await writeFile(join(dir,'dsh-companion/config.json'),JSON.stringify({petId:'legacy'}));
 await writeFile(join(dir,'dsh-pet-company/config.json'),JSON.stringify({petId:'current'}));
 const bridge={close(){}};const first=createRuntime({}, {},dir,{bridge});await first.ready;assert.equal(first.status().config.petId,'current');first.stop();
 await writeFile(join(dir,'dsh-pet-company/config.json'),'BROKEN');const second=createRuntime({}, {},dir,{bridge});
 try{await second.ready;assert.equal(second.status().config.enabled,false);assert.notEqual(second.status().config.petId,'legacy');assert.equal((await request(second,'PUT','config',{})).code,409);assert.equal(await readFile(join(dir,'dsh-pet-company/config.json'),'utf8'),'BROKEN');}
 finally{second.stop();await rm(dir,{recursive:true});}
});
test('legacy route is compatible; similarly prefixed routes are not rewritten',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-migration-'));const r=createRuntime({}, {},dir,{bridge:{close(){}}});
 async function get(url){const req=Readable.from([]);req.method='GET';req.url=url;let code;await r.handle(req,{writeHead(c){code=c;},end(){}});return code;}
 try{assert.equal(await get('/dsh-companion/status'),200);assert.equal(await get('/dsh-pet-company/status'),200);assert.equal(await get('/dsh-companion-evil/status'),404);}finally{r.stop();await rm(dir,{recursive:true});}
});

test('corrupt legacy config identifies the actual file without creating a new one',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-migration-'));await mkdir(join(dir,'dsh-companion'));
 const legacy=join(dir,'dsh-companion/config.json');await writeFile(legacy,'BROKEN');
 const r=createRuntime({}, {},dir,{bridge:{close(){}}});
 try{await r.ready;const result=await request(r,'PUT','config',{});assert.equal(result.code,409);assert.ok(result.data.error.includes(legacy));assert.equal(await readFile(legacy,'utf8'),'BROKEN');await assert.rejects(readFile(join(dir,'dsh-pet-company/config.v2.json')),e=>e.code==='ENOENT');}finally{r.stop();await rm(dir,{recursive:true});}
});


test('care bubble and optional animation share one immutable event identity',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-care-'));const events=[];
 const r=createRuntime({}, {},dir,{bridge:{state:async()=>state,broadcast:async(pet,text,feedback)=>events.push({action:'say',pet,feedback}),animate:async(pet,feedback)=>events.push({action:'anim',pet,feedback}),close(){}}});
 try{await r.tick();assert.equal((await request(r,'POST','test',{})).code,200);assert.equal(events.length,2);assert.equal(events[0].feedback.source,'care');assert.match(events[0].feedback.eventId,/^[a-f0-9-]{36}$/);assert.deepEqual(events[0].feedback,events[1].feedback);}finally{r.stop();await rm(dir,{recursive:true});}
});
test('missing renderer pauses reminders with its specific explanation',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-renderer-'));
 const r=createRuntime({}, {},dir,{bridge:{state:async()=>{throw Object.assign(Error('DSH 主界面中继未连接，提醒已暂停'),{code:'RENDERER_UNAVAILABLE'});},close(){}}});
 try{await r.tick();assert.equal(r.status().available,false);assert.match(r.status().reason,/中继未连接/);}finally{r.stop();await rm(dir,{recursive:true});}
});

for(const directory of ['dsh-companion','dsh-pet-company'])for(const value of [null,[],42])test('invalid persisted root is preserved: '+directory+' '+JSON.stringify(value),async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-invalid-root-'));await mkdir(join(dir,directory));const file=join(dir,directory,'config.json'),raw=JSON.stringify(value);await writeFile(file,raw);
 const r=createRuntime({}, {},dir,{bridge:{close(){}}});
 try{await r.ready;assert.equal(r.status().config.enabled,false);assert.equal((await request(r,'PUT','config',{})).code,409);assert.equal(await readFile(file,'utf8'),raw);}finally{r.stop();await rm(dir,{recursive:true});}
});
test('shared-home concurrent saves use independent atomic temporary files',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'dsh-concurrent-'));const bridge={close(){}};const first=createRuntime({}, {},dir,{bridge}),second=createRuntime({}, {},dir,{bridge});
 try{await Promise.all([first.ready,second.ready]);const results=await Promise.all([request(first,'PUT','config',{petId:'first'}),request(second,'PUT','config',{petId:'second'})]);assert.deepEqual(results.map(x=>x.code),[200,200]);assert.ok(['first','second'].includes(JSON.parse(await readFile(join(dir,'dsh-pet-company/config.v2.json'),'utf8')).petId));}finally{first.stop();second.stop();await rm(dir,{recursive:true});}
});
