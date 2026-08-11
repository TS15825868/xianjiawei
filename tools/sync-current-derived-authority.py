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
 text=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
 old=path.read_text(encoding='utf-8')
 if text!=old:path.write_text(text,encoding='utf-8');return True
 return False

def sync_text(rel:str):
 path=ROOT/rel
 if not path.exists():return False
 old=path.read_text(encoding='utf-8'); new=replace_text(old)
 if rel=='llms-full.txt':
  new=new.replace('最後檢視：2026-08-09','最後檢視：2026-08-11').replace('最後更新：2026-08-09','最後更新：2026-08-11')
 if new!=old:path.write_text(new,encoding='utf-8');return True
 return False

def validate_no_retired_current_copy():
 current=[
  'content/public-post-library.json','llms-full.txt','deploy-version.json','data.json','catalog-public.json',
  'config/official-products.json','assets/data/official-products.json','content/visual-production-spec-current.json'
 ]
 retired=['每日早上及下午各一小匙','75g／盒｜8塊裝｜每塊約9.375g','600g（1斤）／盒｜32塊裝｜每塊約18.75g','龜鹿飲30cc玻璃瓶','30cc／瓶']
 for rel in current:
  path=ROOT/rel
  if not path.exists():continue
  value=path.read_text(encoding='utf-8')
  for phrase in retired:
   if phrase in value:raise SystemExit(f'{rel} 仍含退役目前資料：{phrase}')

changed=[]
for rel in ['content/public-post-library.json','content/public-content-policy.json','config/public-content-policy.json','content/post-bank-v6-manifest.json']:
 if sync_json(rel):changed.append(rel)
for rel in ['llms-full.txt']:
 if sync_text(rel):changed.append(rel)
validate_no_retired_current_copy()
print('current authority derived sync:', ', '.join(changed) if changed else 'already current')
