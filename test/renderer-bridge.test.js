import {test} from 'node:test';
import assert from 'node:assert/strict';
const {RendererPetBridge,bindRendererBridge,RELAY_CHANNEL}=await import('../src/renderer-bridge.js').catch(()=>({}));
function clock(){let now=1000,id=0;const tasks=new Map();return {now:()=>now,setTimer(fn,ms){const key=++id;tasks.set(key,{at:now+ms,fn});return key;},clearTimer(key){tasks.delete(key);},advance(ms){const end=now+ms;while(true){const next=[...tasks].filter(([,v])=>v.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;tasks.delete(next[0]);next[1].fn();}now=end;},count:()=>tasks.size};}
function make(options={}){assert.equal(typeof RendererPetBridge,'function');const time=clock();return {bridge:new RendererPetBridge({...time,...options}),time};}
async function claim(bridge,clientId='a'){const r=await bridge.rpc('take',{clientId});assert.equal(r.ok,true);return {clientId,leaseToken:r.value.leaseToken};}
async function take(bridge,lease){const r=await bridge.rpc('take',lease);assert.equal(r.ok,true);return r.value.command;}
async function complete(bridge,lease,command,value={}){return bridge.rpc('complete',{...lease,id:command.id,ok:true,value});}

test('no renderer fails immediately without accumulating work',async()=>{const {bridge}=make();await assert.rejects(bridge.state('main'),e=>e.code==='RENDERER_UNAVAILABLE');bridge.close();});
test('only one lease holder can take commands and complete them once',async()=>{
 const {bridge}=make();const a=await claim(bridge);
 const other=await bridge.rpc('take',{clientId:'b'});assert.equal(other.ok,false);assert.equal(other.error.code,'RELAY_BUSY');
 const result=bridge.request('config');const command=await take(bridge,a);assert.equal(command.operation,'config');
 const forged=await bridge.rpc('complete',{clientId:'b',leaseToken:a.leaseToken,id:command.id,ok:true,value:{bad:true}});assert.equal(forged.ok,false);
 assert.equal((await complete(bridge,a,command,{main:{pets:[]}})).value.accepted,true);
 assert.deepEqual(await result,{main:{pets:[]}});
 assert.equal((await complete(bridge,a,command,{})).value.accepted,false);bridge.close();
});
test('state checks configured roster without requiring prior pet events',async()=>{
 const {bridge}=make();const a=await claim(bridge),result=bridge.state('fresh');
 let command=await take(bridge,a);await complete(bridge,a,command,{sections:{workStatus:{counter:0,data:null}},pets:{}});
 command=await take(bridge,a);assert.equal(command.operation,'config');await complete(bridge,a,command,{main:{pets:[{id:'fresh'}]}});
 assert.deepEqual((await result).pets,{});bridge.close();
});
test('removed roster entry fails even if its old say event still exists',async()=>{
 const {bridge}=make();const a=await claim(bridge),result=bridge.state('removed');const rejected=assert.rejects(result,e=>e.code==='PET_NOT_FOUND');
 await complete(bridge,a,await take(bridge,a),{pets:{removed:{say:{counter:2}}}});
 await complete(bridge,a,await take(bridge,a),{main:{pets:[{id:'fresh'}]}});await rejected;bridge.close();
});
test('broadcast and optional care animation retain PetBridge interface',async()=>{
 const {bridge}=make();const a=await claim(bridge),bubble=bridge.broadcast('a.b','喝水');
 let command=await take(bridge,a);assert.deepEqual({operation:command.operation,pet:command.pet,text:command.text},{operation:'broadcast',pet:'a.b',text:'喝水'});await complete(bridge,a,command,{ok:true});await bubble;
 const animation=bridge.animate('a.b');await complete(bridge,a,await take(bridge,a),{main:{pets:[{id:'a.b'}],animations:{categories:[{actions:['care']}]}}});command=await take(bridge,a);assert.equal(command.operation,'anim');assert.equal(command.name,'care');await complete(bridge,a,command,{ok:true});await animation;bridge.close();
});
test('feedback is optional, validated before dispatch, and snapshotted for both actions',async()=>{
 const {bridge}=make();const a=await claim(bridge),feedback={eventId:'b67b0e16-7321-4c04-a9a4-040ecf84c55f',source:'care'};
 const bubble=bridge.broadcast('main','喝水',feedback);feedback.eventId='mutated';
 let command=await take(bridge,a);assert.deepEqual(command.feedback,{eventId:'b67b0e16-7321-4c04-a9a4-040ecf84c55f',source:'care'});await complete(bridge,a,command,{ok:true});await bubble;
 const animation=bridge.animate('main',command.feedback);await complete(bridge,a,await take(bridge,a),{main:{pets:[{id:'main'}],animations:{categories:[{actions:['care']}]}}});
 command=await take(bridge,a);assert.deepEqual(command.feedback,{eventId:'b67b0e16-7321-4c04-a9a4-040ecf84c55f',source:'care'});await complete(bridge,a,command,{ok:true});await animation;
 for(const invalid of [null,[],{}, {eventId:'',source:'care'},{eventId:'x'.repeat(101),source:'care'},{eventId:'a\n',source:'care'},{eventId:'bad/id',source:'care'},{eventId:'a',source:'other'},{eventId:'a',source:'care',theme:'cloud'}]){
  await assert.rejects(bridge.broadcast('main','hello',invalid),e=>e.code==='RELAY_BAD_REQUEST');
  await assert.rejects(bridge.animate('main',invalid),e=>e.code==='RELAY_BAD_REQUEST');
 }
 assert.equal(bridge.jobs.size,0);bridge.close();
});
test('feedback accepts safe ID lengths one and one hundred and rejects feedback on reads',async()=>{
 const {bridge}=make();const a=await claim(bridge);
 for(const eventId of ['a','x'.repeat(100)]){
  const result=bridge.broadcast('main','hello',{eventId,source:'care'}),command=await take(bridge,a);assert.equal(command.feedback.eventId,eventId);await complete(bridge,a,command,{ok:true});await result;
 }
 await assert.rejects(bridge.request('state',{feedback:{eventId:'a',source:'care'}}),e=>e.code==='RELAY_BAD_REQUEST');bridge.close();
});
test('command timeout discards dispatched work and ignores late acknowledgement',async()=>{
 const {bridge,time}=make();const a=await claim(bridge),result=bridge.broadcast('main','hello'),rejected=assert.rejects(result,e=>e.code==='RELAY_TIMEOUT');const command=await take(bridge,a);time.advance(8000);await rejected;
 assert.equal((await complete(bridge,a,command,{ok:true})).value.accepted,false);bridge.close();
});
test('release quarantines old dispatched command until deadline before lease transfer',async()=>{
 const {bridge,time}=make();const a=await claim(bridge),result=bridge.broadcast('main','hello'),rejected=assert.rejects(result);const old=await take(bridge,a);
 await bridge.rpc('release',a);await rejected;assert.equal((await bridge.rpc('take',{clientId:'b'})).error.code,'RELAY_HANDOFF');time.advance(8000);const b=await claim(bridge,'b');assert.notEqual(a.leaseToken,b.leaseToken);assert.equal((await complete(bridge,a,old,{ok:true})).ok,false);bridge.close();
});
test('sleep expires lease and discards queued work without replay',async()=>{
 const {bridge,time}=make();const a=await claim(bridge),result=bridge.request('state'),rejected=assert.rejects(result);time.advance(60000);await rejected;
 const b=await claim(bridge,'b');const pending=bridge.rpc('take',b);time.advance(15000);assert.equal((await pending).value.command,null);bridge.close();
});
test('limits and allowlist reject unsafe operations and oversized results',async()=>{
 const {bridge}=make({maxPending:1});const a=await claim(bridge);
 await assert.rejects(bridge.request('https://bad.example'),e=>e.code==='RELAY_BAD_REQUEST');
 for(const op of ['constructor','toString','__proto__'])await assert.rejects(bridge.request(op),e=>e.code==='RELAY_BAD_REQUEST');
 await assert.rejects(bridge.broadcast('main','x'.repeat(70000)),e=>e.code==='RELAY_TOO_LARGE');
 const first=bridge.request('state'),rejected=assert.rejects(first);await assert.rejects(bridge.request('config'),e=>e.code==='RELAY_BUSY');const command=await take(bridge,a);
 const ack=await complete(bridge,a,command,{data:'x'.repeat(70000)});assert.equal(ack.ok,false);assert.equal(ack.error.code,'RELAY_TOO_LARGE');bridge.close();await rejected;
});
test('failed renderer result preserves safe dependency error category',async()=>{
 const {bridge}=make();const a=await claim(bridge),result=bridge.broadcast('main','hello'),rejected=assert.rejects(result,e=>e.code==='PET_NOT_FOUND');const command=await take(bridge,a);
 await bridge.rpc('complete',{...a,id:command.id,ok:false,error:{code:'PET_NOT_FOUND',message:'ignored'}});await rejected;bridge.close();
});
test('poll abort and close release timers and pending promises',async()=>{
 const {bridge,time}=make();const a=await claim(bridge),controller=new AbortController();const poll=bridge.rpc('take',a,controller.signal);controller.abort();assert.equal((await poll).ok,false);
 const b=await claim(bridge,'b'),result=bridge.request('state'),rejected=assert.rejects(result,e=>e.code==='RELAY_CLOSED');bridge.close();await rejected;assert.equal(time.count(),0);assert.equal((await bridge.rpc('take',b)).error.code,'RELAY_CLOSED');
});
test('official RPC binding owns registration and bridge disposal',()=>{
 const {bridge}=make();const registered=[],removed=[],effects=[];const ctx={connection:{fetch:{register(route){registered.push(route);return()=>removed.push(route.path);}}},effect(fn){const cleanup=fn();effects.push(cleanup);return cleanup;}};
 assert.equal(typeof bindRendererBridge,'function');bindRendererBridge(ctx,bridge);assert.equal(registered.length,3);assert.equal(registered[0].path,RELAY_CHANNEL+'/dsh-pet-company/take');assert.equal(typeof registered[0].fetch,'function');for(const cleanup of effects.reverse())cleanup();assert.equal(removed.length,3);assert.equal(bridge.closed,true);
});
test('onConnect runs once per new lease and callback failures do not break RPC',async()=>{
 let connected=0;const {bridge,time}=make({onConnect:async()=>{connected++;throw Error('consumer failure');}});
 const a=await claim(bridge);await Promise.resolve();assert.equal(connected,1);
 const waiting=bridge.rpc('take',a);time.advance(15000);assert.equal((await waiting).ok,true);await Promise.resolve();assert.equal(connected,1);
 await bridge.rpc('release',a);await claim(bridge,'b');await Promise.resolve();assert.equal(connected,2);bridge.close();
});
