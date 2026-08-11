from __future__ import annotations
import json,re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
AUTH=ROOT/'data'/'formal-media-authority-v20260810.json'
MANIFEST=ROOT/'images'/'formal-display'/'manifest.json'
SITE_JS=ROOT/'site-formal-media-v20260810.js'
EXPECTED={
 'guilu-gao':'100g／罐',
 'guilu-drink-30cc':'30cc／罐（小玻璃罐）',
 'guilu-drink-180cc':'180cc／包（鋁袋）',
 'guilu-tangkuai':'75g／盒｜8塊裝',
 'guilu-jiao':'600g／盒｜32塊裝',
 'lurong-fen':'75g／罐',
}
MANIFEST_KEYS={
 'guilu-gao':'guilu-gao',
 'guilu-drink-30cc':'guilu-drink-30',
 'guilu-drink-180cc':'guilu-drink-180',
 'guilu-tangkuai':'guilu-tangkuai',
 'guilu-jiao':'guilu-jiao',
 'lurong-fen':'luerong-fen',
}

def must(ok:bool,msg:str):
 if not ok: raise SystemExit(msg)

def local(public_path:str)->Path:
 return ROOT/public_path.split('?',1)[0].lstrip('/')

def raster_kind(path:Path)->str:
 if not path.exists() or not path.is_file() or path.stat().st_size<12:return ''
 head=path.read_bytes()[:16]
 if head[:3]==b'\xff\xd8\xff':return 'jpeg'
 if head[:8]==b'\x89PNG\r\n\x1a\n':return 'png'
 if head[:4]==b'RIFF' and head[8:12]==b'WEBP':return 'webp'
 return ''

must(AUTH.exists(),'找不到目前正式媒體權威')
a=json.loads(AUTH.read_text('utf-8'))
products=a.get('products') or []
must(len(products)==6,'正式媒體權威必須維持六項產品')
by_id={p.get('id'):p for p in products}

manifest={
 'runtime':'current-formal-customer-media',
 'approval_batch':a.get('approval_batch') or 'current-user-approved',
 'products':{},
 'trial':{},
 'latestPostZip':a.get('latest_post_zip') or {},
 'rules':{
  'product_authority':'products-v3 original product identity; customer display media may only be used when embedded copy agrees with current formal facts',
  'dm_copy_must_match_current_specs':True,
  'conflicting_dm_must_quarantine_and_fallback_to_products_v3':True,
  'no_ai_product_redraw':True,
  'no_crop':True,
  'no_stretch':True,
  'zip_first_for_lifestyle':True,
  'regenerate_only_if_no_match':True,
  'review_after_media_change':16,
  'guard_policy':'validate current approved content, actual raster binary availability and capabilities; never require retired version strings, filenames, historical counts, old fixed copy or retired derived specifications',
 }
}

for pid,spec in EXPECTED.items():
 p=by_id.get(pid)
 must(p is not None,f'正式媒體權威缺少產品：{pid}')
 must(p.get('spec')==spec,f'{pid} 正式規格不符：{p.get("spec")}')
 must(p.get('status')=='approved_display',f'{pid} 尚未核准顧客展示')
 dm=str(p.get('dm') or '')
 must(dm.startswith('/images/'),f'{pid} 正式顯示媒體必須是網站圖片路徑')
 kind=raster_kind(local(dm))
 must(kind in {'jpeg','png','webp'},f'{pid} 正式顯示媒體不存在或不是有效點陣圖片：{dm}')
 mk=MANIFEST_KEYS[pid]
 manifest['products'][mk]={
  'name':p.get('name'),'spec':spec,'path':dm,'status':'approved_display','format':kind,
  **({'validation':p.get('validation')} if p.get('validation') else {})
 }

