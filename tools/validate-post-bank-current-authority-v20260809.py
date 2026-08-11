#!/usr/bin/env python3
from __future__ import annotations
import json
import subprocess
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def main():
    authority=json.loads((ROOT/'content/post-bank-current-authority-v20260809.json').read_text(encoding='utf-8'))
    exporter=(ROOT/'post-bank-export.html').read_text(encoding='utf-8')
    current_guard=(ROOT/'publishing-center-data-current-authority-guard.js').read_text(encoding='utf-8')
    base=json.loads((ROOT/'content/public-post-library.json').read_text(encoding='utf-8'))

    bank=authority['contentBank']
    req(bank.get('runtimeCountPolicy')=='current-catalog-dynamic','正式母庫張數必須跟隨目前catalog，不得鎖歷史固定數量')
    req(int(bank.get('minimumRuntimeCount') or 0)>=1,'正式母庫至少必須有一篇可驗證內容')
    req(bank.get('declaredCountMustMatchRuntime') is True,'母庫宣告張數必須與實際runtime一致')
    req(bank.get('uniqueIdsRequired') is True,'正式runtime母庫必須要求所有ID唯一')
    req(bank.get('assemblyMode')=='runtime-compatibility-layers','歷史資料層僅可保留作相容組裝')
    req(len(base.get('posts',[]))>0,'核心母庫不可為空')
    req(bank.get('runtimeValidator')=='tools/validate-post-bank-runtime-current.mjs','目前權威必須指向能力式runtime驗收')
    req(bank.get('currentAuthorityGuard')=='publishing-center-data-current-authority-guard.js','目前權威必須載入最後一層資產權威守門')

    migration=authority['migration']
    req(migration.get('deduplicateBySourceId') is True and migration.get('boundedWriteConcurrency') is True,'母庫同步必須以source id去重且限制寫入併發')
    req(migration.get('autoApprove') is False and migration.get('autoSchedule') is False and migration.get('autoPublish') is False,'母庫同步不得自動核准／排程／發布')
    req(migration.get('paidOpenAIApiRequired') is False,'貼文流程不得依賴付費OpenAI API')
    req('目前' in str(migration.get('syncButton') or ''),'同步按鈕文案必須表達目前母庫，不得鎖歷史篇數')

    state=authority['imageState']
    req(state.get('productImageAuthority')=='images/products-v3/','產品圖片權威必須是products-v3')
    req(state.get('publicAssetAuthority')=='content/public-asset-library.json','退役資產判斷必須依目前公開資產權威')
    req(state.get('formalMediaAuthority')=='data/formal-media-authority-v20260810.json','產品／試喝顧客展示必須依目前formal media authority')
    latest_catalog=str(state.get('latestUserPostCatalog') or '').strip()
    req(latest_catalog and (ROOT/latest_catalog).is_file(),'目前貼文圖來源沒有指向可讀取的最新使用者ZIP目錄')
    latest_zip=json.loads((ROOT/latest_catalog).read_text(encoding='utf-8'))
    req(state.get('legacyProductImagesRejected') is True and state.get('unapprovedDmRejected') is True,'舊產品圖／未核准DM必須拒絕')
    req(state.get('approvedCurrentDmAllowed') is True,'目前formal authority核准DM不得再被舊隔離規則誤擋')
    req('deprecated-reference-only' in state.get('deprecatedAssetStatusesRejectedForNewCandidates',[]),'deprecated資產必須退出新候選')
    candidate_count=int(latest_zip.get('candidate_count') or latest_zip.get('unique_image_count') or 0)
    original_count=int(latest_zip.get('original_file_count') or candidate_count)
    req(candidate_count>0 and original_count>=candidate_count,'目前最新使用者ZIP目錄候選數必須有效；不得要求歷史固定張數')
    req(latest_zip.get('binary_sync',{}).get('status') in {'pending','ready'},'最新ZIP binary狀態必須可判斷')

    guard_policy=authority['guardPolicy']
    req(all(guard_policy.get(k) is True for k in [
        'validateCurrentAuthority','validateCapabilitiesNotHistoricalVersions','fixedHistoricalPostCountsForbidden',
        'fixedHistoricalCandidateCountsForbidden','fixedHistoricalRegenerationMinimumsForbidden',
        'oldRuntimeStringEqualityForbidden','oldUiVersionEqualityForbidden','approvedCurrentMediaMustNotBeQuarantinedByOldRules'
    ]),'目前守門政策沒有完整禁止歷史版本／固定數字／舊媒體隔離規則誤擋')

    serialized=json.dumps(authority,ensure_ascii=False)
    for forbidden in ['runtimeTotalRequired','knownCharacterRegenerationMinimum','knownTotalRegenerationMinimum','knownApprovedMascotReuseCandidates','characterRegenerationBreakdown','quarantinedCurrentCopyConflict']:
        req(forbidden not in serialized,f'目前權威仍保留固定歷史門檻／舊隔離欄位：{forbidden}')

    req('publishing-center-data-current-authority-guard.js?v=current' in exporter,'匯出頁缺少最後一層目前資產權威守門')
    req('posts.length<1' in exporter,'匯出頁必須拒絕空白母庫')
    req('new Set(ids).size!==posts.length' in exporter,'匯出頁必須驗證目前ID唯一')
    req('declaredTotal!==posts.length' in exporter,'匯出頁必須驗證宣告張數與目前實際張數一致')
    req('current_post_count:true' in exporter and 'post_count_matches_current_catalog:true' in exporter,'匯出能力必須宣告動態目前母庫張數驗收')
    req('xjw-post-bank-export-v1' in exporter,'匯出schema缺失')
    req('https://xianjiawei-internal.tung314069.workers.dev' in exporter,'匯出頁沒有鎖定正式內部系統目標')
    req('noindex,nofollow,noarchive' in exporter,'匯出頁不得被搜尋引擎索引')
    req('posts.length!==500' not in exporter and 'post_count_500' not in exporter,'匯出頁不得再要求歷史500篇')
    req('KNOWN_REGENERATION_MINIMUM' not in exporter,'匯出頁不得再使用歷史重生成最低數量')

    for token in ['public-asset-library.json','formal-media-authority-v20260810.json','currentFormalPaths','deprecated-reference-only','preflight-rejected-reference-only','superseded-reference-only','current-authority-regeneration-required','needs_generation','products-v2']:
        req(token in current_guard,f'目前資產權威守門缺少：{token}')
    req("publish_allowed:false" in current_guard and "schedule_enabled:false" in current_guard,'退役／不合格資產回收後不得直接發布／排程')
    req("status:'pending_review'" in current_guard,'退役／不合格資產處理後必須回待審核')
    req("if(currentFormal.has(normalized))return''" in current_guard,'目前formal authority核准媒體必須優先放行，不得被舊DM目錄規則誤擋')

    regeneration=authority['regeneration']
    req(regeneration.get('mode')=='chatgpt-handoff-free-roundtrip','重生成模式不是免費ChatGPT交接閉環')
    req(regeneration.get('resultStatus')=='pending_review' and regeneration.get('reviewRequiredAfterGeneration') is True,'重生成完成後必須回待審核')
    req(regeneration.get('publishedContentLocked') is True,'已發布內容必須鎖定')
    req(regeneration.get('regenerateOnlyWhenNoApprovedSourceMatches') is True,'必須先找正式／ZIP合格來源，真的缺圖才重生成')

    validator=ROOT/'tools/validate-post-bank-runtime-current.mjs'
    req(validator.exists(),'缺少目前runtime能力式驗收工具')
    subprocess.run(['node',str(validator)],cwd=ROOT,check=True)

    print(f'PASS current post bank authority: dynamic runtime count + unique IDs + current asset/formal authority + products-v3 + current user ZIP({candidate_count} candidates) + pending-review regeneration; no fixed 500/history gates or retired 30cc quarantine.')

if __name__=='__main__':
    main()
