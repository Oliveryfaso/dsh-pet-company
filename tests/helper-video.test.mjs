import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const file = process.env.DSH_PET_HELPER_SPRITE_SOURCE || new URL('../compat/dsh-pet-0.3.7/source/runtime/electron-helper/sprite.js', import.meta.url);
function fixture(presentation = {}) {
  let nextTimer = 0;
  const timers = new Map(), frames = new Map();
  const context = vm.createContext({ console: { log() {}, warn() {} },
    window: { setTimeout(fn) { const id = ++nextTimer; timers.set(id, fn); return id; }, clearTimeout(id) { timers.delete(id); },
      requestAnimationFrame(fn) { const id = ++nextTimer; frames.set(id, fn); return id; }, cancelAnimationFrame(id) { frames.delete(id); } },
  });
  vm.runInContext(readFileSync(process.env.DSH_PET_HELPER_SHARED_SOURCE || new URL('../compat/dsh-pet-0.3.7/source/runtime/electron-helper/shared-core.js', import.meta.url), 'utf8') + '\nvar S = PetShared;', context);
  vm.runInContext(readFileSync(file, 'utf8') + '\nglobalThis.Sprite = PetSprite;', context);
  vm.runInContext(readFileSync(process.env.DSH_PET_HELPER_EVENTS_SOURCE || new URL('../compat/dsh-pet-0.3.7/source/runtime/electron-helper/events.js', import.meta.url), 'utf8'), context);
  function video(front = false) {
    const events = new Map(), frames = new Map(), classes = new Set(front ? ['is-front'] : []);
    return { style: {}, events, frames, readyState: 0, loads: 0, plays: 0, pauses: 0, nextFrame: 0,
      classList: { add(v) { classes.add(v); }, remove(v) { classes.delete(v); }, contains: v => classes.has(v) },
      load() { this.loads++; this.readyState = 0; },
      play() { this.plays++; return Promise.resolve(); }, pause() { this.pauses++; },
      addEventListener(name, fn) { if (!events.has(name)) events.set(name, new Set()); events.get(name).add(fn); },
      removeEventListener(name, fn) { events.get(name)?.delete(fn); },
      fire(name) { if (name === 'loadeddata') { this.readyState = 2; this.currentSrc = this.src; } for (const fn of [...events.get(name) || []]) fn(); },
      requestVideoFrameCallback(fn) { const id = ++this.nextFrame; frames.set(id, fn); return id; },
      cancelVideoFrameCallback(id) { frames.delete(id); },
      present() { const calls = [...frames.values()]; frames.clear(); calls.forEach(fn => fn(0, {})); },
    };
  }
  const pet = Object.assign(Object.create(context.Sprite.prototype), { presentation, pet: { id: 'test', fixedEnabled: true },
    animations: { idle: ['idle'], turn: [], drag: [], clicks: ['click'], categories: [], moves: { actions: [] }, events: {} },
    weights: { idle: 100, turn: 0, move: 0 }, front: 0, gen: 0, pending: null, facing: 'left',
    assetBase: '/thumb/test/', videoA: video(true), videoB: video(), anim: 'idle', once: true,
    pendingSquash: false, pendingMove: null, stopMove() {}, dragState: { active: false },
    ac: { abort() {} }, inputRegionMutation: { disconnect() {} }, inputRegionResize: { disconnect() {} }, inputRegionElements: new Set(),
    bubbleTimer: null, whisperTimer: null, workTimer: null, closeMenu() {}, stopThrow() {}, stopDragFollow() {}, stopSquash() {},
    el: { remove() {} },
  });
  return { pet, timers, frames };
}
test('opt-in fixed single idle uses native loop instead of end/load/swap chain', () => {
  const { pet } = fixture(); pet.playIdle();
  assert.equal(pet.videoB.loop, true); assert.equal(pet.once, false);
  pet.videoB.fire('loadeddata'); pet.videoB.present();
  assert.equal(pet.videoB.onended, null); assert.equal(pet.videoB.loads, 1);
});
test('non-opt-in pet retains its original once and immediate loadeddata behavior', () => {
  const { pet } = fixture(null); pet.playIdle(); assert.equal(pet.videoB.loop, false);
  pet.videoB.fire('loadeddata'); assert.equal(pet.front, 1); assert.equal(typeof pet.videoB.onended, 'function');
});
test('idle weight below 100 preserves random action scheduling', () => {
  const { pet } = fixture(); pet.weights.idle = 90; pet.playIdle(); assert.equal(pet.videoB.loop, false);
});
test('opt-in retains old frame until incoming compositor frame then swaps without opacity fade', () => {
  const { pet } = fixture(); pet.switchTo('care', true); pet.videoB.fire('loadeddata');
  assert.equal(pet.front, 0); assert.equal(pet.videoA.pauses, 0); assert.equal(pet.videoA.classList.contains('is-front'), true);
  pet.videoB.present();
  assert.equal(pet.front, 1); assert.equal(pet.videoA.classList.contains('is-front'), false);
  assert.equal(pet.videoB.classList.contains('is-front'), true);
  assert.equal(pet.videoA.style.transition, 'none'); assert.equal(pet.videoB.style.transition, 'none');
});
test('superseded loadeddata and compositor callbacks cannot commit', () => {
  const { pet } = fixture(); pet.switchTo('click', true);
  const staleReady = [...pet.videoB.events.get('loadeddata')][0];
  pet.videoB.fire('loadeddata'); const staleFrame = [...pet.videoB.frames.values()][0];
  pet.switchTo('care', true);
  assert.equal(pet.videoB.frames.size, 0); staleReady(); staleFrame(0, {});
  assert.equal(pet.front, 0); assert.equal(pet.pending.anim, 'care');
  pet.videoB.fire('loadeddata'); pet.videoB.present(); assert.equal(pet.front, 1); assert.equal(pet.pending, null);
});
test('timeout detaches all callbacks and late readiness cannot replace retained old frame', () => {
  const { pet, timers } = fixture(); pet.switchTo('care', true);
  const stale = [...pet.videoB.events.get('loadeddata')][0];
  [...timers.values()][0]();
  assert.equal(pet.pending, null); assert.equal(pet.videoB.events.get('loadeddata').size, 0);
  stale(); pet.videoB.fire('loadeddata'); pet.videoB.present();
  assert.equal(pet.front, 0); assert.equal(pet.videoA.pauses, 0);
});
test('dispose cancels timers/listeners/frame callbacks and ignores retained callbacks', () => {
  const { pet, timers } = fixture(); pet.switchTo('care', true); pet.videoB.fire('loadeddata');
  const stale = [...pet.videoB.frames.values()][0]; assert.equal(typeof stale, 'function');
  pet.dispose(); stale(0, {});
  assert.equal(timers.size, 0); assert.equal(pet.videoB.frames.size, 0); assert.equal(pet.pending, null); assert.equal(pet.front, 0);
});
test('incoming decode error clears pending while retaining the last front frame', () => {
  const { pet, timers } = fixture(); pet.switchTo('care', true); pet.videoB.fire('error');
  assert.equal(pet.pending, null); assert.equal(timers.size, 0); assert.equal(pet.front, 0);
  assert.equal(pet.videoA.classList.contains('is-front'), true); assert.equal(pet.videoA.pauses, 0);
  assert.equal(pet.videoB.events.get('loadeddata').size, 0);
});
test('one shot care ends into native idle without changing event playback semantics', () => {
  const { pet } = fixture(); pet.animations.events = { whisper: ['care'] };
  pet.playOnce('care'); assert.equal(pet.videoB.loop, false);
  pet.videoB.fire('loadeddata'); pet.videoB.present();
  pet.videoB.onended(); assert.equal(pet.videoA.loop, true); assert.equal(pet.anim, 'idle');
  pet.videoA.fire('loadeddata'); pet.videoA.present(); assert.equal(pet.videoA.onended, null);
});
test('a slow old frame cannot commit after its slot is assigned a newer animation', () => {
  const { pet } = fixture(); pet.switchTo('click', true);
  const oldReady = [...pet.videoB.events.get('loadeddata')][0];
  pet.switchTo('care', true); oldReady();
  assert.equal(pet.videoB.frames.size, 0); assert.equal(pet.pending.anim, 'care');
  pet.videoB.fire('loadeddata'); pet.videoB.fire('loadeddata');
  assert.equal(pet.videoB.frames.size, 1); pet.videoB.present(); assert.equal(pet.front, 1);
});
test('queued ready event for a superseded source is ignored even on the current slot', () => {
  const { pet } = fixture(); pet.switchTo('click', true); const oldSrc = pet.videoB.src;
  pet.switchTo('care', true); pet.videoB.currentSrc = oldSrc; pet.videoB.readyState = 2;
  [...pet.videoB.events.get('loadeddata')][0]();
  assert.equal(pet.videoB.frames.size, 0); assert.equal(pet.front, 0); assert.equal(pet.pending.anim, 'care');
  pet.videoB.fire('loadeddata'); pet.videoB.present(); assert.equal(pet.front, 1);
});
test('play rejection after loadeddata cancels the incoming frame and keeps the old front', async () => {
  const { pet, timers } = fixture(); pet.videoB.play = () => Promise.reject(new Error('decoder refused'));
  pet.switchTo('care', true); pet.videoB.fire('loadeddata');
  await Promise.resolve();
  assert.equal(pet.pending, null); assert.equal(pet.videoB.frames.size, 0); assert.equal(timers.size, 0);
  assert.equal(pet.front, 0); assert.equal(pet.videoA.pauses, 0);
});
test('missing video frame API fallback retains front for two animation frames', () => {
  const { pet, frames } = fixture(); pet.videoB.requestVideoFrameCallback = undefined;
  pet.switchTo('care', true); pet.videoB.fire('loadeddata'); assert.equal(pet.front, 0);
  for (const [id, fn] of [...frames]) { frames.delete(id); fn(); } assert.equal(pet.front, 0);
  for (const [id, fn] of [...frames]) { frames.delete(id); fn(); } assert.equal(pet.front, 1);
});
test('an old one-shot ended during the next load cannot replace that pending command', () => {
  const { pet } = fixture(); pet.playOnce('care'); pet.videoB.fire('loadeddata'); pet.videoB.present();
  const oldEnded = pet.videoB.onended; pet.playOnce('click'); oldEnded();
  assert.equal(pet.pending.anim, 'click'); assert.equal(pet.front, 1);
});
test('an active work-status candidate named idle retains one-shot progression', () => {
  const { pet } = fixture(); pet.pet.workStatusEnabled = true; pet.workState = 'working';
  pet.animations.events = { workStatus: [['idle', 'care']] };
  pet.playOnce('idle'); assert.equal(pet.videoB.loop, false); assert.equal(pet.once, true);
});
test('retained front can finish after a newer request fails', () => {
  const { pet } = fixture(); pet.playOnce('care'); pet.videoB.fire('loadeddata'); pet.videoB.present();
  const oldEnded = pet.videoB.onended; let ended = 0; pet.handleEnded = () => { ended++; };
  pet.playOnce('click'); pet.videoA.fire('error'); assert.equal(ended, 0);
  oldEnded(); assert.equal(ended, 1); assert.equal(pet.anim, 'care');
});
test('retained front that ended during a failed request resumes once after failure', () => {
  const { pet } = fixture(); pet.playOnce('care'); pet.videoB.fire('loadeddata'); pet.videoB.present();
  const oldEnded = pet.videoB.onended; let ended = 0; pet.handleEnded = () => { ended++; };
  pet.playOnce('click'); oldEnded(); assert.equal(ended, 0);
  pet.videoA.fire('error'); assert.equal(ended, 1); assert.equal(pet.anim, 'care');
  oldEnded(); assert.equal(ended, 1, 'late duplicate old ended must not advance twice');
});
test('work to idle keeps committed ended ownership while a different action is pending', () => {
  const { pet } = fixture(); pet.pet.workStatusEnabled = true;
  pet.animations.events.workStatus = ['working']; pet.workState = 'working';
  pet.switchTo('working', false); pet.videoB.fire('loadeddata'); pet.videoB.present();
  let ended = 0; pet.handleEnded = () => { ended++; };
  pet.prevWorkTick = 0; pet.renderBubble = () => {}; pet.workTimer = null;
  pet.playOnce('care'); pet.onWorkTick({ state: null }, 1);
  assert.equal(pet.videoB.loop, false); pet.videoB.onended(); assert.equal(ended, 0);
  pet.videoA.fire('error'); assert.equal(ended, 1); assert.equal(pet.anim, 'working');
});
