#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT=Path(__file__).resolve().parents[1]
V6=ROOT/'publishing-center-data-v6.js';V7=ROOT/'publishing-center-data-v7.js';MANIFEST=ROOT/'content/post-bank-v6-manifest.json';QUEUE=ROOT/'content/image-generation-queue-v20260808.json'
def require(c,m):
    if not c: raise AssertionError(m)
def main():
    v6=V6.read_text(encoding='utf-8');v7=V7.read_text(encoding='utf-8');combined=v6+'\n'+v7
    manifest=json.loads(MANIFEST.read_text(encoding='utf-8'));queue=json.loads(QUEUE.read_text(encoding='utf-8'))
    require('posts.length!==300' in v6,'v6 必須明確驗證300篇');require('extra.length!==177' in v7,'v7 必須明確驗證177篇');require('bossCount!==32||companionCount!==16' in v7,'v7 必須驗證角色數')
    for pattern in [r'龜鹿湯塊\s*300\s*g',r'龜鹿湯塊\s*600\s*g',r'guilu-tangkuai-300',r'guilu-tangkuai-600',r'小老闆出現時小鹿與小烏龜必須一起出現',r'PRODUCTS\.length\s*!==\s*8']:
        require(not re.search(pattern,combined,flags=re.I),f'500篇母生成器仍含舊規則：{pattern}')
    for product_id in ['guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen']:require(product_id in v6,f'v6缺少正式產品：{product_id}')
    require('只有75g深藍正式盒裝' in v6,'v6未鎖75g-only');require('姿勢依情境自由變化' in combined,'未同步小老闆自由姿勢');require('不是每張強制出現' in combined,'未同步夥伴規則')
    counts=manifest['counts'];require(counts['base']==23 and counts['generatedCopyQueueV6']==300 and counts['generatedCopyQueueV7']==177 and counts['runtimeTotal']==500,'500篇計數錯誤')
    require(counts['activeImageGenerationRequired']==0,'仍有缺圖待生成');require(counts['existingCandidateNeeds16PointReview']==486,'候選數不是486');require(counts['preflightRejectedNeedsRegeneration']==0,'仍有預檢退回未重做');require(counts['preflightRejectedReplaced']==13,'替代候選數不是13')
    coverage=manifest['runtimeCandidateCoverage'];require(coverage['v12SafeNonCharacter']==345 and coverage['v13FestivalLocationWanhua']==72 and coverage['v14BossDaily']==32 and coverage['v15Companions']==16,'v12-v15候選覆蓋數錯誤');require(coverage['candidateReviewTotal']==486 and coverage['missingImageTotal']==0,'候選覆蓋總數錯誤')
    s=queue['summary'];require(queue['runtimeContentTotal']==500,'圖片佇列總數錯誤');require(s['generationRequiredActive']==0 and s['existingCandidateNeeds16PointReview']==486,'圖片佇列0/486不一致');require(s['preflightRejectedNeedsRegeneration']==0 and s['preflightRejectedReplaced']==13,'預檢替代狀態不一致');require(s['publishedFinalLocked']==3 and s['campaignHold']==11,'鎖定／冷卻數錯誤');require(0+486+3+11==500,'圖片狀態合計不是500')
    qcov=queue['runtimeCandidateCoverage'];require(qcov['v12SafeNonCharacter']==345 and qcov['v13FestivalLocationWanhua']==72 and qcov['v14BossDaily']==32 and qcov['v15Companions']==16,'圖片佇列v12-v15覆蓋錯誤')
    pillars=manifest['generatedCopyQueueByPillar'];require(sum(int(v) for v in pillars.values())==477,'生成分類合計必須477');require(pillars['小老闆與夥伴']==32 and pillars['陪伴角色']==16 and pillars['FAQ']==48 and pillars['試喝活動']==12,'分類數錯誤')

    # 最新配圖原則驗「能力／資料」，不綁任何單一 v21/v22 版號或舊固定文案。
    require(manifest.get('formalMediaAuthority')=='data/formal-media-authority-v20260810.json','母庫必須連到目前正式DM／試喝權威')
    require(manifest.get('latestUserZipCatalog')=='data/post-library-userzip2-v20260810.json','母庫必須連到最新使用者2.zip圖庫')
    wf=manifest.get('imageWorkflow') or {}
    priority=wf.get('priority') or []
    joined='｜'.join(priority)
    require('正式DM' in joined and '2.zip' in joined and '重新生成' in joined,'母庫缺少正式DM→2.zip→缺圖才重生成的優先能力')
    require('products-v3' in str(wf.get('productIdentityAuthority','')),'產品身分權威必須維持products-v3真正正式原圖')
    require('public_url' in str(wf.get('zipBinaryRule','')) and '真實二進位' in str(wf.get('zipBinaryRule','')),'ZIP候選必須驗真實二進位與可載入public_url')
    regen=str(wf.get('regenerationRule',''))
    require('pending_review' in regen and '16項' in regen and '不得自動核准或發布' in regen,'重生成／換圖後必須回待審核、重跑16項且不得自動發布')
    require(wf.get('currentMissingImageTotal')==0,'目前500篇母庫仍不應被誤判為缺圖而大量重生成')

    print('PASS post bank: runtime500; 0 missing / 486 review candidates / 3 locked / 11 hold; approved DM first, latest 2.zip second, regeneration only when truly missing; guards validate capability rather than legacy version text')
if __name__=='__main__':main()
