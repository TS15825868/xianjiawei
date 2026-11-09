"use strict";
/* Audit legacy URLs and standalone customer pages without assuming the shared
   header exists. Public product details remain controlled by official masters. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {chromium, webkit} = require("playwright");
const engine = process.env.XJW_BROWSER_ENGINE || "chromium";
const base = process.env.XJW_AUDIT_BASE || "https://ts15825868.github.io/xianjiawei/";
const redirectTargets = [
  ["business-card.html","links.html"],
  ["zheng-tong.html","links.html"],
  ["product-guilu-jiao.html","products.html"],
  ["product-guilu-tangkuai.html","products.html"],
  ["product-jianfeng-fiber-tea.html","product-danshen-tea.html"],
  ["product-jianfeng-leisure-tea.html","product-danshen-tea.html"],
  ["product-jianfeng-refresh-tea.html","product-danshen-tea.html"],
  ["product-jianfeng-rose-fruit-tea.html","product-danshen-tea.html"],
  ["product-jianfeng-white-tea.html","product-danshen-tea.html"],
  ["product-jianfeng-wudahan-tea.html","product-danshen-tea.html"]
];
const standalone = ["links.html","post-image-guilu-drink.html"];
const report = {engine,base,redirects:[],standalone:[],errors:[]};
const browserType = engine==="webkit"?webkit:chromium;
async function audit() {
  for (const source of ["publishing-center.html","post-bank-export.html"]) {
    const html=fs.readFileSync(source,"utf8");
    assert.match(html,/noindex/i,source+" must not be indexed");
    assert.match(html,/nofollow/i,source+" must not be followed by crawlers");
  }
  const browser=await browserType.launch();
  try{
    for(const viewport of [{name:"desktop",width:1365,height:900},{name:"phone",width:390,height:844}]) {
      const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},locale:"zh-TW",reducedMotion:"reduce",deviceScaleFactor:1});
      try{
        for(const source of standalone) {
          const page=await context.newPage();
          try {
            const response=await page.goto(new URL(source,base).href,{waitUntil:"domcontentloaded",timeout:30000});
            await page.locator("main").waitFor({state:"visible",timeout:10000});
            await page.waitForLoadState("networkidle",{timeout:12000}).catch(()=>{});
            const result=await page.evaluate(()=>{
              const imgs=[...document.images];
              const interactive=[...document.querySelectorAll("a[href]")].filter(a=>a.getClientRects().length);
              return {
                h1:document.querySelector("main h1")?.textContent.trim()||"",
                scrollWidth:document.documentElement.scrollWidth,
                width:innerWidth,
                brokenImages:imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),
                invalidLinks:interactive.filter(a=>!a.getAttribute("href")||a.getAttribute("href")==="#"||(!a.textContent.trim()&&!a.getAttribute("aria-label")&&!a.querySelector("img[alt]"))).map(a=>a.outerHTML.slice(0,160)),
                imageStyles:imgs.filter(i=>i.closest(".product-photo-frame")).map(i=>({fit:getComputedStyle(i).objectFit,transform:getComputedStyle(i).transform}))
              };
            });
            if(response?.status()!==200||!result.h1||result.scrollWidth>result.width+4||result.brokenImages.length||result.invalidLinks.length||result.imageStyles.some(x=>x.fit!=="contain"||x.transform!=="none")) {
              report.errors.push({page:source,viewport:viewport.name,status:response?.status(),...result});
            }
            report.standalone.push({page:source,viewport:viewport.name,status:response?.status(),h1:result.h1,overflow:result.scrollWidth-result.width,images:result.imageStyles.length});
            if(source==="links.html") {
              fs.mkdirSync("standalone-screens",{recursive:true});
              await page.screenshot({path:"standalone-screens/"+engine+"-"+viewport.name+"-links.png",fullPage:true,animations:"disabled"});
            }
          }catch(e){report.errors.push({page:source,viewport:viewport.name,error:String(e)})}
          finally{await page.close()}
        }
        if(viewport.name==="phone") {
          for(const [source,target] of redirectTargets) {
            const page=await context.newPage();
            try{
              await page.goto(new URL(source,base).href,{waitUntil:"domcontentloaded",timeout:30000});
              await page.waitForURL(u=>u.pathname.endsWith("/"+target),{timeout:14000});
              const finalUrl=new URL(page.url());
              const ok=finalUrl.pathname.endsWith("/"+target)&&finalUrl.origin===new URL(base).origin;
              if(!ok)report.errors.push({redirect:source,target,actual:page.url()});
              report.redirects.push({from:source,to:target,ok});
            }catch(e){report.errors.push({redirect:source,target,error:String(e)})}
            finally{await page.close()}
          }
        }
      }finally{await context.close()}
    }
  }finally{await browser.close()}
  fs.writeFileSync("standalone-audit-report.json",JSON.stringify(report,null,2));
  console.log("STANDALONE_AUDIT",JSON.stringify({engine,pages:report.standalone.length,redirects:report.redirects.length,errors:report.errors.length}));
  for(const err of report.errors)console.error("STANDALONE_FAILURE",JSON.stringify(err));
  if(report.errors.length)process.exitCode=1;
}
audit().catch(err=>{console.error(err);process.exitCode=1;});
