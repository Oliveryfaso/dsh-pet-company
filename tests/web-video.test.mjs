import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {stripTypeScriptTypes} from 'node:module';

// Node 22.13+ or 24; reads the vendored source without installing TypeScript or opening a UI.
const source=await readFile(process.env.DSH_PET_WEB_SOURCE ?? new URL('../compat/dsh-pet-0.3.7/source/src/client/pet.ts', import.meta.url),'utf8');
const switchSource=stripTypeScriptTypes(source.slice(source.indexOf('    const switchTo ='),source.indexOf('\n    // 可选表现层的生命周期')));
const policySource=source.match(/const presentationPlaybackKey = [\s\S]*?: '';/)?.[0]??'';
const effectStart=source.indexOf('    useEffect(() => {',source.indexOf('// ---- 状态驱动播放'));
const playbackEffect=source.slice(effectStart,source.indexOf('    useEffect(() => {\n      mountedRef.current = true;',effectStart));
const modeStart=source.indexOf('    useEffect(() => {\n      feedbackVisibleRef.current = false;');
const modeEnd=source.indexOf('    }, [cfg.id, feedbackEnabled]);',modeStart)+'    }, [cfg.id, feedbackEnabled]);'.length;
const modeEffect=stripTypeScriptTypes(source.slice(modeStart,modeEnd));
const flush=async()=>{for(let i=0;i<8;i++)await Promise.resolve();};
function harness(presentation=true){
  let serial=0,frameId=0,timerId=0;const fetches=[],frames=new Map(),timers=new Map();
  function video(front=false){
    const listeners=new Map(),classes=new Set(front?['is-front']:[]),callbacks=new Map();
    return {style:{},src:front?'blob:old':'',currentSrc:front?'blob:old':'',readyState:front?2:0,paused:true,loadCount:0,playCount:0,
      classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),contains:v=>classes.has(v)},
      addEventListener(type,fn){if(!listeners.has(type))listeners.set(type,new Set());listeners.get(type).add(fn);},
      removeEventListener(type,fn){listeners.get(type)?.delete(fn);},
      emit(type){for(const fn of [...listeners.get(type)??[]])fn({currentTarget:this});},
      load(){this.loadCount++;this.readyState=0;this.currentSrc=this.src;},play(){this.paused=false;this.playCount++;return Promise.resolve();},pause(){this.paused=true;},
      requestVideoFrameCallback(fn){const id=++frameId;callbacks.set(id,fn);return id;},cancelVideoFrameCallback(id){callbacks.delete(id);},
      present(){for(const [id,fn]of [...callbacks]){callbacks.delete(id);fn(0,{});}},listenerCount:type=>listeners.get(type)?.size??0,
    };
  }
  const a=video(true),b=video(),ref=current=>({current});
  const env={videoARef:ref(a),videoBRef:ref(b),frontRef:ref(0),pendingRef:ref(null),genRef:ref(0),
    pendingSquashRef:ref(false),feedbackEnabledRef:ref(presentation),activeVideoRef:ref(null),readyCleanupRef:ref(null),
    cfg:{id:'test',assetRoot:'test',fixedEnabled:true,workStatusEnabled:false},petAnims:{idle:['idle'],events:{}},petWeights:{idle:100,turn:0,move:0},workStatusRef:ref(null),
    mountedRef:ref(true),animRef:ref('idle'),blobUrlRef:ref({a:null,b:null}),inflightRef:ref([]),facingRef:ref('left'),pendingMoveRef:ref(null),
    isEventAnim:()=>false,handleEnded(){},startSquash(){},startMoveDrive(){},THUMB_EXT:'.webm',AbortController,
    console:{log(){},warn(){}},URL:{createObjectURL:blob=>'blob:'+blob.id+'-'+ ++serial,revokeObjectURL(){}},
    requestAnimationFrame:fn=>{const id=++frameId;frames.set(id,fn);return id;},cancelAnimationFrame:id=>frames.delete(id),
    window:{setTimeout:fn=>{const id=++timerId;timers.set(id,fn);return id;},clearTimeout:id=>timers.delete(id)},
    fetch(url,{signal}){return new Promise((resolve,reject)=>{fetches.push({url,resolve:()=>resolve({ok:true,blob:async()=>({id:url.split('/').at(-1)})})});signal.addEventListener('abort',()=>reject(new Error('aborted')),{once:true});});},
  };
  const switchTo=Function(...Object.keys(env),switchSource+';return switchTo;')(...Object.values(env));
  return {a,b,env,fetches,switchTo,async loaded(index,el=b){fetches[index].resolve();await flush();el.readyState=2;el.emit('loadeddata');await flush();},flush,frames,timers};
}

