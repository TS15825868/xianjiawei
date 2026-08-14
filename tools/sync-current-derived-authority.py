#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FORMAL_AUTH=ROOT/'data'/'formal-media-authority-v20260810.json'
OFFICIAL_PRODUCTS=ROOT/'assets'/'data'/'official-products.json'
SITE_BASE='https://ts15825868.github.io/xianjiawei'
PRODUCT_IDENTITY_BASE='images/products-v3/'

# 只清理真正退役內容；新版合法資訊不得被同步腳本降級。
# 舊版「～」寫法以 Unicode escape 保存，避免一次性同步工具把守門條目本身改成目前合法的「1-2」。
OLD_30_RANGE_TIGHT='每日1\uFF5E2罐'
OLD_30_RANGE_SPACED='每日 1\uFF5E2罐'
REPLACEMENTS=[
 ('每日早上及下午各一小匙','食用時間可依個人使用習慣與作息時間安排'),
 ('建議白天飲用','飲用時間可依個人使用習慣與作息時間安排'),
 ('每日一罐','每日 1-2罐'),('每日1罐','每日 1-2罐'),('每日 1 罐','每日 1-2罐'),
 (OLD_30_RANGE_TIGHT,'每日 1-2罐'),(OLD_30_RANGE_SPACED,'每日 1-2罐'),
 ('一天一次一小匙','食用時間可依個人使用習慣與作息時間安排'),
 ('早晚各一小匙','食用時間可依個人使用習慣與作息時間安排'),
 ('600g／盒｜32塊裝','600g （1斤）／盒｜32塊裝'),
 ('600g一斤裝','600g （1斤）／盒｜32塊裝'),
 ('75g／盒｜8塊裝','75g （2兩）／盒｜8塊裝'),
 ('龜鹿飲30cc玻璃瓶','龜鹿飲30cc玻璃罐'),
 ('30cc／瓶（玻璃瓶）','30cc／罐（小玻璃罐）'),
 ('30cc／瓶','30cc／罐（小玻璃罐）'),
]

def replace_text(value:str)->str:
 out=value
 for old,new in REPLACEMENTS:out=out.replace(old,new)
 return out

def transform(value):
 if isinstance(value,str):return replace_text(value)
 if isinstance(value,list):return [transform(x) for x in value]
 if isinstance(value,dict):return {k:transform(v) for k,v in value.items()}
 return value

def write_json_if_changed(path:Path,data)->bool:
 text=json.dumps(data,ensure_ascii=False,indent=2)+'\n'; old=path.read_text(encoding='utf-8') if path.exists() else ''
 if text!=old:path.write_text(text,encoding='utf-8');return True
 return False

def load_formal():return json.loads(FORMAL_AUTH.read_text(encoding='utf-8')) if FORMAL_AUTH.exists() else {}
def load_official():return json.loads(OFFICIAL_PRODUCTS.read_text(encoding='utf-8')) if OFFICIAL_PRODUCTS.exists() else {}
def official_by_id():return {p.get('id'):p for p in load_official().get('products',[]) if p.get('id')}
def formal_by_catalog_id(formal):
 by={p.get('id'):p for p in formal.get('products',[]) if p.get('id')}
 return {'guilu-gao':by.get('guilu-gao'),'guilu-drink-30':by.get('guilu-drink-30cc'),'guilu-drink-180':by.get('guilu-drink-180cc'),'guilu-tangkuai':by.get('guilu-tangkuai'),'guilu-jiao':by.get('guilu-jiao'),'luerong-fen':by.get('luerong-fen')}
def public_url(path:str,version='current')->str:
 if not path:return ''
 if path.startswith('http://') or path.startswith('https://'):return path
 return SITE_BASE+'/'+path.lstrip('/')+'?v='+version

def complete_spec(product:dict)->str:
 spec=str(product.get('specification') or '').strip(); detail=str(product.get('detail_unit_approx') or '').strip()
 if not detail or detail in spec:return spec
 return f'{spec}，{detail}'

