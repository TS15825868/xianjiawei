const { chromium, webkit, devices } = require('playwright');
const fs = require('fs'), assert = require('node:assert/strict');
(async () => {
 const base = 'http://127.0.0.1:8765/';
 const results = [];
 fs.mkdirSync('contact-evidence', {recursive:true});
 for (const [name, type, config] of [
  ['iphone-safari',webkit,devices['iPhone 13']],
  ['android-chrome',chromium,devices['Pixel 7']],
  ['line-mobile-viewport',chromium,{...devices['iPhone 13'],defaultBrowserType:'chromium',userAgent:devices['iPhone 13'].userAgent+' Line/15.0.0'}],
  ['desktop-chrome',chromium,{viewport:{width:1440,height:1000}}]
 ]) {
  const browser=await type.launch();
  const page=await browser.newPage(config);
  const errors=[];page.on('pageerror', e=>errors.push(e.message));
  const response=await page.goto(base+'zheng-tong.html');
  assert.equal(response.status(),200);await page.locator('.logo').waitFor();await page.waitForLoadState('networkidle');
  const state=await page.evaluate(()=>({
   overflow:document.documentElement.scrollWidth>innerWidth,
   images:[...document.images].every(i=>i.complete&&i.naturalWidth>0),
   links:[...document.querySelectorAll('.action')].map(a=>a.getAttribute('href')),
   clipped:[...document.querySelectorAll('.action,h1,.role')].some(e=>e.scrollWidth>e.clientWidth),
   logoRatio:document.querySelector('.logo').naturalWidth/document.querySelector('.logo').naturalHeight
  }));
  assert.equal(state.overflow,false);assert.equal(state.clipped,false);assert.equal(state.images,true);assert.equal(state.links.length,4);
  assert.equal(state.links[1],'https://line.me/ti/p/~chengtung');assert.equal(state.links[2],'tel:+886952314069');
  assert.equal(errors.length,0);
  const v=await page.request.get(base+state.links[3]);assert.equal(v.status(),200);
  const bytes=await v.body(), text=bytes.toString('utf8');
  assert(text.includes('FN;CHARSET=UTF-8:鄭統\r\n'));assert(text.includes('ORG;CHARSET=UTF-8:仙加味\r\n'));
  assert(!text.includes('\\r\\n'));assert(text.includes('TEL;TYPE=CELL,VOICE:+886952314069'));
  await page.screenshot({path:'contact-evidence/'+name+'.png',fullPage:true});
  results.push({name,...state,vCard:true,errors});
  await browser.close();
 }
 fs.writeFileSync('contact-evidence/results.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exit(1)});
