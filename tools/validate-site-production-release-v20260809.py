#!/usr/bin/env python3
from __future__ import annotations

import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
PRODUCTS={
 'guilu-gao':('龜鹿膏','100g／罐','guilu-gao.jpg','product-guilu-gao.html'),
 'guilu-drink-30':('龜鹿飲30cc玻璃罐','30cc／罐（小玻璃罐）','guilu-drink-30.jpg','product-guilu-drink-30cc.html'),
 'guilu-drink-180':('龜鹿飲180cc鋁袋','180cc／包（鋁袋）','guilu-drink-180.jpg','product-guilu-drink-180cc.html'),
 'guilu-tangkuai':('龜鹿湯塊','75g／盒｜8塊裝','guilu-tangkuai.jpg','product-guilu-tangkuai.html'),
 'guilu-jiao':('龜鹿膠','600g／盒｜32塊裝','guilu-jiao.jpg','product-guilu-jiao.html'),
 'luerong-fen':('鹿茸粉','75g／罐','luerong-fen.jpg','product-luerong-fen.html'),
}
INGREDIENTS={
 'guilu-gao':['鹿角萃取物','龜板萃取物','枸杞','紅棗','黃耆','粉光蔘'],
 'guilu-drink-30':['水','龜板萃取物','鹿角萃取物','粉光蔘','枸杞','紅棗','黃耆'],
 'guilu-drink-180':['水','龜板萃取物','鹿角萃取物','粉光蔘','枸杞','紅棗','黃耆'],
 'guilu-tangkuai':['龜板萃取物','鹿角萃取物'],
 'guilu-jiao':['龜板萃取物','鹿角萃取物'],
 'luerong-fen':['鹿茸'],
}
PUBLIC_HTML=['index.html','products.html','dm.html','choose.html','combo.html','guide.html','recipes.html','faq.html','brand.html','brand-facts.html','ingredients.html','quality.html','craft.html','knowledge.html','video.html','hanfang-baike.html','sources.html','contact.html','trial.html',*[v[3] for v in PRODUCTS.values()]]

class Links(HTMLParser):
 def __init__(self): super().__init__(); self.hrefs=[]
 def handle_starttag(self,tag,attrs):
  if tag=='a':
   href=dict(attrs).get('href')
   if href:self.hrefs.append(href)

def req(ok,message):
 if not ok:raise AssertionError(message)
def text(path):return (ROOT/path).read_text(encoding='utf-8')
def load(path):return json.loads(text(path))
def webp(path):
 b=(ROOT/path).read_bytes(); return len(b)>12 and b[:4]==b'RIFF' and b[8:12]==b'WEBP'
def local_from_public_url(value):
 value=str(value or '').split('?',1)[0]
 if '/xianjiawei/' in value:value=value.split('/xianjiawei/',1)[1]
 return value.lstrip('/')

