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
  const response=await page.goto(base+'business-card.html');
  assert.equal(response.status(),200);await page.locator('.logo').waitFor();await page.waitForLoadState('networkidle');
  const state=await page.evaluate(()=>({
   overflow:document.documentElement.scrollWidth>innerWidth,
   images:[...document.images].every(i=>i.complete&&i.naturalWidth>0),
   links:[...document.querySelectorAll('.action')].map(a=>a.getAttribute('href')),
   clipped:[...document.querySelectorAll('.action,h1,.role')].some(e=>e.scrollWidth>e.clientWidth),
   logoRatio:document.querySelector('.logo').naturalWidth/document.querySelector('.logo').naturalHeight
  }));
  assert.equal(state.overflow,false);assert.equal(state.clipped,false);assert.equal(state.images,true);assert.equal(state.links.length,3);
  assert.equal(state.links[0],'https://lin.ee/sHZW7NkR');
  assert.equal(errors.length,0);
  assert(!state.links.some(x=>x.startsWith('tel:')||x.includes('.vcf')||x.includes('~')));
  await page.goto(base+'zheng-tong.html');await page.waitForURL('**/business-card.html');
  await page.screenshot({path:'contact-evidence/'+name+'.png',fullPage:true});
  results.push({name,...state,officialLine:true,errors});
  await browser.close();
 }
 fs.writeFileSync('contact-evidence/results.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exit(1)});
