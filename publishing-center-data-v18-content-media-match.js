(()=>{
  'use strict';
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const VERSION='2026-08-20-v18-six-public-semantic-media-no-stale-authority';
  const SITE='https://ts15825868.github.io/xianjiawei/';
  const COMPAT='images/post-library/userzip3-v20260811/';
  const url=path=>SITE+path;

  // 這一層只替「生活情境」候選找既有可用圖，不覆蓋產品總覽／組合／使用指南等需要依目前六項官網公開產品權威重新生成的圖。
  // 舊ZIP名稱只作來源追溯，不代表目前最新權威。
  const MEDIA=Object.freeze({
    'XJW-WORK-REST-001':{path:COMPAT+'work-break.webp',alt:'仙加味小老闆在工作空檔喝水休息的日常情境',source:'相容生活素材｜work-break｜需目前16項審核',status:'candidate-review-required'},
    'POST-STORAGE':{path:COMPAT+'storage.webp',alt:'仙加味產品保存整理的居家情境',source:'相容生活素材｜storage｜需目前16項審核',status:'candidate-review-required'},
    'POST-DAILY-SOUP':{path:COMPAT+'warm-rhythm.webp',alt:'仙加味小老闆在家準備溫熱湯品的生活情境',source:'相容生活素材｜warm-rhythm｜需目前16項審核',status:'candidate-review-required'},
    'POST-WEATHER-HOT':{path:COMPAT+'hot-weather-hydration-2.webp',alt:'天氣悶熱外出時攜帶水壺的仙加味生活情境',source:'相容生活素材｜hot-weather-hydration-2｜發布前需即時天氣確認',status:'live-check-required'},
    'POST-WEATHER-TEMP':{path:COMPAT+'temperature-coat.webp',alt:'早晚溫差明顯時攜帶薄外套的仙加味生活情境',source:'相容生活素材｜temperature-coat｜發布前需即時天氣確認',status:'live-check-required'},
    'POST-WEATHER-RAIN':{path:COMPAT+'rainy-home.webp',alt:'下雨天回到室內收傘並喝溫水的仙加味生活情境',source:'相容生活素材｜rainy-home｜發布前需即時天氣確認',status:'live-check-required'}
  });
  const WEATHER_COPY=Object.freeze({
    'POST-WEATHER-HOT':'天氣悶熱、準備外出時，水壺記得帶著，依活動狀況補充水分。仙加味想提醒的不是多做多少，而是讓日常安排保持清楚、順手。',
    'POST-WEATHER-TEMP':'早晚溫差比較明顯時，出門前可以多帶一件薄外套。仙加味把這種小小的準備也看成生活節奏的一部分。',
    'POST-WEATHER-RAIN':'下雨天回到室內，先收好雨傘、喝口溫水，再整理手邊的事。仙加味想把補養放進這種實際生活情境裡，讓節奏自然一點。'
  });
  const KEEP_NEEDS_GENERATION=new Set(['POST-PRODUCT-OVERVIEW','POST-CHOOSE','POST-COMBO','POST-GUIDE','POST-CHOOSE-BY-HABIT']);

  function fix(post){
    if(!post||post.status==='published'||post.status==='archived'||post.prevent_republish===true||post.do_not_republish===true)return post;
    if(KEEP_NEEDS_GENERATION.has(post.id)){
      return{...post,status:'pending_review',image_url:null,image_asset_id:null,image_status:'needs_generation',regeneration_mode:'chatgpt_handoff',candidate_generated:false,owner_review_required:true,approval_required:true,publish_allowed:false,schedule_enabled:false,scheduled_at:null,auto_approve:false,auto_schedule:false,auto_publish:false,image_review_reason:post.image_review_reason||'此篇需要依目前官網六項公開產品文字權威／六項核准媒體重新建立圖文一致候選；舊七項官網模型、舊產品資訊圖與舊ZIP拼圖不得覆蓋。'};
    }
    const media=MEDIA[post.id];
    let out=post;
    if(media&&String(post.image_status||'')!=='approved-existing-pending-copy-review'){
      out={...out,status:'pending_review',image_asset_id:`v18-current-${String(post.id).toLowerCase()}`,image_url:url(media.path),image_alt:media.alt,image_source:media.source,image_status:media.status,candidate_generated:false,candidate_generation_mode:'existing-compatible-lifestyle-media-current-review',owner_review_required:true,approval_required:true,publish_allowed:false,schedule_enabled:false,scheduled_at:null,auto_approve:false,auto_schedule:false,auto_publish:false,image_review_reason:'這是既有相容生活情境候選，不是最新權威本身；必須依目前文案、季節、環境、冷熱、小老闆與16項規則重新審核後才能核准。'};
    }
    if(WEATHER_COPY[out.id])out={...out,copy:WEATHER_COPY[out.id],live_check_required:true,image_status:'live-check-required',weather_review_required:true,weather_review_max_age_hours:12,publish_allowed:false,schedule_enabled:false,auto_schedule:false,auto_publish:false};
    return out;
  }
  function countDuplicateLifestyle(posts){
    const seen=new Map();let duplicates=0;
    for(const post of posts){
      if(!post||post.status==='published'||post.status==='archived')continue;
      const image=String(post.image_url||'').split(/[?#]/)[0];
      if(!image)continue;
      if(/customer-display-v20260812|trial-poster-small-boss-official-v20260814|final-published/.test(image))continue;
      if(seen.has(image))duplicates++;else seen.set(image,post.id);
    }
    return duplicates;
  }
  window.fetch=async function(input,init){
    const requestUrl=typeof input==='string'?input:(input?.url||'');const response=await PREV_FETCH(input,init);if(!requestUrl.includes(TARGET)||!response.ok)return response;
    try{
      const data=await response.clone().json();const posts=(data.posts||[]).map(fix);const active=posts.filter(p=>p&&p.status!=='published'&&p.status!=='archived'&&!p.campaign_hold);const missing=active.filter(p=>!String(p.image_url||'').trim()).length;const needs=active.filter(p=>p.image_status==='needs_generation'||p.requires_image_generation===true).length;
      const merged={...data,version:`${data.version||'post-bank'}+v18-six-public-semantic-media`,posts};
      merged.counts={...(data.counts||{}),total:posts.length,known_image_copy_mismatches:needs,missing_asset_bindings:missing,duplicate_primary_images:countDuplicateLifestyle(posts),semantic_media_bound:posts.filter(p=>MEDIA[p.id]).length,weather_live_check_count:posts.filter(p=>p.weather_review_required===true).length};
      const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');headers.set('x-xianjiawei-post-bank-semantic-media',VERSION);return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response;}
  };
  window.XJWPostBankV18=Object.freeze({version:VERSION,media:MEDIA,weatherCopy:WEATHER_COPY,keepNeedsGeneration:[...KEEP_NEEDS_GENERATION],fix,countDuplicateLifestyle});
})();
