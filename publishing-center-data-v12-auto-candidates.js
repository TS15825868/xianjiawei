(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const PUBLIC='https://ts15825868.github.io/xianjiawei/';
  const GENERATED_AT='2026-08-09T02:13:00+08:00';
  const svgs=new Map(),urls=new Map();
  const PRODUCTS={
    'guilu-gao':{name:'龜鹿膏',spec:'100g／罐',img:'images/products-v3/guilu-gao.jpg?v=20260809-25',dimensions:{widthMm:51,heightMm:78}},
    'guilu-drink-30':{name:'龜鹿飲30cc玻璃罐',spec:'30cc／罐（小玻璃罐）',img:'images/products-v3/guilu-drink-30.jpg?v=20260809-25',dimensions:{diameterMm:42,heightMm:51}},
    'guilu-drink-180':{name:'龜鹿飲180cc鋁袋',spec:'180cc／包（鋁袋）',img:'images/products-v3/guilu-drink-180.jpg?v=20260809-25',aspectRatio:{min:.60,target:.64,max:.68}},
    'guilu-tangkuai':{name:'龜鹿湯塊',spec:'75g／盒｜8塊裝｜每塊約9.375g',img:'images/products-v3/guilu-tangkuai.jpg?v=20260809-25',dimensions:null},
    'guilu-jiao':{name:'龜鹿膠',spec:'600g（1斤）／盒｜32塊裝｜每塊約18.75g',img:'images/products-v3/guilu-jiao.jpg?v=20260809-25',dimensions:null},
    'luerong-fen':{name:'鹿茸粉',spec:'75g／罐',img:'images/products-v3/luerong-fen.jpg?v=20260809-25',dimensions:null}
  };
  const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const cut=(s='',n=48)=>{const t=String(s).replace(/\s+/g,' ').trim();return t.length>n?t.slice(0,n-1)+'…':t};
  const titleLines=(s='')=>{const t=String(s).trim();if(t.length<=18)return[t];let at=Math.min(18,Math.max(8,t.lastIndexOf('｜',18)+1||18));return[t.slice(0,at),t.slice(at,36)]};
  const hash=(s='')=>[...String(s)].reduce((a,c)=>(a*31+c.charCodeAt(0))>>>0,2166136261);
  function productIds(p){
    const refs=Array.isArray(p.product_refs)?p.product_refs.filter(id=>PRODUCTS[id]):[];
    if(refs.length)return[...new Set(refs)].slice(0,3);
    const t=`${p.title||''} ${p.copy||''}`;
    return Object.entries(PRODUCTS).filter(([,v])=>t.includes(v.name)||t.includes(v.name.replace('30cc玻璃罐','30cc'))||t.includes(v.name.replace('180cc鋁袋','180cc'))).map(([id])=>id).slice(0,3);
  }
  function eligible(p){
    if(!p||p.status==='published'||p.campaign_hold)return false;
    if(!(p.image_status==='needs_generation'||!p.image_url))return false;
    if(String(p.characters||'').trim())return false;
    if(/小老闆與夥伴|陪伴角色/.test(String(p.category||'')))return false;
    return true;
  }
  function buildProductFreeSvg(p,reason='情境候選'){ 
    const lines=titleLines(p.title||'仙加味日常'),seed=hash(p.id),a=150+seed%540,b=420+(seed>>>4)%280;
    const chips=[p.season,p.weather,p.occasion,p.location].filter(x=>x&&x!=='中性').slice(0,3);
    const chipSvg=chips.map((x,i)=>`<rect x="${76+i*190}" y="292" width="174" height="46" rx="23" fill="#EEF3EF"/><text x="${163+i*190}" y="322" class="g" font-size="20" text-anchor="middle">${esc(cut(x,9))}</text>`).join('');
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1254" height="1254" viewBox="0 0 1254 1254"><rect width="1254" height="1254" fill="#F7F4ED"/><style>text{font-family:"Noto Sans TC","PingFang TC","Microsoft JhengHei",sans-serif}.n{fill:#0B1F3B}.g{fill:#315A49}.m{fill:#667085}</style><text x="76" y="78" class="g" font-size="29" font-weight="700">仙加味</text><rect x="1000" y="45" width="178" height="54" rx="16" fill="#9B2C2C"/><text x="1089" y="79" fill="#fff" font-size="17" text-anchor="middle" font-weight="700">補養，是一種節奏。</text><line x1="76" y1="124" x2="1178" y2="124" stroke="#D9D1C4" stroke-width="2"/><text x="76" y="196" class="n" font-size="48" font-weight="800">${esc(lines[0])}</text>${lines[1]?`<text x="76" y="250" class="n" font-size="42" font-weight="800">${esc(lines[1])}</text>`:''}${chipSvg}<circle cx="${a}" cy="${b}" r="160" fill="#DCE7DF"/><circle cx="${a+250}" cy="${b+110}" r="108" fill="#EFE3D0"/><path d="M110 790 C310 635 505 850 700 720 C880 600 1050 760 1140 665" fill="none" stroke="#315A49" stroke-width="26" stroke-linecap="round"/><rect x="118" y="850" width="1018" height="110" rx="30" fill="#FFFDF9" stroke="#DED7CA"/><text x="627" y="905" class="n" font-size="26" text-anchor="middle" font-weight="700">${esc(reason)}</text><text x="627" y="940" class="g" font-size="20" text-anchor="middle">產品本體留白｜禁止AI重畫或猜測產品尺寸</text><rect x="76" y="1000" width="1102" height="112" rx="26" fill="#F2EFE8"/><text x="102" y="1044" class="m" font-size="22">${esc(cut(p.copy||'',48))}</text><text x="102" y="1082" class="m" font-size="20">候選圖 ${esc(p.id)}｜產品如需加入須使用products-v3正式原圖・待16項人工審核</text><line x1="76" y1="1150" x2="1178" y2="1150" stroke="#D9D1C4"/><text x="76" y="1192" class="m" font-size="20">自動安全候選 v12｜不猜多產品相對尺寸｜不自動發布</text></svg>`;
  }
  function blobCandidate(p,reason){
    const svg=buildProductFreeSvg(p,reason);svgs.set(p.id,svg);
    if(urls.has(p.id))URL.revokeObjectURL(urls.get(p.id));
    const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));urls.set(p.id,url);
    return{...p,image_asset_id:`auto-v12-${p.id}`,image_url:url,image_status:'candidate-review-required',candidate_generated:true,candidate_generation_mode:'runtime-safe-svg-v12',candidate_generated_at:GENERATED_AT,image_preflight:'structural-safe-pending-human-review',publish_allowed:false,schedule_enabled:false,scheduled_at:null,owner_review_required:true,approval_required:true,image_policy:'product-free-scene-until-official-photo-composite',physical_scale_policy:'do-not-guess-relative-scale',image_review_reason:`${reason}。候選圖不畫產品本體；需要產品時只能使用products-v3正式原圖等比例合成。這只是候選，仍須完成16項人工審核。`};
  }
  function candidate(p){
    const ids=productIds(p);
    if(ids.length===1){
      const id=ids[0],v=PRODUCTS[id];
      return{...p,image_asset_id:`official-v3-${id}`,image_url:PUBLIC+v.img,image_status:'candidate-review-required',candidate_generated:true,candidate_generation_mode:'official-product-photo-v12',candidate_generated_at:GENERATED_AT,image_preflight:'official-photo-pending-context-review',publish_allowed:false,schedule_enabled:false,scheduled_at:null,owner_review_required:true,approval_required:true,image_source:'products-v3-user-approved-original',image_policy:'approved-original-uniform-scale-contain-no-crop-no-stretch',physical_scale_policy:'preserve-original-aspect-and-realistic-scale',image_review_reason:`此篇只有一項明確產品，直接使用 ${v.name} products-v3正式原圖；不生成產品替身、不改包裝、不拉伸。仍須確認文案情境是否適合直接使用單品照。`};
    }
    if(ids.length>1)return blobCandidate(p,'多產品相對尺寸沒有足夠可靠依據，禁止自動做成同高／同寬');
    return blobCandidate(p,'此篇目前不需要產品本體，先建立產品留白的生活情境候選');
  }
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');const response=await PREV_FETCH(input,init);if(!url.includes(TARGET)||!response.ok)return response;
    try{const data=await response.clone().json();const posts=(data.posts||[]).map(p=>eligible(p)?candidate(p):p);const merged={...data,version:'2026-08-09-public-posts-v24-products-v3-scale-safe',posts};merged.counts={...(data.counts||{}),total:posts.length,campaign_hold:posts.filter(p=>p.campaign_hold).length,auto_candidate_v12:posts.filter(p=>String(p.candidate_generation_mode||'').includes('v12')).length,candidate_review:posts.filter(p=>p.image_status==='candidate-review-required'&&!p.campaign_hold).length,needs_generation:posts.filter(p=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published'&&!p.campaign_hold)).length};const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});}catch{return response}
  };
  window.XJWRuntimeCandidateFactory={version:'2026-08-09-v12-products-v3-scale-safe',products:PRODUCTS,getSvg:(id)=>svgs.get(id)||'',has:(id)=>svgs.has(id),getStats:()=>({generated:svgs.size})};
})();