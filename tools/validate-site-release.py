#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CURRENT_SPECS={
 'guilu-gao':'100g／罐',
 'guilu-drink-30':'30cc／罐（小玻璃罐）',
 'guilu-drink-180':'180cc／包（鋁袋）',
 'guilu-tangkuai':'75g／盒｜8塊裝',
 'guilu-jiao':'600g／盒｜32塊裝',
 'luerong-fen':'75g／罐',
}
RETIRED_PUBLIC_FACTS=['每日早上及下午各一小匙','75g／盒｜8塊裝｜每塊約9.375g','600g（1斤）／盒｜32塊裝｜每塊約18.75g','30cc／瓶','龜鹿飲30cc玻璃瓶']

def load(path):return json.loads((ROOT/path).read_text(encoding='utf-8'))
def text(path):return (ROOT/path).read_text(encoding='utf-8')
def req(ok,msg):
 if not ok:raise AssertionError(msg)

def validate_current_authorities():
 data=load('data.json'); catalog=load('catalog-public.json'); official=load('config/official-products.json'); public_official=load('assets/data/official-products.json'); visual=load('content/visual-production-spec-current.json'); formal=load('data/formal-media-authority-v20260810.json')
 data_by={p['id']:p for p in data['products']}; cat_by={p['id']:p for p in catalog['products']}; off_by={p['id']:p for p in official['products']}; pub_by={p['id']:p for p in public_official['products']}
 for collection,name in [(data_by,'data.json'),(cat_by,'catalog-public.json'),(off_by,'config/official-products.json'),(pub_by,'assets/data/official-products.json')]:req(set(collection)==set(CURRENT_SPECS),f'{name} 必須剛好六項正式產品')
 for pid,spec in CURRENT_SPECS.items():
  req(data_by[pid].get('size')==spec,f'data.json {pid} 規格不同步')
  req(cat_by[pid].get('size')==spec,f'catalog {pid} 規格不同步')
  req(off_by[pid].get('spec')==spec,f'official master {pid} 規格不同步')
  req(pub_by[pid].get('specification')==spec,f'public official master {pid} 規格不同步')
 req(data_by['guilu-gao'].get('usage',[None])[0]=='每日早上及下午各一小匙','data.json 龜鹿膏用法未同步')
 req(cat_by['guilu-gao'].get('usage',[None])[0]=='每日早上及下午各一小匙','catalog 龜鹿膏用法未同步')
 req(official.get('visual_spec')=='content/visual-production-spec-current.json','official master 未指向 current visual authority')
 req(public_official.get('visual_spec')=='content/visual-production-spec-current.json','public official master 未指向 current visual authority')
 req(visual.get('official_specs')==[f"{off_by[pid]['name']} {CURRENT_SPECS[pid]}" for pid in CURRENT_SPECS],'current visual 六項規格不同步')
 req(visual.get('copy_image_match',{}).get('review_items')==16,'current visual 必須維持16項審核')
 req(visual.get('post_media_policy',{}).get('regenerate_only_if_no_approved_match') is True,'current visual 必須維持真正缺圖才生成')
 post_catalog=str(formal.get('post_catalog') or '').lstrip('/')
 req(post_catalog and (ROOT/post_catalog).is_file(),'formal authority 缺少目前貼文素材目錄')
 post=load(post_catalog)
 req(post.get('approval_batch')==formal.get('post_approval_batch'),'formal authority 與目前貼文素材核准批次不同步')
 req(post.get('priority')=='user_zip_approved' and int(post.get('candidate_count') or 0)>0,'目前使用者ZIP素材權威不同步')
 req(post.get('binary_sync',{}).get('status') in {'pending','ready'},'目前ZIP缺少二進位狀態')
 for rel in ['data.json','catalog-public.json','config/official-products.json','assets/data/official-products.json','content/visual-production-spec-current.json','data/formal-media-authority-v20260810.json']:
  value=text(rel)
  for phrase in RETIRED_PUBLIC_FACTS:req(phrase not in value,f'{rel} 仍含退役正式資料：{phrase}')

def validate_posts():
 doc=load('content/public-post-library.json'); posts=doc.get('posts',[])
 req(posts and doc.get('counts',{}).get('total')==len(posts),'公開貼文母庫總數不同步')
 ids=[str(p.get('id') or '') for p in posts]; req(all(ids) and len(ids)==len(set(ids)),'公開貼文ID不得空白或重複')
 for p in posts:
  body=json.dumps(p,ensure_ascii=False); status=str(p.get('status') or '')
  for phrase in RETIRED_PUBLIC_FACTS:req(phrase not in body,f"貼文 {p.get('id')} 仍含退役正式資料：{phrase}")
  if status=='published':
   req(p.get('prevent_republish') is True and p.get('do_not_republish') is True,f"已發布貼文未鎖定：{p.get('id')}")
   req(p.get('publish_allowed') is False and p.get('schedule_enabled') is False,f"已發布貼文仍可重發：{p.get('id')}")
  elif status!='archived':
   req(status in {'pending_review','draft','rejected'},f"未知貼文狀態：{p.get('id')}")
   req(p.get('owner_review_required',doc.get('publishing_defaults',{}).get('owner_review_required')) is True,f"待審貼文未要求人工審核：{p.get('id')}")
   req(p.get('publish_allowed',doc.get('publishing_defaults',{}).get('publish_allowed')) is False,f"待審貼文不應直接發布：{p.get('id')}")
  if p.get('image_status') in {'needs_generation','replace-required'}:
   req(p.get('regeneration_mode')=='chatgpt_handoff',f"需換圖貼文未走ChatGPT回填：{p.get('id')}")

def main():
 subprocess.run([sys.executable,str(ROOT/'tools/validate-site-production-release-v20260809.py')],check=True)
 validate_current_authorities(); validate_posts()
 print('PASS current site release: current product/data/catalog/visual/post-media authorities, public post review safety and website production release all align; no legacy copy/version/ZIP-count locks.')

if __name__=='__main__':main()
