import fs from 'node:fs';
import path from 'node:path';
import { renderScenePoster, cacheBusted, sceneSourceLabel } from './render-scene-poster-core-v20260817.mjs';

const manifestPath='images/posts/priority10-v20260817/manifest.json';
const manifest=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
if(manifest.posts.length!==10) throw new Error(`priority10 count ${manifest.posts.length}`);

const SCENE_BY_ID={
  'XJW-GUILU-choose-by-place':'home_out',
  'XJW-GUILU-drink180-home':'home',
  'XJW-GUILU-drink30-work-break':'work',
  'XJW-GUILU-gao-storage':'storage',
  'XJW-GUILU-jiao-600g':'weekend_home',
  'XJW-GUILU-luerong-75g':'afternoon_work',
  'XJW-GUILU-tangkuai-soup':'kitchen_dinner',
  'XJW-SOCIAL-20260815-01-warm-drink-moment':'work_afternoon',
  'XJW-SOCIAL-20260815-03-storage-basics':'storage_home',
  'XJW-SOCIAL-20260815-02-line-consult-and-trial':'consult_phone'
};
const BULLETS_BY_ID={
  'XJW-GUILU-choose-by-place':['在家與外出先看今天行程','直接飲用、溫熱或料理搭配','先看生活再選產品'],
  'XJW-GUILU-drink180-home':['回家後把步調放慢','180cc鋁袋可溫熱飲用','依自己的生活習慣安排'],
  'XJW-GUILU-drink30-work-break':['上班外出輕巧帶著走','工作告一段落再找空檔','30cc小玻璃裸罐'],
  'XJW-GUILU-gao-storage':['未開封放常溫陰涼處','開罐後記得冷藏','取用後蓋好放回固定位置'],
  'XJW-GUILU-jiao-600g':['週末慢慢看清產品型態','600g／盒、32塊裝','從料理與家庭使用方式認識'],
  'XJW-GUILU-luerong-75g':['下午工作告一段落','鹿茸粉75g／罐','先看標示再依習慣安排'],
  'XJW-GUILU-tangkuai-soup':['今晚煮一鍋家常熱湯','75g／盒、8塊裝','回到餐桌與燉煮情境'],
  'XJW-SOCIAL-20260815-01-warm-drink-moment':['離開螢幕休息幾分鐘','依工作與居家情境選擇','想溫熱時再調整溫度'],
  'XJW-SOCIAL-20260815-03-storage-basics':['星期天順手整理櫃子','開封與未開封分開整理','龜鹿膏開罐後冷藏'],
  'XJW-SOCIAL-20260815-02-line-consult-and-trial':['先說平常在家或外出','再說習慣時間與使用方式','產品、試喝、下單都可LINE詢問']
};

for(const [index,post] of manifest.posts.entries()){
  post.scene=SCENE_BY_ID[post.id]||'general';
  post.bullets=BULLETS_BY_ID[post.id]||[];
  fs.mkdirSync(path.dirname(post.image_path),{recursive:true});
  const meta=await renderScenePoster(post,index,post.image_path);
  post.image_url=cacheBusted(post.image_url);
  post.image_alt=`${String(post.image_alt||'').replace(/｜完整生活場景v2$/,'')}｜完整生活場景v2`;
  post.image_source=sceneSourceLabel();
  console.log('PRIORITY10_SCENE',post.id,meta.kind,meta.hero);
}
manifest.version='2026-08-17-priority10-scene-v4';
manifest.generated_at='2026-08-17';
manifest.visual_policy={full_lifestyle_scene:true,website_q_mascot:true,official_product_art:true,ai_product_redraw_forbidden:true,unique_image:true,human_review_required:true};
fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');
console.log('PASS priority10 full-scene render',manifest.posts.length);
