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

STATIC_PUBLIC_FILES=[
    'public-product-master.json',
    'assets/data/official-products.json',
    'config/official-products.json',
    'ai-answers.json',
    'geo-data.json',
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
]

SOCIAL_PAYLOAD_SOURCES={
    'content/social-content-bank-v20260911.json': ('topics',),
    'content/social-schedule-20260911-0924.json': ('metricoolFormalSchedule','schedule'),
    'content/social-schedule-20261001-1014.json': ('schedule',),
    'content/social-plan-20261015-1031-candidates.json': ('candidates',),
}

# 這些 JSON 同時保存產品 payload 與「不得宣稱／防回流」政策；
# 整檔只做退役資料／暫緩產品檢查，療效禁詞改掃真正 products[] 或 answers[] payload。
POLICY_BEARING_PRODUCT_JSON={
    'public-product-master.json',
    'assets/data/official-products.json',
    'config/official-products.json',
}
POLICY_BEARING_ANSWER_JSON={'ai-answers.json'}

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

def assert_copy_text(text: str, label: str, *, deferred_forbidden: bool=True, claims: bool=True):
    for retired in STALE_PUBLIC_LITERALS:
        req(retired not in text,f'{label}仍含退役公開資料：{retired}')
    if claims:
        for claim in PUBLIC_CLAIM_LITERALS:
            req(claim not in text,f'{label}含目前公開內容禁用療效詞：{claim}')
    if deferred_forbidden:
        req(DEFERRED_ID not in text and DEFERRED_NAME not in text,f'{label}把暫緩產品放進實際公開內容')

def assert_static_public_copy():
    missing=[]
    for rel in STATIC_PUBLIC_FILES:
        path=ROOT/rel
        if not path.exists():
            missing.append(rel)
            continue
        text=path.read_text(encoding='utf-8')
        policy_bearing = rel in POLICY_BEARING_PRODUCT_JSON or rel in POLICY_BEARING_ANSWER_JSON
        assert_copy_text(text,rel,claims=not policy_bearing)
        if rel in POLICY_BEARING_PRODUCT_JSON:
            data=json.loads(text)
            for index,product in enumerate(data.get('products') or []):
                assert_copy_text(json.dumps(product,ensure_ascii=False,sort_keys=True),f'{rel}:products[{index}]')
        if rel in POLICY_BEARING_ANSWER_JSON:
            data=json.loads(text)
            answers=data.get('answers') or []
            req(isinstance(answers,list) and answers,f'{rel} 缺少 answers[]')
            for index,answer in enumerate(answers):
                # 只驗證真正會被搜尋引擎／AI引用的問答 payload，不把檔案級安全政策誤當宣稱。
                payload={key:answer.get(key) for key in ('question','aliases','shortAnswer','answer') if key in answer}
                assert_copy_text(json.dumps(payload,ensure_ascii=False,sort_keys=True),f'{rel}:answers[{index}]')
    req(not missing,f'目前公開守門檔案缺失：{missing}')

def assert_social_payloads():
    for rel,keys in SOCIAL_PAYLOAD_SOURCES.items():
        data=load(rel)
        payloads=[]
        for key in keys:
            value=data.get(key)
            if isinstance(value,list): payloads.extend(value)
        req(payloads or rel.endswith('social-schedule-20260911-0924.json'),f'{rel}找不到預期社群 payload')
        for index,item in enumerate(payloads):
            assert_copy_text(json.dumps(item,ensure_ascii=False,sort_keys=True),f'{rel}:{index}')

        # rules/principles 可記錄目前暫緩產品，這是防回流政策，不是待發布文案。
        for container_key in ('rules','principles'):
            container=data.get(container_key)
            if isinstance(container,dict) and 'deferredPublicProduct' in container:
                req(container.get('deferredPublicProduct')==DEFERRED_NAME,f'{rel} deferredPublicProduct 指向錯誤產品')

def main():
    master=load('public-product-master.json')
    ids=[p.get('id') for p in master.get('products') or []]
    req(master.get('authority')=='user-confirmed-current','目前公開母資料authority錯誤')
    req(master.get('productCount')==6 and ids==PUBLIC_IDS,'舊七項公開產品模型重新混入')
    req(DEFERRED_ID not in ids and DEFERRED_NAME not in json.dumps(master.get('products') or [],ensure_ascii=False),'暫緩官網產品不得出現在官網六項產品清單')
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

    gao=read('product-guilu-gao.html')
    req(CURRENT_GAO in gao and '時間依作息安排' in gao,'龜鹿膏顧客頁未同步目前彈性時段')

    runtime=read('site-product-data-authority.js');display=read('site-customer-display-v20260812.js');fallback=read('site.js')
    req('productCount!==6' in runtime and 'knowledgeProductCount:6' in runtime,'官網產品runtime仍未鎖定六項')
    req('knowledgeProductCount:7' not in runtime,'官網產品runtime仍有七項硬門')
    req('knowledgeProductCount:6' in display and 'knowledgeProductCount:7' not in display,'顧客產品圖runtime仍有七項metadata')
    req('knowledgeProductCount: 6' in fallback,'網站安全備援不是六項')
    req(CURRENT_30 in read('public-product-master.json'),'缺少30cc目前正式用法')

    # llms*.txt 與 policy 欄位可寫「不得公開／不得宣稱」；真正顧客／AI回答／社群 payload 必須通過下列檢查。
    assert_static_public_copy()
    assert_social_payloads()
    print('PASS: six website products; 30cc small glass jar/bare/no sticker; flexible timing; negative policy may name forbidden items while actual product/customer/AI-answer/social payloads cannot; no stale public brand/product/timing or high-risk claim regression.')

if __name__=='__main__': main()
