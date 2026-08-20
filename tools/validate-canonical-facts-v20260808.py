#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CURRENT_30='每日 1–2 罐'
PUBLIC_IDS=['guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen']
DEFERRED=('柒玄茶・龜鹿調飲粉','qixuan-guilu-drink-powder')

def read(path): return (ROOT/path).read_text(encoding='utf-8')
def load(path): return json.loads(read(path))
def req(ok,msg):
    if not ok: raise AssertionError(msg)
def run_current_validator(path): subprocess.run([sys.executable,str(ROOT/path)],check=True)

def check_publishing_architecture():
    html=read('publishing-center.html');bridge=read('publishing-center-erp-bridge.js')
    req('publishing-center-erp-bridge.js' in html,'公開發布中心未載入ERP交接層')
    req('真正的社群立即發布由受保護的 ERP 執行' in html,'公開發布中心責任邊界不清楚')
    req('前往ERP立即發布' in bridge,'ERP立即發布交接按鈕缺失')
    req('published-manual' in bridge and 'erp-handoff-required' in bridge,'舊前端假發布紀錄處理缺失')
    req('xianjiawei-internal.tung314069.workers.dev/#posts' in bridge,'ERP貼文中心交接網址缺失')
    req('CHANNEL_ACCESS_TOKEN' not in html and 'CHANNEL_ACCESS_TOKEN' not in bridge,'公開頁不得含LINE token')

def check_post_library():
    doc=load('content/public-post-library.json');posts=doc.get('posts') or [];req(posts,'公開貼文母庫不得為空')
    ids=[str(p.get('id') or '').strip() for p in posts];req(all(ids) and len(ids)==len(set(ids)),'公開貼文ID不可空白或重複')
    serialized=json.dumps(doc,ensure_ascii=False)
    for marker in DEFERRED:req(marker not in serialized,f'公開貼文母庫重新出現暫緩產品：{marker}')
    for post in posts:
        body=json.dumps(post,ensure_ascii=False)
        req('龜鹿飲30cc玻璃瓶' not in body and '30cc／瓶' not in body,f"貼文 {post.get('id')} 仍含30cc舊瓶型")
        if '龜鹿飲30cc' in body or 'guilu-drink-30' in body:req('每日一罐' not in body or '不得回退成每日一罐' in body,f"貼文 {post.get('id')} 30cc回退成每日一罐")
        if post.get('status')=='published':req(post.get('prevent_republish') is True and post.get('do_not_republish') is True,f"已發布貼文未鎖定：{post.get('id')}")

def main():
    run_current_validator('tools/validate-site-production-release-v20260809.py')
    run_current_validator('tools/validate-ai-geo-current-v20260820.py')
    run_current_validator('tools/validate-public-boundary-v20260808.py')
    check_publishing_architecture();check_post_library()

    master=load('public-product-master.json');products={p.get('id'):p for p in master.get('products') or []}
    req(master.get('productCount')==6 and list(products)==PUBLIC_IDS,'目前公開母資料必須為六項官網產品')
    req((products['guilu-drink-30'].get('usage') or [None])[0]==CURRENT_30,'30cc目前用法必須精確為每日 1–2 罐')
    gao=read('product-guilu-gao.html');req('早上＋下午' not in gao and '早上+下午' not in gao,'龜鹿膏詳頁仍有舊固定時段標籤')
    for rel in ['index.html','products.html','guide.html','faq.html','ai-answers.json','geo-data.json']:
        text=read(rel)
        for marker in DEFERRED:req(marker not in text,f'{rel}重新公開暫緩產品：{marker}')

    print('PASS canonical audit: six website products, six approved media, current 30cc use, no fixed-time Guilu Gao chip, public boundaries and publishing architecture align.')

if __name__=='__main__':main()
