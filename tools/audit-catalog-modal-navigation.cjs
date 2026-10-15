"use strict";
// 全站商品入口一致性驗收：商品圖／介紹按鈕先進跳窗，唯一「查看詳細」進詳細頁。
const assert = require("node:assert/strict");
const { chromium, webkit } = require("playwright");
const engine = process.env.XJW_BROWSER_ENGINE || "chromium";
const base = (process.env.XJW_AUDIT_BASE || "http://127.0.0.1:8765/").replace(/\/?$/, "/");
const own = JSON.parse(require("node:fs").readFileSync("public-product-master.json", "utf8")).products || [];
const partner = JSON.parse(require("node:fs").readFileSync("partner-catalog.json", "utf8")).products.filter(p => p.public === true && p.id && p.image && p.page && p.brand);
const expectedCount = own.length + partner.length;
if(expectedCount < 1)throw Error("沒有可驗收的已核准公開商品，不能進行入口測試");
const report={engine,expectedCount,checks:[]};

async function ready(page,path) {
  await page.goto(base+path,{waitUntil:"domcontentloaded",timeout:45000});
  try {
    await page.waitForFunction(() => Boolean(window.__XJW_SITE_INITIALIZED__)
      && document.documentElement.dataset.productIntroMode === "unified-catalog-modal-v1"
      && Boolean(document.getElementById("product-modal")),null,{timeout:30000});
  } catch(error) {
    const state=await page.evaluate(() => ({
      page:document.body?.dataset?.page,
      runtime:document.documentElement.dataset.xjwRuntime,
      mode:document.documentElement.dataset.productIntroMode,
      initialized:Boolean(window.__XJW_SITE_INITIALIZED__),
      modal:Boolean(document.getElementById("product-modal"))
    })).catch(() => ({}));
    throw new Error("商品頁初始化失敗："+path+" "+JSON.stringify(state)+" "+error.message);
  }
}
async function opened(page,name,detailHref) {
  await page.locator("#product-modal.show").waitFor({state:"visible",timeout:10000});
  assert.equal(await page.locator("#product-modal").getAttribute("aria-hidden"),"false");
  assert.equal((await page.locator("#product-modal-title").innerText()).trim(),name);
  const detail=page.locator('#product-modal .modal-actions a[data-product-page-direct="1"]');
  assert.equal(await detail.count(),1,"跳窗必須只有一個詳細頁入口："+name);
  assert.equal((await detail.innerText()).trim(),"查看詳細","所有商品的詳細頁按鈕文字需一致");
  assert.equal(await detail.getAttribute("href"),detailHref);
  assert.equal(await page.locator('#product-modal .modal-variant-links a[href]').count(),0,"跳窗內不能藏第二組直通詳細頁入口");
  await page.waitForFunction(() => {
    const image=document.querySelector("#product-modal.show .modal-gallery__item img");
    return Boolean(image?.complete && image.naturalWidth>0);
  },null,{timeout:15000});
  const artwork=await page.locator("#product-modal").evaluate(modal=>{
    const panel=modal.querySelector(".product-modal__panel");
    const photo=modal.querySelector(".modal-gallery__item img");
    const intro=modal.querySelector(".modal-intro h2");
    const content=modal.querySelector(".modal-preview");
    const css=getComputedStyle(panel),photoCss=getComputedStyle(photo),introCss=getComputedStyle(intro);
    return {background:css.backgroundImage,borderTop:parseFloat(css.borderTopWidth),titleColor:introCss.color,
      photoFit:photoCss.objectFit,photoLoaded:photo.complete&&photo.naturalWidth>0,
      foreground:getComputedStyle(content).color,contentSize:parseFloat(getComputedStyle(content).fontSize),
      scrollWidth:document.documentElement.scrollWidth,viewport:innerWidth};
  });
  assert.match(artwork.background,/mountains-center\.webp/,"產品跳窗應延續仙加味山水紙感背景");
  assert.ok(artwork.borderTop>=4,"產品跳窗應有清楚的金色飾線");
  assert.equal(artwork.photoFit,"contain","產品原圖必須等比例完整呈現");
  assert.ok(artwork.photoLoaded,"商品跳窗主圖需正常載入");
  assert.ok(artwork.contentSize>=15,"手機與桌機的商品介紹需保持可讀性");
  assert.ok(artwork.scrollWidth<=artwork.viewport+3,"產品跳窗不得造成橫向溢位");
  assert.ok(await page.locator("#product-modal .modal-gallery img").count()>0,"跳窗需有正式產品主圖");
  report.checks.push(name+"：山水背景、正式主圖與唯一查看詳細");
  return detail;
}
async function close(page) {
  await page.locator("#product-modal-close").click();
  await page.locator("#product-modal.show").waitFor({state:"hidden"});
  assert.equal(await page.locator("#product-modal").getAttribute("aria-hidden"),"true");
}
(async()=>{
 const browser=await ({chromium,webkit}[engine]).launch({headless:true});
 try {
  for(const [device,options] of Object.entries({
    desktop:{viewport:{width:1366,height:900},isMobile:false},
    phone:{viewport:{width:390,height:844},isMobile:true,hasTouch:true}
  })){
    const context=await browser.newContext({...options,reducedMotion:"reduce",locale:"zh-TW"});
    const page=await context.newPage();
    try{
      await ready(page,"products.html");
      const cards=page.locator('#product-list .product-card[data-product-id],#partner-product-list .product-card[data-product-id]');
      await page.waitForFunction(count=>document.querySelectorAll('#product-list .product-card[data-product-id],#partner-product-list .product-card[data-product-id]').length===count,expectedCount,{timeout:20000});
      assert.equal(await cards.count(),expectedCount);
      for(let i=0;i<expectedCount;i++){
        const card=cards.nth(i),name=(await card.locator("h3").innerText()).trim();
        const href=await card.locator(".product-card__actions a[href]").getAttribute("href");
        assert.match(href,/^product-[a-z0-9-]+\.html$/);
        assert.equal(await card.locator('.product-card__actions a[data-product-intro="1"]').count(),1);
        assert.equal(await card.locator('[data-product-page-direct="1"]').count(),0);
        const url=page.url();

        await card.locator(".product-card__img img").click();
        assert.equal(page.url(),url,"主圖不可直接跳詳細頁");
        await opened(page,name,href);await close(page);
        report.checks.push(device+"："+name+" 圖片");

        await card.locator(".product-card__actions a").click();
        assert.equal(page.url(),url,"產品介紹按鈕不可直接跳詳細頁");
        await opened(page,name,href);
        await page.keyboard.press("Escape");
        await page.locator("#product-modal.show").waitFor({state:"hidden"});
        report.checks.push(device+"："+name+" 按鈕");

        await card.locator("h3").click();
        const detail=await opened(page,name,href);
        await detail.click();
        await page.waitForURL(u=>u.pathname.endsWith("/"+href),{timeout:15000});
        assert.ok(await page.locator("h1").count()>0,"查看詳細應載入完整詳細頁："+href);
        if(href==="product-danshen-tea.html"){
          const series=partner.find(p=>p.page===href);
          assert.equal(await page.locator('.product-variant').count(),series?.variants?.length||0,"系列完整頁保留當期核准款式");
        }
        report.checks.push(device+"："+name+" 查看詳細");
        await ready(page,"products.html");
      }

      await ready(page,"index.html");
      const home=page.locator('.home-product-showcase__grid a[href^="product-"]');
      assert.equal(await home.count(),own.length,"首頁原有四項正式商品維持一致");
      for(let i=0;i<await home.count();i++){
        const entry=home.nth(i),href=await entry.getAttribute("href");
        const name=(await entry.locator("span").innerText()).trim();
        const before=page.url();
        await entry.locator("img").click();
        assert.equal(page.url(),before,"首頁主圖不可直接跳詳細頁");
        await opened(page,name,href);await close(page);
      }
      report.checks.push(device+"：首頁商品主圖");

      for(const other of ["trial.html","choose.html","combo.html","recipes.html","dm.html","why-guilu.html"]){
        await ready(page,other);
        const link=page.locator('a[href^="product-"]:visible').first();
        if(!await link.count()){
          // 行動版會隱藏表格中的直接產品連結；隱藏項仍不得保留直達詳細頁的 JS 行為。
          const nonVisible=page.locator('a[href^="product-"]');
          assert.ok(await nonVisible.count(),"頁面沒有正式商品參考連結："+other);
          assert.equal(await nonVisible.first().getAttribute("data-product-intro"),"1",
            "隱藏的商品連結仍應統一標記為跳窗入口："+other);
          report.checks.push(device+"："+other+" 隱藏對照表入口已正規化");
          continue;
        }
        const href=await link.getAttribute("href");
        const current=page.url();
        await link.click();
        assert.equal(page.url(),current,"商品連結不可繞過跳窗："+other);
        await page.locator("#product-modal.show").waitFor({state:"visible"});
        assert.equal(await page.locator('#product-modal .modal-actions a[data-product-page-direct="1"]').getAttribute("href"),href);
        await close(page);
        report.checks.push(device+"："+other+" 商品入口");
      }

      await ready(page,"trial.html");
      const trialPhotos=page.locator('.trial-product-card__media a[data-product-intro="1"]');
      assert.equal(await trialPhotos.count(),2,"試喝頁30cc／180cc產品圖都要能開啟跳窗");
      for(let i=0;i<2;i++){
        const picture=trialPhotos.nth(i),href=await picture.getAttribute("href");
        const name=(await picture.locator("img").getAttribute("alt")).includes("30cc")
          ?"龜鹿飲30cc玻璃罐":"龜鹿飲180cc鋁袋";
        await picture.locator("img").click();
        await opened(page,name,href);await close(page);
      }
      report.checks.push(device+"：試喝頁兩項實物圖片");

      if(device==="desktop"){
        await page.route("**/partner-catalog.json*",route=>route.abort("failed"));
        await ready(page,"products.html");
        const backups=page.locator('#partner-product-list .product-card[data-fallback-product]');
        assert.ok(await backups.count()>=1,"商品目錄暫時失敗時，既有備援卡不可全部消失");
        for(let i=0;i<await backups.count();i++){
          const backup=backups.nth(i),href=await backup.locator('.product-card__actions a').getAttribute("href");
          const name=(await backup.locator("h3").innerText()).trim();
          await backup.locator(".product-card__img img").click();
          await opened(page,name,href);await close(page);
        }
        report.checks.push("備援商品主圖也進同一跳窗");
      }
    }finally{await page.close();await context.close();}
  }
 }finally{await browser.close();}
 console.log(JSON.stringify(report,null,2));
})().catch(e=>{console.error("商品入口驗收失敗",e);process.exitCode=1});
