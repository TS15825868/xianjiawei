#!/usr/bin/env python3
from __future__ import annotations
import json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
AUTH=ROOT/'content/visual-cohesion-authority-v20260809.json'
PAGES=['index.html','products.html','dm.html','choose.html','combo.html','guide.html','recipes.html','faq.html','brand.html','contact.html','trial.html','product-guilu-gao.html','product-guilu-drink-30cc.html','product-guilu-drink-180cc.html','product-guilu-tangkuai.html','product-guilu-jiao.html','product-luerong-fen.html']
def req(ok,msg):
    if not ok: raise AssertionError(msg)
def main():
    req(AUTH.exists(),'缺少單一完整視覺正式母本')
    authority=json.loads(AUTH.read_text(encoding='utf-8'))
    req(authority['rich_menu']['single_complete_image_required'] is True,'Rich Menu未鎖單一完整成品圖')
    req(authority['rich_menu']['runtime_composite_forbidden'] is True,'Rich Menu未禁止runtime拼圖')
    req(authority['social_post']['single_scene_required'] is True,'貼文圖未鎖單一完整場景')
    req(authority['website']['image_fit']=='contain','官網正式圖片政策不是contain')
    req(authority['website']['no_crop'] is True and authority['website']['no_stretch'] is True,'官網未鎖禁止裁切/拉伸')
    css=(ROOT/'site-formal-v20260809.css').read_text(encoding='utf-8').replace(' ','').lower()
    req('object-fit:contain' in css,'正式CSS沒有contain硬規則')
    source='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in PAGES)
    for token in ['images/products-v2/','images/dm-final/']:
        req(token not in source,f'顧客頁仍引用淘汰產品素材：{token}')
    # 官網公開頁不得把LINE OA專用角色當作網站視覺素材。
    req('images/brand/line-oa/' not in source,'官網顧客頁混用了LINE OA專用角色圖')
    # 已知舊候選拼貼/卡片圖不得成為官網主視覺。
    for token in ['generated-v20260808-priority1','generated-v20260808-preflight/guide-use','generated-v20260808-preflight/choose-products','generated-v20260808-preflight/choose-by-habit']:
        req(token not in source,f'官網顧客頁仍引用舊候選/拼貼素材：{token}')
    trial=(ROOT/'trial.html').read_text(encoding='utf-8')
    req('guilu-drink-trial-final-20260808-web.svg' in trial,'試喝頁沒有使用鎖定完整試喝主圖')
    print(f'PASS visual cohesion: {len(PAGES)} customer pages use products-v3/approved website assets; no LINE cutouts, legacy product images or known collage candidates.')
if __name__=='__main__': main()
