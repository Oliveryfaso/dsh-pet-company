import test from 'node:test';
import assert from 'node:assert/strict';
import {createFeedbackState,normalizeFeedback,reduceFeedback,placeCloud,motionKeyframes} from '../compat/dsh-pet-feedback/feedback-core.mjs';
const event=(id='care:1',text='水杯也在等你。',trigger='care')=>({eventId:id,text,trigger});
const show=(state,id='care:1',now=0,text='水杯也在等你。',trigger='care')=>reduceFeedback(state,{type:'show',event:event(id,text,trigger)},now);

test('limits Unicode text and keeps markup literal',()=>{
 const e=normalizeFeedback(event('x','  <img src=x>\n🙂🙂🙂\u0000 '),{maxCharacters:16});
 assert.equal(e.text,'<img src=x> 🙂🙂🙂');
 const capped=normalizeFeedback(event('x','🙂'.repeat(20)),{maxCharacters:5});
 assert.equal(Array.from(capped.text).length,5);assert.equal(capped.text,'🙂🙂🙂🙂…');
});
test('invalid empty event is ignored',()=>{const s=createFeedbackState();assert.equal(reduceFeedback(s,{type:'show',event:{text:' '}},0),s);});
test('new care is visible for eight seconds by default',()=>{const s=show(createFeedbackState());assert.equal(s.phase,'visible');assert.equal(s.expiresAt,8000);assert.equal(s.text,'水杯也在等你。');});
test('same event id does not prolong or restart feedback',()=>{const s=show(createFeedbackState());assert.equal(show(s,'care:1',2000),s);assert.equal(s.expiresAt,8000);});
test('new text replaces the single visible slot without a queue',()=>{const s=show(show(createFeedbackState()),'care:2',1000,'该歇会儿啦。');assert.equal(s.text,'该歇会儿啦。');assert.equal(s.eventId,'care:2');assert.equal('queue' in s,false);});
test('closing keeps the same event dismissed',()=>{let s=show(createFeedbackState());s=reduceFeedback(s,{type:'close'},100);assert.equal(s.phase,'hidden');assert.equal(show(s,'care:1',200),s);});
test('only an expired deadline dismisses the visible slot',()=>{const s=show(createFeedbackState());assert.equal(reduceFeedback(s,{type:'expire'},7999),s);assert.equal(reduceFeedback(s,{type:'expire'},8000).phase,'hidden');});
test('drag clears feedback and its release cannot become a click',()=>{let s=show(createFeedbackState());s=reduceFeedback(s,{type:'dragstart'},20);assert.equal(s.phase,'dragging');assert.equal(s.text,'');s=reduceFeedback(s,{type:'dragend'},100);s=show(s,'click:1',120,'我在呢。','click');assert.equal(s.phase,'hidden');s=show(s,'click:2',500,'我在呢。','click');assert.equal(s.phase,'visible');});
test('care during a drag is suppressed rather than queued',()=>{let s=reduceFeedback(createFeedbackState(),{type:'dragstart'},0);s=show(s,'care:1',50);s=reduceFeedback(s,{type:'dragend'},60);assert.equal(s.phase,'hidden');assert.equal(show(s,'care:1',600),s);});
test('background events stay dismissed on return',()=>{let s=reduceFeedback(createFeedbackState(),{type:'background',hidden:true},0);s=show(s,'care:1',20);s=reduceFeedback(s,{type:'background',hidden:false},30);assert.equal(s.phase,'hidden');assert.equal(show(s,'care:1',50),s);});
test('destroyed controller remains inert',()=>{const s=reduceFeedback(show(createFeedbackState()),{type:'destroy'},1);assert.equal(s.phase,'destroyed');assert.equal(show(s,'care:2',2),s);});
test('dedupe memory is bounded during repeated clicking',()=>{let s=createFeedbackState();for(let i=0;i<200;i++)s=show(s,'click:'+i,i*400,'我在呢。','click');assert.ok(s.seenIds.length<=64);});
const rect=(x,y,width,height)=>({x,y,width,height});
test('cloud sits above an unobstructed pet',()=>{const p=placeCloud({anchor:rect(100,200,50,80),bubble:{width:160,height:72},viewport:rect(0,0,400,400)});assert.deepEqual(p,{x:45,y:116,width:160,height:72,placement:'above',tailX:80,maxWidth:376,maxHeight:376});});
test('cloud flips below near the top edge',()=>{const p=placeCloud({anchor:rect(100,10,50,80),bubble:{width:160,height:72},viewport:rect(0,0,400,400)});assert.equal(p.placement,'below');assert.equal(p.y,102);});
test('cloud clamps at the right edge and keeps its tail inside',()=>{const p=placeCloud({anchor:rect(375,200,20,60),bubble:{width:160,height:72},viewport:rect(0,0,400,400)});assert.equal(p.x,228);assert.ok(p.tailX<=142);});
test('negative monitor origins use the same DIP coordinate system',()=>{const p=placeCloud({anchor:rect(-1590,200,50,80),bubble:{width:160,height:72},viewport:rect(-1600,0,800,600)});assert.equal(p.x,-1588);assert.ok(p.y>=12);});
test('small work area constrains the cloud without overflowing',()=>{const p=placeCloud({anchor:rect(90,60,50,70),bubble:{width:600,height:400},viewport:rect(0,0,240,180)});assert.ok(p.width<=216);assert.ok(p.height<=156);assert.ok(p.x>=12&&p.x+p.width<=228);assert.ok(p.y>=12&&p.y+p.height<=168);});
test('invalid geometry never produces NaN styles',()=>{assert.equal(placeCloud({anchor:rect(NaN,0,40,50),bubble:{width:100,height:50},viewport:rect(0,0,400,400)}),null);});
test('reduced motion has no scale frames',()=>{assert.deepEqual(motionKeyframes(true),[]);const frames=motionKeyframes(false);assert.ok(frames.every(f=>Number.isFinite(f.scale)&&f.scale>=.97&&f.scale<=1.01));assert.equal(frames.at(-1).scale,1);});

test('real say upgrades the current fallback once without extending or replaying',()=>{
 let state=createFeedbackState();
 state=reduceFeedback(state,{type:'show',event:{eventId:'shared',text:'我在呢～',fallback:true}},100);
 const deadline=state.expiresAt;
 state=reduceFeedback(state,{type:'show',event:{eventId:'shared',text:'喝一口水，看看远处。'}},500);
 assert.equal(state.text,'喝一口水，看看远处。');
 assert.equal(state.fallback,false);
 assert.equal(state.expiresAt,deadline);
 assert.equal(state.eventId,'shared');
 assert.deepEqual(state.seenIds,['shared']);
 const repeated=reduceFeedback(state,{type:'show',event:{eventId:'shared',text:'不得二次改写'}},600);
 assert.equal(repeated,state);
});

test('a dismissed fallback never reopens when the real text arrives',()=>{
 let state=createFeedbackState();
 state=reduceFeedback(state,{type:'show',event:{eventId:'shared-close',text:'默认',fallback:true}},100);
 state=reduceFeedback(state,{type:'close'},150);
 state=reduceFeedback(state,{type:'show',event:{eventId:'shared-close',text:'真实关怀'}},200);
 assert.equal(state.phase,'hidden');
 assert.equal(state.text,'');
});
