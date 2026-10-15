import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RendererPetBridge,RELAY_CHANNEL} from '../src/renderer-bridge.js';
import {createRendererRelay} from '../src/client-relay.js';

test('real host and renderer adapters carry state, broadcast and care with official RPC envelopes',async()=>{
 const bridge=new RendererPetBridge(),paths=[],bodies=[];
 const rpc={call(channel,endpoint,payload,signal){assert.equal(channel,RELAY_CHANNEL);assert.ok(endpoint.startsWith('dsh-pet-company/'));return bridge.rpc(endpoint.slice('dsh-pet-company/'.length),payload,signal);}};
 const relay=createRendererRelay({rpc,fetcher:async(url,init)=>{
  paths.push(url);if(init.body)bodies.push(JSON.parse(init.body));assert.equal(Object.keys(init.headers).some(key=>/token|authorization|renderer/i.test(key)),false);
  if(url.endsWith('/state'))return Response.json({sections:{workStatus:{counter:0,data:null}},pets:{}});
  if(url.endsWith('/config'))return Response.json({main:{pets:[{id:'a.b'}],animations:{categories:[{actions:['care']}]}}});
  return Response.json({ok:true});
 }});
 const running=relay.run();
 try{
  assert.deepEqual((await bridge.state('a.b')).pets,{});
  const feedback={eventId:'shared-event_1',source:'care'};await bridge.broadcast('a.b','喝水',feedback);await bridge.animate('a.b',feedback);
  assert.deepEqual(bodies,[{text:'喝水',feedback},{name:'care',feedback}]);
  assert.deepEqual(paths,['/dsh-pet-7340/state','/dsh-pet-7340/config','/dsh-pet-7340/broadcast?pet=a.b','/dsh-pet-7340/config','/dsh-pet-7340/anim?pet=a.b']);
 }finally{await relay.stop();bridge.close();await running;}
});
