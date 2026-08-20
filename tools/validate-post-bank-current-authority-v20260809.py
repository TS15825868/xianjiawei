#!/usr/bin/env python3
from __future__ import annotations

import json
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CURRENT_30='每日 1–2 罐'
DEFERRED=('柒玄茶・龜鹿調飲粉','qixuan-guilu-drink-powder')

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def load(rel): return json.loads((ROOT/rel).read_text(encoding='utf-8'))
def read(rel): return (ROOT/rel).read_text(encoding='utf-8')

def main():
    authority=load('content/post-bank-current-authority-v20260809.json')
    base=load('content/public-post-library.json')
    formal=load('data/formal-media-authority-v20260810.json')
    exporter=read('post-bank-export.html')
    current_guard=read('publishing-center-data-current-authority-guard.js')

    product=authority['productAuthority']
    req(product.get('textSource')=='public-product-master.json','貼文母庫文字權威必須是public-product-master.json')
    req(product.get('knowledgeProductCount')==6,'公開貼文產品目前必須為六項')
    req(product.get('approvedMediaProductCount')==6,'公開貼文核准產品媒體必須為六項')
    req(product.get('drink30Usage')==CURRENT_30,'貼文母庫30cc用法必須為每日 1–2 罐')
    req(product.get('drink180Usage')=='每日一包','貼文母庫180cc用法必須為每日一包')
    req(product.get('latestAuthorityWins') is True,'新版產品權威必須優先')
    req('柒玄茶' in str(product.get('deferredProductPolicy') or ''),'貼文母庫缺少柒玄茶暫緩公開政策')

    bank=authority['contentBank']
    req(bank.get('runtimeCountPolicy')=='current-catalog-dynamic','正式母庫張數必須跟隨目前catalog')
    req(int(bank.get('minimumRuntimeCount') or 0)>=1,'正式母庫至少必須有一篇可驗證內容')
    req(bank.get('declaredCountMustMatchRuntime') is True and bank.get('uniqueIdsRequired') is True,'母庫張數與ID唯一性規則缺失')
    req(bank.get('runtimeValidator')=='tools/validate-post-bank-runtime-current.mjs','目前權威必須指向runtime驗收')
    req(bank.get('currentAuthorityGuard')=='publishing-center-data-current-authority-guard.js','目前權威必須載入目前資產守門')

    migration=authority['migration']
    req(migration.get('deduplicateBySourceId') is True and migration.get('boundedWriteConcurrency') is True,'母庫同步必須去重且限制寫入併發')
    req(migration.get('autoApprove') is False and migration.get('autoSchedule') is False and migration.get('autoPublish') is False,'母庫同步不得自動核准／排程／發布')

    state=authority['imageState']
    req(state.get('productTextAuthoritySource')=='public-product-master.json','產品文字權威來源錯誤')
    req(state.get('customerProductDisplayAuthority')=='images/customer-display-v20260812/','顧客產品主圖權威錯誤')
    req(state.get('productIdentityReference')=='images/products-v3/','products-v3只能作身份／比例參考')
    req(state.get('formalMediaAuthority')=='data/formal-media-authority-v20260810.json','formal media authority錯誤')
    req(state.get('legacyProductImagesRejected') is True and state.get('unapprovedDmRejected') is True,'舊產品圖／未核准DM必須拒絕')
    req(state.get('deferredProductPublicMediaForbidden') is True,'柒玄茶暫緩期間不得進公開貼文媒體')
    req(isinstance(formal.get('products'),list) and len(formal.get('products'))==6,'目前正式產品媒體必須維持六項')

    post_auth=base.get('productAuthority') or {}
    req(post_auth.get('textAuthority')=='public-product-master.json','公開貼文母庫未綁目前文字權威')
    req(post_auth.get('knowledgeProducts')==6 and post_auth.get('approvedMediaProducts')==6,'公開貼文母庫必須是六公開產品／六媒體')
    req(post_auth.get('drink30Usage')==CURRENT_30,'公開貼文母庫30cc用法錯誤')
    serialized_base=json.dumps(base,ensure_ascii=False)
    for marker in DEFERRED:req(marker not in serialized_base,f'公開貼文母庫重新出現暫緩產品：{marker}')

    by={p.get('id'):p for p in base.get('posts',[])}
    overview=str(by['POST-PRODUCT-OVERVIEW'].get('copy') or '')
    req('六項產品' in overview or '官網公開六項產品' in overview,'產品總覽必須是目前六項公開產品')
    req(CURRENT_30 in str(by['POST-DRINK-30'].get('copy') or ''),'30cc待審貼文缺目前使用方式')
    req('每日一包' in str(by['POST-DRINK-180'].get('copy') or ''),'180cc待審貼文缺目前使用方式')

    guard_policy=authority['guardPolicy']
    req(all(guard_policy.get(k) is True for k in [
        'validateCurrentAuthority','validateCapabilitiesNotHistoricalVersions','fixedHistoricalPostCountsForbidden',
        'oldZipNameAsLatestAuthorityForbidden','oldProductDataMayNotOverrideCurrent','approvedCurrentMediaMustNotBeQuarantinedByOldRules',
        'oldSevenProductWebsiteModelForbidden'
    ]),'目前守門政策未完整禁止舊資料誤擋')

    req('publishing-center-data-current-authority-guard.js?v=current' in exporter,'匯出頁缺最後一層目前資產權威守門')
    req('posts.length<1' in exporter and 'new Set(ids).size!==posts.length' in exporter,'匯出頁缺目前母庫基本能力驗收')
    req('posts.length!==500' not in exporter and 'KNOWN_REGENERATION_MINIMUM' not in exporter,'匯出頁不得再使用歷史固定數量')

    for token in ['public-asset-library.json','formal-media-authority-v20260810.json','currentFormalPaths','needs_generation','products-v3','每日 1–2 罐','knowledgeProducts:6','早上＋下午']:
        req(token in current_guard,f'目前資產權威守門缺少或未處理：{token}')
    req('knowledgeProducts:7' not in current_guard,'目前資產守門仍會把公開貼文改回七項')
    req("publish_allowed:false" in current_guard and "schedule_enabled:false" in current_guard and "status:'pending_review'" in current_guard,'不合格資產處理後必須回待審核且不可發布／排程')

    regeneration=authority['regeneration']
    req(regeneration.get('resultStatus')=='pending_review' and regeneration.get('reviewRequiredAfterGeneration') is True,'重生成完成後必須回待審核')
    req(regeneration.get('publishedContentLocked') is True,'已發布內容必須鎖定')

    subprocess.run(['node',str(ROOT/'tools/validate-post-bank-runtime-current.mjs')],cwd=ROOT,check=True)
    print('PASS current post bank authority: six public products, six approved media, current 30cc/180cc use, no stale seven-product or fixed-time Guilu Gao gate.')

if __name__=='__main__': main()
