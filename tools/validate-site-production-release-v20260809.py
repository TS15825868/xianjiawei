#!/usr/bin/env python3
from __future__ import annotations

import json
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse

ROOT=Path(__file__).resolve().parents[1]
REQUIRED_IDS=('guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen')
PAGE_BY_ID={
 'guilu-gao':'product-guilu-gao.html',
 'guilu-drink-30':'product-guilu-drink-30cc.html',
 'guilu-drink-180':'product-guilu-drink-180cc.html',
 'guilu-tangkuai':'product-guilu-tangkuai.html',
 'guilu-jiao':'product-guilu-jiao.html',
 'luerong-fen':'product-luerong-fen.html',
}
PRODUCT_IMAGE_BY_ID={
 'guilu-gao':'guilu-gao.jpg',
 'guilu-drink-30':'guilu-drink-30.jpg',
 'guilu-drink-180':'guilu-drink-180.jpg',
 'guilu-tangkuai':'guilu-tangkuai.jpg',
 'guilu-jiao':'guilu-jiao.jpg',
 'luerong-fen':'luerong-fen.jpg',
}
FORMAL_ID_BY_PRODUCT={
 'guilu-gao':'guilu-gao',
 'guilu-drink-30':'guilu-drink-30cc',
 'guilu-drink-180':'guilu-drink-180cc',
 'guilu-tangkuai':'guilu-tangkuai',
 'guilu-jiao':'guilu-jiao',
 'luerong-fen':'lurong-fen',
}
DISPLAY_KEY_BY_PRODUCT={
 'guilu-gao':'guilu-gao',
 'guilu-drink-30':'guilu-drink-30',
 'guilu-drink-180':'guilu-drink-180',
 'guilu-tangkuai':'guilu-tangkuai',
 'guilu-jiao':'guilu-jiao',
 'luerong-fen':'luerong-fen',
}
PUBLIC_HTML=['index.html','products.html','dm.html','choose.html','combo.html','guide.html','recipes.html','faq.html','brand.html','brand-facts.html','ingredients.html','quality.html','craft.html','knowledge.html','video.html','hanfang-baike.html','sources.html','contact.html','trial.html',*PAGE_BY_ID.values()]
RETIRED_CUSTOMER_COPY=('每日早上及下午各一小匙','早晚各一小匙','75g／盒｜8塊裝｜每塊約9.375g','600g（1斤）／盒｜32塊裝｜每塊約18.75g','30cc／瓶','龜鹿飲30cc玻璃瓶')

class Links(HTMLParser):
 def __init__(self): super().__init__(); self.hrefs=[]
 def handle_starttag(self,tag,attrs):
  if tag=='a':
   href=dict(attrs).get('href')
   if href:self.hrefs.append(href)

def req(ok,message):
 if not ok: raise AssertionError(message)
def text(path): return (ROOT/path).read_text(encoding='utf-8')
def load(path): return json.loads(text(path))
def local(public_path): return str(public_path or '').split('?',1)[0].lstrip('/')
def raster_kind(path):
 p=ROOT/path
 if not p.is_file() or p.stat().st_size<12:return ''
 b=p.read_bytes()[:16]
 if b[:3]==b'\xff\xd8\xff':return 'jpeg'
 if b[:8]==b'\x89PNG\r\n\x1a\n':return 'png'
 if b[:4]==b'RIFF' and b[8:12]==b'WEBP':return 'webp'
 return ''

def current_authority():
 config=load('config/official-products.json')
 req(config.get('authority')=='user-confirmed-current','config/official-products.json 必須明確標示目前使用者確認權威')
 official={p.get('id'):p for p in config.get('products',[])}
 req(tuple(official.keys())==REQUIRED_IDS or set(official)==set(REQUIRED_IDS),'目前產品權威必須維持六項正式產品ID')
 for pid,p in official.items():
  req(str(p.get('name') or '').strip(),f'{pid} 目前權威缺名稱')
  req(str(p.get('spec') or '').strip(),f'{pid} 目前權威缺規格')
 return config,official

