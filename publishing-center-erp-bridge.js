(()=>{
  const RECORD_KEY='xjw-publishing-v3-records';
  const DATA_URL='content/public-post-library.json?v=20260808-13';
  const ERP_BASE='https://xianjiawei-internal.tung314069.workers.dev/';
  let runtimePromise=null;

  function toast(message){
    const node=document.getElementById('toast');
    if(!node)return;
    node.textContent=message;
    node.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer=setTimeout(()=>node.classList.remove('show'),3600);
  }
  async function copy(text){
    try{await navigator.clipboard.writeText(text);return true}catch{}
    try{const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();return true}catch{return false}
  }
  function toBase64Url(value){
    const bytes=new TextEncoder().encode(value);
    let binary='';
    for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));
    return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  }
  function absoluteImage(value){
    const src=String(value||'').trim();
    if(!src||/^data:/i.test(src)||/^blob:/i.test(src))return'';
    try{return new URL(src,location.href).href}catch{return''}
  }
  async function runtimePosts(){
    if(runtimePromise)return runtimePromise;
    runtimePromise=fetch(DATA_URL+'&t='+Date.now(),{cache:'no-store'}).then(async(response)=>{
      if(!response.ok)throw new Error(`公開貼文資料讀取失敗（HTTP ${response.status}）`);
      const data=await response.json();
      return {version:data?.version||'',posts:Array.isArray(data?.posts)?data.posts:[]};
    }).catch((error)=>{runtimePromise=null;throw error;});
    return runtimePromise;
  }
  function migrateLegacyFakePublish(){
    let records={};
    try{records=JSON.parse(localStorage.getItem(RECORD_KEY)||'{}')||{}}catch{return}
    let changed=false;
    for(const record of Object.values(records)){
      if(record?.scheduleStatus!=='published-manual')continue;
      record.legacyLocalPublishAt=record.publishedAt||record.legacyLocalPublishAt||null;
      record.publishedAt=null;
      record.platforms=[];
      record.scheduleStatus='erp-handoff-required';
      record.handoffRequired=true;
      changed=true;
    }
    if(changed){
      localStorage.setItem(RECORD_KEY,JSON.stringify(records));
      window.__XJW_PUBLIC_PUBLISH_MIGRATED__=true;
    }
  }
  function cardInfo(button){
    const card=button.closest('.post-card');
    const rawImage=card?.querySelector('.image-wrap img')?.getAttribute('src')||'';
    return{
      id:button.dataset.now||card?.dataset?.id||'',
      title:card?.querySelector('h2')?.textContent?.trim()||'',
      copy:card?.querySelector('.excerpt')?.textContent?.trim()||'',
      rawImage,
      image:absoluteImage(rawImage),
      localImageNotTransferable:/^(?:data|blob):/i.test(String(rawImage||'').trim()),
      platforms:[...card?.querySelectorAll('.platform-chip')||[]].map((node)=>node.textContent.trim()).filter(Boolean)
    };
  }
  async function handoff(button){
    const card=cardInfo(button);
    if(!card.id){toast('找不到公開貼文ID，請重新整理後再試');return;}
    let source=null,version='';
    try{
      const runtime=await runtimePosts();
      version=runtime.version;
      source=runtime.posts.find((post)=>post.id===card.id)||null;
    }catch(error){console.warn('runtime post lookup failed',error);}
    const sourceImage=card.localImageNotTransferable?'':absoluteImage(card.image||source?.image_url||'');
    const payload={
      schema:'xjw-public-to-erp-v1',
      source_post_id:card.id,
      source_version:version,
      title:String(source?.title||card.title||'').slice(0,180),
      headline:String(source?.headline||'').slice(0,300),
      copy:String(source?.copy||card.copy||'').slice(0,10000),
      category:String(source?.category||'日常節奏').slice(0,80),
      platforms:Array.isArray(source?.platforms)&&source.platforms.length?source.platforms:card.platforms,
      image_url:sourceImage,
      image_alt:String(source?.image_alt||source?.title||card.title||'仙加味貼文候選圖').slice(0,300),
      image_status:String(source?.image_status||''),
      candidate_generation_mode:String(source?.candidate_generation_mode||''),
      source_page:location.href.split('#')[0],
      local_image_requires_upload:card.localImageNotTransferable,
      imported_as:'draft',
      approval_required:true,
      auto_publish:false
    };
    const encoded=toBase64Url(JSON.stringify(payload));
    const erpUrl=`${ERP_BASE}?xjw_import=${encodeURIComponent(encoded)}#posts`;
    const text=[
      '仙加味｜公開發布中心 → ERP 安全交接',
      `公開貼文ID：${payload.source_post_id}`,
      `標題：${payload.title}`,
      `分類：${payload.category}`,
      `平台：${(payload.platforms||[]).join('、')}`,
      `候選圖：${payload.image_url||'尚無可傳遞圖片'}`,
      payload.local_image_requires_upload?'公開頁目前使用本機替換圖：此圖不塞進網址，請進ERP後用裝置上傳。':'',
      '',
      'ERP會建立「草稿」；不會自動核准、不會自動排程、不會自動發布。',
      '若候選為正式原圖SVG，ERP在審核前會自動轉成1254×1254 JPEG並存入媒體庫。',
      '完成16項檢查並人工核准後，才可排程或立即發布。'
    ].filter(Boolean).join('\n');
    await copy(text);
    toast('完整貼文已準備交接，正在開啟 ERP 建立安全草稿');
    window.open(erpUrl,'_blank','noopener');
  }
  function enhance(){
    document.querySelectorAll('[data-now]').forEach(button=>{
      button.textContent='匯入ERP草稿並發布';
      button.title='完整貼文會安全匯入ERP成為草稿；仍需ERP人工審核後才能真正發布。';
      button.dataset.erpPublishHandoff='1';
    });
    const metric=document.getElementById('metricLocal');
    const label=metric?.parentElement?.querySelector('small');
    if(label)label.textContent='本機補登';
    document.querySelectorAll('.status').forEach(node=>{if(node.textContent.trim()==='本機已發布')node.textContent='本機補登已發布';});
  }

  migrateLegacyFakePublish();
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-now]');
    if(!button)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();handoff(button);
  },true);
  const observer=new MutationObserver(enhance);observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{enhance();if(window.__XJW_PUBLIC_PUBLISH_MIGRATED__)setTimeout(()=>location.reload(),80)},{once:true});
  else{enhance();if(window.__XJW_PUBLIC_PUBLISH_MIGRATED__)setTimeout(()=>location.reload(),80)}
})();
