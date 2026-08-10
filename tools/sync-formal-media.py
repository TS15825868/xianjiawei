from __future__ import annotations
import json,re,shutil
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
IMAGES=ROOT/'images'
OUT=IMAGES/'formal-display'
OUT.mkdir(parents=True,exist_ok=True)
IMAGE_EXTS={'.jpg','.jpeg','.png','.webp'}

PRODUCTS={
 'guilu-gao':('龜鹿膏','100g／罐',['龜鹿膏']),
 'guilu-drink-30':('龜鹿飲30cc','30cc／罐（小玻璃罐、裸罐、無貼紙）',['龜鹿飲30','30cc']),
 'guilu-drink-180':('龜鹿飲180cc','180cc／包（鋁袋）',['龜鹿飲180','180cc']),
 'guilu-tangkuai':('龜鹿湯塊','75g／盒｜8塊裝',['龜鹿湯塊','湯塊75']),
 'guilu-jiao':('龜鹿膠','600g／盒｜32塊裝',['龜鹿膠','膠600']),
 'lurong-fen':('鹿茸粉','75g／罐',['鹿茸粉']),
}

def rel(p:Path)->str:return p.relative_to(ROOT).as_posix()
def all_images():
 return [p for p in IMAGES.rglob('*') if p.is_file() and p.suffix.lower() in IMAGE_EXTS and 'formal-display' not in p.parts]

def score_product(p:Path,keys:list[str])->int:
 s=p.as_posix().lower(); score=0
 if 'dm-final' in s: score+=80
 if '/dm' in s or 'dm_' in s or '_dm' in s: score+=30
 if any(k.lower() in s for k in keys): score+=120
 if any(x in s for x in ('old','backup','retired','products-v2')): score-=500
 return score

def choose_product(keys):
 ranked=sorted(((score_product(p,keys),p) for p in all_images()),reverse=True,key=lambda x:(x[0],x[1].stat().st_size))
 return ranked[0][1] if ranked and ranked[0][0]>0 else None

def trial_from_html():
 found=[]
 for hp in ROOT.glob('*.html'):
  text=hp.read_text('utf-8',errors='ignore')
  for m in re.finditer('試喝',text):
   region=text[max(0,m.start()-1200):m.end()+1200]
   for src in re.findall(r'<img[^>]+src=["\']([^"\']+)',region,re.I):
    src=src.split('?',1)[0].lstrip('/')
    if src.startswith('xianjiawei/'):src=src[len('xianjiawei/'):]
    p=ROOT/src
    if p.exists() and p.suffix.lower() in IMAGE_EXTS:found.append(p)
 return found

def choose_trial():
 cands=[]
 for p in all_images():
  s=p.as_posix().lower(); score=0
  if any(k in s for k in ('試喝','trial','sample')):score+=160
  if 'social' in s:score+=25
  if any(k in s for k in ('old','backup','retired')):score-=500
  if score>0:cands.append((score,p))
 for p in trial_from_html():cands.append((140,p))
 if not cands:return None
 cands.sort(key=lambda x:(x[0],x[1].stat().st_size),reverse=True)
 return cands[0][1]

manifest={'runtime':'20260810-formal-customer-media','products':{},'trial':None,'rules':{
 'product_authority':'formal originals; customer DM display is separate',
 'no_ai_product_redraw':True,'no_crop':True,'no_stretch':True}}

for slug,(name,spec,keys) in PRODUCTS.items():
 src=choose_product(keys)
 if not src:raise SystemExit(f'找不到{name}正式DM候選，拒絕以錯圖補位')
 ext='.jpg' if src.suffix.lower()=='.jpeg' else src.suffix.lower()
 dst=OUT/f'dm-{slug}{ext}'
 shutil.copyfile(src,dst)
 manifest['products'][slug]={'name':name,'spec':spec,'path':'/'+rel(dst),'source':'/'+rel(src)}

trial=choose_trial()
if trial:
 ext='.jpg' if trial.suffix.lower()=='.jpeg' else trial.suffix.lower()
 dst=OUT/f'trial-guilu-drink{ext}'
 shutil.copyfile(trial,dst)
 manifest['trial']={'path':'/'+rel(dst),'source':'/'+rel(trial),'rules':{
  'free_samples':3,'shipping_paid_by_customer':True,'seven_eleven':60,'postal':100,
  'limit':'每位顧客／電話／地址限申請一次','lead_time':'約5～7個工作天',
  'apply_via':'LINE OA','price_30':'60元／罐；買10送1，11罐600元','price_180':'200元／包；買10送1，11包2,000元'}}
else:
 print('WARN: repo 內尚未找到可辨識的試喝圖，保留既有試喝圖，不以其他產品圖冒充')

(OUT/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n','utf-8')

js=r'''(()=>{const V='20260810-formal-media';const pathBase=location.pathname.includes('/xianjiawei/')?'/xianjiawei':'';fetch(pathBase+'/images/formal-display/manifest.json?v='+V,{cache:'no-store'}).then(r=>r.ok?r.json():Promise.reject()).then(m=>{window.XJWFormalCustomerMedia=m;const replace=(img,path)=>{if(!path)return;img.src=pathBase+path;img.style.objectFit='contain';img.style.objectPosition='center';img.removeAttribute('width');img.removeAttribute('height');};if(/\/dm\.html$/.test(location.pathname)){document.querySelectorAll('img').forEach(img=>{const box=img.closest('article,section,figure,div');const t=((img.alt||'')+' '+(box?.textContent||'')).replace(/\s+/g,' ');for(const p of Object.values(m.products||{})){if(t.includes(p.name)||t.includes(p.spec)){replace(img,p.path);break;}}});}if(m.trial?.path){document.querySelectorAll('img').forEach(img=>{const box=img.closest('article,section,figure,div');const t=((img.alt||'')+' '+(box?.textContent||'')).replace(/\s+/g,' ');if(t.includes('試喝'))replace(img,m.trial.path);});}}).catch(()=>{});})();'''
(ROOT/'site-formal-media-v20260810.js').write_text(js+'\n','utf-8')

for name in ('index.html','dm.html','products.html','trial.html'):
 p=ROOT/name
 if not p.exists():continue
 text=p.read_text('utf-8')
 text=text.replace('30cc／瓶（玻璃瓶）','30cc／罐（小玻璃罐）').replace('30cc／瓶','30cc／罐（小玻璃罐）')
 text=text.replace('五種產品使用方式','六項產品使用方式').replace('五種產品','六項產品')
 tag='<script src="site-formal-media-v20260810.js?v=20260810-formal-media"></script>'
 if tag not in text:
  text=text.replace('</body>',tag+'</body>')
 p.write_text(text,'utf-8')

print('formal customer media synchronized')
