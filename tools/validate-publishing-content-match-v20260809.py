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
CURRENT_30='每日 1–2 罐'
ALLOWED_IMAGE_STATES={
    'approved-published-locked','approved-published-final-locked','candidate-review-required',
    'approved-existing-pending-copy-review','official-reference-pending-layout-review',
    'needs_generation','needs_binary_sync','pending_review','approved_existing','live-check-required'
}
PRODUCTS={
    'guilu-gao':('龜鹿膏','guilu-gao'),
    'guilu-drink-30':('龜鹿飲30cc','guilu-drink-30'),
    'guilu-drink-180':('龜鹿飲180cc','guilu-drink-180'),
    'guilu-tangkuai':('龜鹿湯塊','guilu-tangkuai'),
    'guilu-jiao':('龜鹿膠','guilu-jiao'),
    'luerong-fen':('鹿茸粉','luerong-fen'),
}
PRODUCT_NAMES=[value[0] for value in PRODUCTS.values()]+['柒玄茶・龜鹿調飲粉']
TRIAL_APPROVED_STATES={'approved_user_original','approved_display','approved_current_media'}


def req(ok,msg):
    if not ok: raise AssertionError(msg)


def load(rel):
    return json.loads((ROOT/rel).read_text(encoding='utf-8'))


def normalize(value):
    return re.sub(r'^https?://[^/]+/xianjiawei/','',str(value or ''),flags=re.I).lstrip('/').split('?',1)[0].split('#',1)[0]


def product_segments(text:str,target:str)->list[str]:
    source=str(text or '');segments=[];start=0
    while True:
        pos=source.find(target,start)
        if pos<0:break
        end=len(source);search_from=pos+len(target)
        for name in PRODUCT_NAMES:
            if name==target:continue
            next_pos=source.find(name,search_from)
            if next_pos>=0:end=min(end,next_pos)
        segments.append(source[pos:end]);start=pos+len(target)
    return segments


def current_authorities():
    formal=load('data/formal-media-authority-v20260810.json')
    approved_products={normalize(p.get('image')) for p in formal.get('products') or [] if p.get('status')=='approved_display' and p.get('image')}
    approved_dms={normalize(p.get('dm')) for p in formal.get('products') or [] if p.get('status')=='approved_display' and p.get('dm')}
    approved_formal=set(approved_products)|set(approved_dms)
    trial=formal.get('trial') or {}
    if trial.get('status') in TRIAL_APPROVED_STATES and (trial.get('image') or trial.get('path')):
        approved_formal.add(normalize(trial.get('image') or trial.get('path')))
    approved_formal.discard('')
    return formal,approved_products,approved_dms,approved_formal


def validate_core_library(approved_products,approved_dms):
    data=load('content/public-post-library.json');posts=data.get('posts') or []
    req(posts,'公開核心母本沒有貼文')
    declared=int((data.get('counts') or {}).get('total') or len(posts));req(declared==len(posts),f'公開核心母本宣告張數{declared}與實際{len(posts)}不一致')
    auth=data.get('productAuthority') or {}
    req(auth.get('textAuthority')=='public-product-master.json','貼文文字權威不是public-product-master.json')
    req(auth.get('knowledgeProducts')==7 and auth.get('approvedMediaProducts')==6,'貼文母庫不是七文字／六媒體目前模型')
    req(auth.get('drink30Usage')==CURRENT_30,'貼文母庫30cc用法不是每日 1–2 罐')
    req(auth.get('drink180Usage')=='每日一包','貼文母庫180cc用法不是每日一包')
    req('sixProductsSixSpecs' not in auth,'貼文母庫仍含舊六產品權威欄位')
    ids=set();by={}
    for p in posts:
        pid=str(p.get('id') or '');req(pid and pid not in ids,f'貼文ID缺失或重複：{pid}');ids.add(pid);by[pid]=p
        status=str(p.get('image_status') or p.get('media_state') or p.get('status') or '')
        req(status in ALLOWED_IMAGE_STATES or p.get('status') in {'published','archived','campaign_hold','draft','pending_review'},f'{pid} 使用未知圖片／貼文狀態：{status}')
        image=str(p.get('image_url') or '');prompt=str(p.get('image_prompt') or '');reason=str(p.get('image_review_reason') or '')
        copy=' '.join(str(p.get(k) or '') for k in ('title','copy','headline','category'))
        refs=p.get('product_refs') or []
        protected=p.get('status') in {'published','archived'} or p.get('prevent_republish') is True or p.get('do_not_republish') is True

        if protected:
            req(p.get('publish_allowed') is not True,f'{pid} 已發布／防重發內容不得重新開放發布')
            if p.get('status')=='published':
                req(p.get('prevent_republish') is True and p.get('do_not_republish') is True,f'{pid} 已發布內容未完整鎖定')
            continue

        req(p.get('owner_review_required') is True,f'{pid} 未發布內容必須人工審核')
        req(p.get('publish_allowed') is not True,f'{pid} 未發布內容不得直接發布')
        req(p.get('schedule_enabled') is not True,f'{pid} 未發布內容不得直接排程')

        if status=='needs_generation':
            req(not image,f'{pid} 已判需重生成但仍保留舊image_url')
            req(bool(prompt),f'{pid} 需重生成但沒有image_prompt')
            req(bool(reason),f'{pid} 需重生成但沒有退件原因')
            req(p.get('regeneration_mode')=='chatgpt_handoff',f'{pid} 需重生成但沒有走ChatGPT交接')
        elif status=='needs_binary_sync':
            req(not p.get('publish_allowed'),f'{pid} binary待同步不得發布')
        elif status in {'candidate-review-required','live-check-required','approved-existing-pending-copy-review','approved_existing'}:
            req(bool(image),f'{pid} 有候選／正式參考狀態卻沒有圖片')

        if image:
            req('/images/products-v2/' not in image,f'{pid} 圖片仍引用products-v2退役產品圖')
            req('/images/products-v3/' not in image,f'{pid} products-v3只可作身份參考，不得作目前貼文產品主圖')
            normalized=normalize(image)
            if re.search(r'/images/dm-(?:final|approved-v\d+)/',image,re.I):req(normalized in approved_dms,f'{pid} 使用未核准DM：{normalized}')
            if any(ref in PRODUCTS for ref in refs) and len(refs)==1 and '/images/customer-display-v20260812/' in image:
                req(normalized in approved_products,f'{pid} 產品主圖不在目前formal authority核准產品圖清單：{normalized}')

        joined=f'{copy} {prompt} {image}'
        req(not re.search(r'30\s*cc.{0,60}(玻璃瓶|瓶裝|[／/]\s*瓶)',joined,re.I),f'{pid} 又出現30cc瓶型舊稱')
        if '龜鹿飲30cc' in joined and pid=='POST-DRINK-30':req(CURRENT_30 in copy,f'{pid} 缺30cc目前正式使用方式')
        for segment in product_segments(joined,'龜鹿湯塊'):req(not re.search(r'(300\s*g|600\s*g)',segment,re.I),f'{pid} 龜鹿湯塊自己的語境出現退役容量：{segment[:120]}')
        if len(refs)>1 and status not in {'needs_generation','needs_binary_sync'}:
            policy=str(p.get('image_policy') or '')+' '+prompt+' '+reason
            req('不得' in policy and ('等高' in policy or '相對' in policy or '尺寸' in policy),f'{pid} 多產品候選缺相對尺寸安全說明')

    req('柒玄茶・龜鹿調飲粉' in str(by['POST-PRODUCT-OVERVIEW'].get('copy') or ''),'產品總覽缺第七項柒玄茶')
    req('六個正式產品' not in str(by['POST-PRODUCT-OVERVIEW'].get('copy') or ''),'產品總覽仍是舊六產品文案')
    req(CURRENT_30 in str(by['POST-DRINK-30'].get('copy') or ''),'30cc待審文案缺目前用法')
    req('每日一包' in str(by['POST-DRINK-180'].get('copy') or ''),'180cc待審文案缺目前用法')
    for wid in ['POST-WEATHER-HOT','POST-WEATHER-TEMP','POST-WEATHER-RAIN']:
        p=by[wid];req(p.get('live_check_required') is True,f'{wid}缺發布前天氣確認metadata')
        req(not re.search(r'此類貼文需確認|不自動排程|待審核|人工審核',str(p.get('copy') or '')),f'{wid} 公開文案混入內部作業字眼')
    return len(posts)


