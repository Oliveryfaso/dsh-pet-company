import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PetBridge} from '../src/bridge.js';
test('bridge uses loopback, encodes opaque IDs and honors business failure',async()=>{
 const calls=[];
 const b=new PetBridge(()=>3080,async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({ok:true})};});
 await b.broadcast('a.b 中文','喝口水？');assert.equal(calls[0].url,'http://127.0.0.1:3080/dsh-pet-7340/broadcast?pet=a.b%20%E4%B8%AD%E6%96%87');
 assert.deepEqual(JSON.parse(calls[0].options.body),{text:'喝口水？'});assert.equal(calls[0].options.redirect,'error');
 const fail=new PetBridge(()=>3080,async()=>({ok:true,json:async()=>({ok:false,reason:'unknown-pet'})}));
 await assert.rejects(fail.broadcast('bad','hello'),e=>e.code==='PET_NOT_FOUND');
 await assert.rejects(new PetBridge(()=>0).state(),/未就绪/);
});
test('animation only plays care present in target pet entry',async()=>{
 const calls=[];
 const b=new PetBridge(()=>3080,async(url,options)=>{calls.push(url);return {ok:true,json:async()=>options.method==='GET'?{main:{pets:[{id:'x'}],animations:{categories:[{actions:['care']}]}}}:{ok:true}};});
 await b.animate('x');assert.equal(calls.length,2);await b.animate('a.b');assert.equal(calls.length,3);
});

test('fresh pets are found from config even before any state event; stale state cannot revive removed pets',async()=>{
 const calls=[];
 const bridge=new PetBridge(()=>3080,async url=>{
  calls.push(url);
  return {ok:true,json:async()=>url.endsWith('/state')?{sections:{},pets:{removed:{say:{counter:1}}}}:{main:{pets:[{id:'fresh'}]}}};
 });
 const state=await bridge.state('fresh');assert.deepEqual(state.pets,{removed:{say:{counter:1}}});
 assert.equal(calls.length,2);
 await assert.rejects(bridge.state('removed'),/找不到所选宠物/);
});
test('desktop access rejection explains host boundary without suggesting security changes',async()=>{
 const bridge=new PetBridge(()=>3080,async()=>({ok:false,status:403}));
 await assert.rejects(bridge.state('main'),/桌面宿主.*403/);
});
