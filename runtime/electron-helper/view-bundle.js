// Generated; source and upstream MIT license in vendor/dsh-pet-0.3.7.
(function(){
// Generated from feedback.css.
const FEEDBACK_CSS=".dsh-feedback-cloud{--fb-fill:#fffaff;--fb-line:#d7c9e7;--fb-ink:#62506f;--fb-shadow:#51405f20;position:fixed;box-sizing:border-box;padding:14px 2px 14px;z-index:2147482900;width:max-content;opacity:0;visibility:hidden;pointer-events:none;transform:translateY(4px) scale(.985);transform-origin:var(--fb-tail-x,50%) bottom;transition:opacity 110ms ease-out,transform 160ms cubic-bezier(.22,1,.36,1),visibility 0s 110ms;font:14px/1.6 \"PingFang SC\",\"Microsoft YaHei\",system-ui,sans-serif;color:var(--fb-ink)}\n.dsh-feedback-cloud[data-theme=orange]{--fb-fill:#fff8ed;--fb-line:#e8c99f;--fb-ink:#79533c;--fb-shadow:#80502e1c}\n.dsh-feedback-cloud[data-theme=tide]{--fb-fill:#f3fbff;--fb-line:#b0d3e2;--fb-ink:#37657a;--fb-shadow:#285f751c}\n.dsh-feedback-cloud[data-open=true]{opacity:1;visibility:visible;transform:translateY(0) scale(1);transition-delay:0s}\n.dsh-feedback-cloud[data-placement=below]{transform-origin:var(--fb-tail-x,50%) top}\n.dsh-feedback-cloud *{box-sizing:border-box}\n.dsh-feedback-cloud .fb-body{position:relative;min-height:52px;padding:15px 38px 15px 18px;border:1.5px solid var(--fb-line);border-radius:23px 26px 22px 25px;background:var(--fb-fill);box-shadow:0 4px 14px var(--fb-shadow)}\n.dsh-feedback-cloud .fb-lobes{position:absolute;inset:0;pointer-events:none}\n.dsh-feedback-cloud .fb-lobes i{position:absolute;top:-12px;left:18%;width:35px;height:16px;border:1.5px solid var(--fb-line);border-bottom:0;border-radius:50% 50% 0 0 / 100% 100% 0 0;background:var(--fb-fill)}\n.dsh-feedback-cloud .fb-lobes i:nth-child(2){left:40%;top:-13px;width:48px;height:17px}\n.dsh-feedback-cloud .fb-lobes i:nth-child(3){left:66%;top:-9px;width:29px;height:13px}\n.dsh-feedback-cloud .fb-text{position:relative;white-space:normal;overflow-wrap:anywhere;overflow:auto;max-height:var(--fb-text-height,160px);overscroll-behavior:contain;scrollbar-width:thin}\n.dsh-feedback-cloud .fb-close{position:absolute;right:7px;top:8px;width:26px;height:26px;border:0;border-radius:50%;background:transparent;color:var(--fb-ink);font:20px/1 system-ui,sans-serif;cursor:pointer;pointer-events:none;opacity:.65;padding:0}\n.dsh-feedback-cloud[data-open=true] .fb-close{pointer-events:auto}\n.dsh-feedback-cloud[data-open=true][data-scrollable=true] .fb-text{pointer-events:auto}\n.dsh-feedback-cloud .fb-close:hover{background:color-mix(in srgb,var(--fb-line) 28%,transparent);opacity:1}\n.dsh-feedback-cloud .fb-close:focus-visible{outline:2px solid var(--fb-ink);outline-offset:1px}\n.dsh-feedback-cloud .fb-tail{position:absolute;width:12px;height:10px;left:calc(var(--fb-tail-x,50%) - 6px);bottom:8px;background:var(--fb-fill);border:1.5px solid var(--fb-line);border-radius:50%;pointer-events:none}\n.dsh-feedback-cloud .fb-tail:after{content:\"\";position:absolute;width:5px;height:5px;left:4px;top:11px;border:1px solid var(--fb-line);border-radius:50%;background:var(--fb-fill)}\n.dsh-feedback-cloud[data-placement=below] .fb-tail{bottom:auto;top:8px}\n.dsh-feedback-cloud[data-placement=below] .fb-tail:after{top:auto;bottom:11px}\n@media(prefers-reduced-motion:reduce){.dsh-feedback-cloud{transform:none;transition:opacity 100ms linear,visibility 0s 100ms}.dsh-feedback-cloud[data-open=true]{transform:none;transition-delay:0s}}\n\n.dsh-feedback-cloud[data-reduced=true]{transform:none;transition:opacity 100ms linear,visibility 0s 100ms}.dsh-feedback-cloud[data-reduced=true][data-open=true]{transform:none;transition-delay:0s}\n";

/** Renderer-independent feedback state and placement. All geometry uses one CSS/DIP coordinate system. */
const clamp=(n,min,max)=>Math.min(Math.max(n,min),max);
const finite=(value,fallback)=>Number.isFinite(Number(value))?Number(value):fallback;
function normalizeFeedback(raw,options={}){
 if(!raw||typeof raw!=='object')return null;
 const eventId=String(raw.eventId??'').trim();
 if(!eventId||Array.from(eventId).length>200)return null;
 const limit=Math.trunc(clamp(finite(options.maxCharacters,120),1,500));
 let text=String(raw.text??'').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/gu,'').replace(/\s+/gu,' ').trim();
 const chars=Array.from(text);if(chars.length>limit)text=chars.slice(0,Math.max(0,limit-1)).join('')+'…';
 if(!text)return null;
 return {eventId,text,fallback:raw.fallback===true,trigger:raw.trigger==='click'?'click':'care',via:raw.via==='keyboard'?'keyboard':'pointer',durationMs:clamp(finite(raw.durationMs,finite(options.durationMs,8000)),250,60000)};
}
function createFeedbackState(options={}){
 return {phase:'hidden',eventId:null,text:'',fallback:false,expiresAt:0,seenIds:[],documentHidden:false,suppressClickUntil:0,options:{durationMs:options.durationMs,maxCharacters:options.maxCharacters}};
}
const clear=(state,phase='hidden')=>({...state,phase,eventId:null,text:'',fallback:false,expiresAt:0});
function reduceFeedback(state,action,now=0){
 if(state.phase==='destroyed')return state;
 if(action.type==='destroy')return {...clear(state,'destroyed'),seenIds:[]};
 if(action.type==='dragstart')return clear(state,'dragging');
 if(action.type==='dragend')return {...clear(state),suppressClickUntil:now+300};
 if(action.type==='background')return {...(action.hidden?clear(state):state),documentHidden:Boolean(action.hidden)};
 if(action.type==='close')return state.phase==='visible'?clear(state):state;
 if(action.type==='expire')return state.phase==='visible'&&now>=state.expiresAt?clear(state):state;
 if(action.type!=='show')return state;
 const event=normalizeFeedback(action.event,state.options);
 if(!event)return state;
 if(state.seenIds.includes(event.eventId)){
  if(state.phase==='visible'&&state.eventId===event.eventId&&now<state.expiresAt&&state.fallback&&!event.fallback)return {...state,text:event.text,fallback:false};
  return state;
 }
 const seenIds=[...state.seenIds,event.eventId].slice(-64);
 if(state.documentHidden||state.phase==='dragging'||(event.trigger==='click'&&now<state.suppressClickUntil))return {...state,seenIds};
 return {...state,phase:'visible',eventId:event.eventId,text:event.text,fallback:event.fallback,expiresAt:now+event.durationMs,seenIds};
}
function rect(value){
 if(!value)return null;
 const x=Number(value.x??value.left),y=Number(value.y??value.top),width=Number(value.width),height=Number(value.height);
 return [x,y,width,height].every(Number.isFinite)&&width>0&&height>0?{x,y,width,height}:null;
}
function placeCloud({anchor,bubble,viewport,padding=12,gap=12}={}){
 anchor=rect(anchor);viewport=rect(viewport);
 if(!anchor||!viewport||!bubble||![bubble.width,bubble.height].every(v=>Number.isFinite(v)&&v>0))return null;
 padding=clamp(finite(padding,12),0,Math.min(viewport.width,viewport.height)/4);
 gap=Math.max(0,finite(gap,12));
 const maxWidth=viewport.width-2*padding,maxHeight=viewport.height-2*padding;
 const width=Math.min(bubble.width,maxWidth),height=Math.min(bubble.height,maxHeight);
 const minX=viewport.x+padding,minY=viewport.y+padding,maxX=viewport.x+viewport.width-padding,maxY=viewport.y+viewport.height-padding;
 const above=anchor.y-gap-height,below=anchor.y+anchor.height+gap;
 const placement=above>=minY?'above':below+height<=maxY?'below':(anchor.y-minY>=maxY-(anchor.y+anchor.height)?'above':'below');
 const x=clamp(anchor.x+anchor.width/2-width/2,minX,maxX-width);
 const y=clamp(placement==='above'?above:below,minY,maxY-height);
 const tailPadding=Math.min(18,width/2);
 const tailX=clamp(anchor.x+anchor.width/2-x,tailPadding,width-tailPadding);
 return {x,y,width,height,placement,tailX,maxWidth,maxHeight};
}
function motionKeyframes(reduced=false){
 return reduced?[]:[{scale:1,offset:0},{scale:.97,offset:.32},{scale:1.01,offset:.72},{scale:1,offset:1}];
}


/** Needs a DEDICATED actor wrapper; keep upstream mirror/video/hitbox transforms inside it.
 * getViewport returns a rectangle in the same CSS/DIP coordinate system as getBoundingClientRect.
 * Desktop adapters must use helper-window ∩ current work-area and existing input-region IPC.
 * This module never calls focus, captures keyboard input globally, opens windows or speaks.
 */
function createPetFeedback({actor,anchor=actor,theme='silver',pop=true,cloud=true,portal,durationMs=8000,maxCharacters=120,maxWidth=280,padding=12,getViewport,onRegionsChange=()=>{}}={}){
 if(!actor?.ownerDocument||!anchor?.getBoundingClientRect)throw new TypeError('An actor wrapper and measurable anchor are required');
 const doc=actor.ownerDocument,win=doc.defaultView;
 if(!win)throw new TypeError('The actor needs a renderer window');
 if(!doc.querySelector('style[data-dsh-feedback-css]')){const style=doc.createElement('style');style.dataset.dshFeedbackCss='';style.textContent=FEEDBACK_CSS;doc.head.append(style);}
 const bubble=doc.createElement('div');bubble.className='dsh-feedback-cloud';bubble.dataset.open='false';bubble.setAttribute('aria-hidden','true');
 const body=doc.createElement('div');body.className='fb-body';
 const lobes=doc.createElement('span');lobes.className='fb-lobes';lobes.setAttribute('aria-hidden','true');for(let i=0;i<3;i++)lobes.append(doc.createElement('i'));
 const text=doc.createElement('div');text.className='fb-text';text.setAttribute('role','status');text.setAttribute('aria-live','polite');text.setAttribute('aria-atomic','true');
 const close=doc.createElement('button');close.className='fb-close';close.type='button';close.tabIndex=-1;close.textContent='×';close.setAttribute('aria-label','关闭提醒');
 const tail=doc.createElement('span');tail.className='fb-tail';tail.setAttribute('aria-hidden','true');body.append(lobes,text,close);bubble.append(body,tail);(portal||doc.body).append(bubble);
 let state=createFeedbackState({durationMs,maxCharacters}),timer=null,frame=null,motion=null,disposed=false,lastRect='',lastViewport='',measured=null,lastRegions='';
 let reducedOverride=false,popEnabled=pop!==false,cloudEnabled=cloud!==false,layoutAvailable=true;
 const reduced=win.matchMedia('(prefers-reduced-motion: reduce)');
 const now=()=>win.performance.now();
 const active=()=>state.phase==='visible';
 const visible=()=>active()&&cloudEnabled&&layoutAvailable;
 const themeName=value=>['silver','orange','tide'].includes(value)?value:'silver';
 bubble.dataset.theme=themeName(theme);
 const viewport=()=>{if(getViewport)return getViewport();const v=win.visualViewport;return {x:v?.offsetLeft||0,y:v?.offsetTop||0,width:v?.width||win.innerWidth,height:v?.height||win.innerHeight};};
 const bounds=element=>{const r=element.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
 function interactiveRects(){if(!visible())return [];const regions=[bounds(close)];if(bubble.dataset.scrollable==='true')regions.push(bounds(text));return regions;}
 function notifyRegions(){const regions=interactiveRects();const key=JSON.stringify([visible(),regions]);if(key!==lastRegions){lastRegions=key;onRegionsChange(regions,visible());}}
 function cancelMotion(){if(motion){motion.cancel();motion=null;}}
 function animate(event){
  if(!popEnabled||reduced.matches||reducedOverride||event?.via==='keyboard'||typeof actor.animate!=='function'){cancelMotion();return;}
  // A dedicated wrapper owns scale. Cancel the old effect; never concatenate transforms or animations.
  let start=1;try{const value=win.getComputedStyle(actor).transform;if(value&&value!=='none')start=Math.hypot(...value.match(/matrix\(([^)]+)\)/)?.[1].split(',').slice(0,2).map(Number));}catch{}
  if(!Number.isFinite(start))start=1;
  cancelMotion();
  const keyframes=motionKeyframes(false).map((f,i)=>({transform:`scale(${i===0?start:f.scale})`,offset:f.offset}));
  motion=actor.animate(keyframes,{duration:220,easing:'cubic-bezier(.22,1,.36,1)'});
  const current=motion;current.onfinish=()=>{if(motion===current)motion=null;};
 }
 function measure(){
  if(disposed||!visible())return;
  const v=viewport();if(!v||!Number.isFinite(v.width)||!Number.isFinite(v.height)||v.width<=0||v.height<=0)return;
  const key=[v.x,v.y,v.width,v.height].join(',');
  if(key!==lastViewport||!measured){
   const availableWidth=Math.max(1,v.width-2*Math.min(padding,v.width/4));
   const availableHeight=Math.max(1,v.height-2*Math.min(padding,v.height/4));
   bubble.style.maxWidth=Math.min(maxWidth,availableWidth)+'px';bubble.style.minWidth=Math.min(140,availableWidth)+'px';
   bubble.style.setProperty('--fb-text-height',Math.max(20,availableHeight-62)+'px');
   measured={width:bubble.offsetWidth,height:bubble.offsetHeight};lastViewport=key;
  }
  const result=placeCloud({anchor:bounds(anchor),bubble:measured,viewport:v,padding});if(!result)return;
  const rectKey=[result.x,result.y,result.tailX,result.placement].join(',');
  if(rectKey!==lastRect){bubble.style.left=result.x+'px';bubble.style.top=result.y+'px';bubble.style.setProperty('--fb-tail-x',result.tailX+'px');bubble.dataset.placement=result.placement;lastRect=rectKey;}
  bubble.dataset.scrollable=String(text.scrollHeight>text.clientHeight+1);
  notifyRegions();
 }
 function scheduleExpiry(){if(timer!==null)win.clearTimeout(timer);timer=win.setTimeout(()=>{timer=null;if(!apply({type:'expire'})&&active())scheduleExpiry();},Math.max(1,Math.ceil(state.expiresAt-now())));}
 function track(){frame=null;if(disposed||!visible())return;measure();frame=win.requestAnimationFrame(track);}
 function reposition(){const v=viewport();layoutAvailable=Boolean(v&&Number.isFinite(v.width)&&Number.isFinite(v.height)&&v.width>=96&&v.height>=112);syncVisibility();measured=null;lastViewport='';lastRect='';if(visible()){measure();if(frame===null)frame=win.requestAnimationFrame(track);}else{if(frame!==null){win.cancelAnimationFrame(frame);frame=null;}notifyRegions();}}
 function syncVisibility(){bubble.dataset.open=String(visible());bubble.setAttribute('aria-hidden',String(!visible()));close.tabIndex=visible()?0:-1;}
 function renderBubble(){if(active()&&cloudEnabled)reposition();else{syncVisibility();if(frame!==null){win.cancelAnimationFrame(frame);frame=null;}notifyRegions();}}
 function apply(action,event){
  if(disposed)return false;
  const before=state;state=reduceFeedback(state,action,now());if(state===before)return false;
  if(timer!==null){win.clearTimeout(timer);timer=null;}
  if(active()){
   text.textContent=state.text;renderBubble();scheduleExpiry();
   if(action.type==='show'&&state.eventId!==before.eventId)animate(event);
  }else{
   renderBubble();cancelMotion();
  }
  return true;
 }
 close.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();});
 close.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();apply({type:'close'});});
 close.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();apply({type:'close'});}});
 const onVisibility=()=>apply({type:'background',hidden:doc.hidden});
 const onReduced=()=>{bubble.dataset.reduced=String(reduced.matches||reducedOverride);if(reduced.matches||reducedOverride)cancelMotion();};onReduced();
 const onLayout=()=>reposition();
 doc.addEventListener('visibilitychange',onVisibility);win.addEventListener('resize',onLayout);win.addEventListener('scroll',onLayout,{passive:true,capture:true});
 win.visualViewport?.addEventListener('resize',onLayout);win.visualViewport?.addEventListener('scroll',onLayout);
 reduced.addEventListener?.('change',onReduced);
 let dprQuery=null;
 const onDpr=()=>{dprQuery?.removeEventListener?.('change',onDpr);dprQuery=win.matchMedia(`(resolution: ${win.devicePixelRatio}dppx)`);dprQuery.addEventListener?.('change',onDpr);reposition();};onDpr();
 const observer=typeof win.ResizeObserver==='function'?new win.ResizeObserver(()=>reposition()):null;observer?.observe(body);observer?.observe(anchor);
 doc.fonts?.ready.then(()=>{if(!disposed)reposition();});
 if(doc.hidden)onVisibility();
 return {
  show(event){return apply({type:'show',event},event);},
  close(){return apply({type:'close'});},
  dragStart(){return apply({type:'dragstart'});},
  dragEnd(){return apply({type:'dragend'});},
  reposition,
  getState(){return {...state,seenIds:[...state.seenIds],options:{...state.options}};},
  getInteractiveRects:interactiveRects,
  setTheme(value){bubble.dataset.theme=themeName(value);},
  setReducedMotion(value){reducedOverride=Boolean(value);onReduced();},
  setPresentation(value={}){if(disposed)return;if(value.theme!==undefined)bubble.dataset.theme=themeName(value.theme);if(typeof value.pop==='boolean'){popEnabled=value.pop;if(!popEnabled)cancelMotion();}if(typeof value.cloud==='boolean')cloudEnabled=value.cloud;if(Number.isFinite(value.closeSeconds))state={...state,options:{...state.options,durationMs:Math.min(60000,Math.max(250,value.closeSeconds*1000))}};renderBubble();},
  get element(){return bubble;},
  destroy(){
   if(disposed)return;apply({type:'destroy'});disposed=true;observer?.disconnect();
   doc.removeEventListener('visibilitychange',onVisibility);win.removeEventListener('resize',onLayout);win.removeEventListener('scroll',onLayout,true);
   win.visualViewport?.removeEventListener('resize',onLayout);win.visualViewport?.removeEventListener('scroll',onLayout);
   reduced.removeEventListener?.('change',onReduced);dprQuery?.removeEventListener?.('change',onDpr);bubble.remove();
  },
 };
}

