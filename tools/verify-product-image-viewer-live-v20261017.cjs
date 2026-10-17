"use strict";
const {chromium,webkit,devices}=require("playwright");
const assert=require("node:assert/strict");
const URL="https://ts15825868.github.io/xianjiawei/product-danshen-tea.html?test=20261017-owner-photo-main-v4";
async function testMode(browserType,profile){
  const browser=await browserType.launch({headless:true});
  try{
    const context=await browser.newContext(profile==="mobile"?{
      ...devices["iPhone 13"],locale:"zh-TW"
    }:{viewport:{width:1440,height:900},locale:"zh-TW"});
    const page=await context.newPage();
    const res=await page.goto(URL,{waitUntil:"domcontentloaded",timeout:60000});
    assert(res && res.ok(),"public product page must return 200");
    await page.locator(".product-photo-more a").first().waitFor({state:"visible"});
    const initial=page.url();
    await page.locator(".product-photo-more a").first().click();
    const dialog=page.getByRole("dialog",{name:"仙加味完整商品照片"});
    await dialog.waitFor({state:"visible"});
    const close=dialog.getByRole("button",{name:"✕ 關閉"});
    const back=dialog.getByRole("button",{name:"← 返回商品"});
    assert(await close.isVisible(),"explicit close required");
    assert(await back.isVisible(),"explicit back required");
    const dims=await close.boundingBox();
    assert(dims && dims.width>=44 && dims.height>=44,"mobile close must have tappable target");
    await close.click();
    await dialog.waitFor({state:"detached"});
    assert.equal(page.url(),initial,"closing must stay on original page");
    await page.locator(".product-photo-more a").nth(1).click();
    await dialog.waitFor({state:"visible"});
    await back.click();
    await dialog.waitFor({state:"detached"});
    assert.equal(page.url(),initial,"return must stay on original page");
    await context.close();
    console.log("PASS",browserType.name(),profile,"open front/close/open back/return");
  }finally{await browser.close()}
}
(async()=>{
for(const browser of [chromium,webkit]){
  for(const profile of ["desktop","mobile"]){await testMode(browser,profile)}
}
})().catch(e=>{console.error(e);process.exitCode=1});
