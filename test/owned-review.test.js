import {test} from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {EventEmitter} from 'node:events';
import {PassThrough,Writable} from 'node:stream';
import {runInNewContext} from 'node:vm';
import {OwnerLock} from '../src/owned/owner-lock.js';
import {HelperManager} from '../src/owned/helper-manager.js';
import {OwnedController} from '../src/owned/controller.js';
import {ProviderBridge,saveCompanyConfig} from '../src/runtime-provider.js';
import {roleView} from '../src/owned/config.js';
import {request} from './runtime-request.js';
const turn=()=>new Promise(r=>setImmediate(r));
const deferred=()=>{let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};};
async function home(t){const h=await fs.mkdtemp(join(tmpdir(),'owned-review-'));t.after(()=>fs.rm(h,{recursive:true,force:true}));return h;}
function child(){const p=new EventEmitter();p.stdout=new PassThrough();p.stderr=new PassThrough();p.exitCode=null;p.signalCode=null;p.stdin=new Writable({write(bytes,_enc,done){if(JSON.parse(bytes).type==='init')queueMicrotask(()=>p.stdout.write('{"type":"ready"}\n'));done();}});p.kill=()=>true;p.finish=()=>{p.exitCode=0;p.emit('exit',0);};return p;}
async function instrument(file,replace){const url=new URL(file,import.meta.url);let source=await fs.readFile(url,'utf8');source=replace(source);source=source.replace(/from ['"]([.][^'"]+)['"]/g,(_m,p)=>'from '+JSON.stringify(new URL(p,url).href));return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));}

test('simultaneous stale recovery never deletes a newly acquired lock',async t=>{
 const h=await home(t),seed=new OwnerLock(h);await seed.ready;await seed.release();await fs.writeFile(seed.file,JSON.stringify({token:seed.token,pid:2147483647}));
 const comparisons=deferred(),newOwner=deferred();let enabled=false,reads=0,deletes=0,gated=false;
 globalThis.__reviewLockIO={...fs,async readFile(file,...args){const text=await fs.readFile(file,...args);if(enabled&&file===seed.file&&!gated&&++reads>=3){if(reads===4)comparisons.resolve();await comparisons.promise;}return text;},async writeFile(file,...args){if(file===seed.file+'.recovery')gated=true;const result=await fs.writeFile(file,...args);if(enabled&&file===seed.file)newOwner.resolve();return result;},async unlink(file){if(enabled&&file===seed.file&&++deletes===2)await newOwner.promise;return fs.unlink(file);}};
 t.after(()=>{comparisons.resolve();newOwner.resolve();delete globalThis.__reviewLockIO;});
 const {OwnerLock:Lock}=await instrument('../src/owned/owner-lock.js',s=>s.replace("import {mkdir,writeFile,readFile,unlink} from 'node:fs/promises';","const {mkdir,writeFile,readFile,unlink}=globalThis.__reviewLockIO;"));
 const a=new Lock(h),b=new Lock(h);await Promise.all([a.ready,b.ready]);enabled=true;
 await Promise.allSettled([a.recover({stopped:true,token:seed.token}),b.recover({stopped:true,token:seed.token})]);
 t.after(()=>Promise.all([a.release(),b.release()]));assert.equal(Number(a.owned)+Number(b.owned),1);
 const owner=JSON.parse(await fs.readFile(seed.file));assert.equal(owner.token,a.owned?a.token:b.token);
});

test('recent deduplication stays bounded while new reminders continue for days',async t=>{
 let clock=0,sent=0;const c=new OwnedController({now:()=>clock,helper:{ready:true,configure:async()=>{},send:async()=>{sent++;},close:async()=>{}}});t.after(()=>c.close());await c.updateTarget('companion-silver');
 for(let n=0;n<300;n++){clock+=60*60_000;const f={eventId:'care-'+n,source:'care'};await c.broadcast('companion-silver','喝水',f);await c.animate('companion-silver',f);await c.broadcast('companion-silver','喝水',f);await c.animate('companion-silver',f);}
 assert.equal(sent,600);assert.ok(c.seen.size<=512);
});

for(const layer of ['manager','controller','bridge'])test(layer+' repeated close joins actual helper exit',async t=>{
 const p=child(),m=new HelperManager({home:await home(t),ownership:{owned:true},source:{executable:async()=>'/official/Electron'},spawn:()=>p});await m.configure(await roleView('companion-silver'),{});const c=new OwnedController({helper:m}),b=new ProviderBridge({embedded:c});const object={manager:m,controller:c,bridge:b}[layer];t.after(()=>{p.finish();return object.close();});
 const first=object.close();await turn();let done=false;const second=object.close().then(()=>done=true);await turn();assert.equal(done,false);p.finish();await Promise.all([first,second]);assert.equal(done,true);
});

