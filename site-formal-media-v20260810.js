(()=>{
const V='20260813-dm-trial-display-fix-v1';
const pathBase=location.pathname.includes('/xianjiawei/')?'/xianjiawei':'';
const HD_DM=Object.freeze({
 'guilu-gao':'/images/dm-final/01_guilu-gao-100g-dm.jpg',
 'guilu-drink-30':'/images/dm-final/02_guilu-drink-30cc-dm.jpg',
 'guilu-drink-180':'/images/dm-final/03_guilu-drink-180cc-dm.jpg',
 'guilu-tangkuai':'/images/dm-final/05_guilu-tangkuai-75g-dm.jpg',
 'guilu-jiao':'/images/dm-final/06_guilu-jiao-600g-dm.jpg',
 'luerong-fen':'/images/dm-final/04_luerong-fen-75g-dm.jpg'
});
const replace=(img,path)=>{if(!path)return;img.src=pathBase+path+(path.includes('?')?'&':'?')+'v='+V;img.removeAttribute('srcset');img.style.objectFit='contain';img.style.objectPosition='center';img.style.width='100%';img.style.height='auto';img.style.maxWidth='100%';img.style.maxHeight='none';img.style.transform='none';img.removeAttribute('width');img.removeAttribute('height');};
function fixDmEntry(){
 document.querySelectorAll('a[href="dm.html"],a[href$="/dm.html"]').forEach(a=>{if(/實品照|產品圖|DM/i.test(a.textContent||''))a.textContent='查看產品DM';a.setAttribute('aria-label','查看仙加味目前正式產品DM');});
 if(document.body?.dataset?.page==='home'&&!document.querySelector('[data-formal-dm-home-entry]')){
  const products=document.getElementById('home-products');const actions=products?.nextElementSibling;
  if(actions?.classList?.contains('section-actions')){const link=document.createElement('a');link.className='btn btn-outline';link.href='dm.html';link.textContent='查看產品DM';link.dataset.formalDmHomeEntry='true';const trial=[...actions.querySelectorAll('a')].find(a=>/trial\.html/.test(a.getAttribute('href')||''));if(trial)actions.insertBefore(link,trial);else actions.appendChild(link);}
 }
}
fixDmEntry();
fetch(pathBase+'/images/formal-display/manifest.json?v='+V,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(m=>{
 if(m.dm){m.dm.version=V;m.dm.status='approved_high_resolution_jpeg';m.dm.paths={...(m.dm.paths||{}),...HD_DM};}
 window.XJWFormalCustomerMedia=m;
 document.documentElement.dataset.formalMediaRuntime=V;
 document.documentElement.dataset.formalMediaApprovalBatch=String(m.approval_batch||'');
 if(/\/dm\.html$/.test(location.pathname)){
  document.querySelectorAll('img').forEach(img=>{
   const box=img.closest('article,section,figure,div');
   const t=((img.alt||'')+' '+(box?.textContent||'')).replace(/\s+/g,' ');
   for(const [key,p] of Object.entries(m.products||{})){
    if(t.includes(p.name)||t.includes(p.spec)){
     const dm=HD_DM[key];
     if(dm)replace(img,dm);
     break;
    }
   }
  });
 }
 /* trial.html 只允許 trial-showcase-v20260813 正式元件。
    舊 trial-small-boss 與內嵌 WebP SVG 都不得再覆寫回畫面。 */
 if(/\/trial\.html$/.test(location.pathname)){
   const showcase=document.querySelector('[data-trial-showcase="official"]');
   if(showcase){
     document.documentElement.dataset.trialMediaMode='component-v20260813';
     showcase.querySelectorAll('img').forEach(img=>{img.style.objectFit='contain';img.style.objectPosition='center';img.style.transform='none';});
   }
 }
}).catch(()=>{});
})();
