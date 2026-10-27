'use strict';
/* Regression: iPhone Safari LINE QR open/close/back never traps the one-page links hub.
 * Run with the already installed Playwright browser in catalog-modal-navigation CI.
 */
const assert=require('node:assert/strict');
const {chromium,webkit}=require('playwright');
const engine=process.env.XJW_BROWSER_ENGINE||'chromium';
const base=process.env.XJW_AUDIT_BASE||'http://127.0.0.1:8765/';
async function main(){
  const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true});
  const ctx=await browser.newContext({
    viewport:{width:390,height:844},
    deviceScaleFactor:3,isMobile:true,hasTouch:true,locale:'zh-TW',
    reducedMotion:'reduce'
  });
  const page=await ctx.newPage();
  try{
    await page.goto(new URL('links.html',base).href,{waitUntil:'domcontentloaded'});
    const trigger=page.getByRole('button',{name:'顯示官方 LINE QR Code'});
    const dialog=page.locator('#line-qr-dialog');
    await trigger.waitFor({state:'visible'});
    const url=page.url();
    const before=await page.evaluate(()=>({
      pageHeight:document.documentElement.scrollHeight,
      scrollY:window.scrollY,
      lock:document.body.style.overflow
    }));
    assert.equal(await dialog.isVisible(),false,'QR dialog must start closed');
    await trigger.click();
    assert.equal(await dialog.isVisible(),true,'QR opens an accessible modal');
    assert.equal(await dialog.evaluate(node=>node.open),true);
    assert.equal(await page.url(),url,'Opening QR must not navigate away');
    assert.equal(await page.locator('#line-qr-dialog img').evaluate(img=>img.getAttribute('src')),'images/official-line-qr.svg');
    const opened=await page.evaluate(()=>({
      pageHeight:document.documentElement.scrollHeight,
      lock:document.body.style.overflow
    }));
    assert.ok(Math.abs(before.pageHeight-opened.pageHeight)<=2,'QR must not expand height-locked hub');
    assert.equal(opened.lock,before.lock,'QR must not trap document body scrolling');
    await page.getByRole('button',{name:'關閉並返回連結'}).click();
    assert.equal(await dialog.isVisible(),false,'Close QR returns to normal links hub');
    assert.equal(await dialog.evaluate(node=>node.open),false);
    assert.equal(await page.url(),url);
    // Repeat modal open/close to catch stale iOS states.
    await trigger.click();
    await page.keyboard.press('Escape');
    assert.equal(await dialog.isVisible(),false,'Escape returns to normal links hub');
    const home=page.getByRole('link',{name:/官方網站/}).first();
    await home.click();
    await page.waitForURL(/index\\.html/);
    const brandLogo=page.locator('.btn-primary .btn__brand-logo').first();
    await brandLogo.waitFor({state:'visible'});
    const seal=await brandLogo.evaluate(img=>({
      background:getComputedStyle(img).backgroundColor,
      padding:getComputedStyle(img).paddingLeft,
      width:img.getBoundingClientRect().width,
      visible:img.getBoundingClientRect().width>0
    }));
    assert.equal(seal.background,'rgb(255, 253, 247)','Official red logo needs a cream contrast backing');
    assert.notEqual(seal.padding,'0px','Seal must be separated visually from maroon CTA');
    assert.ok(seal.visible,'Official seal remains visible');
    await page.goBack({waitUntil:'domcontentloaded'});
    await trigger.waitFor({state:'visible'});
    assert.equal(await dialog.isVisible(),false,'Back navigation must not resurrect QR modal');
    await trigger.click();
    assert.equal(await dialog.isVisible(),true,'QR can be reopened after Safari back navigation');
    await page.getByRole('button',{name:'關閉並返回連結'}).click();
    assert.equal(await dialog.isVisible(),false);
    const layout=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth-window.innerWidth,
      bodyLock:document.body.style.overflow
    }));
    assert.ok(layout.overflow<=2,'No horizontal overflow after returning to links');
    assert.equal(layout.bodyLock,before.lock);
    console.log('PASS '+engine+' iPhone links QR open/close/escape/back, and original brand logo contrast');
  } finally{
    await ctx.close();
    await browser.close();
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
