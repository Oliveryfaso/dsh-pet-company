/* Static DOM snapshots for visual QA. Hook behavior is covered separately; this is not DSH. */
const {writeFileSync,mkdirSync} = require('node:fs');
const {join} = require('node:path');
const {fixture} = require('../test/ui-fixture.cjs');
const out = process.argv[2] || join(__dirname,'../docs/qa/settings');
mkdirSync(out,{recursive:true});
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function markup(node) {
  if (typeof node !== 'object') return escape(node);
  const attrs = Object.entries(node.props).filter(([key,value])=>!key.startsWith('on') && key!=='key' && value !== undefined && value !== null && value !== false).map(([key,value])=>{
    if (key==='className') key='class';
    if (key==='htmlFor') key='for';
    if (key==='style') value=Object.entries(value).map(([name,entry])=>name.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase())+':'+(typeof entry==='number'&&!['lineHeight','fontWeight','opacity'].includes(name)?entry+'px':entry)).join(';');
    return value===true && key==='disabled' ? 'disabled' : key+'="'+escape(value)+'"';
  }).join(' ');
  if(node.type==='style')return '<style>'+node.children.join('')+'</style>';
  const open='<'+node.type+(attrs?' '+attrs:'')+'>';
  return ['input','br','hr','img'].includes(node.type)?open:open+node.children.map(markup).join('')+'</'+node.type+'>';
}
function save(name,f) {
  writeFileSync(join(out,name+'.html'),'<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>陪伴 · '+escape(name)+' · 静态测试快照</title><style>body{margin:0;background:#eef3f5}main{max-width:880px;margin:24px auto;padding:20px 26px;background:#fff;border-radius:20px}@media(max-width:580px){main{margin:0;padding:18px;background:#fff;border-radius:0}}@media(prefers-color-scheme:dark){body{background:#1a252b}main{background:#202e36}}</style><main>'+markup(f.tree)+'</main></html>');
}
(async()=>{
  let f=fixture();save('loading',f);await f.flush();save('ready',f);
  f.input('dc-petId','friend.with.dots');await f.flush();save('dirty',f);
  f.handlers.push(async()=>{throw Error('连接已断开，请确认 DSH 仍在运行后重试。');});await f.poll();await f.flush();save('error',f);f.unmount();
  f=fixture({status:{available:false,reason:'需要先安装并启用 dsh-pet 才能显示宠物',phase:'unavailable'}});await f.flush();save('missing',f);f.unmount();
  console.log('Wrote static UI snapshots to '+out);
})().catch(error=>{console.error(error);process.exitCode=1;});