test('opt-in waits for its own loaded source and presented frame before replacing the front',async()=>{
 const h=harness();h.switchTo('waving',true);h.fetches[0].resolve();await flush();
 h.switchTo('jumping',true);h.b.readyState=2;h.b.emit('loadeddata');await flush();
 assert.equal(h.env.frontRef.current,0,'old source readiness must not commit the new generation');
 h.fetches[1].resolve();await flush();h.b.readyState=2;h.b.emit('loadeddata');await flush();
 assert.equal(h.env.frontRef.current,0,'loadeddata is not yet a presented video frame');
 h.b.present();assert.equal(h.env.frontRef.current,1);assert.match(h.b.src,/jumping/);
 assert.equal(h.b.style.transition,'none');assert.equal(h.b.style.opacity,'1');assert.equal(h.a.style.opacity,'0');
});

test('opt-in single fixed idle loops the current video without a second fetch or load',async()=>{
 const h=harness();h.switchTo('idle',true);await h.loaded(0);h.b.present();
 assert.equal(h.b.loop,true);const loads=h.b.loadCount;h.switchTo('idle',true);
 assert.equal(h.fetches.length,1);assert.equal(h.b.loadCount,loads);assert.equal(h.b.onended,null);
});

test('superseding an opt-in request cancels old decoded-frame callbacks',async()=>{
 const h=harness();h.switchTo('waving',true);await h.loaded(0);
 h.switchTo('jumping',true);h.b.present();assert.equal(h.env.frontRef.current,0);
 await h.loaded(1);h.b.present();assert.equal(h.env.frontRef.current,1);assert.equal(h.b.listenerCount('loadeddata'),0);
});

test('legacy pets keep loadeddata switching and once-only playback',async()=>{
 const h=harness(false);h.switchTo('idle',true);await h.loaded(0);
 assert.equal(h.env.frontRef.current,1);assert.equal(h.b.loop,false);assert.notEqual(h.b.style.transition,'none');
 h.switchTo('idle',true);assert.equal(h.fetches.length,2);
});

test('non-fixed or randomly weighted opt-in idle retains ended progression',async()=>{
 for(const change of [h=>{h.env.cfg.fixedEnabled=false;},h=>{h.env.petWeights.idle=70;}]){
  const h=harness();change(h);h.switchTo('idle',true);await h.loaded(0);h.b.present();
  assert.equal(h.b.loop,false);assert.equal(typeof h.b.onended,'function');
 }
});

test('decode error preserves the old frame and releases listeners and timers',async()=>{
 const h=harness();h.switchTo('waving',true);h.fetches[0].resolve();await flush();
 h.b.error=new Error('bad video');h.b.emit('error');await flush();
 assert.equal(h.env.frontRef.current,0);assert.equal(h.a.classList.contains('is-front'),true);
 assert.equal(h.b.listenerCount('loadeddata'),0);assert.equal(h.b.listenerCount('error'),0);
 assert.equal(h.env.pendingRef.current,null);assert.equal(h.timers.size,0);assert.equal(h.env.inflightRef.current.length,0);
});

test('unmount cleanup cancels an awaited frame without a late front commit',async()=>{
 const h=harness();h.switchTo('waving',true);await h.loaded(0);
 h.env.mountedRef.current=false;h.env.readyCleanupRef.current();h.b.present();
 assert.equal(h.env.frontRef.current,0);assert.equal(h.timers.size,0);assert.equal(h.env.readyCleanupRef.current,null);
 assert.equal(h.b.listenerCount('loadeddata'),0);assert.equal(h.b.listenerCount('error'),0);
});

test('decode timeout releases the request and a later command can retry',async()=>{
 const h=harness();h.switchTo('waving',true);h.fetches[0].resolve();await flush();
 for(const fn of [...h.timers.values()])fn();await flush();
 assert.equal(h.env.pendingRef.current,null);assert.equal(h.env.frontRef.current,0);assert.equal(h.timers.size,0);
 h.switchTo('waving',true);assert.equal(h.fetches.length,2);
});

test('without video-frame callbacks the opt-in fallback waits two animation frames',async()=>{
 const h=harness();h.b.requestVideoFrameCallback=undefined;h.switchTo('waving',true);await h.loaded(0);
 assert.equal(h.env.frontRef.current,0);
 for(const [id,fn] of [...h.frames]){h.frames.delete(id);fn();}
 assert.equal(h.env.frontRef.current,0);
 for(const [id,fn] of [...h.frames]){h.frames.delete(id);fn();}
 assert.equal(h.env.frontRef.current,1);
});

