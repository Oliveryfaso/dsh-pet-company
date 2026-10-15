import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {runFeedbackChecks} from '../tests/feedback-browser-checks.mjs';
const require=createRequire(import.meta.url);
if(!process.env.PLAYWRIGHT_MODULE)throw new Error('Set PLAYWRIGHT_MODULE to an existing Playwright installation; this script does not install dependencies.');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE);
const root=path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const qa=path.join(root,'docs/qa/feedback');await fs.mkdir(qa,{recursive:true});
const pressure=process.platform==='darwin'?spawnSync('sysctl',['-n','kern.memorystatus_vm_pressure_level'],{encoding:'utf8'}):null;
const memoryPressure=pressure?.status===0?Number(pressure.stdout.trim()):null;
if(process.platform==='darwin'&&memoryPressure!==1)throw new Error('Memory pressure must be normal (1) before this browser check; observed '+memoryPressure);
const browser=await chromium.launch({headless:true,chromiumSandbox:true});
let page;
try{
 page=await browser.newPage({deviceScaleFactor:1});
 const errors=[],requests=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/^https?:/u.test(r.url()))requests.push(r.url());});
 const result=await runFeedbackChecks(page,pathToFileURL(path.join(qa,'demo.html')).href);
 await page.setViewportSize({width:1100,height:760});await page.goto(pathToFileURL(path.join(qa,'demo.html')).href,{waitUntil:'load'});
 await page.waitForFunction(()=>Object.keys(demo.controllers).length===3);
 await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
 const themes=await page.evaluate(()=>Object.keys(demo.controllers).map(theme=>({theme,color:getComputedStyle(demo.controllers[theme].element).getPropertyValue('--fb-line').trim(),text:demo.controllers[theme].element.querySelector('.fb-text').textContent,open:demo.controllers[theme].element.dataset.open})));
 await page.screenshot({path:path.join(qa,'feedback-desktop.png'),fullPage:true});
 await page.setViewportSize({width:375,height:820});await page.goto(pathToFileURL(path.join(qa,'demo.html')).href,{waitUntil:'load'});await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode())));
 await page.screenshot({path:path.join(qa,'feedback-mobile.png'),fullPage:true});
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>demo.controllers.silver.show({eventId:'screenshot:reduced',text:'减少动态：只显示文字云，不缩放伙伴。'}));await page.screenshot({path:path.join(qa,'feedback-reduced.png'),fullPage:true});
 const report={...result,memoryPressureBeforeLaunch:memoryPressure,browser:'existing bundled Chromium, headless, sandbox enabled',themes,errors,externalRequests:requests,screenshots:['feedback-desktop.png','feedback-mobile.png','feedback-reduced.png'],scope:'Independent DOM module only. No DSH host/helper was launched or modified.'};
 await fs.writeFile(path.join(qa,'browser-results.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
 if(errors.length||requests.length)process.exitCode=1;
}catch(error){
 await fs.writeFile(path.join(qa,'browser-results.json'),JSON.stringify({passed:false,error:'Browser verification failed; see the local terminal for details.',scope:'Independent DOM module only'},null,2)+'\n');
 // Failure details remain in the local terminal; do not publish machine paths or accidental screenshots.
 throw error;
}finally{await browser.close();}
