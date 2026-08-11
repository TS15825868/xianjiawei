#!/usr/bin/env python3
from __future__ import annotations

import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
REQUIRED_IDS=('guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen')
FORMAL_ID={
 'guilu-gao':'guilu-gao','guilu-drink-30':'guilu-drink-30cc','guilu-drink-180':'guilu-drink-180cc',
 'guilu-tangkuai':'guilu-tangkuai','guilu-jiao':'guilu-jiao','luerong-fen':'lurong-fen'
}
DISPLAY_KEY={
 'guilu-gao':'guilu-gao','guilu-drink-30':'guilu-drink-30','guilu-drink-180':'guilu-drink-180',
 'guilu-tangkuai':'guilu-tangkuai','guilu-jiao':'guilu-jiao','luerong-fen':'luerong-fen'
}
PAGE_BY_ID={
 'guilu-gao':'product-guilu-gao.html','guilu-drink-30':'product-guilu-drink-30cc.html',
 'guilu-drink-180':'product-guilu-drink-180cc.html','guilu-tangkuai':'product-guilu-tangkuai.html',
 'guilu-jiao':'product-guilu-jiao.html','luerong-fen':'product-luerong-fen.html'
}
PRODUCT_IMAGE_BY_ID={
 'guilu-gao':'guilu-gao.jpg','guilu-drink-30':'guilu-drink-30.jpg','guilu-drink-180':'guilu-drink-180.jpg',
 'guilu-tangkuai':'guilu-tangkuai.jpg','guilu-jiao':'guilu-jiao.jpg','luerong-fen':'luerong-fen.jpg'
}
PUBLIC_HTML=['index.html','products.html','dm.html','choose.html','combo.html','guide.html','recipes.html','faq.html','brand.html','brand-facts.html','ingredients.html','quality.html','craft.html','knowledge.html','video.html','hanfang-baike.html','sources.html','contact.html','trial.html',*PAGE_BY_ID.values()]
RETIRED_COPY=('每日早上及下午各一小匙','早晚各一小匙','75g／盒｜8塊裝｜每塊約9.375g','600g（1斤）／盒｜32塊裝｜每塊約18.75g','龜鹿飲30cc玻璃瓶','30cc／瓶')

class Links(HTMLParser):
 def __init__(self): super().__init__(); self.hrefs=[]
 def handle_starttag(self,tag,attrs):
  if tag=='a':
   href=dict(attrs).get('href')
   if href:self.hrefs.append(href)

def req(ok,msg):
 if not ok: raise AssertionError(msg)
def read(path): return (ROOT/path).read_text(encoding='utf-8')
def load(path): return json.loads(read(path))
def local(value): return str(value or '').split('?',1)[0].lstrip('/')
def raster_kind(path):
 p=ROOT/path
 if not p.is_file() or p.stat().st_size<12:return ''
 b=p.read_bytes()[:16]
 if b[:3]==b'\xff\xd8\xff':return 'jpeg'
 if b[:8]==b'\x89PNG\r\n\x1a\n':return 'png'
 if b[:4]==b'RIFF' and b[8:12]==b'WEBP':return 'webp'
 return ''

