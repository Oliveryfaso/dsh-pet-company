import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS,validateConfig,isQuiet,Scheduler,MINUTE} from '../src/core.js';
const at=(h=10,m=0)=>new Date(2026,9,15,h,m).getTime();
const cfg=(v={})=>validateConfig({...DEFAULTS,sitMinutes:1,water:false,work:false,late:false,frequency:'chatty',...v});
const frame=(state='working',counter=1,notify=null,say=0)=>({sections:{workStatus:{counter,data:{state,task:null}},notify:{counter:notify?counter:0,data:notify}},pets:{'a.b':{say:{counter:say,data:null}},main:{say:{counter:say,data:null}}}});
function advance(s,t,c,count=4,state=frame()) {let r; for(let i=0;i<=count;i++)r=s.observe(state,t+i*15000,c); return r;}
test('strict config rejects invalid times, types and untrusted fields',()=>{
  for(const value of [{enabled:'false'},{quietStart:'24:00'},{frequency:'loud'},{sitMinutes:0},{petId:'../foo'},{__bad:1},{constructor:1},{minGapMinutes:19},{waterMinutes:Infinity}]) assert.throws(()=>validateConfig(value));
  assert.equal(validateConfig({petId:'a.b'}).petId,'a.b');
});
test('quiet ranges handle midnight and equal bounds disable silence',()=>{
  const c=cfg({quietStart:'23:00',quietEnd:'08:00'});
  assert.equal(isQuiet(new Date(at(23)),c),true);assert.equal(isQuiet(new Date(at(7,59)),c),true);
  assert.equal(isQuiet(new Date(at(8)),c),false);assert.equal(isQuiet(new Date(at(22,59)),c),false);
  assert.equal(isQuiet(new Date(at()),cfg({quietStart:'00:00',quietEnd:'00:00'})),false);
});
test('activity needs observed time; success alone does not count as working',()=>{
  let s=new Scheduler(at());assert.equal(advance(s,at(),cfg()).kind,'sitting');
  s=new Scheduler(at());assert.equal(advance(s,at(),cfg(),8,frame('success')).kind,undefined);
});
test('sleep and reconnect do not accrue working time or catch-up water reminders',()=>{
  const s=new Scheduler(at()),c=cfg({water:true,waterMinutes:1});advance(s,at(),c,2);
  assert.equal(s.observe(frame(),at()+120*MINUTE,c).kind,undefined);
  s.disconnect(at()+121*MINUTE);assert.equal(s.observe(frame(),at()+121*MINUTE,c).kind,undefined);
});
test('approval/question blocks active snapshots until a newer active transition',()=>{
  for(const type of ['approval/requested','question/requested']) {
    const s=new Scheduler(at()),c=cfg();
    assert.equal(advance(s,at(),c,8,frame('working',2,{type})).phase,'waiting');
    assert.equal(s.observe(frame('working',3,{type}),at()+135000,c).phase,'waiting');
    assert.equal(s.observe(frame('result',4),at()+150000,c).kind,'sitting');
  }
  const s=new Scheduler(at());assert.equal(advance(s,at(),cfg(),8,frame('waiting')).kind,undefined);
});
test('external speech, opaque dotted pet id, global cooldown and rolling quota',()=>{
  const s=new Scheduler(at()),c=cfg({petId:'a.b'});advance(s,at(),c);
  assert.equal(s.observe(frame('working',1,null,4),at()+75000,c).phase,'cooldown');
  const q=new Scheduler(at());let r=advance(q,at(),cfg({frequency:'quiet'}));q.delivered(r.kind,at()+MINUTE,r.day);
  assert.equal(q.observe(frame(),at()+75000,cfg({frequency:'quiet'})).phase,'cooldown');
});
test('failed delivery stays due; successful delivery resets only selected timer',()=>{
  const s=new Scheduler(at()),c=cfg();const r=advance(s,at(),c);assert.equal(r.kind,'sitting');
  assert.equal(s.observe(frame(),at()+75000,c).kind,'sitting');assert.equal(s.sent.length,0);
  s.delivered('sitting',at()+75000,r.day);assert.equal(s.sittingMs,0);assert.equal(s.sent.length,1);
});
test('quiet/disabled/snooze gates and late reminder is once per local day',()=>{
  let t=at(23,40),s=new Scheduler(t),c=cfg({late:true,sitting:false});
  let r=s.observe(frame(),t,c);assert.equal(r.kind,'late');s.delivered('late',t,r.day);
  for(let i=1;i<=300;i++)r=s.observe(frame(),t+i*15000,c);
  assert.equal(r.kind,undefined);
  s=new Scheduler(at());s.snoozeUntil=at()+MINUTE;assert.equal(s.observe(frame(),at(),cfg()).phase,'snoozed');
  assert.equal(s.observe(frame(),at(),cfg({enabled:false})).phase,'disabled');
  s=new Scheduler(at(1));assert.equal(s.observe(frame(),at(1),cfg()).phase,'quiet');
});
test('five minutes observed idle resets active counters',()=>{
  const s=new Scheduler(at()),c=cfg();advance(s,at(),c,4);advance(s,at()+75000,c,21,frame(null));
  assert.equal(s.activeMs,0);assert.equal(s.sittingMs,0);
});

test('default quiet schedule eventually serves all independent reminders',()=>{
 const start=at(8),s=new Scheduler(start),c=validateConfig({late:false}),kinds=new Set();
 for(let i=0;i<8*60*4;i++) {const t=start+i*15000,r=s.observe(frame(),t,c);if(r.kind){kinds.add(r.kind);s.delivered(r.kind,t,r.day);}}
 assert.deepEqual([...kinds].sort(),['sitting','water','work']);
});

test('task text updates never unlock a pending question',()=>{
 const s=new Scheduler(at()),c=cfg();const a=frame('working',1,{type:'question/requested'});a.sections.notify.counter=7;
 advance(s,at(),c,4,a);
 const b=frame('working',2,{type:'question/requested'});b.sections.notify.counter=7;b.sections.workStatus.data.task='changed task';
 assert.equal(s.observe(b,at()+75000,c).phase,'waiting');
 const resumed=frame('result',3);resumed.sections.notify=a.sections.notify;
 assert.equal(s.observe(resumed,at()+90000,c).kind,'sitting');
});
test('nonempty existing bubble on first connection gets conservative cooldown',()=>{
 const s=new Scheduler(at(23,40)),c=cfg({late:true}),f=frame();f.pets.main.say.data={text:'外部气泡'};
 assert.equal(s.observe(f,at(23,40),c).phase,'cooldown');
});
