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
 'guilu-jiao':'600g（1斤）／盒｜32塊裝',
 'luerong-fen':'75g／罐',
}
RETIRED_PUBLIC_FACTS=['一天一次一小匙','早晚各一小匙','每日早上及下午各一小匙','建議白天飲用','每日一罐','每日一包','龜鹿飲30cc玻璃瓶','30cc／瓶','30cc瓶裝']

def load(path):return json.loads((ROOT/path).read_text(encoding='utf-8'))
def text(path):return (ROOT/path).read_text(encoding='utf-8')
def req(ok,msg):
 if not ok:raise AssertionError(msg)

def validate_current_authorities():
 data=load('data.json'); catalog=load('catalog-public.json'); official=load('config/official-products.json'); public_official=load('assets/data/official-products.json'); visual=load('content/visual-production-spec-current.json'); formal=load('data/formal-media-authority-v20260810.json'); manifest=load('images/formal-display/manifest.json')
 data_by={p['id']:p for p in data['products']}; cat_by={p['id']:p for p in catalog['products']}; off_by={p['id']:p for p in official['products']}; pub_by={p['id']:p for p in public_official['products']}
 for collection,name in [(data_by,'data.json'),(cat_by,'catalog-public.json'),(off_by,'config/official-products.json'),(pub_by,'assets/data/official-products.json')]:req(set(collection)==set(CURRENT_SPECS),f'{name} 必須剛好六項正式產品')
 req(official.get('authority')=='user-confirmed-current' and public_official.get('authority')=='user-confirmed-current','正式產品母本必須是目前使用者確認權威')
 for pid,spec in CURRENT_SPECS.items():
  req(data_by[pid].get('size')==spec,f'data.json {pid} 規格不同步')
  req(cat_by[pid].get('size')==spec,f'catalog {pid} 規格不同步')
  req(off_by[pid].get('spec')==spec,f'official master {pid} 規格不同步')
  req(pub_by[pid].get('specification')==spec,f'public official master {pid} 規格不同步')
 req(data_by['guilu-gao'].get('usage',[None])[0]=='食用時間與份量可依個人使用習慣與作息安排','data.json 龜鹿膏目前用法未同步')
 req(cat_by['guilu-gao'].get('usage',[None])[0]=='食用時間與份量可依個人使用習慣與作息安排','catalog 龜鹿膏目前用法未同步')
 req(off_by['guilu-tangkuai'].get('detail_unit_approx')=='每塊約9.375g','湯塊詳細約重不同步')
 req(off_by['guilu-jiao'].get('detail_unit_approx')=='每塊約18.75g','龜鹿膠詳細約重不同步')
 req(official.get('visual_spec')=='content/visual-production-spec-current.json','official master 未指向 current visual authority')
 req(public_official.get('visual_spec')=='content/visual-production-spec-current.json','public official master 未指向 current visual authority')
 req(visual.get('official_specs')==[f"{off_by[pid]['name']} {CURRENT_SPECS[pid]}" for pid in CURRENT_SPECS],'current visual 六項主規格不同步')
 req(visual.get('products',{}).get('guilu-gao',{}).get('usage_primary')=='食用時間與份量可依個人使用習慣與作息安排','current visual 龜鹿膏用法不同步')
 req(visual.get('copy_image_match',{}).get('review_items')==16,'current visual 必須維持16項審核')
 post_policy=visual.get('post_media_policy') or {}
 req(post_policy.get('regenerate_only_if_no_approved_match') is True,'current visual 必須維持真正缺圖才生成')
 req(post_policy.get('matching_source_without_binary')=='needs_binary_sync','有合格來源但binary未同步時必須維持needs_binary_sync')
 req(post_policy.get('generated_media_returns_to')=='pending_review','生成或換圖後必須回待審核')
 req(int(post_policy.get('review_items_after_change') or 0)==16,'生成或換圖後必須重新16項審核')
 req(formal.get('runtime')==manifest.get('runtime') and formal.get('approval_batch')==manifest.get('approval_batch'),'formal authority與manifest不同步')
 trial=str((formal.get('trial') or {}).get('image') or (formal.get('trial') or {}).get('path') or '')
 req(trial.endswith('/images/trial/trial-poster-small-boss-official-v20260814.jpg'),'目前試喝權威不是2026-08-14核准海報')
 post_catalog=str(post_policy.get('current_catalog') or formal.get('post_catalog') or '').lstrip('/')
 req(post_catalog and (ROOT/post_catalog).is_file(),'目前貼文素材catalog不存在')
 post=load(post_catalog)
 if formal.get('post_approval_batch'):req(post.get('approval_batch')==formal.get('post_approval_batch'),'formal authority 與目前貼文素材核准批次不同步')
 req(int(post.get('candidate_count') or post.get('unique_image_count') or 0)>0,'目前使用者ZIP素材權威沒有候選圖')
 sync_status=post.get('binary_sync',{}).get('status')
 req(sync_status in {'pending','ready','synced'},f'目前ZIP二進位狀態不支援：{sync_status}')
 if sync_status=='synced':req(int(post.get('binary_sync',{}).get('publishable_count') or 0)>0,'ZIP標記synced但沒有可發布情境圖')
 for rel in ['data.json','catalog-public.json','config/official-products.json','assets/data/official-products.json','content/visual-production-spec-current.json']:
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

def validate_retired_writebacks_removed():
 retired=[
  '.github/workflows/install-trial-poster-v9.yml','.github/workflows/install-trial-poster-v10.yml','.github/workflows/install-trial-poster-v11.yml','.github/workflows/install-trial-poster-v12.yml','.github/workflows/install-trial-poster-v14.yml',
  '.github/workflows/audit-square-trial-assets-v12.yml','.github/workflows/bump-site-entry-cache-v20260812.yml','tools/bump_site_entry_cache_v20260812.py',
  '.github/workflows/sync-formal-media-v2.yml','tools/sync-formal-media.py'
 ]
 for rel in retired:req(not (ROOT/rel).exists(),f'退役舊版寫回工具仍存在：{rel}')

def main():
 subprocess.run([sys.executable,str(ROOT/'tools/validate-site-production-release-v20260809.py')],check=True)
 validate_current_authorities(); validate_posts(); validate_retired_writebacks_removed()
 print('PASS current site release: current product/data/catalog/visual/formal/post authorities and review safety align; retired trial/cache/media write-back tools are removed; no old-copy/version locks.')

if __name__=='__main__':main()