def sync_json(rel:str):
 path=ROOT/rel
 if not path.exists():return False
 data=transform(json.loads(path.read_text(encoding='utf-8')))
 if rel=='content/public-post-library.json':
  formal=load_formal(); current=formal_by_catalog_id(formal); official=official_by_id(); data['version']='current-public-posts-authority-20260815-v3'; auth=data.setdefault('productAuthority',{})
  auth['source']='assets/data/official-products.json + data/formal-media-authority-v20260810.json'; auth['imageAuthority']='images/customer-display-v20260812/'; auth['identityReference']='images/products-v3/'; auth['sixProductsSixSpecs']=True; auth['mediaRoles']='product image / valid detailed DM / trial are separate'; auth['soupBlock']=complete_spec(official.get('guilu-tangkuai') or {}); auth['guiluJiao']=complete_spec(official.get('guilu-jiao') or {}); auth['guardPolicy']='latest-product-authority-first-no-legacy-copy-version-lock'
  for post in data.get('posts',[]):
   pid=post.get('id')
   if pid=='POST-SOUP-75':post['copy']='龜鹿湯塊為75g （2兩）／盒｜8塊裝，每塊約9.375g；深藍正式盒裝，可搭配熱水、保溫壺，也可加入雞湯、排骨湯或日常食材燉煮。'
   elif pid=='POST-JIAO-600':post['copy']='龜鹿膠為600g （1斤）／盒｜32塊裝，每塊約18.75 g；淡紫色正式盒裝，可加入熱水化開，也可依料理方式搭配湯品。'
   product_id=post.get('product_id') or post.get('productId'); f=current.get(product_id)
   if f and f.get('status')=='approved_display' and post.get('status') not in {'published','archived'}:
    image=str(post.get('image_url') or '')
    if '/images/products-v2/' in image or '/images/products-v3/' in image:
     post['image_url']=public_url(str(f.get('image') or ''),'current-product'); post['image_status']='approved_existing'
   if post.get('status')!='published' and post.get('image_status') in {'needs_generation','replace-required'}:post['regeneration_mode']='chatgpt_handoff'
   if post.get('status') not in {'published','archived'}:
    post['owner_review_required']=True; post['publish_allowed']=False; post['auto_approve']=False; post['auto_schedule']=False; post['auto_publish']=False
 return write_json_if_changed(path,data)

