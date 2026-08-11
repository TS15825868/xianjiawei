#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
LIB=ROOT/'content/public-post-library.json'
ASSETS=ROOT/'content/public-asset-library.json'
LATEST_ZIP=ROOT/'data/post-library-userzip3-v20260811.json'
RUNTIME_VALIDATOR=ROOT/'tools/validate-post-bank-runtime-current.mjs'
ALLOWED_IMAGE_STATES={
    'approved-published-locked','candidate-review-required','official-reference-pending-layout-review','needs_generation'
}
PRODUCTS={
    'guilu-gao':('龜鹿膏','guilu-gao'),
    'guilu-drink-30':('龜鹿飲30cc','guilu-drink-30'),
    'guilu-drink-180':('龜鹿飲180cc','guilu-drink-180'),
    'guilu-tangkuai':('龜鹿湯塊','guilu-tangkuai'),
    'guilu-jiao':('龜鹿膠','guilu-jiao'),
    'luerong-fen':('鹿茸粉','luerong-fen'),
}

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def validate_core_library():
    data=json.loads(LIB.read_text(encoding='utf-8'))
    posts=data.get('posts') or []
    req(posts,'公開核心母本沒有貼文')
    ids=set()
    for p in posts:
        pid=str(p.get('id') or '')
        req(pid and pid not in ids,f'貼文ID缺失或重複：{pid}')
        ids.add(pid)
        status=str(p.get('image_status') or '')
        req(status in ALLOWED_IMAGE_STATES,f'{pid} 使用未知image_status：{status}')
        image=str(p.get('image_url') or '')
        prompt=str(p.get('image_prompt') or '')
        reason=str(p.get('image_review_reason') or '')
        copy=' '.join(str(p.get(k) or '') for k in ('title','copy','headline','category'))
        refs=p.get('product_refs') or []

        if status=='needs_generation':
            req(not image,f'{pid} 已判需重生成但仍保留舊image_url')
            req(bool(prompt),f'{pid} 需重生成但沒有image_prompt')
            req(bool(reason),f'{pid} 需重生成但沒有退件原因')
            req(p.get('publish_allowed') is not True,f'{pid} 需重生成卻允許發布')
            req(p.get('schedule_enabled') is not True,f'{pid} 需重生成卻允許排程')
        elif status=='candidate-review-required':
            req(bool(image),f'{pid} 候選待審核卻沒有圖片')
            req(bool(prompt),f'{pid} 候選待審核卻沒有情境prompt')
            req(bool(reason),f'{pid} 候選待審核卻沒有審核理由')
            req(p.get('publish_allowed') is not True,f'{pid} 候選待審核不得直接發布')
        elif status=='official-reference-pending-layout-review':
            req(bool(image),f'{pid} 正式單品候選沒有產品原圖')
            req('/images/products-v3/' in image,f'{pid} 正式單品候選未使用products-v3')
            matched=[(ref,marker) for ref,(name,marker) in PRODUCTS.items() if name.lower() in copy.lower()]
            if len(matched)==1:
                ref,marker=matched[0]
                req(marker in image,f'{pid} 文案產品與正式原圖不一致：應為{ref}')
        elif status=='approved-published-locked':
            req(bool(image),f'{pid} 已發布鎖定卻沒有圖片')
            req(p.get('do_not_republish') is True or p.get('prevent_republish') is True,f'{pid} 已發布貼文未設定防重發')

        if image:
            req('products-v2' not in image and '/dm-final/' not in image,f'{pid} 圖片仍引用舊產品圖／舊DM')
            req('dm-approved-v20260810/guilu-drink-30cc.webp' not in image,f'{pid} 不得使用內嵌30cc／瓶舊字樣的隔離DM')
        joined=f'{copy} {prompt} {image}'
        req(not re.search(r'30\s*cc.{0,40}(玻璃瓶|瓶裝|[／/]\s*瓶)',joined,re.I),f'{pid} 又出現30cc瓶型舊稱')
        if '龜鹿湯塊' in joined:
            req(not re.search(r'龜鹿湯塊.{0,80}(300\s*g|600\s*g)',joined,re.I),f'{pid} 龜鹿湯塊又出現非75g舊規格')

        if len(refs)>1 and status!='needs_generation':
            policy=str(p.get('image_policy') or '')+' '+prompt+' '+reason
            req('不得' in policy and ('等高' in policy or '相對' in policy or '尺寸' in policy),f'{pid} 多產品候選缺少相對尺寸安全說明')
    return len(posts)

def validate_current_authorities():
    assets=json.loads(ASSETS.read_text(encoding='utf-8'))
    req(assets.get('policy',{}).get('officialProductImageSource')=='images/products-v3/','公開資產庫產品原圖權威不是products-v3')
    req(assets.get('policy',{}).get('ownerReviewRequiredBeforePublish') is True,'公開資產庫缺少人工審核門')
    req(len(assets.get('policy',{}).get('reviewDimensions') or [])==16,'公開資產庫必須維持16項正式審核')

    latest=json.loads(LATEST_ZIP.read_text(encoding='utf-8'))
    req(latest.get('source')=='新貼文的圖(3).zip','目前最新使用者ZIP來源不同步')
    req(latest.get('original_file_count')==21 and latest.get('unique_image_count')==20,'最新使用者ZIP應記錄21檔／20張唯一圖')
    req(latest.get('priority')=='user_zip_approved_after_semantic_match','ZIP圖片必須先語意匹配才能使用')
    req(latest.get('binary_sync',{}).get('status') in {'pending','ready'},'最新ZIP binary狀態不可判斷')
    req('16' in str(latest.get('review_rule') or '') and 'pending_review' in str(latest.get('review_rule') or ''),'ZIP換圖／生成後必須回待審核並重跑16項')

    current_guard=(ROOT/'publishing-center-data-current-authority-guard.js').read_text(encoding='utf-8')
    req('public-asset-library.json' in current_guard,'目前500篇守門沒有跟公開資產權威連動')
    req('current-authority-regeneration-required' in current_guard,'退役資產沒有回安全重生成狀態')
    req('LINE OA' in current_guard or 'line-oa' in current_guard.lower(),'目前守門缺少LINE OA角色素材分流')

def main():
    core_count=validate_core_library()
    validate_current_authorities()
    req(RUNTIME_VALIDATOR.exists(),'缺少runtime500能力驗收工具')
    subprocess.run(['node',str(RUNTIME_VALIDATOR)],cwd=ROOT,check=True)
    print(f'PASS publishing content match: {core_count} core posts + assembled runtime500 validated against current product, asset, ZIP, copy-image and review capabilities; no historical layer/version/count gate.')

if __name__=='__main__': main()