test('a superseded fetch never overwrites the current pending video source',async()=>{
 const h=harness();h.switchTo('waving',true);h.switchTo('jumping',true);
 h.fetches[0].resolve();await flush();assert.equal(h.b.src,'');
 await h.loaded(1);h.b.present();assert.match(h.b.src,/jumping/);assert.equal(h.env.frontRef.current,1);
});

test('an old front ended event cannot replace a newer in-flight action',async()=>{
 const h=harness();let ended=0;h.env.handleEnded=()=>{ended++;};
 // The compiled closure captures the environment function, so observe through a wrapper.
 const rebound=Function(...Object.keys(h.env),switchSource+';return switchTo;')(...Object.values(h.env));
 rebound('waving',true);await h.loaded(0);h.b.present();const oldEnded=h.b.onended;
 rebound('jumping',true);oldEnded({currentTarget:h.b});assert.equal(ended,0);
 await h.loaded(1,h.a);h.a.present();h.a.onended({currentTarget:h.a});assert.equal(ended,1);
});

test('canceling an uncommitted target pauses decoding but committing does not pause the front',async()=>{
 const h=harness();h.switchTo('waving',true);await h.loaded(0);assert.equal(h.b.paused,false);
 h.switchTo('jumping',true);assert.equal(h.b.paused,true,'superseded hidden video must stop decoding');
 await h.loaded(1);h.b.present();assert.equal(h.b.paused,false,'successful cleanup must not pause the new front');
});

function playbackRenderer(h,anim='idle'){
 let previous;
 return ()=>{
  const env={...h.env,feedbackEnabled:h.env.feedbackEnabledRef.current,anim,once:true,seq:0,switchTo:h.switchTo,
   useEffect(effect,deps){if(!previous||deps.some((v,i)=>!Object.is(v,previous[i]))){previous=deps;effect();}}};
  Function(...Object.keys(env),policySource+'\n'+playbackEffect)(...Object.values(env));
 };
}

test('actual playback effect re-evaluates native looping after fixed, weight, or idle-pool changes',async()=>{
 for(const change of [h=>{h.env.cfg.fixedEnabled=false;},h=>{h.env.petWeights.idle=70;},h=>{h.env.petAnims.idle=['new-idle'];}]){
  const h=harness(),render=playbackRenderer(h);render();await h.loaded(0);h.b.present();assert.equal(h.b.loop,true);
  change(h);render();assert.equal(h.fetches.length,2,'configuration change must run the playback effect');
  await h.loaded(1,h.a);h.a.present();assert.equal(h.a.loop,false);assert.equal(typeof h.a.onended,'function');
 }
});

test('hot disable clears canceled managed pending before the same legacy command runs',async()=>{
 const h=harness(),render=playbackRenderer(h,'waving');render();assert.equal(h.env.pendingRef.current.anim,'waving');
 h.env.feedbackEnabledRef.current=false;
 const env={...h.env,presentation:undefined,feedbackEnabled:false,feedbackVisibleRef:{current:false},setFeedbackOn(){},
  feedbackActorRef:{current:null},hitRef:{current:null},once:true,useEffect:effect=>effect()};
 Function(...Object.keys(env),modeEffect)(...Object.values(env));
 assert.equal(h.env.pendingRef.current,null);assert.equal(h.env.readyCleanupRef.current,null);
 render();assert.equal(h.fetches.length,2,'same anim/once must not hit the canceled pending guard');
 await h.loaded(1);assert.equal(h.env.frontRef.current,1);assert.notEqual(h.b.style.transition,'none');
});

test('legacy configuration changes keep the original playback-effect dependency behavior',async()=>{
 const h=harness(false),render=playbackRenderer(h);render();await h.loaded(0);
 h.env.cfg.fixedEnabled=false;h.env.petWeights.idle=20;render();assert.equal(h.fetches.length,1);
});

