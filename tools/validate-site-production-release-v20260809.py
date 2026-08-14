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
 'guilu-tangkuai':'guilu-tangkuai','guilu-jiao':'guilu-jiao','luerong-fen':'luerong-fen'
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
PRODUCT_IDENTITY_FILE={
 'guilu-gao':'guilu-gao.jpg','guilu-drink-30':'guilu-drink-30.jpg','guilu-drink-180':'guilu-drink-180.jpg',
 'guilu-tangkuai':'guilu-tangkuai.jpg','guilu-jiao':'guilu-jiao.jpg','luerong-fen':'luerong-fen.jpg'
}
CURRENT_SPECS={
 'guilu-gao':'100g／罐',
 'guilu-drink-30':'30cc／罐（小玻璃罐）',
 'guilu-drink-180':'180cc／包（鋁袋）',
 'guilu-tangkuai':'75g／盒｜8塊裝',
 'guilu-jiao':'600g（1斤）／盒｜32塊裝',
 'luerong-fen':'75g／罐',
}
PUBLIC_HTML=['index.html','products.html','dm.html','choose.html','combo.html','guide.html','recipes.html','faq.html','brand.html','brand-facts.html','ingredients.html','quality.html','craft.html','knowledge.html','video.html','hanfang-baike.html','sources.html','contact.html','trial.html',*PAGE_BY_ID.values()]
RETIRED_PUBLIC_COPY=('一天一次一小匙','早晚各一小匙','每日早上及下午各一小匙','建議白天飲用','每日一罐','每日一包','龜鹿飲30cc玻璃瓶','30cc／瓶','30cc瓶裝')

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
 b=p.read_bytes()[:20]
 if b[:3]==b'\xff\xd8\xff':return 'jpeg'
 if b[:8]==b'\x89PNG\r\n\x1a\n':return 'png'
 if b[:4]==b'RIFF' and b[8:12]==b'WEBP':return 'webp'
 if b[4:16].find(b'ftypavif')>=0:return 'avif'
 return ''

def validate_product_authority():
 config=load('config/official-products.json')
 public_config=load('assets/data/official-products.json')
 req(config.get('authority')=='user-confirmed-current','產品權威必須是目前使用者確認資料')
 req(public_config.get('authority')=='user-confirmed-current','公開產品權威必須是目前使用者確認資料')
 official={p.get('id'):p for p in config.get('products') or []}
 public_official={p.get('id'):p for p in public_config.get('products') or []}
 data={p.get('id'):p for p in load('data.json').get('products') or []}
 catalog={p.get('id'):p for p in load('catalog-public.json').get('products') or []}
 for collection,name in [(official,'config/official-products.json'),(public_official,'assets/data/official-products.json'),(data,'data.json'),(catalog,'catalog-public.json')]:
  req(set(collection)==set(REQUIRED_IDS),f'{name} 必須剛好六項正式產品')
 for pid in REQUIRED_IDS:
  spec=CURRENT_SPECS[pid]; auth=official[pid]; p=data[pid]; c=catalog[pid]; pub=public_official[pid]
  req(auth.get('spec')==spec,f'{pid} official主規格不同步')
  req(pub.get('specification')==spec,f'{pid} public official主規格不同步')
  req((p.get('size') or p.get('specification') or p.get('spec'))==spec,f'{pid} data.json規格不同步')
  req(c.get('size')==spec,f'{pid} catalog規格不同步')
  req(p.get('name')==auth.get('name')==c.get('name')==pub.get('name'),f'{pid} 名稱不同步')
  identity=' '.join(str(p.get(k) or '') for k in ('image','imageUrl','image_url','officialOriginalImage','detailImages'))
  req('/images/products-v3/' in identity or 'images/products-v3/' in identity,f'{pid}資料層缺products-v3身份原圖')
  req('/images/products-v2/' not in identity and 'images/products-v2/' not in identity,f'{pid}資料層回退products-v2')
  req((ROOT/'images/products-v3'/PRODUCT_IDENTITY_FILE[pid]).is_file(),f'{pid}缺products-v3身份原圖')
  page=read(PAGE_BY_ID[pid])
  req(spec in page,f'{PAGE_BY_ID[pid]}缺目前正式規格：{spec}')
  req('products-v2' not in page,f'{PAGE_BY_ID[pid]}不得引用products-v2')
 req(data['guilu-gao'].get('usage',[None])[0]=='食用時間與份量可依個人使用習慣與作息安排','龜鹿膏主要使用方式未同步目前authority')
 req(catalog['guilu-gao'].get('usage',[None])[0]=='食用時間與份量可依個人使用習慣與作息安排','catalog龜鹿膏主要使用方式未同步目前authority')
 req(data['guilu-drink-30'].get('knownContainerDimensionsMm')=={'diameter':42,'height':51},'30cc必須維持小玻璃罐Ø42×H51mm參考尺寸')
 req(data['guilu-gao'].get('knownContainerDimensionsMm')=={'width':51,'height':78},'龜鹿膏罐必須維持51×78mm參考尺寸')
 ratio=(data['guilu-drink-180'].get('aspectRatioWidthToHeight') or {}).get('target')
 req(abs(float(ratio or 0)-.64)<.001,'180cc鋁袋比例未同步目前authority')
 req(official['guilu-tangkuai'].get('detail_unit_approx')=='每塊約9.375g','湯塊詳細約重不同步')
 req(official['guilu-jiao'].get('detail_unit_approx')=='每塊約18.75g','龜鹿膠詳細約重不同步')
 return official

