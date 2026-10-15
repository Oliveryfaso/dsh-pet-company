import {test} from 'node:test';
import assert from 'node:assert/strict';
import {OwnedVideoPlayer} from '../vendor/dsh-pet-0.3.7/player.js';
import {ownedDocument} from './owned-view-fixture.js';
const callback=value=>{assert.equal(typeof value,'function','frame/end callback must stay owned');return value;};
const RED=[255,0,0,255,0,0,0,0],GREEN=[0,0,0,0,0,255,0,255],BLUE=[0,0,255,255,0,0,0,0];
// Actual player with a tiny drawing boundary. These are exact alpha/pixel contracts, not native GPU acceptance.
function fixture(t,{fallback=false}={}){
 const d=ownedDocument(),before=globalThis.window;globalThis.window=d.win;
 const a=d.doc.createElement('video'),b=d.doc.createElement('video'),surface=d.doc.createElement('canvas');
 if(fallback)a.requestVideoFrameCallback=b.requestVideoFrameCallback=undefined;
 const player=new OwnedVideoPlayer({videoA:a,videoB:b,surface,pet:{id:'companion-silver'},assetBase:'/assets/',idle:'idle'});
 t.after(()=>{player.dispose();if(before===undefined)delete globalThis.window;else globalThis.window=before;});
 const frame=video=>fallback?d.paint():video.present();const present=video=>{video.loaded();frame(video);};
 player.playIdle();present(b);
 return {...d,a,b,surface,player,frame,present,pixels:()=>[...surface.pixels]};
}
test('full-frame copy replaces old alpha without clearing the visible output',t=>{
 const h=fixture(t);assert.deepEqual(h.pixels(),RED);const n=h.surface.context.operations.length;
 h.player.switchTo('care',true);assert.deepEqual(h.pixels(),RED);h.a.framePixels=new Uint8ClampedArray(GREEN);h.present(h.a);
 assert.deepEqual(h.pixels(),GREEN);assert.equal(h.surface.context.operations.slice(n).length,1);assert.equal(h.surface.context.operations.at(-1).composite,'copy');
 assert.equal(h.surface.context.operations.some(op=>op.type==='clear'),false);
 for(const v of [h.a,h.b]){assert.equal(v.style.opacity,'0');assert.equal(v.style.getPropertyPriority('opacity'),'important');}
});
test('half-transparent edges replace old color and alpha without accumulating',t=>{
 const h=fixture(t),halfRed=[255,0,0,128,0,0,0,0],halfBlue=[0,0,255,128,0,0,0,0];
 h.b.framePixels=new Uint8ClampedArray(halfRed);h.frame(h.b);assert.deepEqual(h.pixels(),halfRed);
 h.player.switchTo('care',true);h.a.framePixels=new Uint8ClampedArray(halfBlue);h.present(h.a);assert.deepEqual(h.pixels(),halfBlue);
 h.frame(h.a);assert.deepEqual(h.pixels(),halfBlue);
});
test('undrawable incoming frame holds old pixels and retries on a later decoded frame',t=>{
 const h=fixture(t);h.player.switchTo('care',true);h.a.framePixels=new Uint8ClampedArray(GREEN);h.a.drawError=true;h.present(h.a);
 assert.deepEqual(h.pixels(),RED);assert.equal(h.player.pending.anim,'care');assert.equal(h.b.paused,false);
 h.a.drawError=false;h.frame(h.a);assert.deepEqual(h.pixels(),GREEN);assert.equal(h.player.pending,null);assert.equal(h.b.paused,true);
});
test('output copy failure preserves the previous bitmap and retries',t=>{
 const h=fixture(t);h.player.switchTo('care',true);h.a.framePixels=new Uint8ClampedArray(GREEN);h.surface.drawError=true;h.present(h.a);
 assert.deepEqual(h.pixels(),RED);h.surface.drawError=false;h.frame(h.a);assert.deepEqual(h.pixels(),GREEN);
});
test('zero decoded dimensions cannot replace the current bitmap',t=>{
 const h=fixture(t);h.player.switchTo('care',true);h.a.videoWidth=0;h.present(h.a);assert.deepEqual(h.pixels(),RED);
 h.a.videoWidth=2;h.a.framePixels=new Uint8ClampedArray(GREEN);h.frame(h.a);assert.deepEqual(h.pixels(),GREEN);
});
test('committed video keeps painting without another load',t=>{
 const h=fixture(t);h.b.framePixels=new Uint8ClampedArray(BLUE);h.frame(h.b);
 assert.deepEqual(h.pixels(),BLUE);assert.equal(h.b.loads,1);assert.equal(h.b.loop,true);
});
test('old painter continues while loading but cannot overwrite a newly owned frame',t=>{
 const h=fixture(t);const stale=callback([...h.b.frames.values()][0]);h.player.switchTo('care',true);h.b.framePixels=new Uint8ClampedArray(BLUE);h.frame(h.b);assert.deepEqual(h.pixels(),BLUE);
 h.a.framePixels=new Uint8ClampedArray(GREEN);h.present(h.a);stale();assert.deepEqual(h.pixels(),GREEN);assert.equal(h.b.frames.size,0);
});
test('superseded incoming callback cannot paint or acquire ownership',t=>{
 const h=fixture(t);h.player.switchTo('care',true);h.a.loaded();const stale=callback([...h.a.frames.values()][0]);
 h.player.switchTo('click',true);stale();assert.deepEqual(h.pixels(),RED);assert.equal(h.player.pending.anim,'click');
 h.a.framePixels=new Uint8ClampedArray(GREEN);h.present(h.a);assert.deepEqual(h.pixels(),GREEN);assert.equal(h.player.anim,'click');
});
for(const failure of ['error','timeout'])test(failure+' preserves committed pixels and releases pending callbacks',t=>{
 const h=fixture(t);h.player.switchTo('care',true);h.a.loaded();const stale=callback([...h.a.frames.values()][0]);
 if(failure==='error')h.fire(h.a,'error');else callback([...h.timers.values()][0])();stale();
 assert.deepEqual(h.pixels(),RED);assert.equal(h.player.pending,null);assert.equal(h.a.frames.size,0);assert.equal(h.timers.size,0);assert.equal(h.b.paused,false);
});
test('dispose fences both painters and releases video and canvas buffers once',t=>{
 const h=fixture(t);h.player.switchTo('care',true);h.a.loaded();const lateA=callback([...h.a.frames.values()][0]),lateB=callback([...h.b.frames.values()][0]),lateTimeout=callback([...h.timers.values()][0]);
 h.player.dispose();const loads=[h.a.loads,h.b.loads];lateA();lateB();lateTimeout();h.player.dispose();
 assert.deepEqual([h.a.loads,h.b.loads],loads);assert.equal(h.timers.size,0);assert.equal(h.paints.size,0);
 for(const v of [h.a,h.b]){assert.equal(v.frames.size,0);assert.equal(v.src,undefined);assert.equal(v.paused,true);assert.equal(v.onended,null);}
 for(const c of h.elements.filter(e=>e.tagName==='canvas')){assert.equal(c.width,0);assert.equal(c.height,0);assert.equal(c.pixels.length,0);}
});
test('fallback rendering callbacks are cancellable and keep one output',t=>{
 const h=fixture(t,{fallback:true});h.player.switchTo('care',true);h.a.framePixels=new Uint8ClampedArray(GREEN);h.present(h.a);assert.deepEqual(h.pixels(),GREEN);
 const stale=callback([...h.paints.values()][0]);h.player.dispose();stale();assert.equal(h.paints.size,0);assert.equal(h.surface.width,0);
});
test('B to A to B to A reuse cannot revive an old ended callback',t=>{
 const h=fixture(t);h.player.switchTo('care',true);h.a.framePixels=new Uint8ClampedArray(GREEN);h.present(h.a);const staleEnd=callback(h.a.onended);
 h.a.ended=true;h.a.onended();h.present(h.b);assert.deepEqual(h.pixels(),RED);
 h.player.switchTo('click',true);h.a.framePixels=new Uint8ClampedArray(BLUE);h.present(h.a);staleEnd();
 assert.deepEqual(h.pixels(),BLUE);assert.equal(h.player.pending,null);assert.equal(h.player.anim,'click');assert.deepEqual([h.a.loads,h.b.loads],[2,2]);
});
test('retained one-shot ending while a replacement fails advances exactly once',t=>{
 const h=fixture(t);h.player.switchTo('care',true);h.present(h.a);let ended=0;h.player.handleEnded=()=>ended++;const finish=callback(h.a.onended);
 h.player.switchTo('click',true);finish();assert.equal(ended,0);h.fire(h.b,'error');finish();assert.equal(ended,1);
});
test('ended one-shot advances if a later drawable callback arrives',t=>{
 const h=fixture(t);let ended=0;h.player.handleEnded=()=>ended++;h.player.switchTo('care',true);h.a.drawError=true;h.present(h.a);h.a.ended=true;
 h.a.drawError=false;h.frame(h.a);assert.equal(ended,1);h.a.onended();assert.equal(ended,1);
});
test('same pending playback is not loaded twice',t=>{
 const h=fixture(t);h.player.switchTo('care',true);h.player.switchTo('care',true);assert.equal(h.a.loads,1);
});
test('unavailable Canvas2D fails explicitly without a dual-video fallback',()=>{
 const d=ownedDocument(),surface=d.doc.createElement('canvas');surface.getContext=()=>null;
 assert.throws(()=>new OwnedVideoPlayer({videoA:d.doc.createElement('video'),videoB:d.doc.createElement('video'),surface,pet:{id:'test'},assetBase:'/assets/',idle:'idle'}),/Canvas/);
});
