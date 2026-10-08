/* Production visual evidence and functional checks for the shared landscape design. */
const fs=require('fs');const {chromium,webkit}=require('playwright');
const engine=process.env.XJW_BROWSER_ENGINE||'chromium';
const base=(process.env.XJW_AUDIT_BASE||'http://127.0.0.1:8765/').replace(/\/?$/,'/');
const release='20261008-readable-v48';
const pages=fs.readdirSync('.').filter(p=>p.endsWith('.html')&&(fs.readFileSync(p,'utf8').includes('site.js?v='+release)||p==='links.html'));
const devices={desktop:{width:1440,height:1000},tablet:{width:820,height:1180},phone:{width:390,height:844}};
const dir='visual-evidence-'+engine;fs.mkdirSync(dir,{recursive:true});
const report={engine,base,release,generatedAt:new Date().toISOString(),pages,checks:[],errors:[]};
function check(ok,type,detail){report.checks.push({ok,type,...detail});if(!ok)report.errors.push({type,...detail});}
(async()=>{const browser=await({chromium,webkit}[engine]).launch({headless:true});
for(const [device,viewport]of Object.entries(devices)){
 const context=await browser.newContext({viewport,deviceScaleFactor:1,hasTouch:device==='phone',isMobile:device==='phone',reducedMotion:'reduce'});
 for(const file of pages){const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  const response=await page.goto(base+file+'?visual='+release,{waitUntil:'load',timeout:60000});
  check(response.status()===200||(file==='404.html'&&response.status()===404),'http',{file,device,status:response.status()});
  if(file!=='links.html')await page.waitForFunction(()=>window.__XJW_SITE_INITIALIZED__&&document.querySelector('#site-footer .footer-card'),{timeout:20000});
  await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=700){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,35))}await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));window.scrollTo(0,0)});
  await page.waitForTimeout(1800);
  const audit=await page.evaluate(()=>{
   const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
   const imageErrors=[...document.images].filter(visible).filter(i=>!i.complete||!i.naturalWidth).map(i=>i.getAttribute('src'));
   const css=[...document.querySelectorAll('link[rel=stylesheet]')].map(l=>l.getAttribute('href'));
   const productImages=[...document.images].filter(i=>i.src.includes('/product-main/')&&visible(i)).map(i=>({src:i.src,fit:getComputedStyle(i).objectFit,transform:getComputedStyle(i).transform}));
   const rgb=s=>(s.match(/[\d.]+/g)||[]).slice(0,3).map(Number);
   const lum=s=>rgb(s).map(c=>{c/=255;return c<=.04045?c/12.92:Math.pow((c+.055)/1.055,2.4)}).reduce((a,c,i)=>a+c*[.2126,.7152,.0722][i],0);
   const contrast=(a,b)=>{a=lum(a);b=lum(b);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05)};
   const contrastErrors=[...document.querySelectorAll('.btn,.header-line-cta,.site-footer h3,.site-footer p,.site-footer a,.footer-legal')].filter(visible).map(e=>{const s=getComputedStyle(e);let p=e;while(p&&getComputedStyle(p).backgroundColor==='rgba(0, 0, 0, 0)')p=p.parentElement;const bg=p?getComputedStyle(p).backgroundColor:'rgb(247,244,237)';return {text:e.textContent.trim().slice(0,80),ratio:contrast(s.color,bg)}}).filter(e=>e.ratio<4.5);
   return{width:innerWidth,scroll:document.documentElement.scrollWidth,images:imageErrors,css,productImages,contrastErrors,h1:document.querySelectorAll('h1').length,canonical:!!document.querySelector('link[rel=canonical]'),schema:!!document.querySelector('script[type="application/ld+json"]'),line:[...document.querySelectorAll('a')].some(a=>/line\.me|lin\.ee/.test(a.href)),mainBg:document.querySelector('.brand-landscape')?getComputedStyle(document.querySelector('.brand-landscape__mountains')).backgroundImage:''};
  });
  check(audit.scroll<=audit.width+1,'horizontal-overflow',{file,device,width:audit.width,scroll:audit.scroll});
  check(!audit.images.length,'image-decode',{file,device,images:audit.images});check(audit.h1===1,'heading',{file,device,count:audit.h1});check(audit.canonical,'canonical',{file,device});check(audit.line,'line-link',{file,device});
  if(file!=='links.html'){check(audit.css.length===1&&audit.css[0]==='site.css?v='+release,'single-style-source',{file,device,css:audit.css});check(audit.mainBg.includes('mountains-center'),'continuous-scenery',{file,device});check(!audit.contrastErrors.length,'text-contrast',{file,device,issues:audit.contrastErrors});}
  check(audit.productImages.every(i=>i.fit==='contain'&&i.transform==='none'),'product-original-fit',{file,device,images:audit.productImages});check(!errors.length,'javascript',{file,device,errors});
  await page.screenshot({type:'jpeg',quality:86,path:`${dir}/${device}-${file.replace('.html','')}.jpg`,fullPage:true});
  if(file==='index.html'){const scenery=await page.locator('.home-hero').evaluate(e=>{const r=e.getBoundingClientRect(),g=e.querySelector('.brand-landscape__goji'),d=e.querySelector('.brand-landscape__deer'),m=e.querySelector('.brand-landscape__mountains');return{gojiTop:g.getBoundingClientRect().top-r.top,deerTop:d.getBoundingClientRect().top-r.top,mountainTop:m.getBoundingClientRect().top-r.top,deerBottom:d.getBoundingClientRect().bottom-r.top,leadTop:e.querySelector('.hero__lead').getBoundingClientRect().top-r.top,paddingBottom:parseFloat(getComputedStyle(e).paddingBottom),heroImage:getComputedStyle(e).backgroundImage,assets:[...e.querySelectorAll('.brand-landscape>span')].map(s=>getComputedStyle(s).backgroundImage)}});check(scenery.gojiTop<=0&&scenery.deerTop<=180&&scenery.mountainTop<=220&&scenery.paddingBottom<=140&&scenery.heroImage==='none'&&(device!=='phone'||scenery.deerBottom<=scenery.leadTop+4),'hero-scenery-from-top',{file,device,...scenery});check(await page.locator('.home-product-showcase__grid a').count()>0,'home-products-preserved',{file,device});}
  if(file==='index.html'&&device==='phone'){
   await page.locator('#menu-btn').click();check(await page.locator('#menu-drawer').getAttribute('aria-hidden')==='false','menu-open',{file,device});await page.screenshot({type:'jpeg',quality:86,path:`${dir}/phone-menu.jpg`,fullPage:true});await page.locator('#menu-close').click();check(await page.locator('#menu-drawer').getAttribute('aria-hidden')==='true','menu-close',{file,device});
  }
  if(file==='faq.html'){
   const detail=page.locator('.faq-list details').first();if(await detail.evaluate(e=>e.open))await detail.locator('summary').click();await detail.locator('summary').click();check(await detail.evaluate(e=>e.open),'faq-open',{file,device});await page.screenshot({type:'jpeg',quality:86,path:`${dir}/${device}-faq-open.jpg`,fullPage:true});
  }
  if(file==='products.html'){
   const buttons=page.locator('[data-product-intro="1"]');const n=await buttons.count();check(n>0,'product-intros',{file,device,count:n});
   for(let i=0;i<n;i++){
    await buttons.nth(i).click();await page.locator('#product-modal.show').waitFor({state:'visible'});
    await page.locator('#product-modal').evaluate(async e=>{await Promise.all([...e.querySelectorAll('img')].map(i=>i.decode().catch(()=>{})))});
    const modal=await page.locator('#product-modal').evaluate(e=>({broken:[...e.querySelectorAll('img')].filter(i=>!i.naturalWidth).length,fit:[...e.querySelectorAll('img')].every(i=>getComputedStyle(i).objectFit==='contain'&&getComputedStyle(i).transform==='none'),title:e.querySelector('h2')?.textContent,line:!!e.querySelector('.btn-line')}));
    check(!modal.broken&&modal.fit&&modal.line,'product-modal',{file,device,index:i,...modal});
    if(i===0)await page.screenshot({type:'jpeg',quality:86,path:`${dir}/${device}-product-modal.jpg`,fullPage:true});await page.locator('#product-modal-close').click();
   }
  }
  if(file==='contact.html'){const logo=await page.locator('.footer-line-logo img').boundingBox();check(logo&&logo.width<=60&&logo.height<=120,'contact-logo-size',{file,device,logo});}
  if(file==='knowledge.html'){
   const tabs=page.locator('.knowledge-tab');if(await tabs.count()>1){await tabs.nth(1).click();check((await tabs.nth(1).getAttribute('class')).includes('is-active'),'knowledge-tabs',{file,device});}
  }
 }catch(e){check(false,'exception',{file,device,message:e.message});}finally{await page.close()}
 }
 await context.close();
}
await browser.close();fs.writeFileSync(`${dir}/report.json`,JSON.stringify(report,null,2));console.log(JSON.stringify({engine,pages:pages.length,checks:report.checks.length,errors:report.errors},null,2));if(report.errors.length)process.exitCode=1;
})();
