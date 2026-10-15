// Derived loader/lifecycle from dsh-pet 0.3.7 PetSprite. Copyright (c) PC2005-cloud; MIT, see LICENSE.
// Company change: one visible Canvas2D surface. Native pixel continuity still requires verification.
function requestFrame(win,video,callback){
 if(typeof video.requestVideoFrameCallback==='function'){const id=video.requestVideoFrameCallback(callback);return ()=>video.cancelVideoFrameCallback?.(id);}
 const id=win.requestAnimationFrame(callback);return ()=>win.cancelAnimationFrame(id);
}
export class OwnedVideoPlayer {
 constructor({videoA,videoB,surface,pet,assetBase,idle}){
  const output=surface?.getContext?.('2d',{alpha:true});
  if(!output)throw Error('Canvas2D is required for the companion frame surface');
  const buffer=surface.ownerDocument.createElement('canvas'),bufferContext=buffer.getContext('2d',{alpha:true});
  if(!bufferContext)throw Error('Canvas2D frame buffer is unavailable');
  Object.assign(this,{videoA,videoB,surface,output,buffer,bufferContext,pet,assetBase,idle,win:surface.ownerDocument.defaultView,front:0,gen:0,pending:null,presentationFront:null,hasFrame:false});
  for(const video of [videoA,videoB])video.style.setProperty('opacity','0','important');
 }
 switchTo(name,once=true){this.switchPresentationVideo(name,once);}
 playIdle(){this.switchTo(this.idle,false);}
 handleEnded(){this.playIdle();}
 copyFrame(video){
  if(this.presentationVideoDisposed||video.readyState<2||!video.videoWidth||!video.videoHeight)return false;
  const width=this.hasFrame?this.surface.width:video.videoWidth,height=this.hasFrame?this.surface.height:video.videoHeight;
  try{
   if(this.buffer.width!==width)this.buffer.width=width;if(this.buffer.height!==height)this.buffer.height=height;
   const scale=Math.min(width/video.videoWidth,height/video.videoHeight),w=video.videoWidth*scale,h=video.videoHeight*scale;
   // Clear only the detached buffer. A failed decode/draw leaves the visible bitmap untouched.
   this.bufferContext.clearRect(0,0,width,height);
   this.bufferContext.drawImage(video,(width-w)/2,(height-h)/2,w,h);
   if(!this.hasFrame){this.surface.width=width;this.surface.height=height;}
   this.output.globalCompositeOperation='copy';
   this.output.drawImage(this.buffer,0,0);
   this.hasFrame=true;return true;
  }catch{return false;}
 }
 startPainter(state){
  const valid=()=>!this.presentationVideoDisposed&&this.presentationFront===state&&state.element.currentSrc===state.source;
  const tick=()=>{state.cancelFrame=null;if(!valid())return;this.copyFrame(state.element);schedule();};
  const schedule=()=>{if(valid())state.cancelFrame=requestFrame(this.win,state.element,tick);};
  state.stop=()=>{state.cancelFrame?.();state.cancelFrame=null;};schedule();
 }
 dispose(){
  if(this.presentationVideoDisposed)return;this.presentationVideoDisposed=true;++this.gen;
  this.presentationVideoCleanup?.();this.presentationFront?.stop();this.pending=null;this.presentationFront=null;
  for(const video of [this.videoA,this.videoB]){video.onended=null;video.classList.remove('is-front');video.pause();video.removeAttribute('src');video.load();}
  this.surface.width=this.surface.height=this.buffer.width=this.buffer.height=0;this.hasFrame=false;
 }
 switchPresentationVideo(next,nextOnce){
  if(!next||this.presentationVideoDisposed)return;
  if(this.pending?.anim===next&&this.pending.once===nextOnce)return;
  this.presentationVideoCleanup?.();
  const gen=++this.gen,targetIndex=this.front===0?1:0,el=targetIndex===0?this.videoA:this.videoB;
  this.pending={anim:next,once:nextOnce,gen};
  let cancelFrame=null,timer=null,cleaned=false,ready=false,committed=false,expectedSource='';
  const current=()=>!cleaned&&!this.presentationVideoDisposed&&this.gen===gen&&this.pending?.gen===gen;
  const cleanup=()=>{
   if(cleaned)return;cleaned=true;el.removeEventListener('loadeddata',onReady);el.removeEventListener('error',onError);
   if(timer!==null)this.win.clearTimeout(timer);cancelFrame?.();cancelFrame=null;
   if(!committed)el.pause();if(this.presentationVideoCleanup===cleanup)this.presentationVideoCleanup=null;
  };
  const fail=reason=>{
   if(!current())return;cleanup();this.pending=null;
   console.warn('[pet-company] 素材加载失败 pet='+this.pet.id+' anim='+next+'：'+reason+'（保留当前画面）');
   const retained=this.presentationFront;
   if(retained){this.anim=retained.anim;this.once=retained.once;if(retained.once&&!retained.handled&&(retained.ended||retained.element.ended))retained.finish();}
  };
  const commit=()=>{
   const old=this.presentationFront;old?.stop();
   const state={element:el,source:expectedSource,index:targetIndex,anim:next,once:nextOnce,ended:false,handled:false,cancelFrame:null};
   this.presentationFront=state;this.front=targetIndex;this.pending=null;this.anim=next;this.once=nextOnce;committed=true;
   for(const video of [this.videoA,this.videoB]){if(video===el)video.classList.add('is-front');else{video.classList.remove('is-front');video.onended=null;video.pause();}}
   state.finish=()=>{
    if(this.presentationVideoDisposed||this.presentationFront!==state||state.handled)return;
    state.ended=true;if(this.pending)return;state.handled=true;this.anim=state.anim;this.once=state.once;this.handleEnded();
   };
   el.onended=nextOnce?state.finish:null;cleanup();this.startPainter(state);
   if(nextOnce&&el.ended)state.finish();
  };
  const attempt=()=>{
   cancelFrame=null;if(!current()||el.currentSrc!==expectedSource)return;
   if(this.copyFrame(el))commit();else cancelFrame=requestFrame(this.win,el,attempt);
  };
  const onError=()=>fail('video error');
  const onReady=()=>{
   if(!current()||ready||el.readyState<2||el.currentSrc!==expectedSource)return;
   ready=true;el.removeEventListener('loadeddata',onReady);cancelFrame=requestFrame(this.win,el,attempt);
   el.play()?.catch(()=>fail('video play rejected'));
  };
  this.presentationVideoCleanup=cleanup;el.onended=null;el.loop=!nextOnce;el.muted=true;el.autoplay=false;el.playsInline=true;
  el.addEventListener('loadeddata',onReady);el.addEventListener('error',onError);timer=this.win.setTimeout(()=>fail('10s 超时'),10000);
  el.src=this.assetBase+encodeURIComponent(next)+'.webm';expectedSource=el.src;el.load();
 }
}
