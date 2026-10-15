const {test} = require('node:test');
const assert = require('node:assert/strict');
const {fixture, CONFIG, clone} = require('./ui-fixture.cjs');

test('registers DSH section and reads status without unsolicited POST requests',async()=>{
  const f=fixture(); assert.match(f.text(),/正在读取设置/); await f.flush();
  assert.match(f.text(),/桌宠已连接/);assert.equal(f.byId('dc-petId').props.value,'main');
  assert.equal(f.calls.length,1);assert.equal(f.calls[0].request.method,'GET');assert.equal(f.calls[0].request.credentials,'same-origin');
  await f.poll();await f.flush();assert.equal(f.calls.length,2);f.unmount();await f.flush();assert.equal(f.timers.size,0);
});
test('polling preserves drafts; saving sends full config and accepts persisted values',async()=>{
  const f=fixture();await f.flush();f.input('dc-petId','friend.with.dots');await f.flush();
  f.server.config.sitMinutes=99;await f.poll();await f.flush();
  assert.equal(f.byId('dc-petId').props.value,'friend.with.dots');assert.equal(f.byId('dc-sitMinutes').props.value,50);
  assert.match(f.text(),/有未保存的修改/);f.submit();await f.flush();
  const call=f.calls.find(x=>x.request.method==='PUT');assert.equal(call.url,'/dsh-pet-company/config');
  const body=JSON.parse(call.request.body);assert.equal(body.petId,'friend.with.dots');assert.equal(body.sitMinutes,50);assert.equal(Object.keys(body).length,Object.keys(CONFIG).length);
  assert.match(f.text(),/已保存，下次启动也会记得/);assert.equal(f.button('保存设置').props.disabled,true);f.unmount();
});
test('invalid numeric and pet values cannot be saved; undo restores saved config',async()=>{
  const f=fixture();await f.flush();f.input('dc-minGapMinutes','19');f.input('dc-petId','');await f.flush();
  assert.match(f.text(),/20–1440/);assert.match(f.text(),/有效宠物 ID/);assert.equal(f.button('保存设置').props.disabled,true);
  f.click('撤销修改');await f.flush();assert.equal(f.byId('dc-minGapMinutes').props.value,20);assert.equal(f.byId('dc-petId').props.value,'main');f.unmount();
});
test('dependency unavailable has a calm explanation, editable settings and disabled bubble action',async()=>{
  const f=fixture({status:{available:false,phase:'unavailable',reason:'需要先安装并启用 dsh-pet 才能显示宠物'}});await f.flush();
  assert.match(f.text(),/陪伴设置仍然可以保存/);assert.equal(f.button('试说一句').props.disabled,true);
  assert.match(f.text(),/宿主的插件管理/);assert.doesNotMatch(f.text(),/dsh plugin --profile desktop/);f.input('dc-waterMinutes','100');await f.flush();assert.equal(f.button('保存设置').props.disabled,false);f.unmount();
});
test('explicit bubble and snooze actions use correct endpoints and JSON bodies',async()=>{
  const f=fixture();await f.flush();await f.click('试说一句');await f.flush();
  let call=f.calls.at(-1);assert.equal(call.url,'/dsh-pet-company/test');assert.equal(call.request.body,'{}');assert.equal(call.request.headers['Content-Type'],'application/json');
  assert.match(f.text(),/看看它的气泡/);await f.click('安静一小时');await f.flush();call=f.calls.at(-1);
  assert.equal(call.url,'/dsh-pet-company/snooze');assert.deepEqual(JSON.parse(call.request.body),{minutes:60});assert.match(f.text(),/这一小时安静陪你/);f.unmount();
});
test('save failure keeps draft and surfaces service reason',async()=>{
  const f=fixture();await f.flush();f.input('dc-waterMinutes','101');await f.flush();
  f.handlers.push(async()=>({ok:false,status:409,json:async()=>({error:'正在处理，请稍后重试'})}));f.submit();await f.flush();
  assert.match(f.text(),/正在处理，请稍后重试/);assert.equal(f.byId('dc-waterMinutes').props.value,101);assert.equal(f.button('保存设置').props.disabled,false);f.unmount();
});
test('connection failure can retry without dropping a newly received config',async()=>{
  const f=fixture({});await f.flush();
  f.handlers.push(async()=>{throw new Error('连接已断开');});await f.poll();await f.flush();assert.match(f.text(),/连接已断开/);
  await f.click('重新连接');await f.flush();assert.doesNotMatch(f.text(),/连接已断开/);f.unmount();
});
test('request timeout aborts, and unmount cleans all pending requests and timers',async()=>{
  const f=fixture();await f.flush();let signal;
  f.handlers.push((url,request)=>new Promise((resolve,reject)=>{signal=request.signal;signal.addEventListener('abort',()=>reject(new Error('aborted')));}));
  const pending=f.poll();f.timeout();await pending;await f.flush();assert.equal(signal.aborted,true);assert.match(f.text(),/连接超时/);
  f.handlers.push((url,request)=>new Promise((resolve,reject)=>{signal=request.signal;signal.addEventListener('abort',()=>reject(new Error('aborted')));}));
  const next=f.poll();f.unmount();await next;assert.equal(signal.aborted,true);assert.equal(f.timers.size,0);
});
test('late poll response cannot overwrite a newer save response',async()=>{
  const f=fixture();await f.flush();let release;
  const old=clone(f.server);f.handlers.push(()=>new Promise(resolve=>{release=()=>resolve({ok:true,json:async()=>old});}));
  const pending=f.poll();f.input('dc-workMinutes','140');await f.flush();f.submit();await f.flush();
  release();await pending;await f.flush();assert.equal(f.byId('dc-workMinutes').props.value,140);assert.match(f.text(),/已保存/);f.unmount();
});

test('reminder interval inputs have distinct accessible names',async()=>{
  const f=fixture();await f.flush();
  for(const [id,title] of [['sitMinutes','起来走走'],['waterMinutes','记得喝水'],['workMinutes','歇一会儿'],['lateAt','早点收工']]) {
    assert.ok(f.byId('dc-'+id).props['aria-label'].includes(title));
  }
  f.unmount();
});
test('radio groups support arrow navigation and one tab stop per group',async()=>{
  const f=fixture();await f.flush();
  const radios=f.byRole('radio');assert.equal(radios.filter(n=>n.props.tabIndex===0).length,2);
  let focused=-1,prevented=false;
  radios[0].props.onKeyDown({key:'ArrowRight',preventDefault(){prevented=true;},currentTarget:{parentElement:{querySelectorAll(){return [0,1,2].map(i=>({focus(){focused=i;}}));}}}});
  await f.flush();assert.ok(prevented);assert.equal(focused,1);assert.equal(f.byRole('radio')[1].props['aria-checked'],true);
  f.unmount();
});

test('owned child plugin registers a separate overlay and disposes with the root',async()=>{
 const f=fixture();await f.flush();assert.deepEqual(f.childPlugins,['pet-company-runtime-client']);
 assert.deepEqual([...f.registeredSlots.keys()].sort(),['settings.section:dsh-pet-company','shell.overlay:pet-company-runtime']);
 f.unmount();await f.flush();assert.equal(f.registeredSlots.size,0);assert.equal(f.timers.size,0);
});
