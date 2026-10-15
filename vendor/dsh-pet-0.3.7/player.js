// Derived from dsh-pet 0.3.7 PetSprite and this repository's reviewed presentation patch.
// Copyright (c) PC2005-cloud. MIT; see LICENSE. Scope: compositor-ready video swap only.
export class OwnedVideoPlayer {
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
