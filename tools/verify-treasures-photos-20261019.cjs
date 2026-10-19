const {chromium,webkit}=require('playwright');
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict');
const manifest=JSON.parse(fs.readFileSync('images/catalog-real-owner-v20261019/manifest.json'));
(async()=>{
 fs.mkdirSync('diagnostics/treasures-20261019',{recursive:true});const results=[];
 for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch();
 for(const width of [390,1440]){
 const page=await browser.newPage({viewport:{width,height:900}});
 for(const [id,file] of [['royalherb-erzhenbao-64','product-er-zhen-bao.html'],['uboss-sizhenbao','product-four-treasures.html']]){
 await page.goto('http://127.0.0.1:8765/'+file,{waitUntil:'networkidle'});
 const photo=page.locator('img[src*="catalog-real-owner-v20261019"]');assert.equal(await photo.count(),3);
 for(let i=0;i<3;i++){await photo.nth(i).scrollIntoViewIfNeeded();await photo.nth(i).evaluate(i=>i.decode());}
 const state=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth,images:[...document.querySelectorAll('img[src*="catalog-real-owner-v20261019"]')].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0,fit:getComputedStyle(i).objectFit}))}));
 assert.equal(state.overflow,false);assert.ok(state.images.every(i=>i.loaded&&i.fit==='contain'));assert.ok(state.images[0].src.endsWith(id+'-front.png'));
 await page.screenshot({path:`diagnostics/treasures-20261019/${engine}-${width}-${id}.png`,fullPage:true});
 await page.locator(`a[href$="${id}-back.png"]`).click();await page.getByRole('button',{name:'← 返回商品',exact:true}).click();assert.equal(await page.locator('.xjw-photo-viewer').count(),0);
 results.push({engine,width,id,...state,photoViewer:'pass'});
 }
 await page.close();
 }
 await browser.close();
 }
 for(const p of Object.values(manifest.products))for(const m of Object.values(p)){
 const r=await fetch('https://ts15825868.github.io/xianjiawei/'+m.path);assert.ok(r.ok);assert.equal(crypto.createHash('sha256').update(Buffer.from(await r.arrayBuffer())).digest('hex'),m.sha256,'Published bytes differ');
 }
 fs.writeFileSync('diagnostics/treasures-20261019/results.json',JSON.stringify({results,livePhotoHashes:'all six match'},null,2));console.log('PASS 2 engines × 2 widths × 2 pages, viewer returns and six live exact image hashes');
})().catch(e=>{console.error(e);process.exitCode=1});
