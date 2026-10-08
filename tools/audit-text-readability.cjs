/* Sample the rendered background at painted glyph pixels, including landscape images.
   Text is temporarily cleared only in the audit browser; production markup is untouched. */
const fs=require('fs'),path=require('path'),http=require('http');
const {PNG}=require('pngjs');
const pw=require(process.env.XJW_PLAYWRIGHT_MODULE||'playwright');
const engine=process.env.XJW_BROWSER_ENGINE||'chromium';
const release=(fs.readFileSync('index.html','utf8').match(/site\.css\?v=([^" ]+)/)||[])[1];
const pages=process.env.XJW_TEXT_PAGES?.split(',')||fs.readdirSync('.').filter(f=>f.endsWith('.html')&&(f==='links.html'||fs.readFileSync(f,'utf8').includes('site.css?v='+release)));
const profiles={desktop:{width:1440,height:1000},tablet:{width:820,height:1180},phone:{width:390,height:844},small:{width:320,height:740}};
const selected=process.env.XJW_TEXT_VIEWPORTS?.split(',')||Object.keys(profiles);
const out=process.env.XJW_TEXT_OUTPUT||'text-evidence-'+engine;
const report={engine,release,generatedAt:new Date().toISOString(),base:'',pages,viewports:selected,states:[],errors:[],warnings:[]};
const srgb=v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4};
const lum=c=>srgb(c[0])*.2126+srgb(c[1])*.7152+srgb(c[2])*.0722;
const ratio=(a,b)=>(Math.max(lum(a),lum(b))+.05)/(Math.min(lum(a),lum(b))+.05);
async function inspect(page,file,device,state){
 const overlay=await page.locator('.product-modal.show,.site-menu.open').count()>0;
 const text=await page.evaluate(()=>{
  const result=[],walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
  while(node=walker.nextNode()){
   const value=node.textContent.trim(),el=node.parentElement;
   const overlay=document.querySelector('.product-modal.show')||document.querySelector('.site-menu.open');
   if(overlay&&!overlay.contains(el))continue;
   if(!value||!el||el.closest('script,style,noscript,svg,[aria-hidden="true"],.sr-only'))continue;
   const closed=el.closest('details:not([open])');if(closed&&!closed.querySelector('summary')?.contains(el))continue;
   const cs=getComputedStyle(el);let opacity=1,visible=true;
   for(let e=el;e;e=e.parentElement){const s=getComputedStyle(e);opacity*=+s.opacity;if(s.display==='none'||s.visibility!=='visible'){visible=false;break;}}
   if(!visible||opacity<.05)continue;
   const range=document.createRange();range.selectNodeContents(node);
   const rects=[...range.getClientRects()].map(r=>{let l=Math.max(0,r.left),rr=Math.min(innerWidth,r.right),t=r.top,b=r.bottom;
    for(let a=el.parentElement;a&&a!==document.body;a=a.parentElement){const s=getComputedStyle(a),q=a.getBoundingClientRect();if(s.overflowX!=='visible'){l=Math.max(l,q.left);rr=Math.min(rr,q.right)}if(s.overflowY!=='visible'){t=Math.max(t,q.top);b=Math.min(b,q.bottom)}}
    if(overlay){t=Math.max(0,t);b=Math.min(innerHeight,b)}return{x:l+(overlay?0:scrollX),y:t+(overlay?0:scrollY),w:rr-l,h:b-t}}).filter(r=>r.w>1&&r.h>1);
   if(!rects.length)continue;
   const color=(cs.color.match(/[\d.]+/g)||[]).map(Number),size=parseFloat(cs.fontSize),weight=parseInt(cs.fontWeight)||400;
   result.push({text:value.slice(0,130),tag:el.tagName,class:el.className||'',color:color.slice(0,3),alpha:opacity*(color[3]??1),size,weight,threshold:size>=24||(size>=18.66&&weight>=700)?3:4.5,rects});
  }
  return result;
 });
 const original=PNG.sync.read(await page.screenshot({fullPage:!overlay,type:'png'}));
 const hide=await page.addStyleTag({content:'*{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;caret-color:transparent!important}'});
 const backdrop=PNG.sync.read(await page.screenshot({fullPage:!overlay,type:'png'}));await hide.evaluate(e=>e.remove());
 const issues=[],small=[],noPaint=[];let paintedTotal=0;
 for(const t of text){
  let total=0,bad=0,min=100;
  for(const r of t.rects){
   const x0=Math.max(0,Math.floor(r.x)),y0=Math.max(0,Math.floor(r.y)),x1=Math.min(original.width,Math.ceil(r.x+r.w)),y1=Math.min(original.height,Math.ceil(r.y+r.h));
   for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){
    const i=(y*original.width+x)*4,b=[backdrop.data[i],backdrop.data[i+1],backdrop.data[i+2]],a=[original.data[i],original.data[i+1],original.data[i+2]];
    const fg=t.color.map((c,j)=>c*t.alpha+b[j]*(1-t.alpha));
    if(Math.max(...a.map((c,j)=>Math.abs(c-fg[j])))>24||Math.max(...a.map((c,j)=>Math.abs(c-b[j])))<15)continue;
    total++;const c=ratio(fg,b);min=Math.min(min,c);if(c<t.threshold-.02)bad++;
   }
  }
  paintedTotal+=total;
  if(bad>=5&&bad/Math.max(total,1)>.015)issues.push({...t,rects:t.rects.slice(0,2),min:+min.toFixed(2),badPixels:bad,paintedPixels:total,badFraction:+(bad/total).toFixed(3)});
  const compact= /brand-mark__|header-line-cta|menu-btn|floating-line-cta|video-play/.test(t.class);
  if(t.size<14&&!compact&&/[\p{L}\p{N}]/u.test(t.text))small.push({text:t.text,size:t.size,class:t.class});
  if(total<3&&t.text.length>2&&t.size>=12&&/[\p{L}\p{N}]/u.test(t.text))noPaint.push({text:t.text,class:t.class,size:t.size});
 }
 const entry={file,device,state,textRuns:text.length,paintedPixels:paintedTotal,contrastIssues:issues,smallText:small,noPaint};report.states.push(entry);
 for(const issue of issues)report.errors.push({type:'rendered-text-contrast',file,device,state,...issue});
 for(const issue of small)report.errors.push({type:'small-content-text',file,device,state,...issue});
 for(const item of noPaint)report.errors.push({type:'no-visible-glyph-sample',file,device,state,...item});
 await page.screenshot({fullPage:!overlay,type:'jpeg',quality:88,path:path.join(out,`${device}-${file.replace('.html','')}-${state}.jpg`)});
 console.log(JSON.stringify({file,device,state,text:text.length,contrast:issues.length,small:small.length}));
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});let server,base=process.env.XJW_AUDIT_BASE;
 if(!base){server=http.createServer((req,res)=>{const f=path.resolve('.','.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(!f.startsWith(path.resolve('.')+path.sep)){res.writeHead(403).end();return}fs.readFile(f,(e,d)=>{if(e){res.writeHead(404).end();return}const ext=path.extname(f);res.setHeader('Content-Type',({'.html':'text/html','.css':'text/css','.js':'text/javascript','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'})[ext]||'application/octet-stream');res.end(d)})});await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}/`;}
 report.base=base;const browser=await pw[engine].launch({headless:true});
 try{for(const device of selected){
  const context=await browser.newContext({viewport:profiles[device],deviceScaleFactor:1,reducedMotion:'reduce',isMobile:['phone','small'].includes(device),hasTouch:['phone','small'].includes(device),locale:'zh-TW'});
  for(const file of pages){const page=await context.newPage();try{
   if(file==='trial-line.html')await page.route('**/trial-line.html*',async route=>{const response=await route.fetch();const body=(await response.text()).replace('setTimeout(()=>location.href=target,650);','/* audit only: retain official handoff target without leaving layout */');await route.fulfill({response,body})});
   await page.goto(base+file+'?text-audit='+release,{waitUntil:'load',timeout:60000});
   if(!['links.html','trial-line.html'].includes(file))await page.waitForFunction(()=>window.__XJW_SITE_INITIALIZED__&&document.querySelector('#site-footer .footer-card'),{timeout:20000});
   await page.evaluate(async()=>{document.querySelectorAll('img[loading="lazy"]').forEach(i=>i.loading='eager');await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})));await document.fonts.ready;scrollTo(0,0)});
   await page.waitForTimeout(file==='index.html'?2100:300);await inspect(page,file,device,'default');
   if(process.env.XJW_TEXT_SKIP_STATES==='1')continue;
   if(file==='faq.html'){await page.locator('.faq-list details').evaluateAll(es=>es.forEach(e=>e.open=true));await inspect(page,file,device,'expanded');}
   if(file==='index.html'&&['phone','small','tablet'].includes(device)){await page.locator('#menu-btn').click();await inspect(page,file,device,'menu');await page.locator('#menu-close').click();}
   if(file==='knowledge.html'){const tabs=page.locator('.knowledge-tab');for(let i=1;i<await tabs.count();i++){await tabs.nth(i).click();await inspect(page,file,device,'tab-'+i);}}
   if(file==='products.html'){const buttons=page.locator('[data-product-intro="1"]');for(let i=0;i<await buttons.count();i++){await buttons.nth(i).click();await page.locator('#product-modal.show').waitFor({state:'visible'});await page.locator('#product-modal').evaluate(async e=>{await Promise.all([...e.querySelectorAll('img')].map(i=>i.decode().catch(()=>{})))});await inspect(page,file,device,'modal-'+i);
    const positions=await page.locator('.product-modal__scroll').evaluate(e=>{const step=e.clientHeight*.65,top=e.getBoundingClientRect().top,walker=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),values=new Set([0]);let n;while(n=walker.nextNode()){if(!n.textContent.trim()||n.parentElement.closest('script,style,[aria-hidden="true"]'))continue;const r=document.createRange();r.selectNodeContents(n);for(const b of r.getClientRects())if(b.width&&b.height)values.add(Math.max(0,Math.min(e.scrollHeight-e.clientHeight,Math.floor((b.top-top+e.scrollTop)/step)*step)))}return [...values].sort((a,b)=>a-b)});
    for(const y of positions.filter(y=>y>0)){await page.locator('.product-modal__scroll').evaluate((e,y)=>e.scrollTop=y,y);await inspect(page,file,device,'modal-'+i+'-scroll-'+Math.round(y));}
    await page.locator('#product-modal-close').click();}}
  }catch(e){report.errors.push({type:'exception',file,device,message:e.message});console.error(file,device,e.message)}finally{await page.close()}}
  await context.close();
 }}finally{await browser.close();if(server)await new Promise(r=>server.close(r));fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({engine,states:report.states.length,errors:report.errors.length,warnings:report.warnings.length}));if(report.errors.length)process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1});