test('actual root disposers retain ownership until helper exit and accepted config save finish',async t=>{
 const h=await home(t),p=child(),entered=deferred(),resume=deferred(),instances=[];let hold=true;
 const runtime=await instrument('../src/runtime.js',s=>s.replace('loadCompanyConfig,saveCompanyConfig,initialCompanyConfig','loadCompanyConfig,initialCompanyConfig').replace('export const ROUTE=',`const saveCompanyConfig=(...args)=>globalThis.__reviewSave(...args);export const ROUTE=`));
 globalThis.__reviewSave=async(...args)=>{if(hold){entered.resolve();await resume.promise;}return saveCompanyConfig(...args);};
 globalThis.__reviewRoot={home:h,createRuntime:runtime.createRuntime,HelperManager:class extends HelperManager{constructor(opts){super({...opts,source:{executable:async()=>'/official/Electron'},spawn:()=>p});instances.push(this);}},RuntimeSource:class{status(){return {};}async close(){}}};
 t.after(()=>{resume.resolve();p.finish();delete globalThis.__reviewSave;delete globalThis.__reviewRoot;});
 const mod=await instrument('../src/index.js',s=>s.replace("import Schema from '@deepseek-ai/schemastery';",'const chain=new Proxy(()=>chain,{get:()=>chain});const Schema=chain;').replace("import {resolveDshHome} from '@deepseek-ai/dsh-home-paths';",'const resolveDshHome=()=>globalThis.__reviewRoot.home;').replace("import {createRuntime} from './runtime.js';",'const {createRuntime}=globalThis.__reviewRoot;').replace("import {HelperManager} from './owned/helper-manager.js';",'const {HelperManager}=globalThis.__reviewRoot;').replace("import {RuntimeSource} from './owned/runtime-source.js';",'const {RuntimeSource}=globalThis.__reviewRoot;'));
 const disposers=[],routes=new Map();const ctx={effect(fn){const d=fn();if(typeof d==='function')disposers.push(d);},on(){},plugin(plugin,cfg){plugin.apply(ctx,cfg);},webServer:{register({path,handler}){routes.set(path,handler);return ()=>routes.delete(path);}},connection:{fetch:{register(){return ()=>{};}}}};
 mod.apply(ctx,{});await instances[0].queue;for(let n=0;n<100&&!instances[0].ready;n++)await new Promise(r=>setTimeout(r,5));assert.equal(instances[0].ready,true);
 await turn();const r={handle:routes.get('/dsh-pet-company')};const save=request(r,'PUT','config',{enabled:false});await entered.promise;
 let disposed=false;const unload=Promise.all(disposers.map(d=>d())).then(()=>disposed=true);await turn();
 const b=new OwnerLock(h);await b.ready;assert.equal(b.owned,false);assert.equal(disposed,false);assert.equal((await request(r,'PUT','config',{enabled:true})).code,503);
 p.finish();await new Promise(r=>setTimeout(r,30));const duringWrite=new OwnerLock(h);await duringWrite.ready;t.after(()=>duringWrite.release());assert.equal(duringWrite.owned,false,'accepted save must still retain ownership');assert.equal(disposed,false);hold=false;resume.resolve();await save;await unload;
 assert.equal(routes.size,0,'unload must unregister company and owned-asset routes');const next=new OwnerLock(h);await next.ready;assert.equal(next.owned,true);await next.release();await b.release();
});

test('unresolved waiting survives idle expiry and history capacity until explicit resume',async t=>{
 let clock=0;const c=new OwnedController({now:()=>clock,helper:{ready:true,configure:async()=>{},send:async()=>{},close:async()=>{}}});t.after(()=>c.close());await c.updateTarget('companion-silver');c.observe({id:'waiting'},{type:'approval/asked'});clock=31*60_000;c.observe({id:'working'},{type:'tool/call',data:{name:'read'}});
 assert.equal((await c.state()).sections.workStatus.data.state,'waiting');for(let n=0;n<300;n++)c.observe({id:'history-'+n},{type:'turn/start'});
 await assert.rejects(c.broadcast('companion-silver','稍后',{eventId:'blocked',source:'care'}),e=>e.code==='OWNED_WAITING');c.observe({id:'waiting'},{type:'tool/result'});await c.broadcast('companion-silver','现在可以',{eventId:'resumed',source:'care'});
});

test('renderer consumes expired counters without presentation or later replay',async()=>{
 const source=await fs.readFile(new URL('../runtime/electron-helper/renderer.js',import.meta.url),'utf8');let receive;const updates=[],consumed=[],acks=[],listeners={};
 const initial={padding:100,view:{pet:{id:'companion-silver'}},state:{counter:0}};const bridge={init:async()=>initial,onState(fn){receive=fn;return ()=>{};},ack:id=>acks.push(id),ready(){}};
 await runInNewContext(source,{window:{companyBridge:bridge,CompanyView:{createOwnedView(){return {update:s=>updates.push(s),consume:s=>consumed.push(s)};}},addEventListener:(k,v)=>listeners[k]=v},document:{querySelector:()=>({style:{}})},Date:{now:()=>2000}});
 receive({id:'old',expiresAt:1500,state:{counter:1}});assert.equal(updates.length,1);assert.deepEqual(consumed,[{counter:1}]);assert.deepEqual(acks,['old']);receive({id:'fresh',expiresAt:3000,state:{counter:2}});assert.equal(updates.length,2);
});
