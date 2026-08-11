#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

REPLACEMENTS=[
 ('每日早上及下午各一小匙','一天一次一小匙'),
 ('龜鹿湯塊 75g／盒｜深藍盒｜8塊裝｜每塊約9.375g','龜鹿湯塊 75g／盒｜深藍盒｜8塊裝'),
 ('75g／盒｜深藍盒｜8塊裝｜每塊約9.375g','75g／盒｜深藍盒｜8塊裝'),
 ('75g／盒｜8塊裝｜每塊約9.375g','75g／盒｜8塊裝'),
 ('75g／盒，8塊裝、每塊約9.375g','75g／盒｜8塊裝'),
 ('75g／盒、8塊裝、每塊約9.375g','75g／盒｜8塊裝'),
 ('600g（1斤）／盒｜32塊裝｜每塊約18.75g','600g／盒｜32塊裝'),
 ('600g（1斤）／盒、32塊裝、每塊約18.75g','600g／盒｜32塊裝'),
 ('600g（1斤）／盒｜32塊裝','600g／盒｜32塊裝'),
 ('600g（1斤）／盒','600g／盒'),
 ('600g一斤裝','600g大盒'),
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

def sync_json(rel:str):
 path=ROOT/rel
 if not path.exists():return False
 original=json.loads(path.read_text(encoding='utf-8'))
 data=transform(original)
 if rel=='content/public-post-library.json':
  data['version']='2026-08-11-public-posts-current-authority'
  auth=data.setdefault('productAuthority',{})
  auth['source']='catalog-public.json'
  auth['imageAuthority']='images/products-v3/'
  auth['sixProductsSixSpecs']=True
  auth['soupBlock']='75g／盒｜深藍盒｜8塊裝'
  auth['guiluJiao']='600g／盒｜32塊裝｜淡紫色正式盒裝'
  auth['guardPolicy']='current-authority-no-legacy-copy-version-lock'
  for post in data.get('posts',[]):
   pid=post.get('id')
   if pid=='POST-SOUP-75':
    post['copy']='龜鹿湯塊為75g／盒｜8塊裝的深藍正式盒裝，可搭配熱水、保溫壺，也可加入雞湯、排骨湯或日常食材燉煮。'
   elif pid=='POST-JIAO-600':
    post['copy']='龜鹿膠為600g／盒｜32塊裝的淡紫色盒裝，可加入熱水化開，也可依料理方式搭配湯品。'
   if post.get('status')!='published' and post.get('image_status') in {'needs_generation','replace-required'}:
    post['regeneration_mode']='chatgpt_handoff'
   if post.get('status')!='published' and post.get('status')!='archived':
    post['owner_review_required']=True
    post['publish_allowed']=False
    post['auto_approve']=False
    post['auto_schedule']=False
    post['auto_publish']=False
 return write_json_if_changed(path,data)

def sync_catalog_current_media():
 path=ROOT/'catalog-public.json'
 if not path.exists():return False
 data=json.loads(path.read_text(encoding='utf-8'))
 data=transform(data)
 data['catalogVersion']='current-products-v3-approved-formal-media'
 data['formalDmApprovalBatch']='current-user-approved-media'
 rules=data.setdefault('specificationRules',{})
 rules['drink30']='30cc產品正式名稱為龜鹿飲30cc玻璃罐；規格30cc／罐（小玻璃罐）；小玻璃裸罐、無貼紙、無外盒、無外袋、金色蓋；實際罐體約直徑42mm、高51mm；不得改瓶型或放大成接近100g龜鹿膏罐；顧客DM必須先通過目前正式規格與產品外觀驗證，衝突時立即隔離。'
 by={p.get('id'):p for p in data.get('products',[])}
 p=by.get('guilu-drink-30')
 if p:
  p['dmImage']='https://ts15825868.github.io/xianjiawei/images/dm-approved-v20260810/guilu-drink-30cc.webp?v=current'
  p.pop('quarantinedDmImage',None)
  p['imagePolicy']='products-v3維持30cc小玻璃裸罐產品本體識別權威；目前使用者核准DM已通過規格文字與產品外觀驗證，可顧客展示；後續DM若衝突則隔離並回退products-v3。'
 return write_json_if_changed(path,data)

def sync_text(rel:str):
 path=ROOT/rel
 if not path.exists():return False
 old=path.read_text(encoding='utf-8'); new=replace_text(old)
 if rel=='llms-full.txt':
  new=new.replace('最後檢視：2026-08-09','最後檢視：2026-08-11').replace('最後更新：2026-08-09','最後更新：2026-08-11')
 if new!=old:path.write_text(new,encoding='utf-8');return True
 return False

def validate_no_retired_customer_copy():
 # 只檢查會直接成為顧客／公開內容的目前輸出，不掃描守門規則、歷史隔離說明、版本註記等政策文字。
 current=[
  'content/public-post-library.json','llms-full.txt','deploy-version.json','data.json','catalog-public.json',
  'config/official-products.json','assets/data/official-products.json'
 ]
 retired=['每日早上及下午各一小匙','75g／盒｜8塊裝｜每塊約9.375g','600g（1斤）／盒｜32塊裝｜每塊約18.75g','龜鹿飲30cc玻璃瓶','30cc／瓶']
 for rel in current:
  path=ROOT/rel
  if not path.exists():continue
  value=path.read_text(encoding='utf-8')
  for phrase in retired:
   if phrase in value:raise SystemExit(f'{rel} 顧客／公開目前輸出仍含退役資料：{phrase}')

changed=[]
for rel in ['content/public-post-library.json','content/public-content-policy.json','config/public-content-policy.json','content/post-bank-v6-manifest.json']:
 if sync_json(rel):changed.append(rel)
if sync_catalog_current_media():changed.append('catalog-public.json')
for rel in ['llms-full.txt']:
 if sync_text(rel):changed.append(rel)
validate_no_retired_customer_copy()
print('current authority derived sync:', ', '.join(changed) if changed else 'already current')
