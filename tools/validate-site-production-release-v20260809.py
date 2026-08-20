#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CURRENT_30='每日 1–2 罐'
PUBLIC_IDS=['guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen']
DEFERRED=('qixuan-guilu-drink-powder','柒玄茶・龜鹿調飲粉')
SPECS={
 'guilu-gao':'100g／罐','guilu-drink-30':'30cc／罐（小玻璃罐）','guilu-drink-180':'180cc／包（鋁袋）',
 'guilu-tangkuai':'75g （2兩）／盒｜8塊裝','guilu-jiao':'600g （1斤）／盒｜32塊裝','luerong-fen':'75g／罐'
}
PAGE_BY_ID={
 'guilu-gao':'product-guilu-gao.html','guilu-drink-30':'product-guilu-drink-30cc.html','guilu-drink-180':'product-guilu-drink-180cc.html',
 'guilu-tangkuai':'product-guilu-tangkuai.html','guilu-jiao':'product-guilu-jiao.html','luerong-fen':'product-luerong-fen.html'
}
LEGACY_30=('每日1-2罐','每日 1-2罐','每日 1-2 罐','每日1～2罐','每日 1～2罐','每日 1～2 罐','每日一罐')

def load(rel): return json.loads((ROOT/rel).read_text(encoding='utf-8'))
def read(rel): return (ROOT/rel).read_text(encoding='utf-8')
def req(ok,msg):
    if not ok: raise AssertionError(msg)
def product_map(data):
    products=data.get('products') or []
    if isinstance(products,list): return {p.get('id'):p for p in products if p.get('id')}
    if isinstance(products,dict): return {k:({'id':k,**v} if isinstance(v,dict) else {'id':k}) for k,v in products.items()}
    return {}
def spec_of(item): return item.get('specification') or item.get('size') or item.get('spec')
def usage_of(item):
    if item.get('usagePrimary'): return item.get('usagePrimary')
    if item.get('usage_primary'): return item.get('usage_primary')
    usage=item.get('usage') or []
    return usage[0] if usage else None

def validate_products():
    master=load('public-product-master.json');mb=product_map(master)
    req(master.get('authority')=='user-confirmed-current','public-product-master authority錯誤')
    req(master.get('productCount')==6 and list(mb)==PUBLIC_IDS,'public-product-master必須為目前六項官網產品')
    for pid,spec in SPECS.items():req(spec_of(mb[pid])==spec,f'{pid}公開母資料規格錯誤')
    req(usage_of(mb['guilu-drink-30'])==CURRENT_30,'30cc公開母資料用法錯誤')
    req(usage_of(mb['guilu-drink-180'])=='每日一包','180cc公開母資料用法錯誤')

    for rel in ['assets/data/official-products.json','config/official-products.json','data.json','catalog-public.json','product-master.json']:
        data=load(rel);pm=product_map(data)
        req(set(pm)==set(PUBLIC_IDS),f'{rel}產品集合不是目前六項官網產品')
        serialized=json.dumps(data,ensure_ascii=False)
        for marker in DEFERRED:req(marker not in serialized,f'{rel}重新混入暫緩產品：{marker}')
        p30=pm['guilu-drink-30'];req(usage_of(p30)==CURRENT_30 or CURRENT_30 in serialized,f'{rel} 30cc未同步每日 1–2 罐')
        for legacy in LEGACY_30:
            if legacy=='每日一罐' and '不得回退成每日一罐' in serialized: continue
            req(legacy not in serialized,f'{rel}仍含30cc退役輸出：{legacy}')

    for pid,page in PAGE_BY_ID.items():
        source=read(page);req(SPECS[pid] in source,f'{page}缺目前規格')
        for marker in DEFERRED:req(marker not in source,f'{page}不應出現暫緩產品')
    gao=read('product-guilu-gao.html')
    req('食用時間可依個人使用習慣與作息時間安排' in gao,'龜鹿膏目前使用方式缺失')
    for retired in ['早上＋下午','早上+下午','每日早上及下午各一小匙','早晚各一小匙']:req(retired not in gao,f'龜鹿膏仍含舊固定時段：{retired}')
    req('時間依作息安排' in gao,'龜鹿膏快捷標籤未同步目前用法')

def validate_public_surfaces():
    for rel in ['index.html','products.html','guide.html','faq.html','ai-answers.json','geo-data.json','llms.txt','llms-full.txt']:
        text=read(rel)
        for marker in DEFERRED:req(marker not in text,f'{rel}重新公開暫緩產品：{marker}')
    req('六項' in read('index.html'),'首頁未維持六項官網產品')
    req('六項' in read('products.html'),'產品總覽未維持六項官網產品')
    req(CURRENT_30 in read('products.html') and CURRENT_30 in read('guide.html') and CURRENT_30 in read('faq.html'),'30cc目前用法未同步公開頁')

def validate_media():
    formal=load('data/formal-media-authority-v20260810.json');products=formal.get('products') or []
    req(len(products)==6,'正式產品媒體必須為六項')
    for item in products:
        req(item.get('status')=='approved_display',f"{item.get('id')}正式媒體未核准")
        for key in ['image','dm']:
            path=str(item.get(key) or '').split('?',1)[0].lstrip('/')
            req(path and (ROOT/path).is_file(),f"{item.get('id')} {key}檔案不存在")
    trial=formal.get('trial') or {};trial_path=str(trial.get('image') or trial.get('path') or '').split('?',1)[0].lstrip('/')
    req(trial_path=='images/trial/trial-poster-small-boss-official-v20260814.jpg','試喝主圖不是目前核准海報')
    req((ROOT/trial_path).is_file(),'試喝主圖檔案不存在')

def main():
    validate_products();validate_public_surfaces();validate_media()
    print('PASS production release: six website products, six approved media, 30cc daily 1–2 cans, no retired fixed-time Guilu Gao chip, and deferred Qixuan excluded from website/public AI surfaces.')

if __name__=='__main__':main()