trial=a.get('trial') or {}
trial_image=str(trial.get('image') or '')
must(trial.get('status')=='approved_display','試喝圖尚未核准顧客展示')
must(trial_image.startswith('/images/'),'試喝圖必須是網站圖片路徑')
trial_kind=raster_kind(local(trial_image))
must(trial_kind in {'jpeg','png','webp'},f'試喝圖不存在或不是有效點陣圖片：{trial_image}')
must('3罐' in str(trial.get('free') or ''),'試喝規則必須維持3罐免費')
shipping=trial.get('shipping') or []
must(any('60元' in str(x) for x in shipping) and any('100元' in str(x) for x in shipping),'試喝運費規則不完整')
must('5～7' in str(trial.get('lead_time') or ''),'試喝交期必須維持5～7個工作天')
manifest['trial']={
 'path':trial_image,'status':'approved_display','format':trial_kind,
 'rules':{
  'free_samples':3,'shipping_paid_by_customer':True,'seven_eleven':60,'postal':100,
  'limit':trial.get('limit'),'lead_time':'約5～7個工作天','apply_via':'LINE OA',
  'price_30':(trial.get('prices') or {}).get('30cc'),'price_180':(trial.get('prices') or {}).get('180cc'),
 }
}

MANIFEST.parent.mkdir(parents=True,exist_ok=True)
MANIFEST.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n','utf-8')

js=r'''(()=>{
const V='current-formal-media';
const pathBase=location.pathname.includes('/xianjiawei/')?'/xianjiawei':'';
const replace=(img,path)=>{if(!path)return;img.src=pathBase+path+(path.includes('?')?'&':'?')+'v='+V;img.style.objectFit='contain';img.style.objectPosition='center';img.removeAttribute('width');img.removeAttribute('height');};
function fixDmEntry(){
 document.querySelectorAll('a[href="dm.html"],a[href$="/dm.html"]').forEach(a=>{if(/實品照|產品圖|DM/i.test(a.textContent||''))a.textContent='查看產品DM';a.setAttribute('aria-label','查看仙加味目前正式產品DM');});
 if(document.body?.dataset?.page==='home'&&!document.querySelector('[data-formal-dm-home-entry]')){
  const products=document.getElementById('home-products');const actions=products?.nextElementSibling;
  if(actions?.classList?.contains('section-actions')){const link=document.createElement('a');link.className='btn btn-outline';link.href='dm.html';link.textContent='查看產品DM';link.dataset.formalDmHomeEntry='true';const trial=[...actions.querySelectorAll('a')].find(a=>/trial\.html/.test(a.getAttribute('href')||''));if(trial)actions.insertBefore(link,trial);else actions.appendChild(link);}
 }
}
fixDmEntry();
fetch(pathBase+'/images/formal-display/manifest.json?v='+V,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(m=>{
 window.XJWFormalCustomerMedia=m;
 document.documentElement.dataset.formalMediaRuntime=String(m.runtime||V);
 document.documentElement.dataset.formalMediaApprovalBatch=String(m.approval_batch||'');
 if(/\/dm\.html$/.test(location.pathname)){document.querySelectorAll('img').forEach(img=>{const box=img.closest('article,section,figure,div');const t=((img.alt||'')+' '+(box?.textContent||'')).replace(/\s+/g,' ');for(const p of Object.values(m.products||{})){if(t.includes(p.name)||t.includes(p.spec)){replace(img,p.path);break;}}});}
 if(/\/trial\.html$/.test(location.pathname)&&m.trial?.path){const hero=document.querySelector('.trial-poster img')||[...document.querySelectorAll('img')].find(img=>/試喝/.test((img.alt||'')+' '+(img.closest('section,article,figure,div')?.textContent||'')));if(hero)replace(hero,m.trial.path);}
}).catch(()=>{});
})();'''
SITE_JS.write_text(js+'\n','utf-8')

for name in ('index.html','dm.html','products.html','trial.html','guide.html'):
 p=ROOT/name
 if not p.exists():continue
 text=p.read_text('utf-8')
 text=text.replace('30cc／瓶（玻璃瓶）','30cc／罐（小玻璃罐）').replace('30cc／瓶','30cc／罐（小玻璃罐）')
 text=text.replace('五種產品使用方式','六項產品使用方式').replace('五種產品','六項產品')
 text=re.sub(r'<script src="site-formal-media-v20260810\.js\?v=[^"]+"></script>','<script src="site-formal-media-v20260810.js?v=current-formal-media"></script>',text)
 if 'site-formal-media-v20260810.js' not in text and name in ('index.html','dm.html','products.html','trial.html'):
  text=text.replace('</body>','<script src="site-formal-media-v20260810.js?v=current-formal-media"></script></body>')
 p.write_text(text,'utf-8')

print('formal customer media synchronized from current authority; JPEG/PNG/WebP supported, no retired version lock')
