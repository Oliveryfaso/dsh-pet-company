#!/usr/bin/env node
/** Capture the generated preview with an existing headless Playwright installation. */
import path from 'node:path';
import fs from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.resolve(process.argv[2]||path.join(path.dirname(fileURLToPath(import.meta.url)),'..'));
const browser=await chromium.launch({headless:true,chromiumSandbox:true});
try{
 const page=await browser.newPage({viewport:{width:1120,height:780},deviceScaleFactor:1});
 await page.goto('file://'+path.join(root,'assets/characters/preview.html'),{waitUntil:'load'});
 await page.screenshot({path:path.join(root,'assets/characters/preview.png'),fullPage:true});
 await page.setViewportSize({width:375,height:900});
 await page.screenshot({path:path.join(root,'qa/fywdy/preview-mobile.png'),fullPage:true});
 const layout=await page.evaluate(()=>({innerWidth,scrollWidth:document.documentElement.scrollWidth,videoControls:[...document.querySelectorAll('video')].map(v=>v.controls),buttons:[...document.querySelectorAll('.play')].map(b=>b.textContent)}));
 if(layout.scrollWidth>layout.innerWidth||layout.videoControls.some(Boolean)||layout.buttons.length!==3)throw new Error('Preview layout or external playback controls failed');
 await fs.writeFile(path.join(root,'qa/fywdy/preview-layout.json'),JSON.stringify(layout,null,2)+'\n');
 console.log(JSON.stringify(layout));
}finally{await browser.close();}
