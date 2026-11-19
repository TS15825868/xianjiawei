const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base='https://ts15825868.github.io/xianjiawei/';
const load=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const read=p=>fs.readFileSync(p,'utf8');
const absolute=p=>p.startsWith(base)?p:base+p;
const own=load('public-product-master.json').products;
const partner=load('partner-catalog.json').products.filter(p=>p.public===true);
const media=new Map(load('catalog-public.json').products.map(p=>[p.id,p]));
const expected=new Map([...own.map(p=>[p.id,{name:'仙加味・'+p.name,spec:p.specification,specKey:'正式規格',page:absolute(p.page),image:absolute(media.get(p.id).image),display:p.name,brandId:base+'#organization'}]),...partner.map(p=>[p.id,{name:p.displayName||p.name,spec:p.size,specKey:'原廠規格',page:absolute(p.page||p.detailPage),image:absolute(p.image),display:p.displayName||p.name,brand:p.brand}])]);
function validate(graph){
 const lists=graph.filter(x=>x['@type']==='ItemList');
 const found=new Map();
 for(const list of lists){
  assert.equal(list.numberOfItems,list.itemListElement.length);
  for(const row of list.itemListElement){
   const p=row.item;const e=expected.get(p.sku);
   assert(e,'GEO contains non-public or unknown SKU: '+p.sku);
   assert(!found.has(p.sku),'duplicate GEO SKU: '+p.sku);
   found.set(p.sku,p);
   assert.equal(p['@type'],'Product');
   assert.equal(p.name,e.name);
   assert.equal(p.url,e.page);
   assert.equal(p.image,e.image);
   assert.equal(p.additionalProperty.find(x=>x.name===e.specKey)?.value,e.spec);
   if(e.brandId)assert.equal(p.brand['@id'],e.brandId);
   else assert.equal(p.brand.name,e.brand);
  }
 }
 assert.equal(found.size,expected.size,'GEO public catalog incomplete');
 return found;
}
const graph=load('geo-data.json')['@graph'];
test('all current public product IDs, names, specs, page URLs, brand and original image references agree; no fixed count',()=>{
 assert.equal(expected.size,own.length+partner.length);
 validate(graph);
});
test('GEO rejects missing, duplicate, hidden or changed product image even when the list count looks valid',()=>{
 const clone=()=>JSON.parse(JSON.stringify(graph));
 const list=g=>g.find(x=>x['@type']==='ItemList');
 let g=clone();list(g).itemListElement.pop();list(g).numberOfItems--;assert.throws(()=>validate(g));
 g=clone();list(g).itemListElement[1]=list(g).itemListElement[0];assert.throws(()=>validate(g));
 g=clone();list(g).itemListElement[0].item.sku='offline-unapproved';assert.throws(()=>validate(g));
 g=clone();list(g).itemListElement[0].item.image=base+'offline-old-photo.webp';assert.throws(()=>validate(g));
});
test('public AI overview and both llms files contain all approved display names and correct linked pages',()=>{
 const answers=load('ai-answers.json');const all=answers.answers.find(x=>x.id==='all-products');assert(all);
 for(const e of expected.values()){
  assert(all.answer.includes(e.display),'missing AI display name '+e.display);
  for(const file of ['llms.txt','llms-full.txt']){
   const s=read(file);assert(s.includes(e.display),'missing '+file+' '+e.display);assert(s.includes(e.page),'missing '+file+' '+e.page);
  }
  assert(read('sitemap.xml').includes('<loc>'+e.page+'</loc>'),'missing sitemap '+e.page);
 }
 assert.equal(answers.partnerSourceOfTruth,'partner-catalog.json');
 const ids=new Set(answers.answers.map(a=>a.id));assert.equal(ids.size,answers.answers.length);
 for(const id of ['business-cooperation','referral-trial'])assert(ids.has(id));
});
test('deferred product policy is not a public product listing, hidden partner SKUs never enter GEO',()=>{
 const hidden=load('partner-catalog.json').products.filter(p=>p.public!==true).map(p=>p.id);
 const found=validate(graph);
 for(const id of hidden)assert(!found.has(id));
 for(const rel of ['llms.txt','llms-full.txt'])assert(read(rel).includes('柒玄茶・龜鹿調飲粉'));
});
