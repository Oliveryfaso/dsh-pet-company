import {test} from 'node:test';
import assert from 'node:assert/strict';
const {createRendererRelay}=await import('../src/client-relay.js').catch(()=>({}));
const command=(operation,extra={})=>({id:'job-1',operation,issuedAt:1000,deadline:9000,...extra});
async function renderer(commands,fetcher,options={}){
 assert.equal(typeof createRendererRelay,'function');const calls=[],completions=[];let first=true;
 const rpc={async call(channel,endpoint,payload){assert.equal(channel,'/api');assert.ok(endpoint.startsWith('dsh-pet-company/'));const method=endpoint.slice('dsh-pet-company/'.length);calls.push({channel,method,payload});if(method==='release')return {ok:true,value:{released:true}};if(method==='complete'){completions.push(payload);return {ok:true,value:{accepted:true}};}if(first){first=false;return {ok:true,value:{leaseToken:'lease',command:null}};}if(commands.length)return {ok:true,value:{leaseToken:'lease',command:commands.shift()}};return {ok:false,error:{code:'RELAY_CLOSED',message:'closed',details:{}}};}};
 const relay=createRendererRelay({rpc,fetcher,now:()=>1000,clientId:'renderer-test',...options});await relay.run();return {calls,completions};
}
test('renderer sends only relative requests and no capability or authentication headers',async()=>{
 const requests=[];const result=await renderer([command('broadcast',{pet:'a.b 中文',text:'hello'})],async(url,init)=>{requests.push({url,init});return {ok:true,status:200,json:async()=>({ok:true})};});
 assert.equal(requests[0].url,'/dsh-pet-7340/broadcast?pet=a.b%20%E4%B8%AD%E6%96%87');assert.deepEqual(requests[0].init.headers,{'Content-Type':'application/json'});assert.equal(requests[0].init.credentials,'same-origin');assert.equal(result.completions[0].ok,true);
});
test('renderer propagates matching feedback IDs and leaves old request bodies unchanged',async()=>{
 const feedback={eventId:'b67b0e16-7321-4c04-a9a4-040ecf84c55f',source:'care'},bodies=[];
 const result=await renderer([command('broadcast',{pet:'main',text:'hello',feedback}),command('anim',{id:'job-2',pet:'main',name:'care',feedback}),command('broadcast',{id:'job-3',pet:'main',text:'old'}),command('anim',{id:'job-4',pet:'main',name:'care'})],async(url,init)=>{bodies.push(JSON.parse(init.body));return {ok:true,json:async()=>({ok:true})};});
 assert.equal(result.completions.every(item=>item.ok),true);assert.deepEqual(bodies,[{text:'hello',feedback},{name:'care',feedback},{text:'old'},{name:'care'}]);
});
test('renderer rejects malformed feedback and extra feedback fields without fetching',async()=>{
 const invalid=[null,[],{}, {eventId:'',source:'care'},{eventId:'x'.repeat(101),source:'care'},{eventId:'a\n',source:'care'},{eventId:'bad/id',source:'care'},{eventId:'a',source:'other'},{eventId:'a',source:'care',url:'https://bad.example'}];let calls=0;
 const commands=invalid.flatMap((feedback,i)=>[command('broadcast',{id:'bad-b-'+i,pet:'main',text:'hello',feedback}),command('anim',{id:'bad-a-'+i,pet:'main',name:'care',feedback})]);
 const result=await renderer(commands,async()=>{calls++;});assert.equal(calls,0);assert.equal(result.completions.every(item=>item.error.code==='RELAY_BAD_REQUEST'),true);
});
test('renderer accepts safe feedback ID boundaries and forbids feedback on read operations',async()=>{
 const ids=['a','x'.repeat(100)],bodies=[];
 const result=await renderer([...ids.map((eventId,i)=>command('broadcast',{id:'valid-'+i,pet:'main',text:'hello',feedback:{eventId,source:'care'}})),command('state',{id:'bad-read',feedback:{eventId:'a',source:'care'}})],async(url,init)=>{bodies.push(JSON.parse(init.body));return {ok:true,json:async()=>({ok:true})};});
 assert.deepEqual(bodies.map(body=>body.feedback.eventId),ids);assert.equal(result.completions[2].error.code,'RELAY_BAD_REQUEST');
});
test('renderer forbids arbitrary URL fields and unsupported animation names',async()=>{
 let count=0;const result=await renderer([command('state',{url:'https://bad.example'}),command('anim',{pet:'main',name:'arbitrary'})],async()=>{count++;});assert.equal(count,0);assert.equal(result.completions.every(c=>c.ok===false),true);
});
test('renderer never executes expired or future-clock commands',async()=>{
 let count=0;const result=await renderer([command('broadcast',{pet:'main',text:'hello',deadline:999}),command('state',{issuedAt:1001})],async()=>{count++;});assert.equal(count,0);assert.equal(result.completions.length,2);
});
test('renderer does not replay a command repeated by the carrier',async()=>{
 let count=0;const c=command('broadcast',{pet:'main',text:'hello'});const result=await renderer([c,c],async()=>{count++;return {ok:true,json:async()=>({ok:true})};});assert.equal(count,1);assert.equal(result.completions.length,2);
});
test('renderer maps business rejection and rejects oversized JSON without truncation',async()=>{
 let n=0;const result=await renderer([command('broadcast',{pet:'main',text:'hello'}),command('state',{id:'job-2'})],async()=>({ok:true,json:async()=>++n===1?{ok:false,reason:'unknown-pet'}:{data:'x'.repeat(70000)}}));assert.equal(result.completions[0].error.code,'PET_NOT_FOUND');assert.equal(result.completions[1].error.code,'RELAY_TOO_LARGE');
});
test('renderer fetch timeout is a failed acknowledgement rather than an automatic retry',async()=>{
 let count=0;const result=await renderer([command('state')],async(url,{signal})=>{count++;return new Promise((resolve,reject)=>signal.addEventListener('abort',()=>reject(signal.reason),{once:true}));},{fetchTimeoutMs:5});assert.equal(count,1);assert.equal(result.completions[0].ok,false);
});
test('renderer limits streamed bytes before parsing JSON and cancels oversized body',async()=>{
 let canceled=false;
 const result=await renderer([command('state')],async()=>({ok:true,body:new ReadableStream({start(c){c.enqueue(new Uint8Array(40000));c.enqueue(new Uint8Array(40000));},cancel(){canceled=true;}}),json(){throw Error('must not parse unbounded JSON');}}));
 assert.equal(result.completions[0].error.code,'RELAY_TOO_LARGE');assert.equal(canceled,true);
});
test('renderer counts RPC acknowledgement envelope toward byte limit',async()=>{
 const result=await renderer([command('state')],async()=>({ok:true,json:async()=>({text:'x'.repeat(65470)})}));
 assert.equal(result.completions[0].ok,false);assert.equal(result.completions[0].error.code,'RELAY_TOO_LARGE');
});
test('renderer treats prototype keys as forbidden operations',async()=>{
 let calls=0;const result=await renderer(['constructor','toString','__proto__'].map((operation,i)=>command(operation,{id:'bad-'+i})),async()=>{calls++;});
 assert.equal(calls,0);assert.equal(result.completions.every(item=>item.error.code==='RELAY_BAD_REQUEST'),true);
});
test('full deduplication cache refuses more work while retaining earlier command results',async()=>{
 let calls=0;const commands=Array.from({length:129},(_,i)=>command('state',{id:'job-'+i}));commands.push(command('state',{id:'job-0'}));
 const result=await renderer(commands,async()=>{calls++;return {ok:true,json:async()=>({number:calls})};});
 assert.equal(calls,128);assert.equal(result.completions[128].error.code,'RELAY_BUSY');assert.equal(result.completions[129].value.number,1);
});
