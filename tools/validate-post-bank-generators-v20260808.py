#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT=Path(__file__).resolve().parents[1]
V6=ROOT/'publishing-center-data-v6.js'; V7=ROOT/'publishing-center-data-v7.js'; MANIFEST=ROOT/'content/post-bank-v6-manifest.json'; QUEUE=ROOT/'content/image-generation-queue-v20260808.json'
def require(c,m):
    if not c: raise AssertionError(m)
def main():
    v6=V6.read_text(encoding='utf-8'); v7=V7.read_text(encoding='utf-8'); combined=v6+'\n'+v7
    manifest=json.loads(MANIFEST.read_text(encoding='utf-8')); queue=json.loads(QUEUE.read_text(encoding='utf-8'))
    require('posts.length!==300' in v6,'v6 必須明確驗證300篇'); require('extra.length!==177' in v7,'v7 必須明確驗證177篇'); require('bossCount!==32||companionCount!==16' in v7,'v7 必須驗證角色數')
    for pattern in [r'龜鹿湯塊\s*300\s*g',r'龜鹿湯塊\s*600\s*g',r'guilu-tangkuai-300',r'guilu-tangkuai-600',r'小老闆出現時小鹿與小烏龜必須一起出現',r'PRODUCTS\.length\s*!==\s*8']:
        require(not re.search(pattern,combined,flags=re.I),f'500篇母生成器仍含舊規則：{pattern}')
    for product_id in ['guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen']: require(product_id in v6,f'v6缺少正式產品：{product_id}')
    require('只有75g深藍正式盒裝' in v6,'v6未鎖75g-only'); require('姿勢依情境自由變化' in combined,'未同步小老闆自由姿勢'); require('不是每張強制出現' in combined,'未同步夥伴規則')
    counts=manifest['counts']; require(counts['base']==23 and counts['generatedCopyQueueV6']==300 and counts['generatedCopyQueueV7']==177 and counts['runtimeTotal']==500,'500篇計數錯誤')
    require(counts['activeImageGenerationRequired']==465,'待生成圖片數不是465'); require(counts['existingCandidateNeeds16PointReview']==21,'候選數不是21'); require(counts['preflightRejectedNeedsRegeneration']==0,'仍有預檢退回未重做'); require(counts['preflightRejectedReplaced']==13,'替代候選數不是13')
    s=queue['summary']; require(queue['runtimeContentTotal']==500,'圖片佇列總數錯誤'); require(s['generationRequiredActive']==465 and s['existingCandidateNeeds16PointReview']==21,'圖片佇列465/21不一致'); require(s['preflightRejectedNeedsRegeneration']==0 and s['preflightRejectedReplaced']==13,'預檢替代狀態不一致'); require(s['publishedFinalLocked']==3 and s['campaignHold']==11,'鎖定／冷卻數錯誤'); require(465+21+3+11==500,'圖片狀態合計不是500')
    pillars=manifest['generatedCopyQueueByPillar']; require(sum(int(v) for v in pillars.values())==477,'生成分類合計必須477'); require(pillars['小老闆與夥伴']==32 and pillars['陪伴角色']==16 and pillars['FAQ']==48 and pillars['試喝活動']==12,'分類數錯誤')
    print('PASS post bank generators: base23 + v6 300 + v7 177 = 500; queue 465 generation / 21 review / 3 locked / 11 hold; 13 unsafe visuals replaced')
if __name__=='__main__': main()
