(()=>{
const V='current-formal-media';
const pathBase=location.pathname.includes('/xianjiawei/')?'/xianjiawei':'';
const replace=(img,path)=>{if(!path)return;img.src=pathBase+path+(path.includes('?')?'&':'?')+'v='+V;img.style.objectFit='contain';img.style.objectPosition='center';img.removeAttribute('width');img.removeAttribute('height');};
function fixDmEntry(){
 document.querySelectorAll('a[href="dm.html"],a[href$="/dm.html"]').forEach(a=>{if(/實品照|產品圖|DM/i.test(a.textContent||''))a.textContent='查看產品DM';a.setAttribute('aria-label','查看仙加味目前正式產品DM');});
 if(document.body?.dataset?.page==='home'&&!document.querySelector('[data-formal-dm-home-entry]')){
  const products=document.getElementById('home-products');const actions=products?.nextElementSibling;
  if(actions?.classList?.contains('section-actions')){const link=document.createElement('a');link.className='btn btn-outline';link.href='dm.html';link.textContent='查看產品DM';link.dataset.formalDmHomeEntry='true';const trial=[...actions.querySelectorAll('a')].find(a=>/trial\.html/.test(a.getAttribute('href')||''));if(trial)actions.insertBefore(link,trial);else actions.appendChild(link);}
 }
}
fixDmEntry();
fetch(pathBase+'/images/formal-display/manifest.json?v='+V,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(m=>{
 window.XJWFormalCustomerMedia=m;
 document.documentElement.dataset.formalMediaRuntime=String(m.runtime||V);
 document.documentElement.dataset.formalMediaApprovalBatch=String(m.approval_batch||'');
 if(/\/dm\.html$/.test(location.pathname)){document.querySelectorAll('img').forEach(img=>{const box=img.closest('article,section,figure,div');const t=((img.alt||'')+' '+(box?.textContent||'')).replace(/\s+/g,' ');for(const p of Object.values(m.products||{})){if(t.includes(p.name)||t.includes(p.spec)){replace(img,p.path);break;}}});}
 if(/\/trial\.html$/.test(location.pathname)&&m.trial?.path){const hero=document.querySelector('.trial-poster img')||[...document.querySelectorAll('img')].find(img=>/試喝/.test((img.alt||'')+' '+(img.closest('section,article,figure,div')?.textContent||'')));if(hero)replace(hero,m.trial.path);}
}).catch(()=>{});
})();
