(()=>{
  'use strict';
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const VERSION='2026-08-15-v18-semantic-media-season-weather';
  const SITE='https://ts15825868.github.io/xianjiawei/';
  const U='images/post-library/userzip3-v20260811/';
  const N='images/posts/current-v20260815/';
  const url=path=>SITE+path;
  const MEDIA=Object.freeze({
    'XJW-WORK-REST-001':{path:U+'work-break.webp',alt:'仙加味小老闆在工作空檔喝水休息的日常情境',source:'2026-08-11最新使用者ZIP｜work-break',status:'candidate-review-required'},
    'POST-PRODUCT-OVERVIEW':{path:N+'product-overview.svg',alt:'仙加味六項正式產品以獨立卡片呈現的產品總覽',source:'2026-08-15正式產品原圖獨立卡片合成',status:'candidate-review-required'},
    'POST-CHOOSE':{path:'images/brand/hd-v20260812/choose.jpg',alt:'仙加味小老闆指向產品選擇說明看板',source:'2026-08-12官網核准HD小老闆｜怎麼選',status:'candidate-review-required'},
    'POST-STORAGE':{path:U+'storage.webp',alt:'仙加味產品開封後與平時保存提醒情境',source:'2026-08-11最新使用者ZIP｜storage',status:'candidate-review-required'},
    'POST-COMBO':{path:N+'gao-drink-combo.svg',alt:'龜鹿膏、30cc龜鹿飲與180cc龜鹿飲依生活型態分開呈現',source:'2026-08-15正式產品原圖獨立卡片搭配圖',status:'candidate-review-required'},
    'POST-GUIDE':{path:N+'guide-use.svg',alt:'龜鹿系列依產品型態整理的一般使用方式圖',source:'2026-08-15使用方式資訊圖',status:'candidate-review-required'},
    'POST-DAILY-SOUP':{path:U+'warm-rhythm.webp',alt:'溫熱料理與日常慢慢安排的生活情境',source:'2026-08-11最新使用者ZIP｜warm-rhythm',status:'candidate-review-required'},
    'POST-RECIPES':{path:N+'recipe-cooking.svg',alt:'家常湯鍋與溫熱料理搭配情境',source:'2026-08-15日常料理情境圖',status:'candidate-review-required'},
    'POST-CHOOSE-BY-HABIT':{path:N+'choose-by-habit.svg',alt:'依外出、居家、料理與自行搭配習慣選擇龜鹿型態',source:'2026-08-15依習慣選擇資訊圖',status:'candidate-review-required'},
    'POST-WEATHER-HOT':{path:U+'hot-weather-hydration-2.webp',alt:'天氣悶熱外出時留意補水與防曬的情境',source:'2026-08-11最新使用者ZIP｜hot-weather-hydration-2',status:'live-check-required'},
    'POST-WEATHER-TEMP':{path:U+'temperature-coat.webp',alt:'早晚溫差明顯時外出多帶一件薄外套的情境',source:'2026-08-11最新使用者ZIP｜temperature-coat',status:'live-check-required'},
    'POST-WEATHER-RAIN':{path:U+'rainy-home.webp',alt:'下雨天在家放慢步調並喝溫水的情境',source:'2026-08-11最新使用者ZIP｜rainy-home',status:'live-check-required'}
  });
  const WEATHER_COPY=Object.freeze({
    'POST-WEATHER-HOT':'天氣悶熱時，外出記得帶水，依活動量分次補充，也可留意防曬與休息。',
    'POST-WEATHER-TEMP':'早晚溫差較明顯時，外出可多帶一件薄外套，依當天實際溫度調整穿著。',
    'POST-WEATHER-RAIN':'下雨天的步調可以慢一點，收好雨具，回到室內喝口溫水、整理手邊的事。'
  });
  function fix(post){
    if(!post||post.status==='published'||post.status==='archived'||post.prevent_republish===true||post.do_not_republish===true)return post;
    const media=MEDIA[post.id];
    let out=post;
    if(media){
      out={...out,status:'pending_review',image_asset_id:`v18-${String(post.id).toLowerCase()}`,image_url:url(media.path),image_alt:media.alt,image_source:media.source,image_status:media.status,candidate_generated:false,candidate_generation_mode:'existing-current-media-v18',owner_review_required:true,approval_required:true,publish_allowed:false,schedule_enabled:false,scheduled_at:null,auto_approve:false,auto_schedule:false,auto_publish:false,image_review_reason:'已依目前正式素材與原文案重新配圖；需重新完成16項圖文審核後才能核准。'};
      delete out.regeneration_mode;
      delete out.requires_image_generation;
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
      if(/customer-display-v20260812|products-v3|trial-poster-small-boss-official-v20260814/.test(image))continue;
      if(seen.has(image))duplicates++;else seen.set(image,post.id);
    }
    return duplicates;
  }
  window.fetch=async function(input,init){
    const requestUrl=typeof input==='string'?input:(input?.url||'');
    const response=await PREV_FETCH(input,init);
    if(!requestUrl.includes(TARGET)||!response.ok)return response;
    try{
      const data=await response.clone().json();
      const posts=(data.posts||[]).map(fix);
      const active=posts.filter(p=>p&&p.status!=='published'&&p.status!=='archived'&&!p.campaign_hold);
      const missing=active.filter(p=>!String(p.image_url||'').trim()).length;
      const needs=active.filter(p=>p.image_status==='needs_generation'||p.requires_image_generation===true).length;
      const merged={...data,version:`${data.version||'post-bank'}+v18-semantic-media`,posts};
      merged.counts={...(data.counts||{}),total:posts.length,known_image_copy_mismatches:needs,missing_asset_bindings:missing,duplicate_primary_images:countDuplicateLifestyle(posts),semantic_media_bound:posts.filter(p=>MEDIA[p.id]).length,weather_live_check_count:posts.filter(p=>p.weather_review_required===true).length};
      const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');headers.set('cache-control','no-store');headers.set('x-xianjiawei-post-bank-semantic-media',VERSION);
      return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response;}
  };
  window.XJWPostBankV18=Object.freeze({version:VERSION,media:MEDIA,weatherCopy:WEATHER_COPY,fix,countDuplicateLifestyle});
})();