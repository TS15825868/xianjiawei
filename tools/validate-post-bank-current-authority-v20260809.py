#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def req(ok,msg):
    if not ok: raise AssertionError(msg)

def main():
    authority=json.loads((ROOT/'content/post-bank-current-authority-v20260809.json').read_text(encoding='utf-8'))
    exporter=(ROOT/'post-bank-export.html').read_text(encoding='utf-8')
    guard=(ROOT/'publishing-center-data-v17-retired-composite-guard.js').read_text(encoding='utf-8')
    base=json.loads((ROOT/'content/public-post-library.json').read_text(encoding='utf-8'))

    bank=authority['contentBank']
    req(bank['baseCount']==23 and bank['generatedV6Count']==300 and bank['generatedV7Count']==177,'500篇內容庫來源計數錯誤')
    req(bank['baseCount']+bank['generatedV6Count']+bank['generatedV7Count']==bank['runtimeTotal']==500,'500篇總數不一致')
    req(len(base.get('posts',[]))==23,'基礎母庫應維持23篇')

    migration=authority['migration']
    req(migration['deduplicate'] is True and migration['writeConcurrency']==4,'500篇同步必須去重且小批量寫入')
    req(migration['autoApprove'] is False and migration['autoSchedule'] is False and migration['autoPublish'] is False,'500篇同步不得自動核准／排程／發布')
    req(migration['paidOpenAIApi'] is False,'500篇流程不得依賴付費OpenAI API')

    state=authority['imageState']
    req(state['knownApprovedMascotReuseCandidates']==4,'目前安全小老闆重用應為4篇')
    req(set(state['knownApprovedMascotReuseIds'])=={'XJW-CHARACTER-008','XJW-CHARACTER-011','XJW-CHARACTER-012','XJW-CHARACTER-014'},'安全小老闆重用ID不一致')
    req(state['retiredMascotReuseIds']==['XJW-CHARACTER-006'],'home-brand舊候選應退役XJW-CHARACTER-006')
    req(state['knownCharacterRegenerationMinimum']==116,'目前已知角色重生成最低數量應為116')
    breakdown=state['characterRegenerationBreakdown']
    req(breakdown['festivalLocationWanhua']+breakdown['bossDailyWithoutApprovedReuse']+breakdown['companions']==116,'角色重生成拆分加總錯誤')
    req(state['legacyHomeBrandCompositeStatus']=='retired-from-new-candidates','home-brand多產品情境圖未標記退役')

    req('XJW-CHARACTER-006' in guard and 'home-brand.webp' in guard,'v17沒有攔截舊home-brand候選')
    req("image_status:'needs_generation'" in guard,'v17退役候選沒有回needs_generation')
    req("publish_allowed:false" in guard and "schedule_enabled:false" in guard,'v17退役候選不得發布／排程')

    order=[
      'publishing-center-data-v6.js','publishing-center-data-v7.js','publishing-center-data-v8-fixes.js',
      'publishing-center-data-v10-published-locks.js','publishing-center-data-v11-campaign-holds.js',
      'publishing-center-data-v12-auto-candidates.js','publishing-center-data-v13-character-scenes.js',
      'publishing-center-data-v14-boss-daily.js','publishing-center-data-v15-companions.js',
      'publishing-center-data-v16-actual-product-photos.js','publishing-center-data-v17-retired-composite-guard.js'
    ]
    positions=[exporter.find(name) for name in order]
    req(all(pos>=0 for pos in positions),'500篇匯出頁缺少runtime安全層')
    req(positions==sorted(positions),'500篇匯出頁runtime安全層順序錯誤')
    req("posts.length!==500" in exporter,'匯出頁未硬性驗證500篇')
    req('xjw-post-bank-export-v1' in exporter,'匯出schema缺失')
    req('https://xianjiawei-internal.tung314069.workers.dev' in exporter,'匯出頁沒有鎖定正式內部系統目標')
    req('noindex,nofollow,noarchive' in exporter,'匯出頁不得被搜尋引擎索引')

    regeneration=authority['regeneration']
    req(regeneration['mode']=='chatgpt-handoff-free-roundtrip','重生成模式不是免費ChatGPT交接閉環')
    req(regeneration['resultStatus']=='pending_review' and regeneration['reviewRequiredAfterGeneration'] is True,'重生成完成後必須回待審核')
    req(regeneration['publishedContentLocked'] is True,'已發布內容必須鎖定')

    print('PASS current post bank authority: 23+300+177=500; home-brand retired; safe mascot reuse=4; known regeneration minimum=116; exporter and free review round-trip locked.')

if __name__=='__main__':
    main()
