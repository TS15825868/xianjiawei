'use strict';
/* Regression: the simplified mobile links hub retains direct LINE and site entry,
 * without the redundant QR dialog. Safari back navigation must stay usable. */
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const engine=process.env.XJW_BROWSER_ENGINE||'chromium';
const base=process.env.XJW_AUDIT_BASE||'http://127.0.0.1:8765/';
async function main(){
 const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true});
 const ctx=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:3,isMobile:true,hasTouch:true,locale:'zh-TW',reducedMotion:'reduce'});
 const page=await ctx.newPage();
 try{
  await page.goto(new URL('links.html',base).href,{waitUntil:'domcontentloaded'});
  const line=page.locator('a.hub-primary[href="https://lin.ee/sHZW7NkR"]');
  assert.equal(await line.count(),1,'One prominent official LINE entry');
  assert.equal(await line.isVisible(),true,'LINE CTA visible');
  assert.match(await line.innerText(),/諮詢・試喝・訂購・合作/);
  assert.equal(await page.locator('#show-line-qr,#line-qr-dialog').count(),0,'No duplicate QR dialog controls');
  const home=page.getByRole('link',{name:/官方網站/}).first();
  await home.click();
  assert.match(new URL(page.url()).pathname,/\/index\.html$/);
  const logo=page.locator('.btn-primary .btn__brand-logo').first();
  await logo.waitFor({state:'visible'});
  const seal=await logo.evaluate(img=>({background:getComputedStyle(img).backgroundColor,padding:getComputedStyle(img).paddingLeft,width:img.getBoundingClientRect().width}));
  assert.equal(seal.background,'rgb(255, 253, 247)');
  assert.notEqual(seal.padding,'0px');
  assert.ok(seal.width>0);
  await page.goBack({waitUntil:'domcontentloaded'});
  assert.equal(await line.isVisible(),true,'LINE remains usable after Safari back');
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
  assert.ok(overflow<=2,'No horizontal overflow');
  console.log('PASS '+engine+' iPhone direct LINE / home / back and logo contrast');
 }finally{await ctx.close();await browser.close();}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
