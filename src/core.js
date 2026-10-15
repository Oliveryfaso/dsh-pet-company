export const MINUTE = 60_000;
export const DEFAULTS = Object.freeze({
  enabled:true, frequency:'quiet', petId:'main', character:'silver',
  quietStart:'00:00', quietEnd:'08:00', minGapMinutes:20,
  sitMinutes:50, waterMinutes:90, workMinutes:120, lateAt:'23:30',
  sitting:true, water:true, work:true, late:true,
});
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
export function validateConfig(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('配置必须是对象');
  const result = {...DEFAULTS};
  for (const [key,v] of Object.entries(value)) {
    if (!Object.hasOwn(DEFAULTS,key)) throw Error('未知配置项：'+key);
    if (typeof DEFAULTS[key] === 'boolean') {
      if (typeof v !== 'boolean') throw Error(key+' 必须是开关');
    } else if (['quietStart','quietEnd','lateAt'].includes(key)) {
      if (typeof v !== 'string' || !timePattern.test(v)) throw Error(key+' 应为 HH:mm');
    } else if (key === 'frequency') {
      if (!['quiet','standard','chatty'].includes(v)) throw Error('请选择有效提醒频率');
    } else if (key === 'character') {
      if (!['silver','orange','tide'].includes(v)) throw Error('请选择有效角色');
    } else if (key === 'petId') {
      if (typeof v !== 'string' || !v.trim() || v.length > 64 || /[\x00-\x1f<>:"/\\|?*]/.test(v)) throw Error('宠物 ID 无效');
    } else {
      const min = key === 'minGapMinutes' ? 20 : 1;
      if (!Number.isInteger(v) || v < min || v > 1440) throw Error(key+' 数值超出范围');
    }
    result[key] = v;
  }
  return result;
}
const minutes = time => Number(time.slice(0,2))*60+Number(time.slice(3));
export function isQuiet(date, config) {
  const n=date.getHours()*60+date.getMinutes(), a=minutes(config.quietStart), b=minutes(config.quietEnd);
  return a === b ? false : a < b ? n >= a && n < b : n >= a || n < b;
}
const activeStates = new Set(['thinking','working','result']);
export class Scheduler {
  constructor(now) { this.reset(now); this.sent=[]; this.lastSpeech=-Infinity; this.lateDay=''; this.snoozeUntil=0; }
  reset(now) { this.lastTick=now; this.previousActive=false; this.activeMs=0; this.sittingMs=0; this.idleSince=now; this.waterSince=now; this.workCounter=undefined; this.notifyCounter=undefined; this.sayCounter=undefined; this.blockedAt=undefined; this.previousWorkState=undefined; }
  disconnect(now) { this.reset(now); }
  observe(state, now, config) {
    const work=state?.sections?.workStatus;
    if (!work || !Number.isSafeInteger(work.counter) || work.counter < 0 || !('data' in work)) throw Error('工作状态契约不可用');
    const workState=work.data?.state;
    if (workState != null && !['thinking','working','result','waiting','success','error'].includes(workState)) throw Error('未知工作状态');
    const notify=state.sections.notify;
    if (notify && notify.counter !== this.notifyCounter) {
      this.notifyCounter=notify.counter;
      if (['approval/requested','question/requested'].includes(notify.data?.type)) this.blockedAt=work.counter;
    }
    // A newer work transition is the only signal that a pending human action has resumed.
    if (this.blockedAt !== undefined && work.counter > this.blockedAt && this.previousWorkState !== undefined && workState !== this.previousWorkState && activeStates.has(workState)) this.blockedAt=undefined;
    const say=state.pets?.[config.petId]?.say;
    if (say && this.sayCounter !== undefined && say.counter !== this.sayCounter) this.lastSpeech=now;
    if (say && this.sayCounter === undefined && say.data?.text) this.lastSpeech=now;
    this.sayCounter=say?.counter;
    const active=activeStates.has(workState);
    const delta=now-this.lastTick;
    // Sleep, clock jumps and failed polls never count as working time.
    if (delta < 0 || delta > 45_000) { this.activeMs=0; this.sittingMs=0; this.waterSince=now; this.previousActive=false; }
    if (active && this.previousActive && delta >= 0 && delta <= 45_000) { this.activeMs+=delta; this.sittingMs+=delta; }
    if (!active) {
      if (this.previousActive) this.idleSince=now;
      if (now-this.idleSince >= 5*MINUTE) { this.activeMs=0; this.sittingMs=0; }
    }
    this.previousActive=active; this.lastTick=now; this.workCounter=work.counter; this.previousWorkState=workState;
    this.sent=this.sent.filter(t=>now-t < 60*MINUTE && now>=t);
    if (!config.enabled) return {phase:'disabled'};
    if (!active) return {phase:workState === 'waiting' ? 'waiting' : 'idle'};
    if (this.blockedAt !== undefined || workState === 'waiting') return {phase:'waiting'};
    if (now < this.snoozeUntil) return {phase:'snoozed'};
    if (isQuiet(new Date(now), config)) return {phase:'quiet'};
    const [gap,quota] = {quiet:[60,1],standard:[30,2],chatty:[20,3]}[config.frequency];
    if (now-this.lastSpeech < Math.max(gap,config.minGapMinutes)*MINUTE || this.sent.length>=quota) return {phase:'cooldown'};
    const date=new Date(now), day=`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    const at=date.getHours()*60+date.getMinutes();
    let kind;
    if (config.late && at >= minutes(config.lateAt) && this.lateDay!==day) kind='late';
    else {
      const due=[
        ['work',config.work ? this.activeMs-config.workMinutes*MINUTE : -Infinity],
        ['sitting',config.sitting ? this.sittingMs-config.sitMinutes*MINUTE : -Infinity],
        ['water',config.water ? now-this.waterSince-config.waterMinutes*MINUTE : -Infinity],
      ].filter(([,overdue])=>overdue>=0).sort((a,b)=>b[1]-a[1]);
      // Oldest overdue first: a frequent sitting timer must never starve water reminders.
      kind=due[0]?.[0];
    }
    return {phase:kind?'due':'watching',kind,day};
  }
  delivered(kind, now, day) {
    this.lastSpeech=now; this.sent.push(now);
    if (kind==='water') this.waterSince=now;
    if (kind==='sitting') this.sittingMs=0;
    if (kind==='work') this.activeMs=0;
    if (kind==='late') this.lateDay=day;
  }
}
const lines = {
  sitting:['该休息啦～劳逸结合。站起来陪我晃一圈？','椅子已经认识你了，起来换个风景吧。','代码先坐着，你起来伸个懒腰。'],
  water:['给自己续杯水吧，别只给代码续命。','嘴硬可以，嘴干不行。喝口水？','你的水杯今天也想有点参与感。'],
  work:['今天已经够努力啦，歇一会儿。','只要学得慢，就不用学——先休息五分钟。','任务可以排队，你的休息不用。'],
  late:['今天先存档吧，明天的你也需要电量。','月亮都打卡下班了，要不咱也收工？','再写一行的故事，明天再续吧。'],
};
export function pickLine(kind, character, index=0) {
  const offset={silver:0,orange:1,tide:2}[character]??0;
  return lines[kind][(index+offset)%lines[kind].length];
}
