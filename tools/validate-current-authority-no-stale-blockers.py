#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PUBLIC_IDS=['guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen']
DEFERRED_ID='qixuan-guilu-drink-powder'
DEFERRED_NAME='柒玄茶・龜鹿調飲粉'
CURRENT_30='每日 1–2 罐'
CURRENT_GAO='食用時間可依個人使用習慣與作息時間安排'

# 只對目前會參與公開顯示、AI/GEO、正式貼文排程或公開貼文庫的檔案做硬門。
# 歷史紀錄、內部稽核、舊素材可保留，不因出現舊字串就阻擋新版更新。
CURRENT_PUBLIC_COPY_FILES=[
    'public-product-master.json',
    'assets/data/official-products.json',
    'config/official-products.json',
    'ai-answers.json',
    'geo-data.json',
    'llms.txt',
    'llms-full.txt',
    'index.html',
    'products.html',
    'guide.html',
    'faq.html',
    'brand-facts.html',
    'product-guilu-gao.html',
    'product-guilu-drink-30cc.html',
    'product-guilu-drink-180cc.html',
    'product-guilu-tangkuai.html',
    'product-guilu-jiao.html',
    'product-luerong-fen.html',
    'content/public-post-library.json',
    'content/social-content-bank-v20260911.json',
    'content/social-schedule-20260911-0924.json',
    'content/social-schedule-20261001-1014.json',
    'content/social-plan-20261015-1031-candidates.json',
]

# 已明確退役、且不應再出現在目前公開內容中的字串。
STALE_PUBLIC_LITERALS=[
    '台興山產',
    '30cc玻璃瓶',
    '30cc 玻璃瓶',
    '30 cc玻璃瓶',
    '30 cc 玻璃瓶',
    '30cc／瓶',
    '建議安排在白天',
    '建議白天',
    '早上＋下午',
    '早上+下午',
    '早晚各一小匙',
    '每日早上及下午各一小匙',
    '一天一次一小匙',
]

# 目前公開內容不得拿這些高風險療效詞當產品賣點；只掃 CURRENT_PUBLIC_COPY_FILES，
# 不掃法規說明或歷史稽核文件，避免把「禁止宣稱」本身誤判為違規文案。
PUBLIC_CLAIM_LITERALS=[
    '關節',
    '卡卡',
    '精神不濟',
    '補氣',
    '生津',
    '膠原蛋白',
    '鈣質',
    '保證功效',
]


def req(ok,msg):
    if not ok: raise AssertionError(msg)
def load(rel): return json.loads((ROOT/rel).read_text(encoding='utf-8'))
def read(rel): return (ROOT/rel).read_text(encoding='utf-8')

def assert_current_public_copy():
    missing=[]
    for rel in CURRENT_PUBLIC_COPY_FILES:
        path=ROOT/rel
        if not path.exists():
            missing.append(rel)
            continue
        text=path.read_text(encoding='utf-8')
        for retired in STALE_PUBLIC_LITERALS:
            req(retired not in text,f'{rel}仍含退役公開資料：{retired}')
        for claim in PUBLIC_CLAIM_LITERALS:
            req(claim not in text,f'{rel}含目前公開內容禁用療效詞：{claim}')
    req(not missing,f'目前公開守門檔案缺失：{missing}')

def main():
    master=load('public-product-master.json')
    ids=[p.get('id') for p in master.get('products') or []]
    req(master.get('authority')=='user-confirmed-current','目前公開母資料authority錯誤')
    req(master.get('productCount')==6 and ids==PUBLIC_IDS,'舊七項公開產品模型重新混入')
    req(DEFERRED_ID not in ids,'暫緩官網產品不得出現在官網母資料')
    by={p['id']:p for p in master['products']}
    req(by['guilu-drink-30'].get('usage',[None])[0]==CURRENT_30,'30cc被舊資料回退')
    req('小玻璃罐' in by['guilu-drink-30'].get('package',''),'30cc正式包裝未鎖定小玻璃罐')
    req('裸罐' in by['guilu-drink-30'].get('package',''),'30cc正式包裝未鎖定裸罐')
    req('無貼紙' in by['guilu-drink-30'].get('package',''),'30cc正式包裝未鎖定無貼紙')
    req(by['guilu-gao'].get('usage',[None])[0]==CURRENT_GAO,'龜鹿膏被舊固定時段資料回退')

    for rel in ['assets/data/official-products.json','config/official-products.json']:
        data=load(rel);pids=[p.get('id') for p in data.get('products') or []]
        req(pids==PUBLIC_IDS,f'{rel}不是目前六項官網產品')
        req((data.get('knowledge_product_ids') or [])==PUBLIC_IDS,f'{rel}知識產品仍是舊模型')
        req((data.get('approved_media_product_ids') or [])==PUBLIC_IDS,f'{rel}媒體產品不同步')
        text=json.dumps(data,ensure_ascii=False)
        req(DEFERRED_ID not in text and DEFERRED_NAME not in text,f'{rel}仍把暫緩產品放回官網鏡像')

    for rel in CURRENT_PUBLIC_COPY_FILES:
        text=read(rel)
        req(DEFERRED_ID not in text and DEFERRED_NAME not in text,f'{rel}重新公開暫緩產品')

    gao=read('product-guilu-gao.html')
    req(CURRENT_GAO in gao and '時間依作息安排' in gao,'龜鹿膏顧客頁未同步目前彈性時段')

    runtime=read('site-product-data-authority.js');display=read('site-customer-display-v20260812.js');fallback=read('site.js')
    req('productCount!==6' in runtime and 'knowledgeProductCount:6' in runtime,'官網產品runtime仍未鎖定六項')
    req('knowledgeProductCount:7' not in runtime,'官網產品runtime仍有七項硬門')
    req('knowledgeProductCount:6' in display and 'knowledgeProductCount:7' not in display,'顧客產品圖runtime仍有七項metadata')
    req('knowledgeProductCount: 6' in fallback,'網站安全備援不是六項')
    req(CURRENT_30 in read('public-product-master.json'),'缺少30cc目前正式用法')

    assert_current_public_copy()
    print('PASS: six website products; 30cc small glass jar/bare/no sticker; flexible timing; no stale public brand/product/timing regressions; no current public high-risk claim literals.')

if __name__=='__main__': main()