def check_current_authority():
 data=load('data.json'); catalog=load('catalog-public.json'); config=load('config/official-products.json'); visual=load('content/visual-production-spec-current.json'); formal=load('data/formal-media-authority-v20260810.json'); display=load('images/formal-display/manifest.json')
 products={p['id']:p for p in data.get('products',[])}; cat={p['id']:p for p in catalog.get('products',[])}; cfg={p['id']:p for p in config.get('products',[])}
 req(config.get('authority')=='user-confirmed-current','config/official-products.json 必須是目前 user-confirmed-current')
 req(set(products)==set(PRODUCTS),'data.json 必須剛好六項目前正式產品')
 req(set(cat)==set(PRODUCTS),'catalog-public.json 必須剛好六項目前正式產品')
 req(set(cfg)==set(PRODUCTS),'config/official-products.json 必須剛好六項目前正式產品')
 for pid,(name,spec,filename,page) in PRODUCTS.items():
  p=products[pid]; c=cat[pid]; q=cfg[pid]
  req(p.get('name')==name and p.get('size')==spec,f'data.json {pid} 名稱／規格不同步')
  req(p.get('ingredients')==INGREDIENTS[pid],f'data.json {pid} 成分／順序不同步')
  req(c.get('name')==name and c.get('size')==spec,f'catalog {pid} 名稱／規格不同步')
  req(c.get('ingredients')==INGREDIENTS[pid],f'catalog {pid} 成分／順序不同步')
  req(q.get('name')==name and q.get('size')==spec,f'config {pid} 名稱／規格不同步')
  image=str(p.get('officialOriginalImage') or p.get('image') or '')
  req('images/products-v3/' in image and 'products-v2' not in image,f'{pid} 產品識別不是products-v3')
  req((ROOT/'images/products-v3'/filename).is_file(),f'缺少 products-v3 原圖：{filename}')
  page_source=text(page)
  req(spec in page_source,f'{page} 缺少目前正式規格：{spec}')
  req('products-v2' not in page_source,f'{page} 不得引用products-v2')

 req(products['guilu-gao'].get('usage',[None])[0]=='一天一次一小匙','data.json 龜鹿膏用法不是目前一天一次一小匙')
 req(cat['guilu-gao'].get('usage',[None])[0]=='一天一次一小匙','catalog 龜鹿膏用法不是目前一天一次一小匙')
 req(products['guilu-drink-30'].get('knownContainerDimensionsMm')=={'diameter':42,'height':51},'30cc尺寸不是Ø42×H51mm')
 req(products['guilu-gao'].get('knownContainerDimensionsMm')=={'width':51,'height':78},'龜鹿膏罐尺寸不是51×78mm')
 ratio=(products['guilu-drink-180'].get('aspectRatioWidthToHeight') or {}).get('target')
 req(abs(float(ratio or 0)-0.64)<0.001,'180cc鋁袋寬高比目標不是0.64')
 req(visual.get('official_specs')==[f'{PRODUCTS[k][0]} {PRODUCTS[k][1]}' for k in PRODUCTS],'current visual authority 六項規格不同步')
 req(visual.get('copy_image_match',{}).get('review_items')==16,'current visual authority 必須維持16項審核')
 req(visual.get('post_media_policy',{}).get('regenerate_only_if_no_approved_match') is True,'current visual authority 必須維持無合格圖才生成')
 req(visual.get('products',{}).get('guilu-drink-30',{}).get('customer_dm_status')=='quarantined_until_copy_matches_current_spec','30cc錯字DM未在目前視覺權威隔離')
 req(str(formal.get('post_catalog') or '').endswith('post-library-userzip3-v20260811.json'),'formal authority 沒有指向目前貼文素材catalog')
 req(next(p for p in formal['products'] if p['id']=='guilu-drink-30cc').get('status')=='quarantined_copy_conflict','formal media 未隔離30cc錯字DM')
 req(display.get('products',{}).get('guilu-drink-30',{}).get('status')=='products-v3-fallback','顧客正式展示manifest未回退30cc products-v3')
 req('/images/products-v3/guilu-drink-30.jpg' in str(cat['guilu-drink-30'].get('dmImage') or ''),'catalog 30cc dmImage 必須回退products-v3')
 req('guilu-drink-30cc.webp' in str(cat['guilu-drink-30'].get('quarantinedDmImage') or ''),'catalog 必須保留30cc隔離DM紀錄')

def check_fulfillment():
 data=load('data.json'); by={p['id']:p for p in data['products']}
 for pid in ('guilu-drink-30','guilu-drink-180'):
  p=by[pid]; req(p.get('fulfillmentType')=='made-to-order-drink' and p.get('readyStock') is False,f'{pid} 接單製作狀態錯誤')
  req('5～7個工作天' in str(p.get('fulfillmentNotice') or ''),f'{pid} 缺少5～7工作天製作說明')
 for pid in ('guilu-gao','guilu-tangkuai','guilu-jiao','luerong-fen'):
  p=by[pid]; req(p.get('fulfillmentType')=='ready-stock' and p.get('readyStock') is True,f'{pid} 備貨狀態錯誤')
  req('5～7個工作天' not in str(p.get('fulfillmentNotice') or ''),f'{pid} 不得套用龜鹿飲製作時間')

