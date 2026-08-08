#!/usr/bin/env python3
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
REJECTED={
    'XJW-WORK-REST-001',
    'POST-STORAGE',
    'POST-SEASONS-RHYTHM',
    'POST-INGREDIENT-PRINCIPLE',
    'POST-DAILY-SOUP',
    'POST-WEATHER-HOT',
    'POST-WEATHER-TEMP',
    'POST-WEATHER-RAIN',
}

def load(path):
    return json.loads((ROOT/path).read_text(encoding='utf-8'))

def text(path):
    return (ROOT/path).read_text(encoding='utf-8')

def main():
    queue=load('content/image-generation-queue-v20260808.json')
    manifest=load('content/post-bank-v6-manifest.json')
    deploy=load('deploy-version.json')
    runtime=text('publishing-center-data-v11-campaign-holds.js')

    summary=queue['summary']
    assert summary['generationRequiredActive']==473, summary
    assert summary['existingCandidateNeeds16PointReview']==13, summary
    assert summary['preflightRejectedNeedsRegeneration']==8, summary
    assert summary['publishedFinalLocked']==3 and summary['campaignHold']==11
    assert 473+13+3+11==500
    assert set(queue['preflightRejected']['post_ids'])==REJECTED

    counts=manifest['counts']
    assert counts['runtimeTotal']==500
    assert counts['activeImageGenerationRequired']==473
    assert counts['existingCandidateNeeds16PointReview']==13
    assert counts['preflightRejectedNeedsRegeneration']==8

    public=deploy['contentAuthority']
    assert public['runtimeContentTotal']==500
    assert public['activeImageGenerationRequired']==473
    assert public['existingCandidateNeeds16PointReview']==13
    assert public['preflightRejectedNeedsRegeneration']==8

    for post_id in REJECTED:
        assert f"'{post_id}'" in runtime, f'發布中心未鎖定預檢退回：{post_id}'
    assert "image_status:'needs_generation'" in runtime
    assert "image_preflight:'rejected'" in runtime

    # 已知的失敗來源不得再被當成通過依據。
    assert "POST-SEASONS-RHYTHM':'原四季候選四格重複同一張 home-brand 圖" in runtime
    assert "POST-INGREDIENT-PRINCIPLE':'原候選嵌入已標記 deprecated-reference-only 的 products-all" in runtime
    for post_id in ['POST-WEATHER-HOT','POST-WEATHER-TEMP','POST-WEATHER-RAIN']:
        assert post_id in runtime and 'home-brand' in runtime

    print('PASS candidate preflight: 8 deterministic mismatches rejected; 473 generation / 13 review / 3 locked / 11 hold = 500.')

if __name__=='__main__':
    main()
