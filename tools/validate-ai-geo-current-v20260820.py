#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CURRENT_30='每日 1–2 罐'
PUBLIC_IDS=['guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen']
DEFERRED_NAME='柒玄茶・龜鹿調飲粉'
DEFERRED_ID='qixuan-guilu-drink-powder'


def load(path):
    return json.loads((ROOT/path).read_text(encoding='utf-8'))

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def main():
    master=load('public-product-master.json')
    req(master.get('authority')=='user-confirmed-current','public master authority錯誤')
    req(master.get('productCount')==6,'官網公開產品數必須為6')
    ids=[p.get('id') for p in master.get('products') or []]
    req(ids==PUBLIC_IDS,f'官網公開產品必須剛好六項：{ids}')
    req(DEFERRED_ID not in ids,'暫緩對外產品不得出現在public master')
    by={p['id']:p for p in master['products']}
    req(by['guilu-drink-30']['usage'][0]==CURRENT_30,'30cc必須每日 1–2 罐')
    req(by['guilu-tangkuai']['specification']=='75g （2兩）／盒｜8塊裝','龜鹿湯塊規格錯誤')
    req(by['guilu-jiao']['specification']=='600g （1斤）／盒｜32塊裝','龜鹿膠規格錯誤')

    ai=load('ai-answers.json')
    all_answer=next((x for x in ai.get('answers') or [] if x.get('id')=='all-products'),None)
    req(all_answer and '共6項' in all_answer.get('answer',''),'AI全產品回答必須是6項')
    req(DEFERRED_NAME not in json.dumps(ai,ensure_ascii=False),'AI公開答案不得含暫緩對外產品')
    drink=next((x for x in ai.get('answers') or [] if x.get('id')=='drink-30-vs-180'),None)
    req(drink and CURRENT_30 in drink.get('answer',''),'AI 30cc回答未同步每日1–2罐')

    geo=load('geo-data.json')
    geo_text=json.dumps(geo,ensure_ascii=False)
    req(DEFERRED_NAME not in geo_text and DEFERRED_ID not in geo_text,'GEO不得含暫緩對外產品')
    lists=[x for x in geo.get('@graph') or [] if x.get('@type')=='ItemList']
    req(lists and lists[0].get('numberOfItems')==6,'GEO ItemList必須6項')

    for rel in ['llms.txt','llms-full.txt','index.html','products.html','faq.html','brand-facts.html']:
        text=(ROOT/rel).read_text(encoding='utf-8')
        req(DEFERRED_NAME not in text,f'{rel}仍公開暫緩對外產品')
        req(DEFERRED_ID not in text,f'{rel}仍公開暫緩對外產品ID')
    for rel in ['llms.txt','llms-full.txt','faq.html','products.html','brand-facts.html']:
        req(CURRENT_30 in (ROOT/rel).read_text(encoding='utf-8'),f'{rel}缺少30cc目前用法')

    print('PASS: six public products only; deferred product absent from website/AI/GEO; 30cc remains daily 1–2 cans.')

if __name__=='__main__': main()
