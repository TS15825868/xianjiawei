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


def req(ok,msg):
    if not ok: raise AssertionError(msg)
def load(rel): return json.loads((ROOT/rel).read_text(encoding='utf-8'))
def read(rel): return (ROOT/rel).read_text(encoding='utf-8')

def main():
    master=load('public-product-master.json')
    ids=[p.get('id') for p in master.get('products') or []]
    req(master.get('authority')=='user-confirmed-current','目前公開母資料authority錯誤')
    req(master.get('productCount')==6 and ids==PUBLIC_IDS,'舊七項公開產品模型重新混入')
    req(DEFERRED_ID not in ids,'暫緩官網產品不得出現在官網母資料')
    by={p['id']:p for p in master['products']}
    req(by['guilu-drink-30'].get('usage',[None])[0]==CURRENT_30,'30cc被舊資料回退')
    req(by['guilu-gao'].get('usage',[None])[0]==CURRENT_GAO,'龜鹿膏被舊固定時段資料回退')

    for rel in ['assets/data/official-products.json','config/official-products.json']:
        data=load(rel);pids=[p.get('id') for p in data.get('products') or []]
        req(pids==PUBLIC_IDS,f'{rel}不是目前六項官網產品')
        req((data.get('knowledge_product_ids') or [])==PUBLIC_IDS,f'{rel}知識產品仍是舊模型')
        req((data.get('approved_media_product_ids') or [])==PUBLIC_IDS,f'{rel}媒體產品不同步')
        text=json.dumps(data,ensure_ascii=False)
        req(DEFERRED_ID not in text and DEFERRED_NAME not in text,f'{rel}仍把暫緩產品放回官網鏡像')

    public_files=['public-product-master.json','ai-answers.json','geo-data.json','llms.txt','llms-full.txt','index.html','products.html','guide.html','faq.html','brand-facts.html','content/public-post-library.json']
    for rel in public_files:
        text=read(rel);req(DEFERRED_ID not in text and DEFERRED_NAME not in text,f'{rel}重新公開暫緩產品')

    gao=read('product-guilu-gao.html')
    req(CURRENT_GAO in gao and '時間依作息安排' in gao,'龜鹿膏顧客頁未同步目前彈性時段')
    for retired in ['早上＋下午','早上+下午','早晚各一小匙','每日早上及下午各一小匙','一天一次一小匙']:
        req(retired not in gao,f'龜鹿膏顧客頁仍含退役資料：{retired}')

    runtime=read('site-product-data-authority.js');display=read('site-customer-display-v20260812.js');fallback=read('site.js')
    req('productCount!==6' in runtime and 'knowledgeProductCount:6' in runtime,'官網產品runtime仍未鎖定六項')
    req('knowledgeProductCount:7' not in runtime,'官網產品runtime仍有七項硬門')
    req('knowledgeProductCount:6' in display and 'knowledgeProductCount:7' not in display,'顧客產品圖runtime仍有七項metadata')
    req('knowledgeProductCount: 6' in fallback,'網站安全備援不是六項')
    req('每日 1–2 罐' in read('public-product-master.json'),'缺少30cc目前正式用法')
    print('PASS: six website products; flexible Guilu Gao timing; 30cc daily 1–2 cans; no stale seven-product runtime blocker or deferred Qixuan website regression.')

if __name__=='__main__': main()
