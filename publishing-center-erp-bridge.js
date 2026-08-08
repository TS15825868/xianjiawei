(()=>{
  const RECORD_KEY='xjw-publishing-v3-records';
  const ERP_URL='https://xianjiawei-internal.tung314069.workers.dev/#posts';

  function toast(message){
    const node=document.getElementById('toast');
    if(!node)return;
    node.textContent=message;
    node.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer=setTimeout(()=>node.classList.remove('show'),3200);
  }
  async function copy(text){
    try{await navigator.clipboard.writeText(text);return true}catch{}
    try{const area=document.createElement('textarea');area.value=text;area.style.position='fixed';area.style.opacity='0';document.body.appendChild(area);area.select();document.execCommand('copy');area.remove();return true}catch{return false}
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
  function postInfo(button){
    const card=button.closest('.post-card');
    const id=button.dataset.now||card?.dataset?.id||'';
    const title=card?.querySelector('h2')?.textContent?.trim()||'';
    const copyText=card?.querySelector('.excerpt')?.textContent?.trim()||'';
    return{id,title,copyText};
  }
  async function handoff(button){
    const post=postInfo(button);
    const text=[
      '仙加味｜ERP正式立即發布交接',
      `公開貼文ID：${post.id}`,
      `標題：${post.title}`,
      '',
      '文案：',
      post.copyText,
      '',
      '此公開發布中心不持有社群Token；真正的立即發布請在ERP貼文中心完成。',
      '在ERP確認對應貼文已審核、圖片已核准後，按「立即發布」。'
    ].join('\n');
    await copy(text);
    toast('交接資料已複製，正在開啟 ERP 正式發布中心');
    window.open(ERP_URL,'_blank','noopener');
  }
  function enhance(){
    document.querySelectorAll('[data-now]').forEach(button=>{
      button.textContent='前往ERP立即發布';
      button.title='真正的社群立即發布由受保護的ERP執行；公開頁不保存Token、不假裝發布成功。';
      button.dataset.erpPublishHandoff='1';
    });
    const metric=document.getElementById('metricLocal');
    const label=metric?.parentElement?.querySelector('small');
    if(label)label.textContent='本機補登';
    document.querySelectorAll('.status').forEach(node=>{
      if(node.textContent.trim()==='本機已發布')node.textContent='本機補登已發布';
    });
  }

  migrateLegacyFakePublish();
  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-now]');
    if(!button)return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    handoff(button);
  },true);
  const observer=new MutationObserver(enhance);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{enhance();if(window.__XJW_PUBLIC_PUBLISH_MIGRATED__)setTimeout(()=>location.reload(),80)},{once:true});
  else{enhance();if(window.__XJW_PUBLIC_PUBLISH_MIGRATED__)setTimeout(()=>location.reload(),80)}
})();