def check_current_products(config,official):
 data=load('data.json'); catalog=load('catalog-public.json')
 products={p.get('id'):p for p in data.get('products',[])}; cat={p.get('id'):p for p in catalog.get('products',[])}
 req(set(products)==set(REQUIRED_IDS),'data.json 必須維持目前六項產品')
 req(set(cat)==set(REQUIRED_IDS),'catalog-public.json 必須維持目前六項產品')
 for pid in REQUIRED_IDS:
  authority=official[pid]; name=authority['name']; spec=authority['spec']
  p=products[pid]; c=cat[pid]
  req(p.get('name')==name,f'data.json {pid} 名稱未跟目前authority同步')
  req((p.get('size') or p.get('specification') or p.get('spec'))==spec,f'data.json {pid} 規格未跟目前authority同步')
  req(c.get('name')==name and c.get('size')==spec,f'catalog {pid} 名稱／規格未跟目前authority同步')
  image=str(p.get('officialOriginalImage') or p.get('image') or '')
  req('/images/products-v3/' in image and '/images/products-v2/' not in image,f'{pid} 產品識別不是products-v3')
  req((ROOT/'images/products-v3'/PRODUCT_IMAGE_BY_ID[pid]).is_file(),f'缺少 products-v3 原圖：{PRODUCT_IMAGE_BY_ID[pid]}')
  page=PAGE_BY_ID[pid]; source=text(page)
  req(spec in source,f'{page} 缺少目前authority規格：{spec}')
  req('products-v2' not in source,f'{page} 不得引用products-v2')
 req(products['guilu-gao'].get('usage',[None])[0]=='一天一次一小匙','龜鹿膏主要使用方式未跟目前authority同步')
 req(products['guilu-drink-30'].get('knownContainerDimensionsMm')=={'diameter':42,'height':51},'30cc必須維持小玻璃罐Ø42×H51mm參考尺寸')
 req(products['guilu-gao'].get('knownContainerDimensionsMm')=={'width':51,'height':78},'龜鹿膏罐必須維持51×78mm參考尺寸')
 ratio=(products['guilu-drink-180'].get('aspectRatioWidthToHeight') or {}).get('target')
 req(abs(float(ratio or 0)-float(official['guilu-drink-180'].get('aspect_ratio_width_to_height') or .64))<.001,'180cc鋁袋比例未跟目前authority同步')

def check_visual_and_post_policy():
 visual=load('content/visual-production-spec-current.json')
 match=visual.get('copy_image_match',{})
 req(match.get('review_items')==16 and match.get('auto_approve') is False and match.get('auto_publish') is False,'圖文修改後必須回待審核、16項檢查且不得自動核准／發布')
 policy=visual.get('post_media_policy',{})
 req(policy.get('regenerate_only_if_no_approved_match') is True,'只有真正沒有合格來源才可重新生成')
 req(policy.get('generated_media_returns_to')=='pending_review','生成／換圖後必須回 pending_review')
 formal=load('data/formal-media-authority-v20260810.json')
 post_catalog=local(formal.get('post_catalog'))
 req(post_catalog and (ROOT/post_catalog).is_file(),'目前 formal authority 指向的貼文素材catalog不存在')
 zip_catalog=load(post_catalog)
 req(str(zip_catalog.get('source') or '').strip(),'目前貼文素材catalog缺來源')
 req(Number(zip_catalog.get('candidate_count') or zip_catalog.get('unique_image_count') or 0)>0 if False else True,'')
 # Python沒有Number；以下以int安全驗證目前候選數，不要求歷史固定張數。
 count=int(zip_catalog.get('candidate_count') or zip_catalog.get('unique_image_count') or 0)
 req(count>0,'目前貼文素材catalog沒有候選')
 req(zip_catalog.get('binary_sync',{}).get('status') in {'pending','ready'},'目前貼文素材必須明確標示二進位同步狀態')
 req(str(formal.get('post_approval_batch') or '')==str(zip_catalog.get('approval_batch') or ''),'formal authority 與目前貼文catalog核准批次不同步')
 post_policy=str(formal.get('post_image_policy') or '')
 for token in ('season','scene','environment','temperature','expression','action','props'):
  req(token in post_policy,f'貼文語意配圖能力缺少：{token}')
 req('needs_binary_sync' in post_policy,'貼文流程必須保留 needs_binary_sync 狀態')
 req('16' in post_policy and ('pending_review' in post_policy or '待審核' in post_policy),'換圖／生成後必須保留16項重審能力')

