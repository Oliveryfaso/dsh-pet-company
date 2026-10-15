import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createOwnedView} from '../src/owned/view.js';
import {roleView} from '../src/owned/config.js';
import {ownedDocument} from './owned-view-fixture.js';
const id='companion-silver',feedback={eventId:'care-one',source:'care'};
const state=(say=0,anim=0,text=null)=>({pets:{[id]:{say:{counter:say,data:text?{text,feedback}:null},anim:{counter:anim,data:anim?{feedback}:null}}}});
async function fixture(t,appearance={}){
 const dom=ownedDocument(),before=globalThis.window;globalThis.window=dom.win;
 const config=await roleView(id,appearance);config.animations.clicks=['click'];
 const view=createOwnedView(dom.doc.body,config,{assetURL:()=>'/assets/'}),videos=dom.elements.filter(e=>e.tagName==='video');
 t.after(()=>{view.destroy();if(before===undefined)delete globalThis.window;else globalThis.window=before;});
 const commit=()=>{const video=videos.find(v=>v.src&&!v.classList.contains('is-front'));video.loaded();video.present();dom.paint();dom.paint();};
 commit();view.update(state());
 return {...dom,view,videos,commit,careLoads:()=>videos.reduce((n,v)=>n+v.loads,0)-1,text:()=>dom.doc.querySelector('.fb-text'),bubble:()=>dom.doc.querySelector('.dsh-feedback-cloud'),hit:dom.doc.querySelector('.company-hit')};
}

// Removing event identity gating must reload care after the first command has committed.
test('say committed before same-UUID anim loads care only once',async t=>{
 const h=await fixture(t);h.view.update(state(1,0,'喝点水吧'));h.commit();
 h.view.update(state(1,1,'喝点水吧'));
 assert.equal(h.careLoads(),1);assert.equal(h.text().textContent,'喝点水吧');
});
test('anim committed before same-UUID say upgrades text without replay',async t=>{
 const h=await fixture(t);h.view.update(state(0,1));h.commit();assert.equal(h.text().textContent,'我在呢～');
 h.view.update(state(1,1,'真正的关心'));
 assert.equal(h.careLoads(),1);assert.equal(h.text().textContent,'真正的关心');
});
test('closing care prevents a delayed same-UUID command from replaying it',async t=>{
 const h=await fixture(t);h.view.update(state(1,0,'喝点水吧'));h.commit();h.fire(h.doc.querySelector('.fb-close'),'click');
 h.view.update(state(1,1,'喝点水吧'));
 assert.equal(h.careLoads(),1);assert.equal(h.bubble().dataset.open,'false');
});
test('care suppressed during drag neither starts video nor replays on release',async t=>{
 const h=await fixture(t);h.fire(h.hit,'pointerdown',{button:0,pointerId:1,screenX:10,screenY:10});h.fire(h.hit,'pointermove',{screenX:20,screenY:10});
 h.view.update(state(1,0,'拖拽时别排队'));assert.equal(h.careLoads(),0);
 h.fire(h.hit,'pointerup');h.view.update(state(1,1,'拖拽时别排队'));assert.equal(h.careLoads(),0);
});
test('care suppressed in background does not play after returning',async t=>{
 const h=await fixture(t);h.doc.hidden=true;h.fire(h.doc,'visibilitychange');h.view.update(state(1,0,'后台不要重播'));
 assert.equal(h.careLoads(),0);h.doc.hidden=false;h.fire(h.doc,'visibilitychange');h.view.update(state(1,1,'后台不要重播'));assert.equal(h.careLoads(),0);
});
test('separate user clicks may replay the same committed action',async t=>{
 const h=await fixture(t);h.fire(h.hit,'click',{detail:1});h.commit();h.fire(h.hit,'click',{detail:1});
 assert.equal(h.careLoads(),2);
});
test('disabling clouds keeps one care playback and same-UUID text upgrade',async t=>{
 const h=await fixture(t,{cloud:false});h.view.update(state(0,1));h.commit();h.view.update(state(1,1,'只播一次'));
 assert.equal(h.careLoads(),1);assert.equal(h.text().textContent,'只播一次');assert.equal(h.bubble().dataset.open,'false');
});
test('view exposes one canvas while both decoding videos stay hidden',async t=>{
 const h=await fixture(t);const surfaces=h.elements.filter(e=>e.tagName==='canvas'&&e.parentElement);
 assert.equal(surfaces.length,1);assert.equal(surfaces[0].className,'company-pet-frame');
 for(const video of h.videos){assert.equal(video.style.opacity,'0');assert.equal(video.style.getPropertyPriority('opacity'),'important');}
});
test('unavailable Canvas2D leaves no orphan stage for the next web poll',async()=>{
 const d=ownedDocument(),create=d.doc.createElement;d.doc.createElement=tag=>{const node=create(tag);if(tag==='canvas')node.getContext=()=>null;return node;};
 const view=await roleView(id);
 assert.throws(()=>createOwnedView(d.doc.body,view,{assetURL:()=>'/assets/'}),/Canvas/);
 assert.equal(d.doc.body.children.length,0);
});