function rebound(h,handleEnded){
 h.env.handleEnded=handleEnded;
 return Function(...Object.keys(h.env),switchSource+';return switchTo;')(...Object.values(h.env));
}
async function committedAction(h,switchTo,name='waving'){
 switchTo(name,true);await h.loaded(0);h.b.present();return h.b.onended;
}
test('failed replacement restores future ended authority to the retained front',async()=>{
 const h=harness();let ended=0;const switchTo=rebound(h,()=>ended++);
 const oldEnded=await committedAction(h,switchTo);switchTo('jumping',true);
 h.fetches[1].resolve();await flush();h.a.error=new Error('decode failed');h.a.emit('error');await flush();
 assert.equal(h.env.pendingRef.current,null);oldEnded({currentTarget:h.b});assert.equal(ended,1);
 oldEnded({currentTarget:h.b});assert.equal(ended,1,'late duplicate ended must not repeat progression');
});
test('a retained front that ended while loading resumes once after replacement failure',async()=>{
 const h=harness();let ended=0;const switchTo=rebound(h,()=>ended++);
 const oldEnded=await committedAction(h,switchTo);switchTo('jumping',true);
 oldEnded({currentTarget:h.b});assert.equal(ended,0);
 h.fetches[1].resolve();await flush();h.a.error=new Error('decode failed');h.a.emit('error');await flush();
 assert.equal(ended,1,'suppressed ended must resume when loading fails');
 oldEnded({currentTarget:h.b});assert.equal(ended,1);
});
test('retained ended classifies the committed animation even after requested-state renders',async()=>{
 const h=harness(),selected=[];h.env.petAnims={idle:['idle'],turn:[],drag:[],clicks:['waving'],events:{}};
 const actualSource=stripTypeScriptTypes(source.slice(source.indexOf('    const handleEnded ='),source.indexOf('    // ---- 移动系统 ----')));
 const env={...h.env,dragRef:{current:{active:false}},facing:'left',setFacing(){},
  resumeWorkStatusAnim:()=>false,pick:pool=>pool[0],setAnim:anim=>selected.push(anim),setOnce(){},setSeq(){},pickNext(){throw new Error('incorrect random classification');}};
 delete env.handleEnded;
 const handleEnded=Function(...Object.keys(env),actualSource+';return handleEnded;')(...Object.values(env));
 const switchTo=rebound(h,handleEnded),oldEnded=await committedAction(h,switchTo);switchTo('jumping',true);
 h.fetches[1].resolve();await flush();h.a.error=new Error('decode failed');h.a.emit('error');await flush();
 h.env.animRef.current='jumping'; // A later React render still contains the failed requested state.
 oldEnded({currentTarget:h.b});assert.deepEqual(selected,['idle']);
});
test('actual unmount cleanup stops committed native idle and clears ended handlers',async()=>{
 const h=harness();h.switchTo('idle',true);await h.loaded(0);h.b.present();assert.equal(h.b.paused,false);
 h.a.onended=()=>{};
 const start=source.indexOf('    useEffect(() => {\n      mountedRef.current = true;');
 const effect=stripTypeScriptTypes(source.slice(start,source.indexOf('    }, []);',start)+'    }, []);'.length));
 let cleanup;const env={...h.env,stopMove(){},stopDragFollow(){},stopThrow(){},stopSquash(){},useEffect:fn=>{cleanup=fn();}};
 Function(...Object.keys(env),effect)(...Object.values(env));cleanup();
 assert.equal(h.a.paused,true);assert.equal(h.b.paused,true);assert.equal(h.a.onended,null);assert.equal(h.b.onended,null);
 assert.equal(h.env.activeVideoRef.current,null);
});

test('work state returning idle retains managed ended deferral and failure recovery',async()=>{
 const h=harness();let ended=0;const switchTo=rebound(h,()=>ended++);
 h.env.cfg.workStatusEnabled=true;h.env.petAnims.events={workStatus:['working']};
 h.env.workStatusRef.current={state:'working'};
 switchTo('working',false);await h.loaded(0);h.b.present();assert.equal(h.b.loop,true);
 switchTo('waving',true);h.env.animRef.current='waving';h.env.workStatusRef.current=null;
 const start=source.indexOf('    useEffect(() => {\n      if (!cfg.workStatusEnabled)');
 const workEffect=stripTypeScriptTypes(source.slice(start,source.indexOf('    }, [workStatusTick]);',start)+'    }, [workStatusTick]);'.length));
 const env={...h.env,workStatusTick:2,prevWorkTickRef:{current:1},prevWorkStateRef:{current:'working'},workStatus:null,
  poolIncludes:(pool,anim)=>pool.includes(anim),workBubbleTimerRef:{current:null},setWorkText(){},setWorkBubbleOn(){},useEffect:fn=>fn()};
 Function(...Object.keys(env),workEffect)(...Object.values(env));
 assert.equal(h.b.loop,false,'null state must stop the actual committed work loop');
 h.b.onended({currentTarget:h.b});assert.equal(ended,0,'newer pending action owns progression');
 h.fetches[1].resolve();await flush();h.a.error=new Error('decode failed');h.a.emit('error');await flush();
 assert.equal(ended,1,'failed replacement resumes the stopped work clip once');
});