def check_formal_media():
 formal=load('data/formal-media-authority-v20260810.json')
 req(len(formal.get('products',[]))==6,'formal media 必須有六項媒體紀錄')
 for p in formal['products']:
  local=str(p['dm']).lstrip('/'); req((ROOT/local).is_file(),f'媒體實體不存在：{local}'); req(webp(local),f'媒體不是有效WebP：{local}')
 trial=str(formal['trial']['image']).lstrip('/'); req((ROOT/trial).is_file() and webp(trial),'正式試喝圖缺失或不是WebP')
 req(formal['trial']['title']=='龜鹿飲試喝組｜先試喝，再決定','試喝標題不同步')
 req('3罐' in formal['trial']['free'] and '7-11店到店60元' in formal['trial']['shipping'] and '郵局宅配100元' in formal['trial']['shipping'],'試喝規則不同步')
 dm=text('dm.html'); trial_html=text('trial.html')
 req('images/products-v3/guilu-drink-30.jpg' in dm,'DM頁30cc必須使用products-v3 fallback')
 req('images/dm-approved-v20260810/guilu-drink-30cc.webp' not in dm,'DM頁不得直接顯示30cc錯字DM')
 req('guilu-drink-trial.webp' in trial_html,'試喝頁沒有使用目前試喝圖')
 req('images/products-v3/guilu-drink-30.jpg' in trial_html,'試喝頁30cc產品本體必須使用products-v3')
 req('7-11 店到店' in trial_html and '60元' in trial_html and '郵局宅配' in trial_html and '100元' in trial_html,'試喝頁運費不同步')
 req('<iframe' not in trial_html.lower(),'試喝頁不得用iframe')

def check_public_pages():
 retired=['每日早上及下午各一小匙','75g／盒｜8塊裝｜每塊約9.375g','600g（1斤）／盒｜32塊裝｜每塊約18.75g','30cc／瓶','龜鹿飲30cc玻璃瓶']
 for rel in PUBLIC_HTML:
  req((ROOT/rel).is_file(),f'缺顧客頁：{rel}')
  source=text(rel); req('/mnt/data/' not in source,f'{rel} 不得露出本機路徑')
  for phrase in retired:req(phrase not in source,f'{rel} 不得顯示目前已退役資料：{phrase}')
 parser_errors=[]
 for rel in PUBLIC_HTML:
  parser=Links(); parser.feed(text(rel))
  for href in parser.hrefs:
   h=href.strip()
   if not h or h.startswith(('#','mailto:','tel:','javascript:')):continue
   parsed=urlparse(h)
   if parsed.scheme or parsed.netloc:continue
   target=parsed.path
   if not target or not target.endswith('.html'):continue
   resolved=(ROOT/target.lstrip('/')).resolve()
   if ROOT not in resolved.parents and resolved!=ROOT:continue
   if not resolved.exists():parser_errors.append(f'{rel} → {target}')
 req(not parser_errors,'站內連結目標不存在：'+'；'.join(parser_errors[:20]))
 site_authority=text('site-product-data-authority.js')
 req("const CUSTOMER=OFFICIAL" in site_authority,'官網產品顧客主圖必須直接使用products-v3 authority')
 req('products-v4-final' not in site_authority,'官網產品資料層不得再把products-v4-final當顧客產品本體')
 req('products-v3-current-customer-authority-contain-no-crop' in site_authority,'官網顧客產品圖未鎖products-v3 contain/no-crop')

if __name__=='__main__':
 check_current_authority(); check_fulfillment(); check_formal_media(); check_public_pages()
 print('PASS website production release: current six specs, once-daily guilu-gao usage, products-v3 customer product identity, 30cc DM quarantine, validated display media, fulfillment, customer pages and links; no legacy version/copy/spec lock.')
