/* DSH companion settings: a side-effect client module; no bundled React or renderer. */
(function () {
  'use strict';
  if (!window.__ModuleLoader__ || typeof window.__ModuleLoader__.load !== 'function') return;
  window.__ModuleLoader__.load({
    id: 'dsh-pet-company',
    factory: function (require) {
      /*__RENDERER_RELAY__*/
      /*__OWNED_CLIENT__*/
      var React = require('react');
      var h = React.createElement;
      var DEFAULTS = { enabled: true, frequency: 'quiet', petId: 'main', character: 'silver', quietStart: '00:00', quietEnd: '08:00', minGapMinutes: 20, sitMinutes: 50, waterMinutes: 90, workMinutes: 120, lateAt: '23:30', sitting: true, water: true, work: true, late: true, schemaVersion:2, provider:'external', externalTarget:'main', embeddedTarget:'companion-silver', handoffConfirmed:true, appearance:{size:462,marginX:16,marginY:16,corner:'bottom-right',cloud:true,pop:true,closeSeconds:8,display:'desktop'} };
      var PHASE = { handoff:'升级交接待确认', connecting: '正在连接桌宠', unavailable: '桌宠尚未就绪', disabled: '陪伴已关闭', waiting: '等你处理完审批或提问', idle: '休息中，陪你安静待着', snoozed: '暂时安静一会儿', quiet: '现在是静默时间', cooldown: '刚说过话，先安静陪着', due: '准备关心你一下', watching: '在这里，安静陪着你' };
      var KINDS = { sitting: '起来走走', water: '记得喝水', work: '歇一会儿', late: '早点收工', test: '试说一句' };
      var CSS = '.dsh-companion{--dc-ink:#273b44;--dc-muted:#647782;--dc-line:#dce5e8;--dc-accent:#477d83;--dc-paper:#f6f9fa;--dc-surface:#fff;color:var(--dc-ink);font-family:"PingFang SC","Microsoft YaHei",system-ui,sans-serif;font-size:14px;line-height:1.6;max-width:820px;padding:12px 2px 32px}.dsh-companion *{box-sizing:border-box}.dsh-companion button,.dsh-companion input,.dsh-companion select{font:inherit}.dsh-companion button{cursor:pointer}.dsh-companion button:disabled{cursor:default;opacity:.48}.dsh-companion :is(button,input,select):focus-visible{outline:3px solid #76a9b4;outline-offset:3px}.dc-head{display:flex;gap:24px;align-items:flex-start;justify-content:space-between;margin-bottom:24px}.dc-eyebrow{font-size:11px;letter-spacing:.18em;color:var(--dc-muted);margin:0 0 8px}.dc-title{font-size:27px;font-weight:600;letter-spacing:.08em;margin:0 0 8px}.dc-desc{color:var(--dc-muted);margin:0;max-width:460px}.dc-badge{display:flex;align-items:center;gap:7px;white-space:nowrap;color:var(--dc-muted);font-size:12px;padding-top:7px}.dc-dot{width:7px;height:7px;border-radius:50%;background:#a7b8bd}.dc-dot.is-ready{background:#598b79}.dc-panel{background:var(--dc-surface);border:1px solid var(--dc-line);border-radius:16px;overflow:hidden;margin-bottom:18px}.dc-row{padding:21px 23px}.dc-row+.dc-row{border-top:1px solid var(--dc-line)}.dc-split{display:flex;align-items:center;justify-content:space-between;gap:20px}.dc-label{display:block;font-size:14px;font-weight:600;margin:0 0 4px}.dc-help{font-size:12px;color:var(--dc-muted);margin:0}.dc-switch{width:42px;min-width:42px;height:25px;border:1px solid #acbcc2;background:#bccbd0;border-radius:20px;padding:3px;display:flex;align-items:center;transition:background .15s}.dc-switch[aria-checked=true]{background:var(--dc-accent);border-color:var(--dc-accent)}.dc-switch:after{content:"";width:17px;height:17px;background:white;border-radius:50%;box-shadow:0 1px 3px #20354030;transform:translateX(0);transition:transform .15s}.dc-switch[aria-checked=true]:after{transform:translateX(16px)}.dc-section-title{font-size:15px;letter-spacing:.02em;font-weight:600;margin:0 0 13px}.dc-segment{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:14px}.dc-choice{border:1px solid var(--dc-line);border-radius:10px;background:transparent;color:var(--dc-ink);padding:11px 12px;text-align:left;min-height:65px}.dc-choice[aria-checked=true]{border-color:var(--dc-accent);background:#eef6f7;box-shadow:inset 0 0 0 1px var(--dc-accent)}.dc-choice strong{display:block;font-size:13px;font-weight:600}.dc-choice span{display:block;color:var(--dc-muted);font-size:11px;margin-top:2px}.dc-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px 22px}.dc-field>label{font-weight:500;display:block;font-size:13px;margin-bottom:6px}.dc-input{border:1px solid #cbd8dd;color:var(--dc-ink);background:var(--dc-surface);border-radius:8px;padding:8px 10px;width:100%;min-height:39px}.dc-input:disabled{background:var(--dc-paper);color:var(--dc-muted)}.dc-inline{display:flex;align-items:center;gap:8px}.dc-inline .dc-input{max-width:110px}.dc-unit{color:var(--dc-muted);font-size:12px;white-space:nowrap}.dc-reminders{display:grid;grid-template-columns:1fr 1fr;gap:0}.dc-reminder{padding:18px 23px;border-top:1px solid var(--dc-line)}.dc-reminder:nth-child(odd){border-right:1px solid var(--dc-line)}.dc-reminder .dc-inline{margin-top:12px}.dc-reminder .dc-label{font-size:13px}.dc-reminder .dc-input{min-height:34px;padding:5px 8px;max-width:80px}.dc-inline .dc-input[type=time]{max-width:140px;min-width:140px;width:140px}.dc-role{display:flex;align-items:center;gap:9px}.dc-role-mark{width:26px;height:26px;border-radius:50% 50% 42% 42%;background:#dfe4ef;box-shadow:inset 0 -4px 0 #c7d0e0;flex-shrink:0}.dc-role-mark.orange{background:#f0d2ad;box-shadow:inset 0 -4px 0 #e7bd8d}.dc-role-mark.tide{background:#c7e1e8;box-shadow:inset 0 -4px 0 #acd0dc}.dc-note{border:1px solid #d9e7eb;background:#eff6f8;border-radius:11px;padding:13px 16px;font-size:12px;color:#48616d;margin-bottom:18px}.dc-note p{margin:0}.dc-note p+p{margin-top:5px}.dc-command{display:block;margin:8px 0;padding:8px 10px;background:var(--dc-surface);border-radius:6px;color:var(--dc-ink);font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;overflow-wrap:anywhere}.dc-error{border-color:#ebd1c8;background:#fcf4f1;color:#884d3b}.dc-notice{color:#43735e;font-size:13px;margin:0}.dc-status{display:flex;gap:9px;align-items:flex-start;font-size:13px;padding:14px 23px;background:var(--dc-paper)}.dc-status .dc-dot{margin-top:7px;flex-shrink:0}.dc-status p{margin:0}.dc-status .dc-help{margin-top:4px}.dc-footer{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;margin-top:22px}.dc-actions{display:flex;gap:8px;flex-wrap:wrap}.dc-btn{border:1px solid #cbd8dd;color:var(--dc-ink);background:var(--dc-surface);border-radius:8px;min-height:37px;padding:7px 13px;font-size:12px;line-height:1.5}.dc-btn:hover:not(:disabled){background:var(--dc-paper)}.dc-btn-primary{background:var(--dc-accent);border-color:var(--dc-accent);color:#fff;font-weight:600;padding-inline:20px}.dc-btn-primary:hover:not(:disabled){background:#396c72}.dc-link{border:0;background:transparent;padding:0;color:var(--dc-accent);text-decoration:underline;text-underline-offset:3px;font-size:12px}.dc-last{padding:0 2px;color:var(--dc-muted);font-size:12px;margin-top:17px}.dc-last blockquote{margin:6px 0 0;border-left:2px solid #cbdce0;padding-left:11px;color:#48616d}.dc-loading{padding:35px 23px;color:var(--dc-muted);font-size:13px}.dc-form{margin:0}.dc-error-list{margin:0;padding-left:18px}.dc-meta{font-size:11px;color:var(--dc-muted);margin:9px 0 0}@media(max-width:580px){.dsh-companion{padding-inline:0}.dc-head{gap:12px;flex-direction:column}.dc-badge{padding:0}.dc-row{padding:18px}.dc-grid,.dc-reminders{grid-template-columns:1fr}.dc-reminder{padding:16px 18px}.dc-reminder:nth-child(odd){border-right:0}.dc-segment{gap:6px}.dc-choice{padding:10px 8px}.dc-choice span{font-size:10px}.dc-role{gap:6px}.dc-role-mark{width:19px;height:21px}.dc-status{padding:14px 18px}.dc-footer{align-items:flex-start}.dc-title{font-size:24px}}@media(prefers-color-scheme:dark){.dsh-companion{--dc-ink:#dce8ec;--dc-muted:#9baeb7;--dc-line:#394b54;--dc-accent:#6cabad;--dc-paper:#25343c;--dc-surface:#202e36}.dc-choice[aria-checked=true]{background:#2a4147}.dc-input,.dc-btn{border-color:#4b606b}.dc-btn-primary{background:#477d83;color:#fff}.dc-note{background:#273d46;border-color:#3e5d69;color:#c0d5dd}.dc-error{background:#422e2b;border-color:#69463e;color:#efb6a2}.dc-notice{color:#a4d0b8}.dc-last blockquote{color:#bdced5}.dc-switch{border-color:#687b84;background:#687b84}}@media(prefers-reduced-motion:reduce){.dc-switch,.dc-switch:after{transition:none}}';

      function cleanConfig(config) {
        var result = {};
        Object.keys(DEFAULTS).forEach(function (key) { result[key] = config && config[key] !== undefined ? config[key] : DEFAULTS[key]; });
        return result;
      }
      function validate(config) {
        var errors = [];
        [['minGapMinutes', '两次关心至少间隔', 20, 1440], ['sitMinutes', '久坐提醒', 1, 1440], ['waterMinutes', '喝水提醒', 1, 1440], ['workMinutes', '连续工作提醒', 1, 1440]].forEach(function (rule) {
          var value = config[rule[0]];
          if (!Number.isInteger(value) || value < rule[2] || value > rule[3]) errors.push(rule[1] + '需填写 ' + rule[2] + '–' + rule[3] + ' 之间的整数分钟。');
        });
        ['quietStart', 'quietEnd', 'lateAt'].forEach(function (key) { if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(config[key])) errors.push('请填写完整的时间（小时和分钟）。'); });
        if (typeof config.petId !== 'string' || !config.petId.trim() || config.petId.length > 64 || /[\x00-\x1f<>:"/\\|?*]/.test(config.petId)) errors.push('请填写有效宠物 ID（最多 64 个字符），默认是 main。');
        [['size',100,800],['marginX',0,4000],['marginY',0,4000],['closeSeconds',3,20]].forEach(function(rule){var n=config.appearance[rule[0]];if(!Number.isInteger(n)||n<rule[1]||n>rule[2])errors.push('外观数值需在 '+rule[1]+'–'+rule[2]+' 范围内。');});
        return errors;
      }
      function readableError(error) { return error && error.message ? error.message : '请求未完成，请重试。'; }
      function timeLabel(at) {
        var date = new Date(at);
        return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
      }
      function CompanionSettings() {
        var statusState = React.useState(null), status = statusState[0], setStatus = statusState[1];
        var draftState = React.useState(cleanConfig()), draft = draftState[0], setDraft = draftState[1];
        var loadingState = React.useState(true), loading = loadingState[0], setLoading = loadingState[1];
        var busyState = React.useState(''), busy = busyState[0], setBusy = busyState[1];
        var errorState = React.useState(''), error = errorState[0], setError = errorState[1];
        var noticeState = React.useState(''), notice = noticeState[0], setNotice = noticeState[1];
        var dirtyState = React.useState(false), dirty = dirtyState[0], setDirty = dirtyState[1];
        var life = React.useRef({ mounted: false, dirty: false, busy: '', reading: false, epoch: 0, controllers: new Set(), baseline: cleanConfig(), refreshTimer: null });

        var request = React.useCallback(async function (path, method, body) {
          var controller = new AbortController(), timedOut = false;
          life.current.controllers.add(controller);
          var timeout = setTimeout(function () { timedOut = true; controller.abort(); }, path === 'test' ? 20000 : 8000);
          try {
            var response = await fetch('/dsh-pet-company/' + path, { method: method || 'GET', credentials: 'same-origin', headers: body === undefined ? { Accept: 'application/json' } : { Accept: 'application/json', 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body), signal: controller.signal });
            var result;
            try { result = await response.json(); } catch (_) { throw new Error('服务返回了无法读取的结果，请重试。'); }
            if (!response.ok) throw new Error(result.reason || result.error || '请求未完成（' + response.status + '），请重试。');
            return result;
          } catch (failure) {
            if (timedOut) throw new Error('连接超时，请确认 DSH 仍在运行后重试。');
            throw failure;
          } finally {
            clearTimeout(timeout);
            life.current.controllers.delete(controller);
          }
        }, []);
        var acceptStatus = React.useCallback(function (next, replaceDraft) {
          if (!next || !next.config || typeof next.available !== 'boolean') throw new Error('服务状态不完整，请重试。');
          setStatus(next);
          if (replaceDraft || !life.current.dirty) {
            var config = cleanConfig(next.config);
            life.current.baseline = config;
            setDraft(config);
            life.current.dirty = false;
            setDirty(false);
          }
        }, []);
        var refresh = React.useCallback(async function () {
          var state = life.current;
          if (!state.mounted || state.reading || state.busy) return;
          var epoch = state.epoch;
          var readToken = {};
          state.reading = readToken;
          try {
            var next = await request('status');
            if (state.mounted && epoch === state.epoch) { acceptStatus(next, false); setError(''); }
          } catch (failure) {
            if (state.mounted && epoch === state.epoch) setError(readableError(failure));
          } finally {
            if (state.reading === readToken) state.reading = false;
            if (state.mounted && epoch === state.epoch) setLoading(false);
          }
        }, [request, acceptStatus]);
        React.useEffect(function () {
          var state = life.current;
          state.mounted = true;
          refresh();
          var timer = setInterval(refresh, 15000);
          return function () { state.mounted = false; state.epoch++; state.reading = false; clearInterval(timer); clearTimeout(state.refreshTimer); state.controllers.forEach(function (controller) { controller.abort(); }); state.controllers.clear(); };
        }, [refresh]);
        function change(key, value) {
          if (life.current.busy) return;
          setDraft(function (previous) {
            var next = Object.assign({}, previous); next[key] = value; if(key==='provider')next.petId=value==='embedded'?next.embeddedTarget:next.externalTarget; if(key==='petId')next[next.provider==='embedded'?'embeddedTarget':'externalTarget']=value; if(key==='embeddedTarget'&&next.provider==='embedded')next.petId=value;
            var changed = JSON.stringify(next) !== JSON.stringify(life.current.baseline);
            life.current.dirty = changed; setDirty(changed); return next;
          });
          setNotice('');
        }
        async function mutate(action, path, payload) {
          var state = life.current;
          if (state.busy) return;
          state.busy = action; state.epoch++;
          setBusy(action); setError(''); setNotice('');
          try {
            var next = await request(path, action === 'save' ? 'PUT' : 'POST', payload);
            if (!state.mounted) return;
            if (action === 'test') {
              if (next.ok !== true) throw new Error(next.reason || '这次没能说出口，请稍后再试。');
              setNotice('已经对桌宠说了悄悄话，看看它的气泡吧。');
            } else {
              acceptStatus(next, action === 'save');
              if (action === 'save') { clearTimeout(state.refreshTimer); state.refreshTimer = setTimeout(function () { if (state.mounted) void refresh(); }, 3000); }
              setNotice(action === 'save' ? '已保存，下次启动也会记得。' : action === 'snooze' ? '好，这一小时安静陪你。' : '');
            }
          } catch (failure) { if (state.mounted) setError(readableError(failure)); }
          finally { state.busy = ''; if (state.mounted) setBusy(''); }
        }
        function choiceKeys(event, key, values) {
          var index = values.indexOf(draft[key]);
          if (event.key === 'ArrowRight' || event.key === 'ArrowDown') index = (index + 1) % values.length;
          else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') index = (index + values.length - 1) % values.length;
          else if (event.key === 'Home') index = 0;
          else if (event.key === 'End') index = values.length - 1;
          else return;
          event.preventDefault(); change(key, values[index]);
          var buttons = event.currentTarget.parentElement.querySelectorAll('[role=radio]');
          if (buttons[index]) buttons[index].focus();
        }
        function revert() { if (busy) return; setDraft(Object.assign({}, life.current.baseline)); life.current.dirty = false; setDirty(false); setNotice('已恢复到上次保存的设置。'); }
        var errors = validate(draft), locked = loading || !!busy || !status || status.readOnly;
        function appearanceChange(key,value){change('appearance',Object.assign({},draft.appearance,{[key]:value}));}
        function appearanceNumber(key,label,min,max){return h('div',{className:'dc-field'},h('label',{htmlFor:'dc-appearance-'+key},label),h('input',{id:'dc-appearance-'+key,className:'dc-input',type:'number',min:min,max:max,step:1,value:draft.appearance[key],disabled:locked,onChange:function(e){appearanceChange(key,e.target.value===''?'':Number(e.target.value));}}));}
        function toggle(key, title, description) {
          return h('div', { className: 'dc-split' }, h('div', null, h('span', { className: 'dc-label', id: 'dc-label-' + key }, title), description && h('p', { className: 'dc-help' }, description)), h('button', { type: 'button', role: 'switch', 'aria-checked': !!draft[key], 'aria-labelledby': 'dc-label-' + key, className: 'dc-switch', disabled: locked, onClick: function () { change(key, !draft[key]); } }));
        }
        function field(key, title, type, min, max, helper) {
          return h('div', { className: 'dc-field' }, h('label', { htmlFor: 'dc-' + key }, title), h('div', { className: 'dc-inline' }, h('input', { className: 'dc-input', id: 'dc-' + key, type: type, value: draft[key], min: min, max: max, step: type === 'number' ? 1 : undefined, disabled: locked, onChange: function (event) { change(key, type === 'number' ? (event.target.value === '' ? '' : Number(event.target.value)) : event.target.value); } }), type === 'number' && h('span', { className: 'dc-unit' }, '分钟')), helper && h('p', { className: 'dc-help', style: { marginTop: 5 } }, helper));
        }
        function reminder(key, title, description, timeKey, max) {
          return h('div', { className: 'dc-reminder', key: key }, toggle(key, title, description), h('div', { className: 'dc-inline' }, h('label', { className: 'dc-unit', htmlFor: 'dc-' + timeKey }, key === 'late' ? '从' : '每'), h('input', { id: 'dc-' + timeKey, 'aria-label': title + (key === 'late' ? '的开始时间' : '的间隔分钟'), className: 'dc-input', type: key === 'late' ? 'time' : 'number', min: key === 'late' ? undefined : 1, max: max, step: key === 'late' ? undefined : 1, value: draft[timeKey], disabled: locked || !draft[key], onChange: function (event) { change(timeKey, key === 'late' ? event.target.value : event.target.value === '' ? '' : Number(event.target.value)); } }), h('span', { className: 'dc-unit' }, key === 'late' ? '以后' : '分钟')));
        }
        var latest = status && status.lastReminder;
        var statusText = status ? (PHASE[status.phase] || '陪伴状态已更新') : '正在读取陪伴设置';
        return h('section', { className: 'dsh-companion', 'aria-label': '陪伴设置' }, h('style', null, CSS),
          h('header', { className: 'dc-head' }, h('div', null, h('p', { className: 'dc-eyebrow' }, 'DSH PET COMPANY'), h('h2', { className: 'dc-title' }, '陪伴'), h('p', { className: 'dc-desc' }, '代码慢慢写，自己也照顾一下。让它偶尔开口，其余时间安静陪你。')), h('div', { className: 'dc-badge' }, h('span', { className: 'dc-dot' + (status && status.available ? ' is-ready' : '') }), status && status.available ? '桌宠已连接' : '等待桌宠')),
          error && h('div', { className: 'dc-note dc-error', role: 'alert' }, h('p', null, error), h('button', { type: 'button', className: 'dc-link', disabled: !!busy, onClick: refresh }, '重新连接')),
          status && !status.available && h('div', { className: 'dc-note' }, h('p', null, status.reason || '需要先安装并启用 dsh-pet 才能显示宠物。'), h('p', null, '陪伴设置仍然可以保存。请核对桌宠是否启用、目标 ID 和当前宿主的兼容性。安装桌宠请使用宿主的插件管理；自定义 profile 可按对应的官方 CLI 流程处理。')),
          status && status.readOnly && h('div',{className:'dc-note'},h('p',null,status.ownership && status.ownership.reason),status.ownership && status.ownership.recoveryToken && h('button',{type:'button',className:'dc-btn',disabled:!!busy,onClick:function(){if(window.confirm('请先关闭相关 Profile。仅当原拥有者进程已退出，才尝试恢复锁；不会结束任何进程。'))mutate('recover','owner/recover',{stopped:true,token:status.ownership.recoveryToken});}},'原进程已退出，恢复占用锁')),
          status && !status.config.handoffConfirmed && h('div',{className:'dc-note'},h('p',null,'升级保留了原外部目标。先在官方入口停用旧实例，并停止其 Profile/进程，再确认交接。'),h('button',{type:'button',className:'dc-btn',disabled:!!busy||status.readOnly,onClick:function(){if(window.confirm('确认相关旧陪伴实例和 Profile 已停止？关闭主窗口并不代表进程退出。'))mutate('handoff','handoff',{stoppedOldInstances:true});}},'旧实例已停止，确认交接')),
          status && status.runtime && draft.appearance.display==='desktop' && h('div',{className:'dc-note'},h('p',null,status.helper && status.helper.reason || status.runtime.reason || '独立运行时已就绪。'),['missing','failed'].includes(status.runtime.phase) && h('button',{type:'button',className:'dc-btn',disabled:!!busy||status.readOnly,onClick:function(){if(window.confirm('从 Electron 官方发布下载 43.3.0 到当前 DSH home 的插件私有缓存？卸载默认保留该缓存。'))mutate('download','runtime/download',{consent:true});}},'下载独立 Electron'),h('button',{type:'button',className:'dc-btn',disabled:!!busy||status.readOnly||status.runtime.phase!=='ready',onClick:function(){mutate('retry','runtime/retry',{});}},'重试启动伴侣')),
          loading && !status ? h('div', { className: 'dc-panel dc-loading', role: 'status' }, '正在读取设置…') : status && h('form', { className: 'dc-form', onSubmit: function (event) { event.preventDefault(); if (dirty && !errors.length && !busy) mutate('save', 'config', draft); } },
            h('div',{className:'dc-panel'},h('div',{className:'dc-row dc-grid'},h('div',{className:'dc-field'},h('label',{htmlFor:'dc-provider'},'陪伴模式'),h('select',{id:'dc-provider',className:'dc-input',value:draft.provider,disabled:locked,onChange:function(e){change('provider',e.target.value);}},h('option',{value:'embedded'},'内置伴侣'),h('option',{value:'external'},'外部 dsh-pet（基础关怀）'))),h('div',{className:'dc-field'},h('label',{htmlFor:'dc-embeddedTarget'},'内置形象'),h('select',{id:'dc-embeddedTarget',className:'dc-input',value:draft.embeddedTarget,disabled:locked,onChange:function(e){change('embeddedTarget',e.target.value);}},[['companion-silver','银白'],['companion-orange','暖橘'],['companion-tide','潮蓝']].map(function(item){return h('option',{key:item[0],value:item[0]},item[1]);}))),h('div',{className:'dc-field'},h('label',{htmlFor:'dc-display'},'显示位置'),h('select',{id:'dc-display',className:'dc-input',value:draft.appearance.display,disabled:locked,onChange:function(e){appearanceChange('display',e.target.value);}},h('option',{value:'desktop'},'桌面窗口（需要独立 Electron）'),h('option',{value:'web'},'DSH 页面内'),h('option',{value:'none'},'暂不显示'))),h('div',{className:'dc-field'},h('label',{htmlFor:'dc-corner'},'停靠角落'),h('select',{id:'dc-corner',className:'dc-input',value:draft.appearance.corner,disabled:locked,onChange:function(e){appearanceChange('corner',e.target.value);}},[['bottom-right','右下'],['bottom-left','左下'],['top-right','右上'],['top-left','左上']].map(function(item){return h('option',{key:item[0],value:item[0]},item[1]);}))),appearanceNumber('size','角色大小（像素）',100,800),appearanceNumber('closeSeconds','云朵显示（秒）',3,20),appearanceNumber('marginX','水平边距（像素）',0,4000),appearanceNumber('marginY','垂直边距（像素）',0,4000),h('label',null,h('input',{type:'checkbox',checked:draft.appearance.cloud,disabled:locked,onChange:function(e){appearanceChange('cloud',e.target.checked);}}),'显示关心云朵'),h('label',null,h('input',{type:'checkbox',checked:draft.appearance.pop,disabled:locked,onChange:function(e){appearanceChange('pop',e.target.checked);}}),'轻轻回弹'))),
            h('div', { className: 'dc-panel' }, h('div', { className: 'dc-row' }, toggle('enabled', '让它关心我', '关闭后停止自动提醒，保留你的所有设置。')), h('div', { className: 'dc-status' }, h('span', { className: 'dc-dot' + (status.available && status.config.enabled ? ' is-ready' : '') }), h('div', null, h('p', null, statusText), h('p', { className: 'dc-help' }, '只在观察到持续工作时计时；等审批、提问和静默时段都不会插话。')))),
            h('div', { className: 'dc-panel' }, h('div', { className: 'dc-row' }, h('h3', { className: 'dc-section-title' }, '多说一点，还是少说一点'), h('p', { className: 'dc-help' }, '档位只设上限，不会为了凑次数而打扰你。'), h('div', { className: 'dc-segment', role: 'radiogroup', 'aria-label': '说话频率' }, [['quiet', '安静', '每小时最多 1 句' ], ['standard', '刚刚好', '每小时最多 2 句'], ['chatty', '多聊一点', '每小时最多 3 句']].map(function (option) { return h('button', { key: option[0], type: 'button', role: 'radio', 'aria-checked': draft.frequency === option[0], tabIndex: draft.frequency === option[0] ? 0 : -1, onKeyDown: function (event) { choiceKeys(event, 'frequency', ['quiet', 'standard', 'chatty']); }, className: 'dc-choice', disabled: locked, onClick: function () { change('frequency', option[0]); } }, h('strong', null, option[1]), h('span', null, option[2])); }))), h('div', { className: 'dc-row dc-grid' }, field('quietStart', '安静时间 · 开始', 'time'), field('quietEnd', '安静时间 · 结束', 'time'), field('minGapMinutes', '两次关心至少间隔', 'number', 20, 1440, '即使几个提醒同时到点，也只说一句。'), h('div', { className: 'dc-field' }, h('span', { className: 'dc-label' }, '按这台电脑的时间'), h('p', { className: 'dc-help' }, '安静时间可以跨过午夜。开始与结束相同时，全天不设置静默时段。')))),
            h('div', { className: 'dc-panel' }, h('div', { className: 'dc-row' }, h('h3', { className: 'dc-section-title', style: { marginBottom: 4 } }, '哪几件事，想让它惦记'), h('p', { className: 'dc-help' }, '这些是提醒时机，不是健康记录。休息五分钟后，久坐与连续工作的计时重新开始。')), h('div', { className: 'dc-reminders' }, reminder('sitting', '起来走走', '坐得有点久了', 'sitMinutes', 1440), reminder('water', '记得喝水', '水杯别只是摆设', 'waterMinutes', 1440), reminder('work', '歇一会儿', '连续工作也要留个逗号', 'workMinutes', 1440), reminder('late', '早点收工', '深夜还在忙，就轻声提醒', 'lateAt'))),
            h('div', { className: 'dc-panel' }, h('div', { className: 'dc-row' }, h('h3', { className: 'dc-section-title', style: { marginBottom: 4 } }, '谁来碎碎念'), h('p', { className: 'dc-help' }, '选择台词语气。内置形象在上方单独选择；外部形象在 dsh-pet 中管理。'), h('div', { className: 'dc-segment', role: 'radiogroup', 'aria-label': '角色语气' }, [['silver', '银白', '温柔，慢一点也没关系'], ['orange', '暖橘', '损友式关心，偶尔嘴硬'], ['tide', '潮蓝', '轻轻冒个泡，陪你收工']].map(function (option) { return h('button', { key: option[0], type: 'button', role: 'radio', 'aria-checked': draft.character === option[0], tabIndex: draft.character === option[0] ? 0 : -1, onKeyDown: function (event) { choiceKeys(event, 'character', ['silver', 'orange', 'tide']); }, className: 'dc-choice', disabled: locked, onClick: function () { change('character', option[0]); } }, h('div', { className: 'dc-role' }, h('i', { className: 'dc-role-mark ' + option[0], 'aria-hidden': true }), h('strong', null, option[1])), h('span', null, option[2])); }))), h('div', { className: 'dc-row' }, h('label', { htmlFor: 'dc-petId', className: 'dc-label' }, '外部目标 ID（仅外部模式使用）'), h('input', { id: 'dc-petId', className: 'dc-input', type: 'text', maxLength: 64, value: draft.externalTarget, placeholder: 'main', autoComplete: 'off', spellCheck: false, disabled: locked, onChange: function (event) { change('externalTarget', event.target.value); if(draft.provider==='external')change('petId',event.target.value); }, 'aria-describedby': 'dc-petId-help' }), h('p', { id: 'dc-petId-help', className: 'dc-help', style: { marginTop: 7 } }, '默认 main。多只桌宠时请填写目标宠物 ID，含点号的 ID 也可以原样填写。'), h('p', { className: 'dc-meta' }, '内置模式使用上方外观设置；外部模式保留原 dsh-pet 配置和数据。'))),
            errors.length > 0 && h('div', { className: 'dc-note dc-error', role: 'alert' }, h('ul', { className: 'dc-error-list' }, errors.map(function (text, index) { return h('li', { key: index }, text); }))),
            h('div', { className: 'dc-footer' }, h('div', { className: 'dc-actions' }, h('button', { type: 'submit', className: 'dc-btn dc-btn-primary', disabled: locked || !dirty || errors.length > 0 }, busy === 'save' ? '正在保存…' : '保存设置'), h('button', { type: 'button', className: 'dc-btn', disabled: locked || !dirty, onClick: revert }, '撤销修改')), h('div', { className: 'dc-actions' }, h('button', { type: 'button', className: 'dc-btn', disabled: locked || !status.available, onClick: function () { mutate('snooze', 'snooze', { minutes: 60 }); } }, busy === 'snooze' ? '稍等…' : '安静一小时'), h('button', { type: 'button', className: 'dc-btn', disabled: locked || !status.available, onClick: function () { mutate('test', 'test', {}); } }, busy === 'test' ? '正在说…' : '试说一句（会显示气泡）'))),
            h('div', { 'aria-live': 'polite', style: { minHeight: 27, paddingTop: 9 } }, notice ? h('p', { className: 'dc-notice' }, notice) : dirty ? h('p', { className: 'dc-help' }, '有未保存的修改。试说和安静一小时会使用上次保存的设置。') : h('p', { className: 'dc-help' }, '设置已与服务同步，每 15 秒更新一次状态。')),
            latest && h('div', { className: 'dc-last' }, (KINDS[latest.kind] || '上次关心') + (timeLabel(latest.at) ? ' · ' + timeLabel(latest.at) : ''), latest.text && h('blockquote', null, latest.text))
          )
        );
      }
      return {
        name: 'dsh-pet-company', inject: ['slots','connection'],
        apply: function (ctx) {
          ctx.plugin(createOwnedClientPlugin(React));
          ctx.effect(function () {
            var relay=createRendererRelay({rpc:ctx.connection.rpc});
            void relay.run();
            return function () { return relay.stop(); };
          }, 'company renderer relay');
          ctx.slots.inject('settings.section', function* () {
            yield ctx.slots.register({ name: 'settings.section', id: 'dsh-pet-company', order: 31, label: function () { return '陪伴'; } }, CompanionSettings);
          });
        }
      };
    }
  });
})();
