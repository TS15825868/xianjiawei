(()=>{
  const PREV_FETCH=window.fetch.bind(window);
  const TARGET='content/public-post-library.json';
  const HOLD_IDS=new Set(Array.from({length:11},(_,i)=>`XJW-TRIAL-${String(i+2).padStart(3,'0')}`));
  const HOLD_UNTIL='2026-11-06';
  const PRIORITY1={
    'POST-PRODUCT-OVERVIEW':'images/posts/generated-v20260808-priority1/product-overview.svg','POST-GAO-100':'images/posts/generated-v20260808-priority1/guilu-gao-100g.svg','POST-DRINK-30':'images/posts/generated-v20260808-priority1/guilu-drink-30cc.svg','POST-DRINK-180':'images/posts/generated-v20260808-priority1/guilu-drink-180cc.svg','POST-JIAO-600':'images/posts/generated-v20260808-priority1/guilu-jiao-600g.svg','POST-COMBO':'images/posts/generated-v20260808-priority1/guilu-gao-drink-combo.svg'
  };
  const REPLACEMENTS={
    'XJW-WORK-REST-001':{id:'preflight-work-rest',path:'images/posts/generated-v20260808-preflight/work-rest.svg'},
    'POST-STORAGE':{id:'preflight-storage',path:'images/posts/generated-v20260808-preflight/storage.svg'},
    'POST-SEASONS-RHYTHM':{id:'preflight-four-seasons',path:'images/posts/generated-v20260808-preflight/four-seasons.svg'},
    'POST-INGREDIENT-PRINCIPLE':{id:'preflight-ingredient-principle',path:'images/posts/generated-v20260808-preflight/ingredient-principle.svg'},
    'POST-DAILY-SOUP':{id:'preflight-daily-soup',path:'images/posts/generated-v20260808-preflight/daily-soup.svg'},
    'POST-WEATHER-HOT':{id:'preflight-weather-hot',path:'images/posts/generated-v20260808-preflight/weather-hot.svg'},
    'POST-WEATHER-TEMP':{id:'preflight-weather-temp',path:'images/posts/generated-v20260808-preflight/weather-temp.svg'},
    'POST-WEATHER-RAIN':{id:'preflight-weather-rain',path:'images/posts/generated-v20260808-preflight/weather-rain.svg'},
    'POST-GUIDE':{id:'preflight-guide-use',path:'images/posts/generated-v20260808-preflight/guide-use.svg'},
    'POST-STORE':{id:'preflight-contact-line',path:'images/posts/generated-v20260808-preflight/contact-line.svg'},
    'POST-RECIPES':{id:'preflight-recipes',path:'images/posts/generated-v20260808-preflight/recipes.svg'},
    'POST-CHOOSE':{id:'preflight-choose-products',path:'images/posts/generated-v20260808-preflight/choose-products.svg'},
    'POST-CHOOSE-BY-HABIT':{id:'preflight-choose-by-habit',path:'images/posts/generated-v20260808-preflight/choose-by-habit.svg'}
  };
  const PRECHECK_REJECT={
    'XJW-WORK-REST-001':'原候選使用 home-brand 品牌場景，與「工作空檔、喝溫水、放慢步調」情境不一致。','POST-STORAGE':'原候選使用 FAQ 看板，沒有呈現冰箱、密封、防潮或乾燥收納，與保存主題不一致。','POST-SEASONS-RHYTHM':'原四季候選四格重複同一張 home-brand 圖，只靠色塊區分季節，未實際呈現春夏秋冬環境。','POST-INGREDIENT-PRINCIPLE':'原候選嵌入已標記 deprecated-reference-only 的 products-all 舊全系列圖，即使降低透明度仍不可使用。','POST-DAILY-SOUP':'原候選直接嵌入 recipes 舊場景，且出現非正式原圖的深色產品塊，不符合產品本體只能用正式原圖的規則。','POST-WEATHER-HOT':'原候選把 home-brand 室內品牌圖套上太陽與暖色，未真正呈現悶熱外出／分次補水環境。','POST-WEATHER-TEMP':'原候選把 home-brand 室內品牌圖套上日夜符號，未真正呈現早晚溫差與攜帶薄外套情境。','POST-WEATHER-RAIN':'原候選把 home-brand 室內品牌圖套上雨線，未真正呈現窗外雨景、收傘與室內溫水情境。','POST-GUIDE':'原「怎麼使用」候選直接畫出 AI 罐、瓶、產品塊與粉體，沒有使用正式產品原圖，也沒有正確區分30cc小玻璃罐與180cc鋁袋。','POST-STORE':'原 LINE 聯絡候選同框出現多個舊產品包裝與舊龜鹿飲袋型；品牌／聯絡貼文不應帶入錯誤產品視覺。','POST-RECIPES':'原料理候選把深色產品塊直接畫在料理場景中；若代表龜鹿湯塊或龜鹿膠，就違反產品只能使用正式原圖的規則。','POST-CHOOSE':'原「怎麼選」候選只用泛用碗、杯、鍋、粉體圖示代表正式產品，無法準確對應六項正式產品與包裝。','POST-CHOOSE-BY-HABIT':'原候選沿用舊 choose 圖示作為核心產品選擇畫面，沒有使用六項正式產品原圖，需重做。'
  };
  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input?.url||''); const response=await PREV_FETCH(input,init); if(!url.includes(TARGET)||!response.ok)return response;
    try{
      const data=await response.clone().json();
      const posts=(data.posts||[]).map(p=>{
        if(HOLD_IDS.has(p.id))return{...p,status:'pending_review',image_status:'campaign_hold',campaign_hold:true,campaign_hold_until:HOLD_UNTIL,publish_allowed:false,schedule_enabled:false,scheduled_at:null,owner_review_required:true,approval_required:true,image_review_reason:'試喝最終主圖已於2026-08-08確認發布。為避免短期重複，這篇試喝變體暫緩至2026-11-06，屆時仍需重新審核後才可生圖或發布。'};
        const candidate=PRIORITY1[p.id];
        if(candidate&&p.status!=='published')return{...p,status:'pending_review',image_url:candidate,image_status:'candidate-review-required',candidate_generated:true,candidate_generation_mode:'exact-official-original-composite',candidate_generated_at:'2026-08-08T15:47:00+08:00',publish_allowed:false,schedule_enabled:false,scheduled_at:null,owner_review_required:true,approval_required:true,image_review_reason:'第一優先批次已用官網正式產品原圖等比例合成1254×1254候選圖；產品本體未重畫、未裁切、未改包裝。仍須完成16項檢查後才可核准。'};
        const replacement=REPLACEMENTS[p.id];
        if(replacement&&p.status!=='published')return{...p,status:'pending_review',image_asset_id:replacement.id,image_url:replacement.path,image_status:'candidate-review-required',candidate_generated:true,candidate_generation_mode:'strict-preflight-replacement',candidate_generated_at:'2026-08-08T19:04:00+08:00',image_preflight:'replaced_after_reject',preflight_rejected_history:true,old_candidate_rejected:true,publish_allowed:false,schedule_enabled:false,scheduled_at:null,owner_review_required:true,approval_required:true,image_review_reason:`舊候選已隔離並重做。原退回原因：${PRECHECK_REJECT[p.id]} 新候選仍須完成16項檢查後才可核准。`};
        return p;
      });
      const merged={...data,version:'2026-08-08-public-posts-v16-preflight-asset-ids',posts};
      merged.counts={...(data.counts||{}),total:posts.length,campaign_hold:posts.filter(p=>p.campaign_hold).length,priority1_candidate:posts.filter(p=>p.candidate_generation_mode==='exact-official-original-composite').length,preflight_replaced:posts.filter(p=>p.image_preflight==='replaced_after_reject').length,pending_review:posts.filter(p=>p.status==='pending_review'&&!p.campaign_hold).length,needs_generation:posts.filter(p=>p.image_status==='needs_generation'||(!p.image_url&&p.status!=='published'&&!p.campaign_hold)).length};
      const headers=new Headers(response.headers); headers.set('content-type','application/json; charset=utf-8'); headers.set('cache-control','no-store'); return new Response(JSON.stringify(merged),{status:response.status,statusText:response.statusText,headers});
    }catch{return response}
  };
})();