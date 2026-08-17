import fs from 'node:fs';
import path from 'node:path';
import { renderScenePoster, cacheBusted, sceneSourceLabel } from './render-scene-poster-core-v20260817.mjs';

const batchFiles=[1,2,3].map(n=>`asset-staging/remainder66-v20260817/batch${n}.json`);
const posts=batchFiles.flatMap(f=>JSON.parse(fs.readFileSync(f,'utf8')).posts||[]);
if(posts.length!==66) throw new Error(`expected 66 posts, got ${posts.length}`);
const outDir='images/posts/remainder66-v20260817';
const outManifest=path.join(outDir,'manifest.json');
fs.mkdirSync(outDir,{recursive:true});

function sanitizeCopy(s=''){
  return String(s)
   .replace('如果本來就容易覺得燥熱、睡不好或口乾，也可以減量或隔天再安排。','第一次可以先從較少份量開始，覺得當天不適合時就先暫停，之後再依自己的生活狀況安排。')
   .replace('如果本來容易覺得燥熱、睡不好或口乾，可以減量或隔天再安排。','第一次可以先從較少份量開始，覺得當天不適合時就先暫停，之後再依自己的生活狀況安排。');
}

const final=[];
for(const [index,src] of posts.entries()){
  const p={...src,copy:sanitizeCopy(src.copy)};
  p.image_path=`${outDir}/${p.id}.webp`;
  p.image_url=cacheBusted(`https://ts15825868.github.io/xianjiawei/${p.image_path}`);
  p.image_source=sceneSourceLabel();
  p.image_alt=`仙加味網站同款Q版小老闆｜${p.title}｜${p.scene}完整生活場景｜正式產品實物等比例呈現`;
  const meta=await renderScenePoster(p,index,p.image_path);
  final.push(p);
  console.log('REMAINDER66_SCENE',index+1,p.id,meta.kind,meta.hero);
}
const unique=(key)=>new Set(final.map(p=>p[key])).size;
if(unique('id')!==66||unique('title')!==66||unique('copy')!==66||unique('image_url')!==66) throw new Error(`uniqueness id/title/copy/image ${unique('id')}/${unique('title')}/${unique('copy')}/${unique('image_url')}`);
const manifest={
  version:'2026-08-17-remainder66-scene-v2',
  generated_at:'2026-08-17',
  count:66,
  visual_policy:{full_lifestyle_scene:true,website_q_mascot:true,official_product_art:true,ai_product_redraw_forbidden:true,unique_copy:true,unique_image:true,human_review_required:true},
  posts:final
};
fs.writeFileSync(outManifest,JSON.stringify(manifest,null,2)+'\n');
console.log('PASS remainder66 full-scene render',final.length);
