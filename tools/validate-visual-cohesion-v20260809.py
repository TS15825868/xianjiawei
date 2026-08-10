#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
AUTH=ROOT/'content/visual-cohesion-authority-v20260809.json'
PAGES=['index.html','products.html','dm.html','choose.html','combo.html','guide.html','recipes.html','faq.html','brand.html','contact.html','trial.html','product-guilu-gao.html','product-guilu-drink-30cc.html','product-guilu-drink-180cc.html','product-guilu-tangkuai.html','product-guilu-jiao.html','product-luerong-fen.html']

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def main():
    req(AUTH.exists(),'缺少官網視覺正式母本')
    authority=json.loads(AUTH.read_text(encoding='utf-8'))
    website=authority.get('website') or {}
    req(website.get('image_fit')=='contain','官網正式圖片政策不是contain')
    req(website.get('no_crop') is True and website.get('no_stretch') is True,'官網未鎖禁止裁切/拉伸')

    css=(ROOT/'site-formal-v20260809.css').read_text(encoding='utf-8').replace(' ','').lower()
    req('object-fit:contain' in css,'正式CSS沒有contain硬規則')
    req('home-brand-signature' in css,'首頁缺少不含產品拼貼的品牌識別面板樣式')

    source='\n'.join((ROOT/p).read_text(encoding='utf-8') for p in PAGES)
    for token in ['images/products-v2/','images/dm-final/']:
        req(token not in source,f'顧客頁仍引用淘汰產品素材：{token}')
    req('images/brand/line-oa/' not in source,'官網顧客頁混用了LINE OA專用角色圖')
    for token in ['generated-v20260808-priority1','generated-v20260808-preflight/guide-use','generated-v20260808-preflight/choose-products','generated-v20260808-preflight/choose-by-habit']:
        req(token not in source,f'官網顧客頁仍引用舊候選/拼貼素材：{token}')

    site_authority=(ROOT/'site-product-data-authority.js').read_text(encoding='utf-8')
    req('images/products-v3/' in site_authority,'官網缺少products-v3產品本體原圖權威')
    req('images/products-v4-final/' in site_authority,'官網缺少核准顧客顯示層')
    req("officialImagePolicy:'products-v3-authority-original-no-redraw'" in site_authority,'顧客顯示層沒有保留products-v3禁止重畫權威')
    req('customer-display-v4-final-contain-no-crop' in site_authority,'顧客顯示層沒有鎖定contain/no-crop')

    index=(ROOT/'index.html').read_text(encoding='utf-8')
    brand=(ROOT/'brand.html').read_text(encoding='utf-8')
    legacy_brand='images/brand/approved-v405/home-brand.webp'
    req(legacy_brand not in index,'首頁不得再使用含多產品的舊情境合成圖')
    req(legacy_brand not in brand,'品牌故事頁不得再使用含多產品的舊情境合成圖')
    req('home-brand-signature' in index and 'images/logo.png' in index,'首頁應使用乾淨品牌識別面板，不使用可能失真的產品情境圖')
    req('images/logo.png' in brand,'品牌故事頁應使用乾淨品牌識別，不使用舊產品合成圖')
    req('images/logo.png' in brand and 'primaryImageOfPage' in brand,'品牌故事結構化主圖必須回到品牌Logo')

    trial=(ROOT/'trial.html').read_text(encoding='utf-8')
    req('guilu-drink-trial-final-20260808-web.svg' not in trial,'試喝頁不得回退到舊價格／活動歷史圖')
    trial30=('images/products-v3/guilu-drink-30.jpg' in trial or 'images/products-v4-final/guilu-drink-30.svg' in trial)
    trial180=('images/products-v3/guilu-drink-180.jpg' in trial or 'images/products-v4-final/guilu-drink-180.svg' in trial)
    req(trial30,'試喝頁主視覺必須使用30cc正式原圖或核准顧客顯示層')
    req(trial180,'試喝頁必須另列180cc正式原圖或核准顧客顯示層')
    if 'images/products-v4-final/' in trial:
        req('site-product-data-authority.js' in trial,'試喝頁使用顧客顯示層時必須載入products-v3正式原圖權威')
    req('object-fit:contain' in trial.replace(' ',''),'試喝頁產品圖必須contain，不得裁切')

    for page in ['products.html','dm.html','trial.html','product-guilu-gao.html','product-guilu-drink-30cc.html','product-guilu-drink-180cc.html','product-guilu-tangkuai.html','product-guilu-jiao.html','product-luerong-fen.html']:
        html=(ROOT/page).read_text(encoding='utf-8')
        req('images/products-v2/' not in html and 'images/dm-final/' not in html,f'{page}不得使用舊產品圖')

    print(f'PASS website visual cohesion: {len(PAGES)} customer pages use contain/no-crop rules; homepage and brand story avoid unsafe product composites; products-v3 remains original authority and approved customer display is allowed without stale-version blocking.')

if __name__=='__main__': main()
