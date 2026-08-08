#!/usr/bin/env python3
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def text(path): return (ROOT/path).read_text(encoding='utf-8')
def req(ok,msg):
    if not ok: raise AssertionError(msg)

def main():
    html=text('publishing-center.html')
    v12=text('publishing-center-data-v12-auto-candidates.js')
    bridge=text('publishing-center-erp-bridge.js')
    req('publishing-center-data-v12-auto-candidates.js' in html,'發布中心未載入v12自動候選層')
    req(html.index('publishing-center-data-v11-campaign-holds.js')<html.index('publishing-center-data-v12-auto-candidates.js')<html.index('publishing-center-v2.js'),'v12載入順序錯誤')
    req("String(p.characters||'').trim()" in v12,'v12沒有避開明確角色需求貼文')
    req("candidate_generation_mode:'runtime-safe-svg-v12'" in v12,'v12候選沒有獨立模式標記')
    req("image_status:'candidate-review-required'" in v12,'v12沒有強制回待審核')
    req('publish_allowed:false' in v12 and 'schedule_enabled:false' in v12,'v12候選仍可能直接發布／排程')
    for phrase in ['龜鹿膏','100g／罐','龜鹿飲30cc玻璃罐','30cc／罐（小玻璃罐）','龜鹿飲180cc鋁袋','180cc／包（鋁袋）','龜鹿湯塊','75g／盒｜8塊裝｜每塊約9.375g','龜鹿膠','600g（1斤）／盒｜32塊裝｜每塊約18.75g','鹿茸粉','75g／罐']:
        req(phrase in v12,f'v12缺少正式產品權威：{phrase}')
    req('candidate_svg:' in bridge,'ERP交接沒有帶runtime SVG本體')
    req("window.XJWRuntimeCandidateFactory?.getSvg?." in bridge,'ERP交接沒有從v12取得SVG')
    req("window.open('about:blank','_blank')" in bridge,'iPhone Safari交接未預先開啟分頁')
    req('location.replace(erpUrl)' in bridge,'預留分頁沒有安全導向ERP')
    print('PASS runtime candidates: safe non-character SVG -> public review -> transferable ERP draft -> JPEG before approval')

if __name__=='__main__': main()
