(()=>{
  'use strict';
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const ASSET_LIBRARY='content/public-asset-library.json';
  const FORMAL_AUTHORITY='data/formal-media-authority-v20260810.json';
  const RUNTIME='current-authority-media-sanitizer-20260820-v7-six-public-products';
  const CURRENT_30_USAGE='每日 1–2 罐';
  const DEFERRED_PRODUCT=/柒玄茶|龜鹿調飲粉|qixuan-guilu-drink-powder/i;
  const DISALLOWED_ASSET_STATUSES=new Set(['deprecated-reference-only','preflight-rejected-reference-only','superseded-reference-only']);
  const TRIAL_APPROVED_STATES=new Set(['approved_user_original','approved_display','approved_current_media']);
  const PRODUCT_NAMES=['龜鹿膏','龜鹿飲30cc','龜鹿飲180cc','龜鹿湯塊','龜鹿膠','鹿茸粉'];
  const normalize=value=>String(value||'').replace(/^https?:\/\/[^/]+\/xianjiawei\//i,'').replace(/^\//,'').split(/[?#]/)[0];
  const assetLibraryPromise=PREV_FETCH(ASSET_LIBRARY+'?authority=20260820-v7',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
  const formalAuthorityPromise=PREV_FETCH(FORMAL_AUTHORITY+'?authority=20260820-v7',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);

  function productSegments(text,target){
    const source=String(text||''),segments=[];let start=0;
    while(true){const pos=source.indexOf(target,start);if(pos<0)break;let end=source.length,searchFrom=pos+target.length;for(const name of PRODUCT_NAMES){const next=source.indexOf(name,searchFrom);if(next>=0)end=Math.min(end,next)}segments.push(source.slice(pos,end));start=pos+target.length}
    return segments;
  }
  function retiredPaths(library){
    const set=new Set();
    for(const asset of Array.isArray(library?.assets)?library.assets:[]){if(DISALLOWED_ASSET_STATUSES.has(String(asset?.status||''))){const p=normalize(asset?.path);if(p)set.add(p)}}
    set.add('images/dm-approved-v20260810/guilu-gao-100g.webp');
    set.add('images/dm-approved-v20260810/guilu-drink-180cc.webp');
    return set;
  }
  function currentFormalPaths(authority){
    const set=new Set();
    for(const product of Array.isArray(authority?.products)?authority.products:[]){if(product?.status==='approved_display'){for(const value of [product.image,product.dm]){const p=normalize(value);if(p)set.add(p)}}}
    if(TRIAL_APPROVED_STATES.has(String(authority?.trial?.status||''))){const p=normalize(authority?.trial?.image);if(p)set.add(p)}
    return set;
  }
  function needsQuarantine(post,retired,currentFormal){
    if(!post||post.status==='published'||post.status==='archived'||post.prevent_republish===true||post.do_not_republish===true)return'';
    const image=String(post.image_url||'').trim();if(!image)return'';const normalized=normalize(image);
    if(currentFormal.has(normalized))return'';
    if(retired.has(normalized))return `圖片已由目前公開資產權威標記為退役：${normalized}`;
    if(/\/images\/brand\/line-oa\//i.test(image))return '官網／貼文候選不得直接混用 LINE OA 專用角色圖片';
    if(/\/images\/products-v2\//i.test(image))return '圖片仍使用退役 products-v2 產品圖';
    if(/\/images\/products-v3\//i.test(image))return 'products-v3目前只作產品身份、包裝與比例校正；貼文產品主圖應改用目前核准customer-display／formal media';
    if(/guilu-gao-100g\.webp/i.test(image))return '龜鹿膏詳細DM仍指向已確認損壞的WebP';
    if(/guilu-drink-180cc\.webp/i.test(image))return '180cc詳細DM仍指向退役WebP，應改用dm-final目前核准JPG';
    if(/\/images\/dm-(?:final|approved-v\d+)\//i.test(image))return '圖片位於DM目錄但不在目前正式媒體authority核准清單';
    return'';
  }
  function quarantine(post,reason){
    const originalPrompt=String(post.image_prompt||'').trim();
    return{...post,status:'pending_review',image_url:null,image_asset_id:null,image_status:'needs_generation',candidate_generated:false,candidate_generation_mode:'current-authority-regeneration-required',publish_allowed:false,schedule_enabled:false,scheduled_at:null,owner_review_required:true,approval_required:true,auto_approve:false,auto_schedule:false,auto_publish:false,image_policy:'current-formal-product-image-or-valid-dm-or-trial; products-v3-identity-reference-only; no-collage-no-line-oa-mix',image_prompt:originalPrompt||'依原貼文文案建立1:1完整場景；優先比對目前正式產品圖、有效DM、正式試喝圖與目前核准生活情境素材。若需要產品，本體只使用正式原圖等比例合成；30cc維持小玻璃裸罐，180cc維持狹長鋁袋。季節、天氣、環境、冷熱、表情、動作與道具必須吻合文案。完成後只回待審核。',image_review_reason:`${reason}。優先使用目前正式媒體或目前核准生活素材；真的沒有合格來源才生成，換圖後回待審核並重新完成16項。`};
  }
  function ensureGenerationReason(post){
    if(!post||String(post.image_status||'')!=='needs_generation'||String(post.image_review_reason||'').trim())return post;
    return{...post,status:'pending_review',publish_allowed:false,schedule_enabled:false,scheduled_at:null,owner_review_required:true,approval_required:true,auto_approve:false,auto_schedule:false,auto_publish:false,image_review_reason:'目前尚未有通過文案語意與正式素材角色的候選圖；優先找目前正式素材，真的沒有合格來源才生成。完成後回待審核並重新完成16項。'};
  }
  function validateFormalCopy(post){
    const serialized=JSON.stringify(post||{});
    if(DEFERRED_PRODUCT.test(serialized))return '柒玄茶目前暫不放官網與公開貼文；資料只保留在允許的內部／LINE文字知識層';
    if(/30\s*cc.{0,60}(玻璃瓶|瓶裝|[／/]\s*瓶)/i.test(serialized))return '貼文仍含30cc瓶型退役稱呼';
    if(/30\s*cc/i.test(serialized)){
      if(/每日一罐|每日1[-～－]2罐|每日\s*1[-～－]2\s*罐/.test(serialized))return `30cc仍含退役使用方式；目前正式使用方式為${CURRENT_30_USAGE}`;
      if(/使用方式|每日|飲用/.test(serialized)&&!/每日\s*1–2\s*罐/.test(serialized)&&String(post?.id||'')==='POST-DRINK-30')return `30cc產品介紹缺目前正式使用方式：${CURRENT_30_USAGE}`;
    }
    for(const segment of productSegments(serialized,'龜鹿湯塊'))if(/(300\s*g|600\s*g)/i.test(segment))return '龜鹿湯塊自己的語境仍含退役容量';
    for(const segment of productSegments(serialized,'龜鹿膠'))if(/300\s*g/i.test(segment))return '龜鹿膠自己的語境仍含錯誤300g容量';
    for(const segment of productSegments(serialized,'龜鹿膏'))if(/(一天一次一小匙|每日一次一小匙|早晚各一小匙|每日早上及下午各一小匙|早上＋下午|早上\+下午)/i.test(segment))return '龜鹿膏仍含退役固定時段；目前為食用時間可依個人使用習慣與作息時間安排';
    if(String(post?.id||'')==='POST-PRODUCT-OVERVIEW'&&(/七項|第七項|seven[- ]product/i.test(serialized)))return '產品總覽不得重新加入目前暫不放官網的第七項；官網與公開貼文目前為六項產品';
    return'';
  }

  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');const response=await PREV_FETCH(input,init);if(!url.includes(TARGET)||!response.ok)return response;
    try{
      const [data,library,formal]=await Promise.all([response.clone().json(),assetLibraryPromise,formalAuthorityPromise]);const retired=retiredPaths(library),currentFormal=currentFormalPaths(formal);
      const posts=(data.posts||[]).map(post=>{const mediaReason=needsQuarantine(post,retired,currentFormal);if(mediaReason)return ensureGenerationReason(quarantine(post,mediaReason));const copyReason=validateFormalCopy(post);if(copyReason&&post.status!=='published'&&post.status!=='archived')return ensureGenerationReason(quarantine(post,copyReason));return ensureGenerationReason(post)});
      const merged={...data,version:`${String(data.version||'post-bank').replace(/\+current-authority.*$/,'')}+current-authority-20260820-v7`,posts};
      merged.productAuthority={...(data.productAuthority||{}),textAuthority:'public-product-master.json',knowledgeProducts:6,approvedMediaProducts:6,drink30Usage:CURRENT_30_USAGE,drink180Usage:'每日一包',deferredProductPolicy:'柒玄茶暫不放官網與公開貼文；允許LINE文字知識與ERP內部保留',guardPolicy:'latest-product-authority-first-no-legacy-copy-version-lock'};
      delete merged.productAuthority.sixProductsSixSpecs;
      merged.counts={...(data.counts||{}),total:posts.length,current_authority_regeneration:posts.filter(p=>p.candidate_generation_mode==='current-authority-regeneration-required').length,needs_generation:posts.filter(p=>p.image_status==='needs_generation'&&p.status!=='published'&&!p.campaign_hold).length};
      const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');headers.set('x-xianjiawei-post-bank-current-authority',RUNTIME);return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response}
  };
  window.XJWCurrentPostMediaAuthority=Object.freeze({runtime:RUNTIME,current30Usage:CURRENT_30_USAGE,assetLibrary:ASSET_LIBRARY,formalAuthority:FORMAL_AUTHORITY,disallowedAssetStatuses:[...DISALLOWED_ASSET_STATUSES],normalize,productSegments,retiredPaths,currentFormalPaths,needsQuarantine,quarantine,ensureGenerationReason,validateFormalCopy});
})();