def validate_formal_media(official):
 formal=load('data/formal-media-authority-v20260810.json')
 display=load('images/formal-display/manifest.json')
 by={p.get('id'):p for p in formal.get('products') or []}
 req(set(by)==set(FORMAL_ID.values()),'formal media必須剛好維持六項產品')
 req(formal.get('runtime')==display.get('runtime'),'formal authority與display runtime不同步')
 req(formal.get('approval_batch')==display.get('approval_batch'),'formal authority與display approval batch不同步')
 for pid in REQUIRED_IDS:
  item=by[FORMAL_ID[pid]]; shown=(display.get('products') or {}).get(DISPLAY_KEY[pid])
  req(item.get('status')=='approved_display',f'{pid}目前產品媒體尚未核准')
  req(item.get('spec')==official[pid].get('spec'),f'{pid} formal media規格未同步目前authority')
  product_path=local(item.get('image')); dm_path=local(item.get('dm'))
  req(raster_kind(product_path) in {'jpeg','png','webp','avif'},f'{pid}產品主圖不是有效點陣圖：{product_path}')
  req(raster_kind(dm_path) in {'jpeg','png','webp','avif'},f'{pid}詳細DM不是有效點陣圖：{dm_path}')
  req(product_path!=dm_path,f'{pid}產品主圖與詳細DM角色混用')
  req(shown and local(shown.get('path'))==product_path and shown.get('status')=='approved_display',f'{pid} display manifest產品主圖不同步')
 p30=by['guilu-drink-30cc']
 req(local(p30.get('dm'))=='images/dm-final/02_guilu-drink-30cc-dm-official-v20260814.jpg','30cc詳細DM不是目前核准JPG')
 req('瓶' not in str(p30.get('name') or '') and p30.get('spec')=='30cc／罐（小玻璃罐）','30cc名稱／規格回退')
 p180=by['guilu-drink-180cc']
 req(local(p180.get('image'))=='images/customer-display-v20260812/guilu-drink-180cc-product.jpg','180cc產品主圖不是目前核准HD產品圖')
 req(local(p180.get('image'))!=local(p180.get('dm')),'180cc產品主圖被DM取代')
 trial=formal.get('trial') or {}; display_trial=display.get('trial') or {}
 trial_path=local(trial.get('image') or trial.get('path'))
 req(trial.get('render_mode')=='poster' and trial.get('status')=='approved_user_original','試喝必須是目前核准海報模式')
 req(trial_path=='images/trial/trial-poster-small-boss-official-v20260814.jpg','試喝不是2026-08-14核准正式海報')
 req(raster_kind(trial_path)=='jpeg','試喝正式海報不是有效JPEG')
 req(local(display_trial.get('path'))==trial_path,'試喝display manifest未同步目前formal authority')
 req('3罐' in str(trial.get('free') or ''),'試喝必須維持3罐免費')
 shipping=trial.get('shipping') or []
 req(any('60元' in str(x) for x in shipping) and any('100元' in str(x) for x in shipping),'試喝運費規則不完整')
 req('5～7' in str(trial.get('lead_time') or ''),'試喝交期規則不完整')
 dm=read('dm.html'); trial_html=read('trial.html')
 for pid in REQUIRED_IDS:req(local(by[FORMAL_ID[pid]].get('dm')) in dm,f'DM頁未使用目前核准詳細DM：{pid}')
 req(trial_path in trial_html,'試喝頁未使用目前核准海報')
 req('images/customer-display-v20260812/guilu-drink-30cc.avif' in trial_html,'試喝頁30cc產品卡未使用目前顧客正式產品圖')
 req('images/customer-display-v20260812/guilu-drink-180cc-product.jpg' in trial_html,'試喝頁180cc產品卡未使用目前顧客正式產品圖')
 return formal