def validate_product_authority():
 config=load('config/official-products.json')
 req(config.get('authority')=='user-confirmed-current','產品權威必須明確是目前使用者確認資料')
 official={p.get('id'):p for p in config.get('products') or []}
 req(set(official)==set(REQUIRED_IDS),'目前產品權威必須維持六項正式產品')
 data={p.get('id'):p for p in load('data.json').get('products') or []}
 catalog={p.get('id'):p for p in load('catalog-public.json').get('products') or []}
 req(set(data)==set(REQUIRED_IDS) and set(catalog)==set(REQUIRED_IDS),'公開data/catalog必須維持目前六項產品')
 for pid in REQUIRED_IDS:
  auth=official[pid]; name=str(auth.get('name') or ''); spec=str(auth.get('spec') or '')
  req(name and spec,f'{pid}目前權威缺名稱／規格')
  p=data[pid]; c=catalog[pid]
  req(p.get('name')==name,f'{pid} data.json名稱未同步目前authority')
  req((p.get('size') or p.get('specification') or p.get('spec'))==spec,f'{pid} data.json規格未同步目前authority')
  req(c.get('name')==name and c.get('size')==spec,f'{pid} catalog名稱／規格未同步目前authority')
  identity=' '.join(str(p.get(k) or '') for k in ('image','imageUrl','image_url','officialOriginalImage'))
  req('/images/products-v3/' in identity or 'images/products-v3/' in identity,f'{pid}產品識別必須維持products-v3')
  req('/images/products-v2/' not in identity and 'images/products-v2/' not in identity,f'{pid}產品識別不得回退products-v2')
  req((ROOT/'images/products-v3'/PRODUCT_IMAGE_BY_ID[pid]).is_file(),f'{pid}缺少products-v3正式原圖')
  page=read(PAGE_BY_ID[pid])
  req(spec in page,f'{PAGE_BY_ID[pid]}缺目前正式規格：{spec}')
  req('products-v2' not in page,f'{PAGE_BY_ID[pid]}不得引用products-v2')
 req(data['guilu-gao'].get('usage',[None])[0]=='一天一次一小匙','龜鹿膏主要使用方式未同步目前authority')
 req(data['guilu-drink-30'].get('knownContainerDimensionsMm')=={'diameter':42,'height':51},'30cc必須維持小玻璃罐Ø42×H51mm參考尺寸')
 req(data['guilu-gao'].get('knownContainerDimensionsMm')=={'width':51,'height':78},'龜鹿膏罐必須維持51×78mm參考尺寸')
 ratio=(data['guilu-drink-180'].get('aspectRatioWidthToHeight') or {}).get('target')
 req(abs(float(ratio or 0)-float(official['guilu-drink-180'].get('aspect_ratio_width_to_height') or .64))<.001,'180cc鋁袋比例未同步目前authority')
 return official

def validate_formal_media(official):
 formal=load('data/formal-media-authority-v20260810.json')
 display=load('images/formal-display/manifest.json')
 by={p.get('id'):p for p in formal.get('products') or []}
 req(len(by)==6,'formal media必須維持六項產品')
 req(str(formal.get('approval_batch') or '').strip(),'formal media必須有目前核准批次')
 req(display.get('approval_batch')==formal.get('approval_batch'),'顧客display manifest未同步目前核准批次')
 for pid in REQUIRED_IDS:
  item=by.get(FORMAL_ID[pid]); shown=(display.get('products') or {}).get(DISPLAY_KEY[pid])
  req(item and item.get('status')=='approved_display',f'{pid}目前顧客媒體尚未核准')
  req(item.get('spec')==official[pid].get('spec'),f'{pid} formal media規格未同步目前authority')
  path=local(item.get('dm')); kind=raster_kind(path)
  req(kind in {'jpeg','png','webp'},f'{pid}正式顧客媒體不是有效點陣圖：{path}')
  req(shown and local(shown.get('path'))==path and shown.get('status')=='approved_display',f'{pid} display manifest未同步目前formal media')
 trial=formal.get('trial') or {}; trial_path=local(trial.get('image'))
 req(trial.get('status')=='approved_display','試喝目前顧客媒體尚未核准')
 req(raster_kind(trial_path) in {'jpeg','png','webp'},'試喝正式圖不是有效點陣圖')
 req((display.get('trial') or {}).get('path')==trial.get('image'),'試喝display manifest未同步目前formal media')
 req('3罐' in str(trial.get('free') or ''),'試喝必須維持3罐免費')
 shipping=trial.get('shipping') or []
 req(any('60元' in str(x) for x in shipping) and any('100元' in str(x) for x in shipping),'試喝運費規則不完整')
 req('5～7' in str(trial.get('lead_time') or ''),'試喝交期規則不完整')
 dm=read('dm.html'); trial_html=read('trial.html')
 for pid in REQUIRED_IDS:req(local(by[FORMAL_ID[pid]].get('dm')) in dm,f'DM頁未使用目前核准媒體：{pid}')
 req(trial_path in trial_html,'試喝頁未使用目前核准海報')
 req('images/products-v3/guilu-drink-30.jpg' in trial_html,'試喝頁30cc產品本體必須維持products-v3')
 return formal