def sync_catalog_current_media():
 path=ROOT/'catalog-public.json'
 if not path.exists():return False
 data=transform(json.loads(path.read_text(encoding='utf-8'))); formal=load_formal(); current=formal_by_catalog_id(formal); official=official_by_id()
 data['catalogVersion']='current-six-product-display-and-valid-dm-20260815-v3'; data['productImageVersion']='current-six-user-confirmed-product-images'; data['productIdentityReference']='products-v3-real-product-package-shape-proportion-only'; data['formalDmApprovalBatch']=formal.get('approval_batch') or 'current'
 rules=data.setdefault('specificationRules',{}); rules['drink30']='30cc產品正式名稱為龜鹿飲30cc玻璃罐；規格30cc／罐（小玻璃罐）；小玻璃裸罐、無貼紙、金色蓋；不得改罐型、比例或稱瓶。'; rules['tangkuai']='龜鹿湯塊文字規格為75g （2兩）／盒｜8塊裝，每塊約9.375g；顧客文字可顯示完整規格；產品主圖與DM維持正式原圖及主規格，不自行加字。'; rules['jiao']='龜鹿膠文字規格為600g （1斤）／盒｜32塊裝，每塊約18.75 g；顧客文字可顯示完整規格；產品主圖與DM維持正式原圖及主規格，不自行加字。'
 for product in data.get('products',[]):
  pid=product.get('id'); f=current.get(pid); o=official.get(pid)
  if o:
   spec=str(o.get('specification') or '').strip(); detail=str(o.get('detail_unit_approx') or '').strip()
   if spec:
    product['specification']=spec; product['size']=spec; product['spec']=spec
   if detail:product['detailUnitApprox']=detail
   if o.get('usage_primary'):product['usagePrimary']=o.get('usage_primary')
   if o.get('usage_timing'):product['usageTiming']=o.get('usage_timing')
  if not f or f.get('status')!='approved_display':continue
  image=str(f.get('image') or ''); dm=str(f.get('dm') or '')
  if image.startswith('/images/'):
   product['image']=public_url(image,'current-product'); product['imageUrl']=product['image']; product['image_url']=product['image']
  if dm.startswith('/images/'):product['dmImage']=public_url(dm,'current-dm')
  product['officialOriginalImage']=SITE_BASE+'/'+PRODUCT_IDENTITY_BASE+{'guilu-gao':'guilu-gao.jpg','guilu-drink-30':'guilu-drink-30.jpg','guilu-drink-180':'guilu-drink-180.jpg','guilu-tangkuai':'guilu-tangkuai.jpg','guilu-jiao':'guilu-jiao.jpg','luerong-fen':'luerong-fen.jpg'}.get(pid,'')
  product['imagePolicy']='六張使用者確認正式產品圖為顧客主視覺；products-v3只作實物身份與比例校正。'
 dm_policy=data.setdefault('dmPolicy',{}); dm_policy['currentDmStatus']='current-approved-valid-binary-separated-from-product-image'; dm_policy['legacyDmUse']='reference-only'; dm_policy['consumerDmMustBeReviewed']=True; dm_policy['consumerDmMustMatchCurrentSpecification']=True; dm_policy['productMainImageMustNotUseDm']=True; dm_policy['dmMustNotRedefineProductIdentity']=True; dm_policy['retiredInvalidPaths']=['images/dm-approved-v20260810/guilu-gao-100g.webp']
 return write_json_if_changed(path,data)

def sync_text(rel:str):
 path=ROOT/rel
 if not path.exists():return False
 old=path.read_text(encoding='utf-8'); new=replace_text(old)
 if new!=old:path.write_text(new,encoding='utf-8');return True
 return False

def validate_no_retired_customer_copy():
 current=['content/public-post-library.json','llms-full.txt','deploy-version.json','data.json','catalog-public.json','config/official-products.json','assets/data/official-products.json']
 retired=['一天一次一小匙','早晚各一小匙','每日早上及下午各一小匙','建議白天飲用','每日一罐','每日1罐','每日 1 罐',OLD_30_RANGE_TIGHT,OLD_30_RANGE_SPACED,'龜鹿飲30cc玻璃瓶','30cc／瓶']
 for rel in current:
  path=ROOT/rel
  if not path.exists():continue
  value=path.read_text(encoding='utf-8')
  for phrase in retired:
   if phrase in value:raise SystemExit(f'{rel} 顧客／公開目前輸出仍含退役資料：{phrase}')
 official=official_by_id()
 for rel in ['content/public-post-library.json','catalog-public.json']:
  path=ROOT/rel
  if not path.exists():continue
  value=path.read_text(encoding='utf-8')
  for pid in ['guilu-tangkuai','guilu-jiao']:
   p=official.get(pid) or {}; spec=str(p.get('specification') or ''); detail=str(p.get('detail_unit_approx') or '')
   if spec and spec not in value:raise SystemExit(f'{rel} 缺少目前正式規格：{spec}')
   if detail and detail not in value:raise SystemExit(f'{rel} 缺少目前詳細約重：{detail}')

changed=[]
for rel in ['content/public-post-library.json','content/public-content-policy.json','config/public-content-policy.json','content/post-bank-v6-manifest.json','data.json','geo-data.json','assets/data/official-products.json','content/visual-production-spec-current.json']:
 if sync_json(rel):changed.append(rel)
if sync_catalog_current_media():changed.append('catalog-public.json')
for rel in ['llms-full.txt','llms.txt']:
 if sync_text(rel):changed.append(rel)
validate_no_retired_customer_copy(); print('current authority derived sync:', ', '.join(changed) if changed else 'already current')
