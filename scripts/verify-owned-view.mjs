// Uses an existing Playwright installation; never downloads browsers or dependencies.
import {createServer} from 'node:http';
import {readFile,writeFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';
import assert from 'node:assert/strict';
const root=fileURLToPath(new URL('../',import.meta.url));
const pressure=spawnSync('/usr/sbin/sysctl',['-n','kern.memorystatus_vm_pressure_level'],{encoding:'utf8'});
if(process.platform==='darwin'&&(pressure.status!==0||pressure.stdout.trim()!=='1'))throw Error('Memory pressure must be normal');
if(!process.env.PLAYWRIGHT_MODULE)throw Error('Provide existing PLAYWRIGHT_MODULE; no install is performed');
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE);
const html=`<!doctype html><meta charset="utf-8"><div id="host"></div><script type="module">
import {createOwnedClientPlugin} from '/src/owned/client.js';
import {createOwnedView} from '/src/owned/view.js';
const view=await (await fetch('/fixture-view')).json();
const state={pets:{[view.pet.id]:{say:{counter:0,data:null},anim:{counter:0,data:null}}}};
const host=document.querySelector('#host');let dispose,overlay;
let pops=0;const animate=Element.prototype.animate;Element.prototype.animate=function(...args){pops++;return animate.apply(this,args);};
const nativeFetch=window.fetch;window.fetch=(url,opts)=>url==='/pet-company-runtime/view'?Promise.resolve(Response.json({view,state})):nativeFetch(url,opts);
const React={useRef:()=>({current:host}),useEffect:fn=>{dispose=fn();},createElement:(_tag,{style})=>{for(const [key,value]of Object.entries(style))host.style[key]=typeof value==='number'&&key!=='zIndex'?value+'px':value;return null;}};
createOwnedClientPlugin(React).apply({slots:{inject:(name,gen)=>[...gen()],register:(meta,component)=>{overlay=component;return meta;}}});overlay();
window.fixture={host,state,view,get pops(){return pops;},mountDirect(){dispose();host.removeAttribute('style');const v=createOwnedView(host,view,{assetURL:(id,name)=>'/pet/'+id+'-animation/'+(name?name+'.webm':'')});v.update(state);this.direct=v;return v;},say(n){state.pets[view.pet.id].say={counter:n,data:{text:'喝点水吧',feedback:{eventId:'care-'+n,source:'care'}}};this.direct.update(state);},stop(){this.direct?.destroy();dispose();}};
</script>`;
const {roleView}=await import('../src/owned/config.js');const view=await roleView('companion-silver',{display:'web',corner:'top-left',marginX:50,marginY:70});
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;if(path==='/'){res.setHeader('Content-Type','text/html');return res.end(html);}if(path==='/fixture-view'){res.setHeader('Content-Type','application/json');return res.end(JSON.stringify(view));}if(!/^\/(?:src\/owned|vendor\/dsh-pet-0\.3\.7|compat\/dsh-pet-feedback|pet)\//.test(path))throw Error();const file=resolve(root,'.'+path);if(!file.startsWith(root)||!['.js','.mjs','.webm'].includes(extname(file)))throw Error();res.setHeader('Content-Type',extname(file)==='.webm'?'video/webm':'text/javascript');res.end(await readFile(file));}catch{res.writeHead(404);res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const results=[],errors=[];
try{browser=await chromium.launch({headless:true,chromiumSandbox:true,executablePath:process.env.PLAYWRIGHT_BROWSER_PATH||undefined});const page=await browser.newPage({viewport:{width:1000,height:800}});page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.fixture?.host.querySelector('video'));
 const check=async(name,fn)=>{try{await fn();results.push({name,pass:true});}catch(e){results.push({name,pass:false,error:e.message});}};
 await check('configured_web_position',async()=>assert.deepEqual(await page.evaluate(()=>({left:fixture.host.style.left,top:fixture.host.style.top,right:fixture.host.style.right,bottom:fixture.host.style.bottom})),{left:'50px',top:'70px',right:'auto',bottom:'auto'}));
 await page.evaluate(()=>fixture.mountDirect());await page.waitForFunction(()=>document.querySelector('video.is-front')?.readyState>=2);
 await check('keyboard_has_no_pop',async()=>{const before=await page.evaluate(()=>fixture.pops);await page.locator('.company-hit').press('Enter');assert.equal(await page.evaluate(()=>fixture.pops),before);});
 await check('drag_clears_and_suppresses_care',async()=>{await page.evaluate(()=>fixture.say(1));assert.equal(await page.locator('.dsh-feedback-cloud').getAttribute('data-open'),'true');const b=await page.locator('.company-hit').boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();await page.mouse.move(b.x+b.width/2+30,b.y+b.height/2+10);assert.equal(await page.locator('.dsh-feedback-cloud').getAttribute('data-open'),'false');const before=await page.evaluate(()=>fixture.pops);await page.evaluate(()=>fixture.say(2));assert.equal(await page.locator('.dsh-feedback-cloud').getAttribute('data-open'),'false');assert.equal(await page.evaluate(()=>fixture.pops),before);await page.mouse.up();await page.evaluate(()=>fixture.say(3));assert.equal(await page.locator('.dsh-feedback-cloud').getAttribute('data-open'),'true');});
 await page.evaluate(()=>fixture.stop());
}finally{await browser?.close();await new Promise(r=>server.close(r));}
const report={results,errors,browserClosed:true,normalPressure:true};if(process.env.OWNED_QA_OUTPUT)await writeFile(process.env.OWNED_QA_OUTPUT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(errors.length||results.some(r=>!r.pass))process.exitCode=1;
