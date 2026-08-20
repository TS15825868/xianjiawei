#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
PUBLIC_IDS=['guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen']
DEFERRED_ID='qixuan-guilu-drink-powder'
DEFERRED_NAME='柒玄茶・龜鹿調飲粉'
CURRENT_30='每日 1–2 罐'


def req(ok,msg):
    if not ok: raise AssertionError(msg)

def load(rel): return json.loads((ROOT/rel).read_text(encoding='utf-8'))

def main():
    master=load('public-product-master.json')
    ids=[p.get('id') for p in master.get('products') or []]
    req(master.get('authority')=='user-confirmed-current','目前公開母資料authority錯誤')
    req(master.get('productCount')==6 and ids==PUBLIC_IDS,'舊七項公開產品模型重新混入')
    req(DEFERRED_ID not in ids,'暫緩對外產品不得出現在官網母資料')
    drink=next(p for p in master['products'] if p['id']=='guilu-drink-30')
    req(drink.get('usage',[None])[0]==CURRENT_30,'30cc被舊資料回退')

    for rel in ['assets/data/official-products.json','config/official-products.json']:
        data=load(rel)
        pids=[p.get('id') for p in data.get('products') or []]
        req(pids==PUBLIC_IDS,f'{rel}不是目前六項公開產品')
        req((data.get('knowledge_product_ids') or [])==PUBLIC_IDS,f'{rel}知識產品數仍是舊模型')
        req((data.get('approved_media_product_ids') or [])==PUBLIC_IDS,f'{rel}媒體產品數不同步')
        text=json.dumps(data,ensure_ascii=False)
        req(DEFERRED_ID not in text and DEFERRED_NAME not in text,f'{rel}仍含暫緩對外產品')

    public_files=['public-product-master.json','ai-answers.json','geo-data.json','llms.txt','llms-full.txt','index.html','products.html','faq.html','brand-facts.html']
    for rel in public_files:
        text=(ROOT/rel).read_text(encoding='utf-8')
        req(DEFERRED_ID not in text and DEFERRED_NAME not in text,f'{rel}重新公開暫緩產品')

    # 舊字樣只可存在於防回退檢查本身，不得成為正式輸出值。
    req('每日 1–2 罐' in (ROOT/'public-product-master.json').read_text(encoding='utf-8'),'缺少30cc目前正式用法')
    print('PASS: current public authority is six products; deferred product cannot be reintroduced by stale seven-product data.')

if __name__=='__main__': main()
