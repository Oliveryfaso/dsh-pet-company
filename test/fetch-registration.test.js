import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RendererPetBridge,bindRendererBridge} from '../src/renderer-bridge.js';

function fixture(){
 const routes=new Map(),effects=[];const ctx={connection:{fetch:{register(route){assert.equal(route.requestBody,'buffered');assert.deepEqual(route.methods,['POST']);routes.set(route.path,route);return()=>routes.delete(route.path);}}},effect(fn){const disposer=fn();effects.push(disposer);return disposer;}};
 const bridge=new RendererPetBridge();bindRendererBridge(ctx,bridge);
 return {bridge,routes,async close(){for(const cleanup of effects.reverse())await cleanup?.();}};
}
const message=(method,payload)=>({type:'client-request',rpcId:'rpc-1',method:'dsh-pet-company/'+method,payload});
const request=(method,payload)=>new Request('http://localhost/api/dsh-pet-company/'+method,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(message(method,payload))});

test('public Fetch registry provides three exact authenticated carrier endpoints and owns cleanup',async()=>{
 const f=fixture();try{
  assert.deepEqual([...f.routes.keys()],['/api/dsh-pet-company/take','/api/dsh-pet-company/complete','/api/dsh-pet-company/release']);
  const full=await (await f.routes.get('/api/dsh-pet-company/take').fetch(request('take',{clientId:'a'}))).json();
  assert.equal(full.type,'server-response');assert.equal(full.rpcId,'rpc-1');assert.equal(full.result.ok,true);assert.equal(typeof full.result.value.leaseToken,'string');
 }finally{await f.close();}assert.equal(f.routes.size,0);assert.equal(f.bridge.closed,true);
});
test('Fetch adapter rejects incorrect media type, method, and malformed or mismatched envelopes',async()=>{
 const f=fixture(),route=f.routes.get('/api/dsh-pet-company/take');try{
  for(const body of [{...message('take',{clientId:'a'}),type:'other'},{...message('take',{clientId:'a'}),rpcId:''},message('release',{clientId:'a'}),{...message('take',{clientId:'a'}),url:'https://bad.example'}]){
   const response=await route.fetch(new Request('http://localhost/api/dsh-pet-company/take',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}));assert.equal(response.status,400);
  }
  assert.equal((await route.fetch(new Request('http://localhost/api/dsh-pet-company/take'))).status,405);
  assert.equal((await route.fetch(new Request('http://localhost/api/dsh-pet-company/take',{method:'POST',body:'{}'}))).status,415);
  assert.equal(f.bridge.lease,null);
 }finally{await f.close();}
});
test('Fetch adapter bounds incoming bytes before JSON parsing and cancels oversized streams',async()=>{
 const f=fixture();let canceled=false;try{
  const body=new ReadableStream({start(controller){controller.enqueue(new Uint8Array(40000));controller.enqueue(new Uint8Array(40000));},cancel(){canceled=true;}});
  const response=await f.routes.get('/api/dsh-pet-company/take').fetch(new Request('http://localhost/api/dsh-pet-company/take',{method:'POST',headers:{'content-type':'application/json'},body,duplex:'half'}));
  assert.equal(response.status,413);assert.equal(canceled,true);assert.equal(f.bridge.lease,null);
 }finally{await f.close();}
});


test('full server response envelope also stays within 64 KiB',async()=>{
 const f=fixture();let pending;
 try{
  const route=f.routes.get('/api/dsh-pet-company/take');
  const first=await (await route.fetch(request('take',{clientId:'a'}))).json();
  pending=f.bridge.broadcast('main','a'.repeat(65450)).catch(error=>error.code);
  const response=await route.fetch(request('take',{clientId:'a',leaseToken:first.result.value.leaseToken}));
  assert.equal(response.status,413);assert.equal((await response.json()).result.error.code,'RELAY_TOO_LARGE');
 }finally{await f.close();if(pending)await pending;}
});