def validate_post_media(formal):
 path=local(formal.get('post_catalog'))
 req(path and (ROOT/path).is_file(),'目前formal authority指向的貼文素材catalog不存在')
 catalog=load(path)
 candidate_count=int(catalog.get('candidate_count') or catalog.get('unique_image_count') or 0)
 original_count=int(catalog.get('original_file_count') or candidate_count)
 req(candidate_count>0 and original_count>=candidate_count,'目前ZIP候選數必須有效；不得依賴歷史固定張數')
 req(str(catalog.get('approval_batch') or '')==str(formal.get('post_approval_batch') or ''),'目前ZIP與formal authority核准批次不同步')
 req(catalog.get('binary_sync',{}).get('status') in {'pending','ready'},'目前ZIP binary_sync必須是pending或ready')
 if catalog.get('binary_sync',{}).get('status')=='ready':
  req(int(catalog.get('binary_sync',{}).get('publishable_count') or 0)>0,'ZIP標示ready時必須有可發布二進位圖')
 policy=str(formal.get('post_image_policy') or '')
 for token in ('season','scene','environment','temperature','expression','action','props'):req(token in policy,f'貼文語意比對缺少：{token}')
 req('needs_binary_sync' in policy,'貼文流程必須保留needs_binary_sync')
 req(('true no-match' in policy.lower() or 'no-match' in policy.lower() or '沒有合格' in policy) and ('regeneration' in policy.lower() or '重新生成' in policy),'必須只有真正無合格來源才重新生成')
 req(('pending_review' in policy or '待審核' in policy) and '16' in policy,'換圖／生成後必須回待審核並重跑16項')
 return candidate_count

def validate_public_pages():
 for rel in PUBLIC_HTML:
  req((ROOT/rel).is_file(),f'缺顧客頁：{rel}')
  source=read(rel)
  req('/mnt/data/' not in source,f'{rel}不得露出本機路徑')
  for phrase in RETIRED_COPY:req(phrase not in source,f'{rel}仍顯示退役資料：{phrase}')
  parser=Links(); parser.feed(source)
  for href in parser.hrefs:
   h=href.strip()
   if not h or h.startswith(('#','mailto:','tel:','javascript:')):continue
   parsed=urlparse(h)
   if parsed.scheme or parsed.netloc or not parsed.path.endswith('.html'):continue
   target=(ROOT/parsed.path.lstrip('/')).resolve()
   if ROOT not in target.parents and target!=ROOT:continue
   req(target.exists(),f'{rel}站內連結不存在：{parsed.path}')
 site=read('site-product-data-authority.js')
 req('products-v3' in site and ('contain' in site or 'no-crop' in site),'官網產品圖片runtime必須維持products-v3與等比例不裁切能力')

def validate_fulfillment():
 products={p['id']:p for p in load('data.json')['products']}
 for pid in ('guilu-drink-30','guilu-drink-180'):
  p=products[pid]
  req(p.get('fulfillmentType')=='made-to-order-drink','龜鹿飲必須維持接單後安排製作')
  req('5～7' in str(p.get('fulfillmentNotice') or p.get('productionLeadTime') or ''),'龜鹿飲必須維持5～7個工作天製作交期')
 for pid in ('guilu-gao','guilu-tangkuai','guilu-jiao','luerong-fen'):
  p=products[pid]
  req(p.get('fulfillmentType')=='ready-stock','非飲產品必須維持備貨商品')
  req('5～7個工作天' not in str(p.get('fulfillmentNotice') or ''),f'{pid}不得套用龜鹿飲交期')

def validate_guard_mode():
 path=ROOT/'config/guard-mode.json'
 if not path.is_file():return
 mode=load('config/guard-mode.json')
 if mode.get('mode')=='paused_for_full_system_update':
  req(mode.get('blocking') is False,'維護模式blocking guard必須保持關閉直到使用者確認')
  req(mode.get('keep_minimum_safety') is True,'維護模式仍必須保留最低安全')

if __name__=='__main__':
 official=validate_product_authority()
 formal=validate_formal_media(official)
 candidates=validate_post_media(formal)
 validate_fulfillment()
 validate_public_pages()
 validate_guard_mode()
 print(f'PASS website current release capabilities: six current products, products-v3 identity, current approved raster media, current ZIP({candidates} candidates), semantic matching, needs_binary_sync, 16-item review, fulfillment and customer pages; no WebP-only/fixed-count/retired-version/old-copy guard lock.')
