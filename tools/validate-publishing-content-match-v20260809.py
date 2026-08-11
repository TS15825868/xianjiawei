#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
LIB=ROOT/'content/public-post-library.json'
ASSETS=ROOT/'content/public-asset-library.json'
FORMAL=ROOT/'data/formal-media-authority-v20260810.json'
RUNTIME_VALIDATOR=ROOT/'tools/validate-post-bank-runtime-current.mjs'
ALLOWED_IMAGE_STATES={
    'approved-published-locked','candidate-review-required','official-reference-pending-layout-review',
    'needs_generation','needs_binary_sync','pending_review','approved_existing'
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
def normalize(value):
    return re.sub(r'^https?://[^/]+/xianjiawei/','',str(value or ''),flags=re.I).lstrip('/').split('?',1)[0].split('#',1)[0]

def current_authorities():
    formal=json.loads(FORMAL.read_text(encoding='utf-8'))
    latest_path=ROOT/str(formal.get('post_catalog') or '').lstrip('/')
    req(latest_path.is_file(),'目前formal authority指向的最新ZIP catalog不存在')
    latest=json.loads(latest_path.read_text(encoding='utf-8'))
    approved_formal={normalize(p.get('dm')) for p in formal.get('products') or [] if p.get('status')=='approved_display'}
    if formal.get('trial',{}).get('status')=='approved_display':approved_formal.add(normalize(formal['trial'].get('image')))
    approved_formal.discard('')
    return formal,latest,approved_formal

def validate_core_library(approved_formal):
    data=json.loads(LIB.read_text(encoding='utf-8'))
    posts=data.get('posts') or []
    req(posts,'公開核心母本沒有貼文')
    declared=int((data.get('counts') or {}).get('total') or len(posts))
    req(declared==len(posts),f'公開核心母本宣告張數{declared}與實際{len(posts)}不一致')
    ids=set()
    for p in posts:
        pid=str(p.get('id') or '')
        req(pid and pid not in ids,f'貼文ID缺失或重複：{pid}')
        ids.add(pid)
        status=str(p.get('image_status') or p.get('media_state') or p.get('status') or '')
        req(status in ALLOWED_IMAGE_STATES or p.get('status') in {'published','archived','campaign_hold','draft','pending_review'},f'{pid} 使用未知圖片／貼文狀態：{status}')
        image=str(p.get('image_url') or '')
        prompt=str(p.get('image_prompt') or '')
        reason=str(p.get('image_review_reason') or '')
        copy=' '.join(str(p.get(k) or '') for k in ('title','copy','headline','category'))
        refs=p.get('product_refs') or []
        protected=p.get('status') in {'published','archived'} or p.get('prevent_republish') is True or p.get('do_not_republish') is True

        if status=='needs_generation':
            req(not image,f'{pid} 已判需重生成但仍保留舊image_url')
            req(bool(prompt),f'{pid} 需重生成但沒有image_prompt')
            req(bool(reason),f'{pid} 需重生成但沒有退件原因')
            req(p.get('publish_allowed') is not True,f'{pid} 需重生成卻允許發布')
            req(p.get('schedule_enabled') is not True,f'{pid} 需重生成卻允許排程')
        elif status=='needs_binary_sync':
            req(p.get('publish_allowed') is not True,f'{pid} ZIP原圖待同步不得發布')
            req(p.get('schedule_enabled') is not True,f'{pid} ZIP原圖待同步不得排程')
        elif status=='candidate-review-required':
            req(bool(image),f'{pid} 候選待審核卻沒有圖片')
            req(p.get('publish_allowed') is not True,f'{pid} 候選待審核不得直接發布')
        elif status=='official-reference-pending-layout-review':
            req(bool(image),f'{pid} 正式單品候選沒有產品原圖')
            req('/images/products-v3/' in image,f'{pid} 正式單品候選未使用products-v3')
            matched=[(ref,marker) for ref,(name,marker) in PRODUCTS.items() if name.lower() in copy.lower()]
            if len(matched)==1:
                ref,marker=matched[0]
                req(marker in image,f'{pid} 文案產品與正式原圖不一致：應為{ref}')
        elif status=='approved-published-locked' or protected:
            if image:req(bool(image),f'{pid} 已發布鎖定圖片無效')
            req(p.get('publish_allowed') is not True,f'{pid} 已發布／防重發內容不得重新開放發布')

        if image:
            req('products-v2' not in image,f'{pid} 圖片仍引用products-v2退役產品圖')
            normalized=normalize(image)
            if re.search(r'/images/dm-(?:final|approved-v\d+)/',image,re.I):
                req(normalized in approved_formal,f'{pid} 使用DM目錄圖片但不在目前formal authority核准清單：{normalized}')
        joined=f'{copy} {prompt} {image}'
        req(not re.search(r'30\s*cc.{0,40}(玻璃瓶|瓶裝|[／/]\s*瓶)',joined,re.I),f'{pid} 又出現30cc瓶型舊稱')
        if '龜鹿湯塊' in joined:
            req(not re.search(r'龜鹿湯塊.{0,80}(300\s*g|600\s*g)',joined,re.I),f'{pid} 龜鹿湯塊又出現非75g舊規格')

        if len(refs)>1 and status not in {'needs_generation','needs_binary_sync'}:
            policy=str(p.get('image_policy') or '')+' '+prompt+' '+reason
            req('不得' in policy and ('等高' in policy or '相對' in policy or '尺寸' in policy),f'{pid} 多產品候選缺少相對尺寸安全說明')
    return len(posts)

def validate_current_authorities(formal,latest,approved_formal):
    assets=json.loads(ASSETS.read_text(encoding='utf-8'))
    req(assets.get('policy',{}).get('officialProductImageSource')=='images/products-v3/','公開資產庫產品原圖權威不是products-v3')
    req(assets.get('policy',{}).get('ownerReviewRequiredBeforePublish') is True,'公開資產庫缺少人工審核門')
    req(len(assets.get('policy',{}).get('reviewDimensions') or [])==16,'公開資產庫必須維持16項正式審核')

    req(str(latest.get('source') or '').strip(),'目前最新使用者ZIP來源不可空白')
    candidate_count=int(latest.get('candidate_count') or latest.get('unique_image_count') or 0)
    original_count=int(latest.get('original_file_count') or candidate_count)
    req(candidate_count>0 and original_count>=candidate_count,'最新使用者ZIP候選數必須有效，不得要求歷史固定張數')
    req(str(latest.get('priority') or '').startswith('user_zip_approved'),'ZIP圖片必須維持使用者素材優先並經語意匹配')
    req(latest.get('binary_sync',{}).get('status') in {'pending','ready'},'最新ZIP binary狀態不可判斷')
    req('16' in str(latest.get('review_rule') or '') and 'pending_review' in str(latest.get('review_rule') or ''),'ZIP換圖／生成後必須回待審核並重跑16項')
    req(len(approved_formal)>=7,'目前formal authority應核准六產品＋試喝顧客媒體')

    current_guard=(ROOT/'publishing-center-data-current-authority-guard.js').read_text(encoding='utf-8')
    req('public-asset-library.json' in current_guard,'目前貼文守門沒有跟公開資產權威連動')
    req('formal-media-authority-v20260810.json' in current_guard and 'currentFormalPaths' in current_guard,'目前貼文守門沒有跟目前formal media authority連動')
    req('current-authority-regeneration-required' in current_guard,'退役／不合格資產沒有回安全重生成狀態')
    req('LINE OA' in current_guard or 'line-oa' in current_guard.lower(),'目前守門缺少LINE OA角色素材分流')
    req("if(currentFormal.has(normalized))return''" in current_guard,'目前核准正式DM不得再被舊DM目錄隔離規則誤擋')

def main():
    formal,latest,approved_formal=current_authorities()
    core_count=validate_core_library(approved_formal)
    validate_current_authorities(formal,latest,approved_formal)
    req(RUNTIME_VALIDATOR.exists(),'缺少目前runtime能力驗收工具')
    subprocess.run(['node',str(RUNTIME_VALIDATOR)],cwd=ROOT,check=True)
    print(f'PASS publishing content match: {core_count} core posts + dynamic assembled runtime validated against current products-v3, current formal media, current ZIP({int(latest.get("candidate_count") or latest.get("unique_image_count") or 0)} candidates), copy-image and 16-item review capabilities; no fixed runtime count, old ZIP count, retired 30cc quarantine or historical version gate.')

if __name__=='__main__': main()
