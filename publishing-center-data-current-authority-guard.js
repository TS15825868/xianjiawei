(()=>{
  'use strict';
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const ASSET_LIBRARY='content/public-asset-library.json';
  const RUNTIME='current-authority-media-guard';
  const DISALLOWED_ASSET_STATUSES=new Set([
    'deprecated-reference-only',
    'preflight-rejected-reference-only',
    'superseded-reference-only'
  ]);
  const CURRENT_COPY_CONFLICTS=[
    /\/images\/dm-approved-v20260810\/guilu-drink-30cc\.webp(?:[?#]|$)/i
  ];
  const normalize=value=>String(value||'').replace(/^https?:\/\/[^/]+\/xianjiawei\//i,'').replace(/^\//,'').split(/[?#]/)[0];
  const assetLibraryPromise=PREV_FETCH(ASSET_LIBRARY+'?authority=current',{cache:'no-store'})
    .then(response=>response.ok?response.json():null)
    .catch(()=>null);

  function retiredPaths(library){
    const set=new Set();
    for(const asset of Array.isArray(library?.assets)?library.assets:[]){
      if(DISALLOWED_ASSET_STATUSES.has(String(asset?.status||''))){
        const path=normalize(asset?.path);
        if(path)set.add(path);
      }
    }
    return set;
  }
  function needsQuarantine(post,retired){
    if(!post||post.status==='published'||post.status==='archived'||post.prevent_republish===true||post.do_not_republish===true)return'';
    const image=String(post.image_url||'').trim();
    if(!image)return'';
    const normalized=normalize(image);
    if(retired.has(normalized))return `圖片已由目前公開資產權威標記為退役：${normalized}`;
    if(/\/images\/products-v2\/|\/images\/dm-final\//i.test(image))return '圖片仍使用舊產品圖／舊DM';
    if(CURRENT_COPY_CONFLICTS.some(pattern=>pattern.test(image)))return '30cc DM內嵌文字仍是30cc／瓶，與目前30cc／罐（小玻璃罐）正式規格衝突';
    return'';
  }
  function quarantine(post,reason){
    const originalPrompt=String(post.image_prompt||'').trim();
    return{
      ...post,
      status:'pending_review',
      image_url:null,
      image_asset_id:null,
      image_status:'needs_generation',
      candidate_generated:false,
      candidate_generation_mode:'current-authority-regeneration-required',
      publish_allowed:false,
      schedule_enabled:false,
      scheduled_at:null,
      owner_review_required:true,
      approval_required:true,
      image_policy:'current-authority-copy-match-products-v3-no-collage',
      image_prompt:originalPrompt||'依原貼文文案重新建立一張完整1:1單一場景候選圖；季節、情境、環境、冷熱、表情、動作與道具必須吻合文案。若需要產品本體，只能合成products-v3目前正式產品原圖並保留實際比例；30cc必須是小玻璃裸罐、180cc必須是狹長鋁袋。若不需要產品則不放產品。生成後只回待審核，不自動核准、排程或發布。',
      image_review_reason:`${reason}。目前權威守門已移除舊候選；優先比對最新使用者ZIP與正式產品／試喝媒體，真的沒有合格來源才重新生成。任何換圖或生成後都回待審核並重新完成16項檢查。`
    };
  }
  function validateFormalCopy(post){
    const serialized=JSON.stringify(post||{});
    if(/30\s*cc.{0,40}(玻璃瓶|瓶裝|[／/]\s*瓶)/i.test(serialized))return '貼文仍含30cc瓶型舊稱';
    if(/龜鹿湯塊.{0,80}(300\s*g|600\s*g)/i.test(serialized))return '龜鹿湯塊仍含舊容量';
    return'';
  }
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||'');
    const response=await PREV_FETCH(input,init);
    if(!url.includes(TARGET)||!response.ok)return response;
    try{
      const [data,library]=await Promise.all([response.clone().json(),assetLibraryPromise]);
      const retired=retiredPaths(library);
      const posts=(data.posts||[]).map(post=>{
        const mediaReason=needsQuarantine(post,retired);
        if(mediaReason)return quarantine(post,mediaReason);
        const copyReason=validateFormalCopy(post);
        if(copyReason&&post.status!=='published'&&post.status!=='archived')return quarantine(post,copyReason);
        return post;
      });
      const merged={...data,version:`${data.version||'post-bank'}+current-authority`,posts};
      merged.counts={
        ...(data.counts||{}),
        total:posts.length,
        current_authority_regeneration:posts.filter(post=>post.candidate_generation_mode==='current-authority-regeneration-required').length,
        needs_generation:posts.filter(post=>post.image_status==='needs_generation'&&post.status!=='published'&&!post.campaign_hold).length
      };
      const headers=new Headers(response.headers);
      headers.set('content-type','application/json; charset=utf-8');
      headers.set('cache-control','no-store');
      headers.set('x-xianjiawei-post-bank-current-authority',RUNTIME);
      return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response;}
  };
  window.XJWCurrentPostMediaAuthority=Object.freeze({runtime:RUNTIME,assetLibrary:ASSET_LIBRARY,disallowedAssetStatuses:[...DISALLOWED_ASSET_STATUSES],normalize,retiredPaths,needsQuarantine,quarantine});
})();
