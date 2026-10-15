import {createFeedbackState,reduceFeedback,placeCloud,motionKeyframes} from './feedback-core.mjs';
import {FEEDBACK_CSS} from './feedback-styles.mjs';

/** Needs a DEDICATED actor wrapper; keep upstream mirror/video/hitbox transforms inside it.
 * getViewport returns a rectangle in the same CSS/DIP coordinate system as getBoundingClientRect.
 * Desktop adapters must use helper-window ∩ current work-area and existing input-region IPC.
 * This module never calls focus, captures keyboard input globally, opens windows or speaks.
 */
export function createPetFeedback({actor,anchor=actor,theme='silver',pop=true,cloud=true,portal,durationMs=8000,maxCharacters=120,maxWidth=280,padding=12,getViewport,onRegionsChange=()=>{}}={}){
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