def validate_current_authorities(formal,approved_products,approved_dms,approved_formal):
    assets=load('content/public-asset-library.json');policy=assets.get('policy',{})
    req(policy.get('ownerReviewRequiredBeforePublish') is True,'公開資產庫缺少人工審核門')
    req(len(policy.get('reviewDimensions') or [])==16,'公開資產庫必須維持16項正式審核')
    req(len(formal.get('products') or [])==6,'目前formal authority應維持六項核准產品媒體')
    req(len(approved_products)==6 and len(approved_dms)==6,'目前formal authority應包含六產品主圖＋六詳細DM')
    req(len(approved_formal)>=13,'目前formal authority至少應包含六產品主圖＋六DM＋試喝正式媒體')
    trial=formal.get('trial') or {};req(trial.get('status') in TRIAL_APPROVED_STATES,'目前試喝媒體不是核准狀態')
    req(normalize(trial.get('image') or trial.get('path'))=='images/trial/trial-poster-small-boss-official-v20260814.jpg','試喝權威不是目前正式海報')

    current_guard=(ROOT/'publishing-center-data-current-authority-guard.js').read_text(encoding='utf-8')
    v16=(ROOT/'publishing-center-data-v16-actual-product-photos.js').read_text(encoding='utf-8')
    v18=(ROOT/'publishing-center-data-v18-content-media-match.js').read_text(encoding='utf-8')
    req('public-asset-library.json' in current_guard and 'formal-media-authority-v20260810.json' in current_guard,'目前貼文守門未連動公開資產／formal media')
    req(CURRENT_30 in current_guard and '柒玄茶・龜鹿調飲粉' in current_guard,'目前貼文守門缺30cc／柒玄茶最新規則')
    req("if(currentFormal.has(normalized))return''" in current_guard,'目前核准正式媒體不得被舊規則誤擋')
    req('customer-display-v20260812' in v16 and 'products-v3-identity-reference-only' in v16,'v16仍可能把products-v3當顧客產品主圖')
    req('舊ZIP名稱只作來源追溯' in v18 and 'KEEP_NEEDS_GENERATION' in v18,'v18仍可能把舊ZIP／舊六產品圖當目前權威')
    req('目前有六項正式產品以獨立卡片' not in v18,'v18仍含舊六產品總覽媒體文案')


def main():
    formal,approved_products,approved_dms,approved_formal=current_authorities()
    core_count=validate_core_library(approved_products,approved_dms)
    validate_current_authorities(formal,approved_products,approved_dms,approved_formal)
    req(RUNTIME_VALIDATOR.exists(),'缺少目前runtime能力驗收工具')
    subprocess.run(['node',str(RUNTIME_VALIDATOR)],cwd=ROOT,check=True)
    print(f'PASS publishing content match: {core_count} core posts validated against seven-product current copy, six approved product media, current formal roles, pending-image review flow, weather metadata and no stale ZIP/products-v3 authority gates.')

if __name__=='__main__':
    main()