def check_formal_media(official):
 formal=load('data/formal-media-authority-v20260810.json'); display=load('images/formal-display/manifest.json')
 by_formal={p.get('id'):p for p in formal.get('products',[])}
 req(len(by_formal)==6,'formal media 必須維持六項產品')
 req(display.get('approval_batch')==formal.get('approval_batch'),'顧客展示manifest與目前核准批次不同步')
 for pid in REQUIRED_IDS:
  f=by_formal.get(FORMAL_ID_BY_PRODUCT[pid]); d=display.get('products',{}).get(DISPLAY_KEY_BY_PRODUCT[pid])
  req(f is not None and f.get('status')=='approved_display',f'{pid} 尚未核准顧客展示')
  req(f.get('spec')==official[pid]['spec'],f'{pid} formal media規格未跟目前authority同步')
  source=local(f.get('dm')); kind=raster_kind(source)
  req(kind in {'jpeg','png','webp'},f'{pid} 正式顯示媒體不存在或不是有效JPEG/PNG/WebP：{source}')
  req(d and d.get('status')=='approved_display' and local(d.get('path'))==source,f'{pid} 顧客展示manifest未跟目前formal authority同步')
 trial=formal.get('trial',{}); trial_path=local(trial.get('image'))
 req(trial.get('status')=='approved_display','試喝圖尚未核准顧客展示')
 req(raster_kind(trial_path) in {'jpeg','png','webp'},'試喝正式圖不存在或不是有效點陣圖片')
 req(display.get('trial',{}).get('path')==trial.get('image'),'試喝manifest未跟目前authority同步')
 req('3罐' in str(trial.get('free') or ''),'試喝免費數量不同步')
 shipping=trial.get('shipping') or []
 req(any('60元' in str(x) for x in shipping) and any('100元' in str(x) for x in shipping),'試喝運費不同步')
 req('5～7' in str(trial.get('lead_time') or ''),'試喝交期不同步')
 dm=text('dm.html'); trial_html=text('trial.html')
 for pid in REQUIRED_IDS:
  req(local(by_formal[FORMAL_ID_BY_PRODUCT[pid]].get('dm')) in dm,f'DM頁沒有使用目前核准媒體：{pid}')
 req(trial_path in trial_html,'試喝頁沒有使用目前核准試喝圖')
 req('images/products-v3/guilu-drink-30.jpg' in trial_html,'試喝頁30cc產品本體必須維持products-v3')
 req('<iframe' not in trial_html.lower(),'試喝頁不得以iframe代替正式內容')

def check_fulfillment():
 data=load('data.json'); by={p['id']:p for p in data['products']}
 for pid in ('guilu-drink-30','guilu-drink-180'):
  p=by[pid]; req(p.get('fulfillmentType')=='made-to-order-drink' and p.get('readyStock') is False,f'{pid} 接單製作狀態錯誤')
  req('5～7個工作天' in str(p.get('fulfillmentNotice') or ''),f'{pid} 缺少5～7工作天製作說明')
 for pid in ('guilu-gao','guilu-tangkuai','guilu-jiao','luerong-fen'):
  p=by[pid]; req(p.get('fulfillmentType')=='ready-stock' and p.get('readyStock') is True,f'{pid} 備貨狀態錯誤')
  req('5～7個工作天' not in str(p.get('fulfillmentNotice') or ''),f'{pid} 不得套用龜鹿飲製作交期')

def check_public_pages():
 for rel in PUBLIC_HTML:
  req((ROOT/rel).is_file(),f'缺顧客頁：{rel}')
  source=text(rel); req('/mnt/data/' not in source,f'{rel} 不得露出本機路徑')
  for phrase in RETIRED_CUSTOMER_COPY:req(phrase not in source,f'{rel} 不得顯示退役資料：{phrase}')
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
 req('products-v3' in site_authority and 'contain-no-crop' in site_authority,'官網產品本體必須維持products-v3與contain/no-crop能力')

def check_guard_mode():
 path=ROOT/'config'/'guard-mode.json'
 if not path.is_file():return
 mode=load('config/guard-mode.json')
 if mode.get('mode')=='paused_for_full_system_update':
  req(mode.get('blocking') is False,'維護期間blocking guard必須維持關閉直到使用者確認')
  req(mode.get('keep_minimum_safety') is True,'維護期間仍須保留最低語法／部署安全')

if __name__=='__main__':
 config,official=current_authority()
 check_current_products(config,official)
 check_visual_and_post_policy()
 check_formal_media(official)
 check_fulfillment()
 check_public_pages()
 check_guard_mode()
 print('PASS website production release: current user-confirmed authority, products-v3 identity, current approved raster media, dynamic current ZIP catalog, semantic matching, 16-item review, fulfillment and customer pages; no WebP-only, fixed ZIP count, retired filename/version or historical copy lock.')
