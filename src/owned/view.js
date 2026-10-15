import {OwnedVideoPlayer} from '../../vendor/dsh-pet-0.3.7/player.js';
import {createPetFeedback} from '../../compat/dsh-pet-feedback/feedback-dom.mjs';
export function createOwnedView(container,view,{assetURL,onDrag=()=>{},onInteractive=()=>{},desktop=false}={}) {
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
 return {update,destroy(){disposed=true;ac.abort();feedback.destroy();player.dispose();stage.remove();}};
}
