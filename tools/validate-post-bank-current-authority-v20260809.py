#!/usr/bin/env python3
from __future__ import annotations
import json
import re
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
    latest_zip=json.loads((ROOT/'data/post-library-userzip3-v20260811.json').read_text(encoding='utf-8'))

    bank=authority['contentBank']
    req(bank['runtimeTotalRequired']==500,'正式runtime母庫必須要求500篇')
    req(bank['uniqueIdsRequired'] is True,'正式runtime母庫必須要求500個唯一ID')
    req(bank['assemblyMode']=='runtime-compatibility-layers','500篇應保留相容資料層組裝，不可把23篇核心JSON誤當完整母庫')
    req(len(base.get('posts',[]))>0,'核心母庫不可為空')
    req(bank['runtimeValidator']=='tools/validate-post-bank-runtime-current.mjs','目前權威必須指向能力式runtime500驗收')
    req(bank['currentAuthorityGuard']=='publishing-center-data-current-authority-guard.js','目前權威必須載入最後一層資產權威守門')

    migration=authority['migration']
    req(migration['deduplicateBySourceId'] is True and migration['boundedWriteConcurrency'] is True,'500篇同步必須以source id去重且限制寫入併發')
    req(migration['autoApprove'] is False and migration['autoSchedule'] is False and migration['autoPublish'] is False,'500篇同步不得自動核准／排程／發布')
    req(migration['paidOpenAIApiRequired'] is False,'500篇流程不得依賴付費OpenAI API')

    state=authority['imageState']
    req(state['productImageAuthority']=='images/products-v3/','產品圖片權威必須是products-v3')
    req(state['publicAssetAuthority']=='content/public-asset-library.json','退役資產判斷必須依目前公開資產權威')
    req(state['latestUserPostCatalog']=='data/post-library-userzip3-v20260811.json','目前貼文圖來源沒有指向最新使用者ZIP目錄')
    req(state['legacyProductImagesRejected'] is True and state['legacyDmRejected'] is True,'舊產品圖／舊DM必須拒絕')
    req('deprecated-reference-only' in state['deprecatedAssetStatusesRejectedForNewCandidates'],'deprecated資產必須退出新候選')
    req('guilu-drink-30cc.webp' in state['quarantinedCurrentCopyConflict'],'30cc錯單位DM必須隔離')
    req(latest_zip.get('unique_image_count')==20 and latest_zip.get('original_file_count')==21,'目前最新使用者ZIP目錄應記錄21檔／20張唯一圖')
    req(latest_zip.get('binary_sync',{}).get('status') in {'pending','ready'},'最新ZIP binary狀態必須可判斷')

    guard_policy=authority['guardPolicy']
    req(all(guard_policy.get(k) is True for k in [
        'validateCurrentAuthority','validateCapabilitiesNotHistoricalVersions',
        'fixedHistoricalCandidateCountsForbidden','fixedHistoricalRegenerationMinimumsForbidden',
        'oldRuntimeStringEqualityForbidden','oldUiVersionEqualityForbidden'
    ]),'目前守門政策沒有完整禁止歷史版本／固定數字誤擋')

    serialized=json.dumps(authority,ensure_ascii=False)
    for forbidden in ['knownCharacterRegenerationMinimum','knownTotalRegenerationMinimum','knownApprovedMascotReuseCandidates','characterRegenerationBreakdown']:
        req(forbidden not in serialized,f'目前權威仍保留固定歷史門檻：{forbidden}')

    req('publishing-center-data-current-authority-guard.js?v=current' in exporter,'500篇匯出頁缺少最後一層目前資產權威守門')
    req("posts.length!==500" in exporter,'匯出頁未驗證runtime500篇')
    req('current_asset_authority_guard:true' in exporter,'匯出能力沒有宣告目前資產權威守門')
    req('xjw-post-bank-export-v1' in exporter,'匯出schema缺失')
    req('https://xianjiawei-internal.tung314069.workers.dev' in exporter,'匯出頁沒有鎖定正式內部系統目標')
    req('noindex,nofollow,noarchive' in exporter,'匯出頁不得被搜尋引擎索引')
    req('KNOWN_REGENERATION_MINIMUM' not in exporter,'匯出頁不得再使用歷史重生成最低數量')
    req('event.data.runtime!==' not in exporter,'匯出頁不得要求舊runtime逐字相等')

    for token in ['public-asset-library.json','deprecated-reference-only','preflight-rejected-reference-only','superseded-reference-only','current-authority-regeneration-required','needs_generation','products-v2','dm-final','guilu-drink-30cc.webp']:
        req(token in current_guard,f'目前資產權威守門缺少：{token}')
    req("publish_allowed:false" in current_guard and "schedule_enabled:false" in current_guard,'退役資產回收後不得直接發布／排程')
    req("status:'pending_review'" in current_guard,'退役資產處理後必須回待審核')

    regeneration=authority['regeneration']
    req(regeneration['mode']=='chatgpt-handoff-free-roundtrip','重生成模式不是免費ChatGPT交接閉環')
    req(regeneration['resultStatus']=='pending_review' and regeneration['reviewRequiredAfterGeneration'] is True,'重生成完成後必須回待審核')
    req(regeneration['publishedContentLocked'] is True,'已發布內容必須鎖定')
    req(regeneration['regenerateOnlyWhenNoApprovedSourceMatches'] is True,'必須先找正式／ZIP合格來源，真的缺圖才重生成')

    validator=ROOT/'tools/validate-post-bank-runtime-current.mjs'
    req(validator.exists(),'缺少runtime500能力式驗收工具')
    subprocess.run(['node',str(validator)],cwd=ROOT,check=True)

    print('PASS current post bank authority: runtime500 + unique IDs + current asset authority + products-v3 + latest user ZIP + pending-review regeneration; no fixed historical candidate/regeneration gates.')

if __name__=='__main__':
    main()
