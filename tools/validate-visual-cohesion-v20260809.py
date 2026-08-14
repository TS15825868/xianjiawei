#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
AUTH=ROOT/'content/visual-cohesion-authority-v20260809.json'
PAGES=['index.html','products.html','dm.html','choose.html','combo.html','guide.html','recipes.html','faq.html','brand.html','contact.html','trial.html','product-guilu-gao.html','product-guilu-drink-30cc.html','product-guilu-drink-180cc.html','product-guilu-tangkuai.html','product-guilu-jiao.html','product-luerong-fen.html']
PRODUCT_DISPLAY_PAGES=['index.html','products.html','choose.html','combo.html','guide.html','recipes.html','faq.html','trial.html','product-guilu-gao.html','product-guilu-drink-30cc.html','product-guilu-drink-180cc.html','product-guilu-tangkuai.html','product-guilu-jiao.html','product-luerong-fen.html']
DETAIL_PAGES=['product-guilu-gao.html','product-guilu-drink-30cc.html','product-guilu-drink-180cc.html','product-guilu-tangkuai.html','product-guilu-jiao.html','product-luerong-fen.html']

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def read(path):return (ROOT/path).read_text(encoding='utf-8')
def load(path):return json.loads(read(path))
def local(value):return str(value or '').split('?',1)[0].lstrip('/')

def main():
    req(AUTH.exists(),'缺少官網視覺正式母本')
    authority=load('content/visual-cohesion-authority-v20260809.json')
    website=authority.get('website') or {}
    req(website.get('image_fit')=='contain','官網正式圖片政策不是contain')
    req(website.get('no_crop') is True and website.get('no_stretch') is True,'官網未鎖禁止裁切/拉伸')
    req(website.get('product_identity_source')=='images/products-v3/','products-v3身份權威不同步')
    req(website.get('customer_product_source')=='images/customer-display-v20260812/','顧客產品圖來源不同步')
    req(website.get('detailed_dm_source')=='images/dm-final/','詳細DM來源不同步')
    req(website.get('trial_source')=='images/trial/trial-poster-small-boss-official-v20260814.jpg','試喝海報來源不同步')

    css=(ROOT/'site-formal-v20260809.css').read_text(encoding='utf-8').replace(' ','').lower()
    req('object-fit:contain' in css,'正式CSS沒有contain硬規則')
    req('home-brand-signature' in css,'首頁缺少不含產品拼貼的品牌識別面板樣式')

    source='\n'.join(read(p) for p in PAGES)
    req('images/products-v2/' not in source,'顧客頁仍引用products-v2淘汰產品素材')
    req('images/brand/line-oa/' not in source,'官網顧客頁混用了LINE OA專用角色圖')
    for token in ['generated-v20260808-priority1','generated-v20260808-preflight/guide-use','generated-v20260808-preflight/choose-products','generated-v20260808-preflight/choose-by-habit']:
        req(token not in source,f'官網顧客頁仍引用舊候選/拼貼素材：{token}')

    site_authority=read('site-product-data-authority.js')
    req('images/products-v3/' in site_authority,'官網缺少products-v3實物身份參考')
    req('images/customer-display-v20260812/' in site_authority,'官網缺少目前顧客產品顯示層')
    req("officialImagePolicy:'products-v3-real-product-identity-reference-only'" in site_authority,'產品身份層沒有鎖products-v3參考角色')
    req("imagePolicy:'formal-product-image-only-contain-no-crop-no-dm-substitution'" in site_authority,'顧客產品圖沒有鎖contain/no-crop/no-DM替代')
    req("normalized.usage=['食用時間可依個人使用習慣與作息時間安排'" in site_authority,'動態龜鹿膏用法未同步目前正式句')

    index=read('index.html'); brand=read('brand.html')
    legacy_brand='images/brand/approved-v405/home-brand.webp'
    req(legacy_brand not in index,'首頁不得再使用含多產品的舊情境合成圖')
    req(legacy_brand not in brand,'品牌故事頁不得再使用含多產品的舊情境合成圖')
    req('home-brand-signature' in index and 'images/logo.png' in index,'首頁應使用乾淨品牌識別面板')
    req('images/logo.png' in brand and 'primaryImageOfPage' in brand,'品牌故事結構化主圖必須回到品牌Logo')

    formal=load('data/formal-media-authority-v20260810.json')
    formal_by={p['id']:p for p in formal.get('products') or []}
    dm=read('dm.html')
    req((dm.count('data-product-intro="1"'))>=6,'DM頁六項查看介紹沒有全部走統一Modal')
    for item in formal_by.values():
        dm_path=local(item.get('dm'))
        req(dm_path.startswith('images/dm-final/'),'目前詳細DM必須使用dm-final高解析母檔')
        req(dm_path in dm,f'DM頁缺少目前核准詳細DM：{item.get("id")}')
    for page in PRODUCT_DISPLAY_PAGES:
        html=read(page)
        req('images/dm-final/' not in html,f'{page}一般產品/顧客版位不得直接把詳細DM當主圖')

    trial=read('trial.html')
    req('images/trial/trial-poster-small-boss-official-v20260814.jpg' in trial,'試喝頁必須使用8/14正式試喝海報')
    req('images/customer-display-v20260812/guilu-drink-30cc.avif' in trial,'試喝頁30cc產品卡必須使用目前顧客產品圖')
    req('images/customer-display-v20260812/guilu-drink-180cc-product.jpg' in trial,'試喝頁180cc產品卡必須使用目前顧客產品圖')
    req('object-fit:contain' in trial.replace(' ',''),'試喝頁產品與海報必須contain，不得裁切')
    req('trial.webp' not in trial and 'trial-clean-v4.svg' not in trial,'試喝頁不得回退舊試喝素材')

    expected_customer={
      'product-guilu-gao.html':'images/customer-display-v20260812/guilu-gao.avif',
      'product-guilu-drink-30cc.html':'images/customer-display-v20260812/guilu-drink-30cc.avif',
      'product-guilu-drink-180cc.html':'images/customer-display-v20260812/guilu-drink-180cc-product.jpg',
      'product-guilu-tangkuai.html':'images/customer-display-v20260812/guilu-tangkuai.avif',
      'product-guilu-jiao.html':'images/customer-display-v20260812/guilu-jiao.avif',
      'product-luerong-fen.html':'images/customer-display-v20260812/luerong-fen.avif',
    }
    for page,path in expected_customer.items():
        html=read(page)
        req(path in html,f'{page}沒有目前核准顧客產品圖')
        req('images/products-v2/' not in html and 'images/dm-final/' not in html,f'{page}產品主圖角色污染')

    safety=read('site-product-image-safety.js')
    req('isDetailedDm' in safety,'產品圖片安全層未區分詳細DM')
    req("objectFit','contain" in safety or "objectFit='contain'" in safety,'產品圖片安全層缺contain')
    retirement=read('site-public-image-retirement-v20260812.js')
    req('customer-display-v20260812' in retirement,'舊圖退役層沒有目前顧客產品圖')
    modal=read('site-media-modal-final-v20260814.js')
    req('trial-poster-small-boss-official-v20260814.jpg' in modal,'Modal媒體層沒有目前試喝海報')
    req('02_guilu-drink-30cc-dm-official-v20260814.jpg' in modal,'Modal媒體層沒有目前30cc詳細DM')

    print(f'PASS website visual cohesion: {len(PAGES)} customer pages preserve contain/no-crop/no-stretch; customer-display product images, dm-final detailed DMs, 8/14 trial poster and products-v3 identity remain separate roles; no LINE-only or products-v2 visual leakage.')

if __name__=='__main__': main()