def validate_post_media(formal):
 visual=load('content/visual-production-spec-current.json')
 policy=visual.get('post_media_policy') or {}
 path=local(policy.get('current_catalog') or formal.get('post_catalog'))
 req(path and (ROOT/path).is_file(),'目前貼文素材catalog不存在')
 catalog=load(path)
 candidate_count=int(catalog.get('candidate_count') or catalog.get('unique_image_count') or 0)
 original_count=int(catalog.get('original_file_count') or candidate_count)
 req(candidate_count>0 and original_count>=candidate_count,'目前ZIP候選數必須有效；不得依賴歷史固定張數')
 if formal.get('post_approval_batch'):req(str(catalog.get('approval_batch') or '')==str(formal.get('post_approval_batch') or ''),'目前ZIP與formal authority核准批次不同步')
 sync_status=catalog.get('binary_sync',{}).get('status')
 req(sync_status in {'pending','ready','synced'},f'目前ZIP binary_sync狀態不支援：{sync_status}')
 if sync_status=='synced':req(int(catalog.get('binary_sync',{}).get('publishable_count') or 0)>0,'ZIP標記synced但沒有可發布情境圖')
 dimensions=set(policy.get('semantic_match_dimensions') or [])
 for token in ('season','scene','environment','temperature','expression','action','props','copy_context'):req(token in dimensions,f'貼文語意比對缺少：{token}')
 req(policy.get('matching_source_without_binary')=='needs_binary_sync','有匹配但缺binary時必須保持needs_binary_sync')
 req(policy.get('regenerate_only_if_no_approved_match') is True,'只有真正沒有核准匹配來源才可重新生成')
 req(policy.get('generated_media_returns_to')=='pending_review','換圖／生成後必須回待審核')
 req(int(policy.get('review_items_after_change') or 0)==16,'換圖／生成後必須重跑16項審核')
 return candidate_count

def validate_public_pages():
 for rel in PUBLIC_HTML:
  req((ROOT/rel).is_file(),f'缺顧客頁：{rel}')
  source=read(rel)
  req('/mnt/data/' not in source,f'{rel}不得露出本機路徑')
  for phrase in RETIRED_PUBLIC_COPY:req(phrase not in source,f'{rel}仍顯示退役資料：{phrase}')
  parser=Links(); parser.feed(source)
  for href in parser.hrefs:
   h=href.strip()
   if not h or h.startswith(('#','mailto:','tel:','javascript:')):continue
   parsed=urlparse(h)
   if parsed.scheme or parsed.netloc or not parsed.path.endswith('.html'):continue
   target=(ROOT/parsed.path.lstrip('/')).resolve()
   if ROOT not in target.parents and target!=ROOT:continue
   req(target.exists(),f'{rel}站內連結不存在：{parsed.path}')
 site=read('site-product-image-safety.js')
 req("objectFit','contain" in site or "objectFit='contain'" in site,'產品圖片runtime缺少contain等比例能力')
 req('customer-display-v20260812' in site,'產品圖片runtime未使用目前顧客正式產品圖層')
 trial=read('trial.html'); req('object-fit:contain' in trial,'試喝頁圖片不得cover裁切')

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
 print(f'PASS website current release: six current products, products-v3 identity, customer-display main images, separate current DMs, 2026-08-14 trial poster, current ZIP({candidates} candidates), semantic matching, 16-item review, fulfillment and public links all align.')
