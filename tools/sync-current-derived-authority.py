#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FORMAL_AUTH=ROOT/'data'/'formal-media-authority-v20260810.json'
SITE_BASE='https://ts15825868.github.io/xianjiawei'
PRODUCT_IDENTITY_BASE='images/products-v3/'

# 只清理真正退役內容；新版合法資訊不得被同步腳本降級。
REPLACEMENTS=[
 ('一天一次一小匙','每日早上及下午各一小匙'),
 ('早晚各一小匙','每日早上及下午各一小匙'),
 ('600g／盒｜32塊裝','600g（1斤）／盒｜32塊裝'),
 ('600g一斤裝','600g（1斤）／盒｜32塊裝'),
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
 text=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
 old=path.read_text(encoding='utf-8') if path.exists() else ''
 if text!=old:path.write_text(text,encoding='utf-8');return True
 return False

def load_formal():
 return json.loads(FORMAL_AUTH.read_text(encoding='utf-8')) if FORMAL_AUTH.exists() else {}

def formal_by_catalog_id(formal):
 by={p.get('id'):p for p in formal.get('products',[]) if p.get('id')}
 return {
  'guilu-gao':by.get('guilu-gao'),
  'guilu-drink-30':by.get('guilu-drink-30cc'),
  'guilu-drink-180':by.get('guilu-drink-180cc'),
  'guilu-tangkuai':by.get('guilu-tangkuai'),
  'guilu-jiao':by.get('guilu-jiao'),
  'luerong-fen':by.get('luerong-fen'),
 }

def public_url(path:str,version='current')->str:
 if not path:return ''
 if path.startswith('http://') or path.startswith('https://'):return path
 return SITE_BASE+'/'+path.lstrip('/')+'?v='+version

def sync_json(rel:str):
 path=ROOT/rel
 if not path.exists():return False
 original=json.loads(path.read_text(encoding='utf-8'))
 data=transform(original)
 if rel=='content/public-post-library.json':
  formal=load_formal(); current=formal_by_catalog_id(formal)
  data['version']='current-public-posts-authority-20260812-v2'
  auth=data.setdefault('productAuthority',{})
  auth['source']='data/formal-media-authority-v20260810.json'
  auth['imageAuthority']='images/customer-display-v20260812/'
  auth['identityReference']='images/products-v3/'
  auth['sixProductsSixSpecs']=True
  auth['mediaRoles']='product image / valid detailed DM / trial are separate'
  auth['soupBlock']='75g／盒｜深藍盒｜8塊裝'
  auth['guiluJiao']='600g（1斤）／盒｜32塊裝｜淡紫色正式盒裝'
  auth['guardPolicy']='validate-current-authority-no-legacy-copy-version-lock'
  for post in data.get('posts',[]):
   pid=post.get('id')
   if pid=='POST-SOUP-75':
    post['copy']='龜鹿湯塊為75g／盒｜8塊裝的深藍正式盒裝，可搭配熱水、保溫壺，也可加入雞湯、排骨湯或日常食材燉煮。'
   elif pid=='POST-JIAO-600':
    post['copy']='龜鹿膠為600g（1斤）／盒｜32塊裝的淡紫色盒裝，可加入熱水化開，也可依料理方式搭配湯品。'
   product_id=post.get('product_id') or post.get('productId')
   f=current.get(product_id)
   if f and f.get('status')=='approved_display' and post.get('status') not in {'published','archived'}:
    # 只在一般產品貼文有明確產品ID且目前圖為舊產品權威時更新；DM／試喝由各自媒體角色處理。
    image=str(post.get('image_url') or '')
    if '/images/products-v2/' in image or '/images/products-v3/' in image:
     post['image_url']=public_url(str(f.get('image') or ''),'current-product')
     post['image_status']='approved_existing'
   if post.get('status')!='published' and post.get('image_status') in {'needs_generation','replace-required'}:
    post['regeneration_mode']='chatgpt_handoff'
   if post.get('status') not in {'published','archived'}:
    post['owner_review_required']=True
    post['publish_allowed']=False
    post['auto_approve']=False
    post['auto_schedule']=False
    post['auto_publish']=False
 return write_json_if_changed(path,data)

def sync_catalog_current_media():
 path=ROOT/'catalog-public.json'
 if not path.exists():return False
 data=transform(json.loads(path.read_text(encoding='utf-8')))
 formal=load_formal(); current=formal_by_catalog_id(formal)
 data['catalogVersion']='current-six-product-display-and-valid-dm-20260812-v2'
 data['productImageVersion']='current-six-user-confirmed-product-images'
 data['productIdentityReference']='products-v3-real-product-package-shape-proportion-only'
 data['formalDmApprovalBatch']=formal.get('approval_batch') or '20260812-dm-binary-fix-v2'
 rules=data.setdefault('specificationRules',{})
 rules['drink30']='30cc產品正式名稱為龜鹿飲30cc玻璃罐；規格30cc／罐（小玻璃罐）；小玻璃裸罐、無貼紙、金色蓋；不得改罐型、比例或稱瓶。'
 rules['tangkuai']='75g／盒｜8塊裝；每塊約9.375g只留產品詳細資料，不放產品圖、DM主規格或貼文主規格。'
 rules['jiao']='600g（1斤）／盒｜32塊裝；每塊約18.75g只留產品詳細資料，不放產品圖、DM主規格或貼文主規格。'
 for product in data.get('products',[]):
  f=current.get(product.get('id'))
  if not f or f.get('status')!='approved_display':continue
  image=str(f.get('image') or '')
  dm=str(f.get('dm') or '')
  if image.startswith('/images/'):
   product['image']=public_url(image,'current-product')
   product['imageUrl']=product['image']
   product['image_url']=product['image']
  if dm.startswith('/images/'):
   product['dmImage']=public_url(dm,'current-dm')
  product['officialOriginalImage']=SITE_BASE+'/'+PRODUCT_IDENTITY_BASE+{
    'guilu-gao':'guilu-gao.jpg','guilu-drink-30':'guilu-drink-30.jpg','guilu-drink-180':'guilu-drink-180.jpg',
    'guilu-tangkuai':'guilu-tangkuai.jpg','guilu-jiao':'guilu-jiao.jpg','luerong-fen':'luerong-fen.jpg'
   }.get(product.get('id'),'')
  product['imagePolicy']='六張使用者確認正式產品圖為顧客主視覺；products-v3只作實物身份與比例校正。'
 dm_policy=data.setdefault('dmPolicy',{})
 dm_policy['currentDmStatus']='current-approved-valid-binary-separated-from-product-image'
 dm_policy['legacyDmUse']='reference-only'
 dm_policy['consumerDmMustBeReviewed']=True
 dm_policy['consumerDmMustMatchCurrentSpecification']=True
 dm_policy['productMainImageMustNotUseDm']=True
 dm_policy['dmMustNotRedefineProductIdentity']=True
 dm_policy['retiredInvalidPaths']=['images/dm-approved-v20260810/guilu-gao-100g.webp']
 return write_json_if_changed(path,data)

def sync_text(rel:str):
 path=ROOT/rel
 if not path.exists():return False
 old=path.read_text(encoding='utf-8'); new=replace_text(old)
 if rel=='llms-full.txt':
  new=new.replace('最後檢視：2026-08-09','最後檢視：2026-08-12').replace('最後更新：2026-08-09','最後更新：2026-08-12').replace('最後檢視：2026-08-11','最後檢視：2026-08-12').replace('最後更新：2026-08-11','最後更新：2026-08-12')
 if new!=old:path.write_text(new,encoding='utf-8');return True
 return False

def validate_no_retired_customer_copy():
 current=['content/public-post-library.json','llms-full.txt','deploy-version.json','data.json','catalog-public.json','config/official-products.json','assets/data/official-products.json']
 retired=['一天一次一小匙','龜鹿飲30cc玻璃瓶','30cc／瓶']
 for rel in current:
  path=ROOT/rel
  if not path.exists():continue
  value=path.read_text(encoding='utf-8')
  for phrase in retired:
   if phrase in value:raise SystemExit(f'{rel} 顧客／公開目前輸出仍含退役資料：{phrase}')
 # 新版合法內容反向驗證，避免同步時又被舊守門員去掉。
 for rel in ['content/public-post-library.json','catalog-public.json']:
  path=ROOT/rel
  if path.exists() and '龜鹿膠' in path.read_text(encoding='utf-8'):
   value=path.read_text(encoding='utf-8')
   if '600g（1斤）／盒｜32塊裝' not in value:
    raise SystemExit(f'{rel} 缺少目前正式龜鹿膠規格：600g（1斤）／盒｜32塊裝')

changed=[]
for rel in ['content/public-post-library.json','content/public-content-policy.json','config/public-content-policy.json','content/post-bank-v6-manifest.json','data.json','geo-data.json','assets/data/official-products.json','content/visual-production-spec-current.json']:
 if sync_json(rel):changed.append(rel)
if sync_catalog_current_media():changed.append('catalog-public.json')
for rel in ['llms-full.txt','llms.txt']:
 if sync_text(rel):changed.append(rel)
validate_no_retired_customer_copy()
print('current authority derived sync:', ', '.join(changed) if changed else 'already current')