// Derived from dsh-pet 0.3.7 PetSprite and this repository's reviewed presentation patch.
// Copyright (c) PC2005-cloud. MIT; see LICENSE. Scope: compositor-ready video swap only.
class OwnedVideoPlayer {
 constructor({videoA,videoB,pet,assetBase,idle}) {
  Object.assign(this,{videoA,videoB,pet,assetBase,idle,front:0,gen:0,pending:null,facing:'left',presentationFront:null});
 }
 switchTo(name,once=true){this.switchPresentationVideo(name,once);}
 playIdle(){this.switchTo(this.idle,false);}
 handleEnded(){this.playIdle();}
 dispose(){this.presentationVideoDisposed=true;++this.gen;this.presentationVideoCleanup?.();this.pending=null;this.presentationFront=null;for(const v of [this.videoA,this.videoB]){v.onended=null;v.pause();v.removeAttribute('src');v.load();}}
  switchPresentationVideo(next, nextOnce) {
    if (!next || this.presentationVideoDisposed) return;
    if (this.pending?.anim === next && this.pending.once === nextOnce) return;
    if (this.presentationVideoCleanup) this.presentationVideoCleanup();
    const gen = ++this.gen;
    const targetIndex = this.front === 0 ? 1 : 0;
    const el = targetIndex === 0 ? this.videoA : this.videoB;
    if (!el) return;
    for (const video of [this.videoA, this.videoB]) video.style.transition = 'none';
    this.pending = { anim: next, once: nextOnce, gen };
    let frame = null, raf = null, timer = null, cleaned = false, ready = false, committed = false, expectedSource = '';
    const current = () => !cleaned && !this.presentationVideoDisposed && this.gen === gen && this.pending?.gen === gen;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      el.removeEventListener('loadeddata', onReady);
      el.removeEventListener('error', onError);
      if (timer !== null) window.clearTimeout(timer);
      if (frame !== null) el.cancelVideoFrameCallback?.(frame);
      if (raf !== null) window.cancelAnimationFrame(raf);
      if (!committed) el.pause();
      if (this.presentationVideoCleanup === cleanup) this.presentationVideoCleanup = null;
    };
    const fail = (reason) => {
      if (!current()) return;
      cleanup();
      this.pending = null;
      console.warn('[pet-company] 素材加载失败 pet=' + this.pet.id + ' anim=' + next + '：' + reason + '（保留当前画面）');
      const retained = this.presentationFront;
      if (retained) {
        this.anim = retained.anim;
        this.once = retained.once;
        if (retained.once && !retained.handled && (retained.ended || retained.element.ended)) {
          retained.finish();
        }
      }
    };
    const commit = () => {
      frame = null; raf = null;
      if (!current() || el.currentSrc !== expectedSource) return;
      committed = true;
      const old = this.front === 0 ? this.videoA : this.videoB;
      el.classList.add('is-front');
      if (old && old !== el) { old.classList.remove('is-front'); old.onended = null; old.pause(); }
      this.front = targetIndex;
      this.pending = null;
      const frontState = { element: el, index: targetIndex, anim: next, once: nextOnce, ended: false, handled: false };
      this.presentationFront = frontState;
      this.anim = next;
      this.once = nextOnce;
      frontState.finish = () => {
        if (this.presentationVideoDisposed || this.presentationFront !== frontState || this.front !== targetIndex || frontState.handled) return;
        frontState.ended = true;
        if (this.pending) return;
        frontState.handled = true;
        this.anim = frontState.anim;
        this.once = frontState.once;
        this.handleEnded();
      };
      el.onended = nextOnce ? frontState.finish : null;
      cleanup();
      this.pendingSquash = false;
    };
    const onError = () => fail('video error');
    const onReady = () => {
      if (!current() || ready || el.readyState < 2 || el.currentSrc !== expectedSource) return;
      ready = true;
      el.removeEventListener('loadeddata', onReady);
      if (typeof el.requestVideoFrameCallback === 'function') frame = el.requestVideoFrameCallback(commit);
      else raf = window.requestAnimationFrame(() => {
        raf = null;
        if (current()) raf = window.requestAnimationFrame(commit);
      });
      const playback = el.play();
      playback?.catch(() => fail('video play rejected'));
    };
    this.presentationVideoCleanup = cleanup;
    el.onended = null;
    el.loop = !nextOnce;
    el.muted = true;
    el.autoplay = false;
    el.playsInline = true;
    el.style.transform = this.facing === 'right' ? 'scaleX(-1)' : '';
    el.addEventListener('loadeddata', onReady);
    el.addEventListener('error', onError);
    timer = window.setTimeout(() => fail('10s 超时'), 10000);
    el.src = this.assetBase + encodeURIComponent(next) + '.webm';
    expectedSource = el.src;
    el.load();
  }

}

