(()=>{
  'use strict';
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const ASSET_LIBRARY='content/public-asset-library.json';
  const FORMAL_AUTHORITY='data/formal-media-authority-v20260810.json';
  const RUNTIME='current-authority-media-sanitizer-20260812-v2';
  const DISALLOWED_ASSET_STATUSES=new Set(['deprecated-reference-only','preflight-rejected-reference-only','superseded-reference-only']);
  const normalize=value=>String(value||'').replace(/^https?:\/\/[^/]+\/xianjiawei\//i,'').replace(/^\//,'').split(/[?#]/)[0];
  const assetLibraryPromise=PREV_FETCH(ASSET_LIBRARY+'?authority=20260812-v2',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);
  const formalAuthorityPromise=PREV_FETCH(FORMAL_AUTHORITY+'?authority=20260812-dm-binary-fix-v2',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null);

  function retiredPaths(library){
    const set=new Set();
    for(const asset of Array.isArray(library?.assets)?library.assets:[]){
      if(DISALLOWED_ASSET_STATUSES.has(String(asset?.status||''))){const p=normalize(asset?.path);if(p)set.add(p);}
    }
    set.add('images/dm-approved-v20260810/guilu-gao-100g.webp');
    return set;
  }
  function currentFormalPaths(authority){
    const set=new Set();
    for(const product of Array.isArray(authority?.products)?authority.products:[]){
      if(product?.status==='approved_display'){
        for(const value of [product.image,product.dm]){const p=normalize(value);if(p)set.add(p);}
      }
    }
    if(authority?.trial?.status==='approved_display'){const p=normalize(authority.trial.image);if(p)set.add(p);}
    return set;
  }
  function needsQuarantine(post,retired,currentFormal){
    if(!post||post.status==='published'||post.status==='archived'||post.prevent_republish===true||post.do_not_republish===true)return'';
    const image=String(post.image_url||'').trim();
    if(!image)return'';
    const normalized=normalize(image);
    if(currentFormal.has(normalized))return'';
    if(retired.has(normalized))return `圖片已由目前公開資產權威標記為退役：${normalized}`;
    if(/\/images\/brand\/line-oa\//i.test(image))return '官網／貼文候選不得直接混用 LINE OA 專用角色圖片';
    if(/\/images\/products-v2\//i.test(image))return '圖片仍使用退役 products-v2 產品圖';
    if(/guilu-gao-100g\.webp/i.test(image))return '龜鹿膏詳細DM仍指向已確認損壞的WebP';
    if(/\/images\/dm-(?:final|approved-v\d+)\//i.test(image))return '圖片位於DM目錄但不在目前正式媒體authority核准清單';
    return'';
  }
  function quarantine(post,reason){
    const originalPrompt=String(post.image_prompt||'').trim();
    return{
      ...post,status:'pending_review',image_url:null,image_asset_id:null,image_status:'needs_generation',candidate_generated:false,
      candidate_generation_mode:'current-authority-regeneration-required',publish_allowed:false,schedule_enabled:false,scheduled_at:null,
      owner_review_required:true,approval_required:true,image_policy:'current-six-product-images-or-valid-dm-or-trial; products-v3-identity-reference-only; no-collage-no-line-oa-mix',
      image_prompt:originalPrompt||'依原貼文文案建立一張完整1:1單一場景候選圖；季節、情境、環境、冷熱、表情、動作與道具必須吻合文案。若貼文是一般產品主題，優先使用目前六張正式產品圖；若明確是DM主題才使用目前有效詳細DM；若為試喝主題固定使用正式試喝主圖。products-v3只作真實產品外觀、包裝與比例校正，不得改畫產品。30cc必須是小玻璃裸罐、180cc必須是狹長鋁袋。小老闆使用官網專用核准造型，不得直接裁切或混用LINE OA專用角色圖。若不需要產品則不放產品。生成或換圖後只回待審核，不自動核准、排程或發布。',
      image_review_reason:`${reason}。目前媒體authority會先允許六張正式產品圖、有效詳細DM與正式試喝圖，再比對最新使用者ZIP；有合格來源但二進位未同步時維持needs_binary_sync，不亂重生成；真的沒有合格來源才生成。任何換圖或生成後都回待審核並重新完成16項檢查。`
    };
  }
  function validateFormalCopy(post){
    const serialized=JSON.stringify(post||{});
    if(/30\s*cc.{0,40}(玻璃瓶|瓶裝|[／/]\s*瓶)/i.test(serialized))return '貼文仍含30cc瓶型退役稱呼';
    if(/龜鹿湯塊.{0,80}(300\s*g|600\s*g)/i.test(serialized))return '龜鹿湯塊仍含退役容量';
    if(/龜鹿湯塊.{0,100}每塊約?\s*9\.375g/i.test(serialized))return '龜鹿湯塊貼文主規格不應放每塊約9.375g；此值只留產品詳細資料';
    if(/龜鹿膠.{0,100}每塊約?\s*18\.75g/i.test(serialized))return '龜鹿膠貼文主規格不應放每塊約18.75g；此值只留產品詳細資料';
    if(/龜鹿膠/.test(serialized)&&/600\s*g/.test(serialized)&&!/32\s*塊/.test(serialized)&&/(規格|容量|盒裝)/.test(serialized))return '龜鹿膠主規格應維持600g（1斤）／盒｜32塊裝';
    if(/龜鹿膏.{0,100}(每日早上及下午各一小匙|早晚各一小匙)/i.test(serialized))return '龜鹿膏仍含退役使用方式';
    return'';
  }
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const response=await PREV_FETCH(input,init);
    if(!url.includes(TARGET)||!response.ok)return response;
    try{
      const [data,library,formal]=await Promise.all([response.clone().json(),assetLibraryPromise,formalAuthorityPromise]);
      const retired=retiredPaths(library),currentFormal=currentFormalPaths(formal);
      const posts=(data.posts||[]).map(post=>{
        const mediaReason=needsQuarantine(post,retired,currentFormal);
        if(mediaReason)return quarantine(post,mediaReason);
        const copyReason=validateFormalCopy(post);
        if(copyReason&&post.status!=='published'&&post.status!=='archived')return quarantine(post,copyReason);
        return post;
      });
      const merged={...data,version:`${data.version||'post-bank'}+current-authority-20260812-v2`,posts};
      merged.counts={...(data.counts||{}),total:posts.length,current_authority_regeneration:posts.filter(p=>p.candidate_generation_mode==='current-authority-regeneration-required').length,needs_generation:posts.filter(p=>p.image_status==='needs_generation'&&p.status!=='published'&&!p.campaign_hold).length};
      const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');headers.set('x-xianjiawei-post-bank-current-authority',RUNTIME);
      return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response;}
  };
  window.XJWCurrentPostMediaAuthority=Object.freeze({runtime:RUNTIME,assetLibrary:ASSET_LIBRARY,formalAuthority:FORMAL_AUTHORITY,disallowedAssetStatuses:[...DISALLOWED_ASSET_STATUSES],normalize,retiredPaths,currentFormalPaths,needsQuarantine,quarantine,validateFormalCopy});
})();
