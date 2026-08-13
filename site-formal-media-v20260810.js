(()=>{
const V='20260813-trial-product-role-fix-v7';
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
 if(/\/dm\.html$/.test(location.pathname)){
  document.querySelectorAll('img').forEach(img=>{
   const box=img.closest('article,section,figure,div');
   const t=((img.alt||'')+' '+(box?.textContent||'')).replace(/\s+/g,' ');
   for(const [key,p] of Object.entries(m.products||{})){
    if(t.includes(p.name)||t.includes(p.spec)){
     const dm=m.dm?.paths?.[key];
     if(dm)replace(img,dm);
     break;
    }
   }
  });
 }
 /* trial.html 自 v7 起由 data-trial-showcase 元件自己管理小老闆＋30cc正式產品圖。
    禁止再依 manifest 把舊 trial-small-boss 二進位覆寫回畫面。 */
 if(/\/trial\.html$/.test(location.pathname)){
   const showcase=document.querySelector('[data-trial-showcase="official"]');
   if(showcase) document.documentElement.dataset.trialMediaMode='component-v7';
 }
}).catch(()=>{});
})();
