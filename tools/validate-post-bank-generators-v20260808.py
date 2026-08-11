#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT=Path(__file__).resolve().parents[1]
V6=ROOT/'publishing-center-data-v6.js'
V7=ROOT/'publishing-center-data-v7.js'
MANIFEST=ROOT/'content/post-bank-v6-manifest.json'

def require(c,m):
    if not c: raise AssertionError(m)

def main():
    v6=V6.read_text(encoding='utf-8')
    v7=V7.read_text(encoding='utf-8')
    combined=v6+'\n'+v7
    manifest=json.loads(MANIFEST.read_text(encoding='utf-8'))
    formal_path=str(manifest.get('formalMediaAuthority') or '')
    zip_path=str(manifest.get('latestUserZipCatalog') or '')
    require(formal_path and (ROOT/formal_path).is_file(),'相容母生成器manifest缺少目前formal media authority')
    require(zip_path and (ROOT/zip_path).is_file(),'相容母生成器manifest缺少目前最新使用者ZIP catalog')
    formal=json.loads((ROOT/formal_path).read_text(encoding='utf-8'))
    latest_zip=json.loads((ROOT/zip_path).read_text(encoding='utf-8'))

    # v6/v7 are compatibility data generators. Their historical output sizes are not release guard conditions.
    require(manifest.get('role')=='compatibility-assembly-manifest-not-fixed-count-guard','manifest必須明確標示歷史生成層不是固定張數守門')
    require(manifest.get('runtimeCountPolicy') and 'no fixed historical count' in manifest.get('runtimeCountPolicy',''),'母庫manifest必須明確禁止歷史固定張數成為發布條件')
    guard=manifest.get('guardPolicy') or {}
    for key in ['validateCurrentAuthority','validateCapabilitiesNotHistoricalVersions','fixedHistoricalPostCountsForbidden','fixedHistoricalCandidateCountsForbidden','fixedHistoricalRegenerationMinimumsForbidden','latestZipComesFromCurrentAuthority','approvedCurrentMediaMustNotBeRejectedByOldRules']:
        require(guard.get(key) is True,f'相容母庫守門政策缺少：{key}')

    for pattern in [
        r'龜鹿湯塊\s*300\s*g',r'龜鹿湯塊\s*600\s*g',r'guilu-tangkuai-300',r'guilu-tangkuai-600',
        r'小老闆出現時小鹿與小烏龜必須一起出現',r'PRODUCTS\.length\s*!==\s*8',
        r'龜鹿飲30cc玻璃瓶',r'30cc／瓶'
    ]:
        require(not re.search(pattern,combined,flags=re.I),f'相容母生成器仍含退役規則：{pattern}')
    for product_id in ['guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen']:
        require(product_id in combined,f'相容母生成器缺少目前正式產品：{product_id}')
    require('75g' in combined and '8塊' in combined,'相容母生成器缺少目前龜鹿湯塊75g／8塊能力')
    require('姿勢依情境自由變化' in combined,'相容母生成器未保留小老闆依情境改變姿勢能力')
    require('不是每張強制出現' in combined,'相容母生成器未保留夥伴依情境出現規則')

    require(len(formal.get('products') or [])==6,'目前formal media authority必須維持六項產品')
    require(all(p.get('status')=='approved_display' for p in formal.get('products') or []),'formal media產品顧客展示必須逐張核准')
    require(formal.get('trial',{}).get('status')=='approved_display','試喝正式媒體必須核准')
    require(str(formal.get('post_catalog') or '').lstrip('/')==zip_path,'相容母庫最新ZIP catalog必須跟目前formal authority一致')
    candidate_count=int(latest_zip.get('candidate_count') or latest_zip.get('unique_image_count') or 0)
    require(candidate_count>0,'目前最新使用者ZIP catalog沒有候選')
    require(latest_zip.get('binary_sync',{}).get('status') in {'pending','ready'},'目前最新ZIP binary狀態不明')

    wf=manifest.get('imageWorkflow') or {}
    joined='｜'.join(wf.get('priority') or [])
    require('formal media' in joined.lower() or '正式媒體' in joined,'母庫缺少目前正式媒體優先能力')
    require('最新使用者ZIP' in joined,'母庫缺少目前最新使用者ZIP優先能力')
    require('needs_binary_sync' in joined,'母庫缺少「有合格來源但binary未同步」狀態')
    require('重新生成' in joined,'母庫缺少真正無合格來源才重新生成能力')
    require('products-v3' in str(wf.get('productIdentityAuthority','')),'產品身分權威必須維持products-v3真正正式原圖')
    require('public_url' in str(wf.get('zipBinaryRule','')) and 'needs_binary_sync' in str(wf.get('zipBinaryRule','')),'ZIP候選必須驗真實binary／public_url並可標記needs_binary_sync')
    regen=str(wf.get('regenerationRule',''))
    require('pending_review' in regen and '16項' in regen and '不得自動核准或發布' in regen,'重生成／換圖後必須回待審核、重跑16項且不得自動發布')

    # Historical compatibility numbers may remain documented as snapshots, but never as required current truth.
    snapshot=manifest.get('historicalCompatibilitySnapshot') or {}
    require('note' in snapshot and 'never be used to reject' in str(snapshot.get('note','')),'歷史相容張數若保留，必須明確標示不可用來阻擋新版')

    print(f'PASS post-bank compatibility generators: six current products, current formal media, current ZIP ({candidate_count} candidates), products-v3 identity, semantic ZIP-first workflow, needs_binary_sync and 16-item review; historical 300/177/500 counts are documentation only, not release guards.')

if __name__=='__main__':main()