function createOwnedView(container,view,{assetURL,onDrag=()=>{},onInteractive=()=>{},desktop=false}={}) {
 const doc=container.ownerDocument,win=doc.defaultView;
 const stage=doc.createElement('div');stage.className='company-stage';stage.style.cssText='position:relative;width:'+view.pet.size+'px;aspect-ratio:16/9;pointer-events:none';
 const actor=doc.createElement('div');actor.style.cssText='position:absolute;inset:0;transform-origin:50% 80%;pointer-events:none';
 const videoA=doc.createElement('video'),videoB=doc.createElement('video');
 for(const v of [videoA,videoB]){v.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:contain;opacity:0;pointer-events:none';actor.append(v);}
 const style=doc.createElement('style');style.textContent='.company-stage video.is-front{opacity:1!important}.company-hit{position:absolute;left:31.25%;top:13.88%;width:37.5%;height:79.17%;pointer-events:auto;touch-action:none;cursor:grab;background:none;border:0;padding:0}.company-hit:focus-visible{outline:2px solid #76a9b4;outline-offset:2px}';
 const hit=doc.createElement('button');hit.type='button';hit.className='company-hit';hit.setAttribute('aria-label',view.pet.name+'，点击关心');
 stage.append(style,actor,hit);container.append(stage);
 const player=new OwnedVideoPlayer({videoA,videoB,pet:view.pet,assetBase:assetURL(view.pet.id,''),idle:view.animations.idle[0]});
 const presentation=view.pet.presentation;
 let regions=[],drag=null,clicks=0,suppressClick=false,baseline=null,disposed=false;
 const feedback=createPetFeedback({actor,anchor:hit,...presentation,durationMs:presentation.closeSeconds*1000,onRegionsChange:r=>{regions=r;}});
 const ac=new AbortController(),listen=(target,event,fn)=>target.addEventListener(event,fn,{signal:ac.signal});
 listen(hit,'pointerdown',e=>{if(e.button!==0)return;drag={x:e.screenX,y:e.screenY,lastX:e.screenX,lastY:e.screenY,moved:false};hit.setPointerCapture(e.pointerId);});
 listen(hit,'pointermove',e=>{if(!drag)return;if(!drag.moved&&Math.hypot(e.screenX-drag.x,e.screenY-drag.y)>5){drag.moved=true;feedback.dragStart();}if(drag.moved){onDrag(e.screenX-drag.lastX,e.screenY-drag.lastY);drag.lastX=e.screenX;drag.lastY=e.screenY;feedback.reposition();}});
 function endDrag(){const moved=drag?.moved;drag=null;if(moved)feedback.dragEnd();return moved;}
 listen(hit,'pointerup',()=>{suppressClick=Boolean(endDrag());});
 listen(hit,'pointercancel',()=>{endDrag();suppressClick=false;});
 listen(hit,'click',e=>{if(suppressClick){suppressClick=false;return;}const id='click:'+view.pet.id+':'+(++clicks);feedback.show({eventId:id,text:'我在呢～',trigger:'click',via:e.detail===0?'keyboard':'pointer'});player.switchTo(view.animations.clicks[clicks%view.animations.clicks.length],true);});
 function interactive(e){const r=hit.getBoundingClientRect();onInteractive(Boolean(drag)||(e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom)||regions.some(r=>e.clientX>=r.x&&e.clientX<=r.x+r.width&&e.clientY>=r.y&&e.clientY<=r.y+r.height));}
 if(desktop){listen(win,'mousemove',interactive);listen(win,'mouseleave',()=>onInteractive(false));listen(win,'blur',()=>{endDrag();suppressClick=false;onInteractive(false);});}
 function update(state){if(disposed)return;const pet=state.pets?.[view.pet.id];if(!pet)return;if(baseline===null){baseline={say:pet.say?.counter,anim:pet.anim?.counter};return;}
  const say=pet.say,anim=pet.anim;
  if(say&&say.counter!==baseline.say){baseline.say=say.counter;if(say.data?.text){feedback.show({text:say.data.text,eventId:say.data.feedback.eventId,trigger:'care'});player.switchTo(view.animations.events.whisper[0],true);}}
  if(anim&&anim.counter!==baseline.anim){baseline.anim=anim.counter;if(anim.data){feedback.show({text:'我在呢～',eventId:anim.data.feedback.eventId,trigger:'care',fallback:true});player.switchTo(view.animations.events.whisper[0],true);}}
 }
 player.playIdle();
 return {update,consume(state){const pet=state?.pets?.[view.pet.id];if(pet)baseline={say:pet.say?.counter,anim:pet.anim?.counter};},destroy(){disposed=true;ac.abort();feedback.destroy();player.dispose();stage.remove();}};
}

window.CompanyView=Object.freeze({createOwnedView});
})();
