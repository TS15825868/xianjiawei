#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FORMAL_AUTH=ROOT/'data'/'formal-media-authority-v20260810.json'
OFFICIAL_PRODUCTS=ROOT/'assets'/'data'/'official-products.json'
SITE_BASE='https://ts15825868.github.io/xianjiawei'
PRODUCT_IDENTITY_BASE='images/products-v3/'
CURRENT_30_USAGE='每日 1–2 罐'
LEGACY_30_OUTPUTS=(
 '每日1-2罐','每日 1-2罐','每日 1-2 罐',
 '每日1～2罐','每日 1～2罐','每日 1～2 罐',
 '每日1－2罐','每日 1－2罐','每日 1－2 罐',
)
REPLACEMENTS=[
 ('每日早上及下午各一小匙','食用時間可依個人使用習慣與作息時間安排'),
 ('建議白天飲用','飲用時間可依個人使用習慣與作息時間安排'),
 *[(old,CURRENT_30_USAGE) for old in LEGACY_30_OUTPUTS],
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

def enforce_current_scope(rel:str,data:dict)->dict:
 official=official_by_id()
 if rel=='data.json':
  data['version']='2026-08-20-six-approved-media-current-v4'
  data['authorityScope']='六項已有核准正式產品圖的顧客顯示／相容資料；七項正式文字產品知識最高權威為 public-product-master.json，本檔不得覆蓋新版產品事實。'
  data['productDataAuthority']='public-product-master.json'
  data['knowledgeProductCount']=7; data['approvedMediaProductCount']=6; data['updatedAt']='2026-08-20'
  data['knowledgeProductIds']=['guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen','qixuan-guilu-drink-powder']
  by={p.get('id'):p for p in data.get('products',[]) if p.get('id')}
  p30=by.get('guilu-drink-30') or {}
  p30['usagePrimary']=CURRENT_30_USAGE
  if p30.get('usage'):p30['usage'][0]=CURRENT_30_USAGE
  p180=by.get('guilu-drink-180') or {}
  p180['usagePrimary']='每日一包'
  if p180.get('usage'):p180['usage'][0]='每日一包'
  runtime=data.setdefault('runtime',{}); runtime['productDataAuthority']='public-product-master.json'; runtime['productMasterMode']='seven-product-text-authority-six-approved-media-products'; runtime['knowledgeProductCount']=7; runtime['approvedMediaProductCount']=6; runtime['guardPolicy']='latest-authority-first-no-legacy-copy-version-lock'
  fp=data.setdefault('fulfillmentPolicy',{}); fp['scopeRule']='5～7個工作天交期只適用龜鹿飲30cc與180cc，不得套用其他產品'
 elif rel=='content/visual-production-spec-current.json':
  data['authority']='user-confirmed-current'; data['updated_at_taipei']='2026-08-20'; data['knowledge_product_count']=7; data['approved_media_product_count']=6
  p=data.setdefault('products',{}).setdefault('guilu-drink-30',{}); p['usage_primary']=CURRENT_30_USAGE
 elif rel=='content/ai-brand-control-v20260807.json':
  data['authority']='user-confirmed-current'; pa=data.setdefault('productAuthority',{}); pa['source']='public-product-master.json'; pa['productCount']=7; pa['knowledgeProductCount']=7; pa['approvedMediaProductCount']=6; pa['latestAuthorityWins']=True
  pa.setdefault('canonicalFacts',{}).setdefault('guiluDrink30',{})['usagePrimary']=CURRENT_30_USAGE
 elif rel=='product-master.json':
  data['authority']='compatibility-mirror-of-public-product-master'; data['productCount']=7; data['knowledgeProductCount']=7; data['approvedMediaProductCount']=6
  by={p.get('id'):p for p in data.get('products',[]) if p.get('id')}; p30=by.get('guilu-drink-30') or {}; p30['usagePrimary']=CURRENT_30_USAGE
  if p30.get('usage'):p30['usage'][0]=CURRENT_30_USAGE
 elif rel=='assets/data/official-products.json':
  by={p.get('id'):p for p in data.get('products',[]) if p.get('id')}; p30=by.get('guilu-drink-30') or {}; p30['usage_primary']=CURRENT_30_USAGE
 return data

def sync_json(rel:str):
 path=ROOT/rel
 if not path.exists():return False
 data=transform(json.loads(path.read_text(encoding='utf-8')))
 data=enforce_current_scope(rel,data)
 if rel=='content/public-post-library.json':
  formal=load_formal(); current=formal_by_catalog_id(formal); official=official_by_id(); data['version']='current-public-posts-authority-20260820-v5'; auth=data.setdefault('productAuthority',{})
  auth['source']='public-product-master.json + assets/data/official-products.json + data/formal-media-authority-v20260810.json'; auth['imageAuthority']='images/customer-display-v20260812/'; auth['identityReference']='images/products-v3/'; auth['knowledgeProducts']=7; auth['approvedMediaProducts']=6; auth.pop('sixProductsSixSpecs',None); auth['mediaRoles']='product image / valid detailed DM / trial are separate'; auth['soupBlock']=complete_spec(official.get('guilu-tangkuai') or {}); auth['guiluJiao']=complete_spec(official.get('guilu-jiao') or {}); auth['guardPolicy']='latest-product-authority-first-no-legacy-copy-version-lock'
  for post in data.get('posts',[]):
   pid=post.get('id')
   if pid=='POST-SOUP-75':post['copy']='龜鹿湯塊為75g （2兩）／盒｜8塊裝，每塊約9.375g；深藍正式盒裝，可搭配熱水、保溫壺，也可加入雞湯、排骨湯或日常食材燉煮。'
   elif pid=='POST-JIAO-600':post['copy']='龜鹿膠為600g （1斤）／盒｜32塊裝，每塊約18.75g；淡紫色正式盒裝，可加入熱水化開，也可依料理方式搭配湯品。'
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
 data['catalogVersion']='current-six-approved-media-plus-seven-knowledge-20260820-v5'; data['updatedAt']='2026-08-20'; data['knowledgeProductCount']=7; data['approvedMediaProductCount']=6; data['publicTextAuthority']='public-product-master.json'; data['productImageVersion']='current-six-user-confirmed-product-images'; data['productIdentityReference']='products-v3-real-product-package-shape-proportion-only'; data['formalDmApprovalBatch']=formal.get('approval_batch') or 'current'
 source=data.setdefault('source',{}); source['role']='六項已有核准正式產品圖／DM的顧客媒體相容目錄；七項產品文字知識最高權威為 public-product-master.json，本目錄不得用舊固定產品數或舊用法覆蓋新版資料'
 rules=data.setdefault('specificationRules',{}); rules['drink30']='30cc產品正式名稱為龜鹿飲30cc玻璃罐；規格30cc／罐（小玻璃罐）；小玻璃裸罐、無貼紙、金色蓋；目前正式使用方式為每日 1–2 罐；不得改罐型、比例、稱瓶或回退舊用法。'; rules['tangkuai']='龜鹿湯塊文字規格為75g （2兩）／盒｜8塊裝，每塊約9.375g；顧客文字可顯示完整規格；產品主圖與DM維持正式原圖及主規格，不自行加字。'; rules['jiao']='龜鹿膠文字規格為600g （1斤）／盒｜32塊裝，每塊約18.75g；顧客文字可顯示完整規格；產品主圖與DM維持正式原圖及主規格，不自行加字。'; rules['qixuan']='柒玄茶・龜鹿調飲粉文字規格2g／小包；20g／包（10小包）；目前未核准正式產品實物原圖，不得AI自創包裝。'
 data['qixuanKnowledge']={'id':'qixuan-guilu-drink-powder','name':'柒玄茶・龜鹿調飲粉','specification':'2g／小包；20g／包（10小包）','ingredientsStatus':'目前公開權威資料尚未提供正式成分表，不自行推測或補寫','mediaStatus':'formal-product-image-pending','displayMode':'text-knowledge-only-until-formal-product-image-approved'}
 fp=data.setdefault('fulfillmentPolicy',{}); fp['scopeRule']='5～7個工作天交期只適用龜鹿飲30cc與180cc，不得套用其他產品'
 for product in data.get('products',[]):
  pid=product.get('id'); f=current.get(pid); o=official.get(pid)
  if o:
   spec=str(o.get('specification') or '').strip(); detail=str(o.get('detail_unit_approx') or '').strip()
   if spec:
    product['specification']=spec; product['size']=spec; product['spec']=spec
   if detail:product['detailUnitApprox']=detail
   if o.get('usage_primary'):product['usagePrimary']=o.get('usage_primary')
   if o.get('usage_timing'):product['usageTiming']=o.get('usage_timing')
   if pid=='guilu-drink-30' and product.get('usage'):product['usage'][0]=CURRENT_30_USAGE
   if pid=='guilu-drink-180' and product.get('usage'):product['usage'][0]='每日一包'
  if not f or f.get('status')!='approved_display':continue
  image=str(f.get('image') or ''); dm=str(f.get('dm') or '')
  if image.startswith('/images/'):
   product['image']=public_url(image,'current-product'); product['imageUrl']=product['image']; product['image_url']=product['image']
  if dm.startswith('/images/'):product['dmImage']=public_url(dm,'current-dm')
  product['officialOriginalImage']=SITE_BASE+'/'+PRODUCT_IDENTITY_BASE+{'guilu-gao':'guilu-gao.jpg','guilu-drink-30':'guilu-drink-30.jpg','guilu-drink-180':'guilu-drink-180.jpg','guilu-tangkuai':'guilu-tangkuai.jpg','guilu-jiao':'guilu-jiao.jpg','luerong-fen':'luerong-fen.jpg'}.get(pid,'')
  product['imagePolicy']='六項已有核准正式產品圖為顧客主視覺；products-v3只作實物身份與比例校正。'
 dm_policy=data.setdefault('dmPolicy',{}); dm_policy['currentDmStatus']='current-approved-valid-binary-separated-from-product-image'; dm_policy['legacyDmUse']='reference-only'; dm_policy['consumerDmMustBeReviewed']=True; dm_policy['consumerDmMustMatchCurrentSpecification']=True; dm_policy['productMainImageMustNotUseDm']=True; dm_policy['dmMustNotRedefineProductIdentity']=True; dm_policy['retiredInvalidPaths']=['images/dm-approved-v20260810/guilu-gao-100g.webp']
 return write_json_if_changed(path,data)

def sync_text(rel:str):
 path=ROOT/rel
 if not path.exists():return False
 old=path.read_text(encoding='utf-8'); new=replace_text(old)
 if new!=old:path.write_text(new,encoding='utf-8');return True
 return False

def validate_no_retired_customer_copy():
 current=['content/public-post-library.json','llms-full.txt','llms.txt','deploy-version.json','data.json','catalog-public.json','config/official-products.json','assets/data/official-products.json','public-product-master.json','product-master.json','ai-answers.json','content/visual-production-spec-current.json','content/ai-brand-control-v20260807.json']
 retired=['一天一次一小匙','早晚各一小匙','每日早上及下午各一小匙','建議白天飲用',*LEGACY_30_OUTPUTS,'龜鹿飲30cc玻璃瓶','30cc／瓶']
 for rel in current:
  path=ROOT/rel
  if not path.exists():continue
  value=path.read_text(encoding='utf-8')
  for phrase in retired:
   if phrase in value:raise SystemExit(f'{rel} 顧客／公開目前輸出仍含退役資料：{phrase}')
 official=official_by_id(); p30=official.get('guilu-drink-30') or {}
 if p30.get('usage_primary')!=CURRENT_30_USAGE:raise SystemExit(f'30cc 最新正式使用方式錯誤：{p30.get("usage_primary")}')
 for rel in ['content/public-post-library.json','catalog-public.json']:
  path=ROOT/rel
  if not path.exists():continue
  value=path.read_text(encoding='utf-8')
  for pid in ['guilu-tangkuai','guilu-jiao']:
   p=official.get(pid) or {}; spec=str(p.get('specification') or ''); detail=str(p.get('detail_unit_approx') or '')
   if spec and spec not in value:raise SystemExit(f'{rel} 缺少目前正式規格：{spec}')
   if detail and detail not in value:raise SystemExit(f'{rel} 缺少目前詳細約重：{detail}')
 ai=json.loads((ROOT/'content/ai-brand-control-v20260807.json').read_text(encoding='utf-8'))
 if ai.get('productAuthority',{}).get('source')!='public-product-master.json' or ai.get('productAuthority',{}).get('productCount')!=7:raise SystemExit('AI brand control 未綁定目前七產品公開權威')

changed=[]
for rel in ['content/public-post-library.json','content/public-content-policy.json','config/public-content-policy.json','content/post-bank-v6-manifest.json','data.json','geo-data.json','assets/data/official-products.json','content/visual-production-spec-current.json','content/ai-brand-control-v20260807.json','product-master.json']:
 if sync_json(rel):changed.append(rel)
if sync_catalog_current_media():changed.append('catalog-public.json')
for rel in ['llms-full.txt','llms.txt']:
 if sync_text(rel):changed.append(rel)
validate_no_retired_customer_copy(); print('current authority derived sync:', ', '.join(changed) if changed else 'already current')
