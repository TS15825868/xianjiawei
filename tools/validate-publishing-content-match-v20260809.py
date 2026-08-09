#!/usr/bin/env python3
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
LIB=ROOT/'content/public-post-library.json'
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

def main():
    data=json.loads(LIB.read_text(encoding='utf-8'))
    posts=data.get('posts') or []
    req(posts,'公開候選母本沒有貼文')
    ids=set()
    needs=0
    for p in posts:
        pid=str(p.get('id') or '')
        req(pid and pid not in ids,f'貼文ID缺失或重複：{pid}')
        ids.add(pid)
        status=str(p.get('image_status') or '')
        req(status in ALLOWED_IMAGE_STATES,f'{pid} 使用未知image_status：{status}')
        image=p.get('image_url')
        prompt=str(p.get('image_prompt') or '')
        reason=str(p.get('image_review_reason') or '')
        copy=' '.join(str(p.get(k) or '') for k in ('title','copy','headline','category'))
        refs=p.get('product_refs') or []

        if status=='needs_generation':
            needs+=1
            req(not image,f'{pid} 已判需重生成但仍保留舊image_url')
            req(bool(prompt),f'{pid} 需重生成但沒有image_prompt')
            req(bool(reason),f'{pid} 需重生成但沒有退件原因')
            req(p.get('publish_allowed') is not True,f'{pid} 需重生成卻允許發布')
            req(p.get('schedule_enabled') is not True,f'{pid} 需重生成卻允許排程')
        elif status=='candidate-review-required':
            req(bool(image),f'{pid} 候選待審核卻沒有圖片')
            req(bool(prompt),f'{pid} 候選待審核卻沒有情境prompt')
            req(bool(reason),f'{pid} 候選待審核卻沒有審核理由')
        elif status=='official-reference-pending-layout-review':
            req(bool(image),f'{pid} 正式單品候選沒有產品原圖')
            req('/images/products-v3/' in str(image),f'{pid} 正式單品候選未使用products-v3')
            matched=[(ref,marker) for ref,(name,marker) in PRODUCTS.items() if name.lower() in copy.lower()]
            if len(matched)==1:
                ref,marker=matched[0]
                req(marker in str(image),f'{pid} 文案產品與正式原圖不一致：應為{ref}')
        elif status=='approved-published-locked':
            req(bool(image),f'{pid} 已發布鎖定卻沒有圖片')
            req(p.get('do_not_republish') is True or p.get('prevent_republish') is True,f'{pid} 已發布貼文未設定防重發')

        if image:
            src=str(image)
            req('products-v2' not in src and '/dm-final/' not in src,f'{pid} 圖片仍引用舊產品圖／舊DM')
        joined=f'{copy} {prompt} {image or ""}'
        req(not re.search(r'30\s*cc.{0,30}(玻璃瓶|瓶裝|[／/]\s*瓶)',joined,re.I),f'{pid} 又出現30cc瓶型舊稱')
        if '龜鹿湯塊' in joined:
            req(not re.search(r'(300\s*g|600\s*g)',joined,re.I),f'{pid} 龜鹿湯塊又出現非75g舊規格')

        # 明確宣告多產品的貼文若沒有可驗證相對尺寸，不得假裝已完成產品合成。
        if len(refs)>1 and status!='needs_generation':
            policy=str(p.get('image_policy') or '')+' '+prompt+' '+reason
            req('不得' in policy and ('等高' in policy or '相對' in policy or '尺寸' in policy),f'{pid} 多產品候選缺少相對尺寸安全說明')

    # 角色三批必須維持「無合格圖就需重生成」，不能再回到LINE OA裁圖／簡單向量假候選。
    v13=(ROOT/'publishing-center-data-v13-character-scenes.js').read_text(encoding='utf-8')
    v14=(ROOT/'publishing-center-data-v14-boss-daily.js').read_text(encoding='utf-8')
    v15=(ROOT/'publishing-center-data-v15-companions.js').read_text(encoding='utf-8')
    req("image_status:'needs_generation'" in v13 and "getSvg:()=>''" in v13,'v13節慶／地點角色未維持重生成隔離')
    req('不得使用LINE OA專用圖直接裁切拼貼' in v13,'v13缺少官網／LINE素材分流')
    req("image_status:'needs_generation'" in v14 and "chatgpt-boss-daily-v14-b1-exact-required" in v14,'v14剩餘小老闆日常未維持逐篇重生成')
    req("approved-v405-semantic-reuse-v14" in v14,'v14五張安全既有圖重用規則缺失')
    req("image_status:'needs_generation'" in v15 and "getSvg:()=>''" in v15,'v15陪伴角色未維持重生成隔離')
    req('灰色小河馬必須明確是娃娃' in v15 and '米色小鹿安撫巾必須保持布巾' in v15,'v15陪伴角色造型規則不完整')
    for name,src in [('v13',v13),('v14',v14),('v15',v15)]:
        req('/images/brand/line-oa/' not in src,f'{name} 現役生成層又直接引用LINE OA角色圖')
        req('<clipPath' not in src and 'preserveAspectRatio="xMidYMid slice"' not in src,f'{name} 又出現裁切角色的SVG實作')

    print(f'PASS publishing content match: {len(posts)} core posts checked; {needs} core mismatches quarantined; v13/v14/v15 character layers preserve exact prompts and no unsafe fake candidates')

if __name__=='__main__': main()
