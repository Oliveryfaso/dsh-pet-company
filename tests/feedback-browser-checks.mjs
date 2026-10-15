/** Run inside the parent's existing Playwright browser. Does not launch a browser or server. */
import assert from 'node:assert/strict';
export async function runFeedbackChecks(page,url){
 const checks=[];
 await page.setViewportSize({width:1100,height:760});
 await page.goto(url,{waitUntil:'load'});
 await page.evaluate(()=>{
  Object.values(demo.controllers).forEach(c=>c.close());
  const actor=document.createElement('div');actor.id='feedback-test-actor';Object.assign(actor.style,{position:'fixed',left:'520px',top:'400px',width:'80px',height:'100px'});document.body.append(actor);
  const input=document.querySelector('#typing');input.focus();
  window.testFeedback=DSHFeedback.createPetFeedback({actor,theme:'silver',onRegionsChange:(rects,visible)=>{window.testRegions={rects,visible};window.testRegionCount=(window.testRegionCount||0)+1;}});
 });
 const inspect=()=>page.evaluate(()=>({state:testFeedback.getState(),open:testFeedback.element.dataset.open,text:testFeedback.element.querySelector('.fb-text').textContent,active:document.activeElement.id,regions:testRegions,animations:document.querySelector('#feedback-test-actor').getAnimations().map(a=>({duration:a.effect.getTiming().duration,frames:a.effect.getKeyframes().map(f=>f.transform)}))}));
 await page.evaluate(()=>testFeedback.show({eventId:'case:literal',text:'<img src=x onerror=alert(1)> 你好🙂',trigger:'care'}));
 let result=await inspect();assert.equal(result.active,'typing');assert.equal(result.text,'<img src=x onerror=alert(1)> 你好🙂');assert.equal(await page.locator('.dsh-feedback-cloud img').count(),0);assert.equal(result.animations.length,1);assert.equal(result.animations[0].duration,220);assert.deepEqual(result.animations[0].frames,['scale(1)','scale(0.97)','scale(1.01)','scale(1)']);checks.push('literal text / input focus / uniform 220ms motion');
 const expires=result.state.expiresAt;
 await page.evaluate(()=>testFeedback.show({eventId:'case:literal',text:'重复提醒不得替换或续时'}));result=await inspect();assert.equal(result.state.expiresAt,expires);assert.ok(result.text.startsWith('<img'));checks.push('same event ID does not replace or extend');
 await page.evaluate(()=>{testFeedback.show({eventId:'case:replace',text:'新的一条'});testFeedback.show({eventId:'case:reenter',text:'最后一条'});});result=await inspect();assert.equal(result.text,'最后一条');assert.equal(result.animations.length,1);checks.push('reentry replaces one message / cancels old animation');
 await page.evaluate(()=>testFeedback.show({eventId:'case:shared',text:'默认招呼',fallback:true}));const shared=await inspect();await page.evaluate(()=>testFeedback.show({eventId:'case:shared',text:'真正的关怀提醒'}));result=await inspect();assert.equal(result.text,'真正的关怀提醒');assert.equal(result.state.expiresAt,shared.state.expiresAt);assert.equal(result.animations.length,1);checks.push('shared ID fallback upgrades text without extra pop or lifetime');
 await page.evaluate(()=>{testFeedback.setReducedMotion(true);testFeedback.show({eventId:'case:reduced',text:'不缩放'});});result=await inspect();assert.equal(result.animations.length,0);assert.equal(await page.evaluate(()=>getComputedStyle(testFeedback.element).transform),'none');checks.push('reduced motion cancels actor and cloud scale');
 await page.evaluate(()=>{testFeedback.setReducedMotion(false);testFeedback.setPresentation({pop:false});testFeedback.show({eventId:'case:no-pop',text:'只显示云朵'});});result=await inspect();assert.equal(result.open,'true');assert.equal(result.animations.length,0);checks.push('pop false keeps cloud');
 await page.evaluate(()=>{testFeedback.setPresentation({pop:true,cloud:false});testFeedback.show({eventId:'case:no-cloud',text:'只做轻回弹'});});result=await inspect();assert.equal(result.open,'false');assert.equal(result.animations.length,1);assert.deepEqual(result.regions,{rects:[],visible:false});checks.push('cloud false keeps pop / releases input regions');
 await page.evaluate(()=>{testFeedback.setPresentation({cloud:true});testFeedback.dragStart();testFeedback.show({eventId:'case:drag-care',text:'拖动中不显示'});testFeedback.dragEnd();testFeedback.show({eventId:'case:drag-click',text:'不把释放当点击',trigger:'click'});});result=await inspect();assert.equal(result.open,'false');assert.equal(result.animations.length,0);checks.push('drag clears / ignores in-drag events and synthetic click');
 await page.evaluate(()=>testFeedback.show({eventId:'case:close',text:'关闭不抢焦点'}));
 const close=page.locator('.dsh-feedback-cloud[data-open=true] .fb-close');await close.click();result=await inspect();assert.equal(result.active,'typing');assert.equal(result.open,'false');assert.deepEqual(result.regions,{rects:[],visible:false});checks.push('close preserves focus / releases input regions');
 await page.evaluate(()=>{testFeedback.setPresentation({closeSeconds:.25});testFeedback.show({eventId:'case:expiry',text:'短时验证'});});await page.waitForFunction(()=>testFeedback.getState().phase==='hidden',{},{timeout:2000});checks.push('automatic expiry');
 for(const size of [{width:375,height:667},{width:240,height:200}]){
  await page.setViewportSize(size);
  await page.evaluate(()=>{Object.assign(document.querySelector('#feedback-test-actor').style,{left:(innerWidth-75)+'px',top:'8px',width:'60px',height:'70px'});testFeedback.setPresentation({closeSeconds:8});testFeedback.show({eventId:'case:edge:'+innerWidth,text:'到边缘会翻转，留出一些空隙。'.repeat(12)});testFeedback.reposition();});
  await page.waitForFunction(()=>{const r=testFeedback.element.getBoundingClientRect();return testFeedback.element.dataset.placement==='below'&&r.x>=11&&r.y>=11&&r.right<=innerWidth-11&&r.bottom<=innerHeight-11;});
  const r=await page.evaluate(()=>{const r=testFeedback.element.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:innerWidth,height:innerHeight,placement:testFeedback.element.dataset.placement,scroll:document.documentElement.scrollWidth};});assert.ok(r.x>=11&&r.y>=11&&r.right<=r.width-11&&r.bottom<=r.height-11,JSON.stringify(r));assert.equal(r.placement,'below');checks.push(`viewport ${size.width}×${size.height} / flip / padding`);
 }
 await page.setViewportSize({width:240,height:96});await page.evaluate(()=>testFeedback.reposition());result=await inspect();assert.equal(result.open,'false');assert.deepEqual(result.regions,{rects:[],visible:false});checks.push('very short work area hides cloud without intercepting input');await page.setViewportSize({width:375,height:667});await page.evaluate(()=>testFeedback.reposition());result=await inspect();assert.equal(result.open,'true');checks.push('cloud recovers after usable area returns');
 await page.evaluate(()=>testFeedback.destroy());assert.equal(await page.locator('#feedback-test-actor').evaluate(e=>e.getAnimations().length),0);checks.push('destroy cancels effects and removes cloud');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(()=>{window.testFeedback=DSHFeedback.createPetFeedback({actor:document.querySelector('#feedback-test-actor')});testFeedback.show({eventId:'case:os-reduced',text:'系统减少动态'});});result=await inspect();assert.equal(result.animations.length,0);assert.equal(await page.evaluate(()=>getComputedStyle(testFeedback.element).transform),'none');checks.push('OS prefers-reduced-motion');
 await page.evaluate(()=>testFeedback.destroy());await page.emulateMedia({reducedMotion:'no-preference'});
 return {kind:'standalone DOM feedback module, not DSH host acceptance',checks:checks.length,passed:checks};
}
