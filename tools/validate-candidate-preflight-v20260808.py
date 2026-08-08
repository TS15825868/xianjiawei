#!/usr/bin/env python3
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
REPLACED={
    'XJW-WORK-REST-001','POST-STORAGE','POST-SEASONS-RHYTHM','POST-INGREDIENT-PRINCIPLE','POST-DAILY-SOUP',
    'POST-WEATHER-HOT','POST-WEATHER-TEMP','POST-WEATHER-RAIN','POST-GUIDE','POST-STORE','POST-RECIPES','POST-CHOOSE','POST-CHOOSE-BY-HABIT',
}
QUARANTINED_ASSETS={'post-09','post-12','post-13','post-14','generated-daily-soup','generated-four-seasons','generated-weather-hot','generated-weather-temp','generated-weather-rain','generated-choose-habit','generated-ingredient-principle'}

def load(path): return json.loads((ROOT/path).read_text(encoding='utf-8'))
def text(path): return (ROOT/path).read_text(encoding='utf-8')

def main():
    queue=load('content/image-generation-queue-v20260808.json'); manifest=load('content/post-bank-v6-manifest.json'); deploy=load('deploy-version.json'); assets=load('content/public-asset-library.json'); runtime=text('publishing-center-data-v11-campaign-holds.js')
    summary=queue['summary']
    assert summary['generationRequiredActive']==465 and summary['existingCandidateNeeds16PointReview']==21
    assert summary['preflightRejectedNeedsRegeneration']==0 and summary['preflightRejectedReplaced']==13
    assert summary['publishedFinalLocked']==3 and summary['campaignHold']==11 and 465+21+3+11==500
    counts=manifest['counts']; assert counts['activeImageGenerationRequired']==465 and counts['existingCandidateNeeds16PointReview']==21
    assert counts['preflightRejectedNeedsRegeneration']==0 and counts['preflightRejectedReplaced']==13 and counts['runtimeTotal']==500
    public=deploy['contentAuthority']; assert public['activeImageGenerationRequired']==465 and public['existingCandidateNeeds16PointReview']==21
    assert public['preflightRejectedNeedsRegeneration']==0 and public['preflightRejectedReplaced']==13
    assert deploy['candidatePreflight']['oldRejectedCount']==13 and deploy['candidatePreflight']['replacementGeneratedCount']==13
    assert set(deploy['candidatePreflight']['postIds'])==REPLACED

    bindings=assets.get('preflightRejectedBindings',[]); assert len(bindings)==13 and {x['post_id'] for x in bindings}==REPLACED
    by_asset={x.get('id'):x for x in assets.get('assets',[])}
    for asset_id in QUARANTINED_ASSETS:
        assert by_asset[asset_id].get('status') in {'deprecated-reference-only','preflight-rejected-reference-only'}

    replacement_batch=next(x for x in queue['priorityBatches'] if x.get('priority')==0)
    assert replacement_batch['count']==13 and replacement_batch['status']=='generated_pending_16_point_review'
    assert set(replacement_batch['post_ids'])==REPLACED
    for post_id,path in replacement_batch['assets'].items():
        file=ROOT/path; assert file.is_file(),f'缺少替代候選：{post_id} {path}'
        svg=file.read_text(encoding='utf-8'); assert '<svg' in svg and '1254' in svg
        assert path in runtime and post_id in runtime
    for product_scene in ['guide-use.svg','choose-products.svg','choose-by-habit.svg']:
        svg=(ROOT/'images/posts/generated-v20260808-preflight'/product_scene).read_text(encoding='utf-8')
        assert '../../products-v3/' in svg and 'preserveAspectRatio="xMidYMid meet"' in svg
    for product_free in ['work-rest.svg','storage.svg','four-seasons.svg','ingredient-principle.svg','daily-soup.svg','weather-hot.svg','weather-temp.svg','weather-rain.svg','contact-line.svg','recipes.svg']:
        svg=(ROOT/'images/posts/generated-v20260808-preflight'/product_free).read_text(encoding='utf-8')
        assert '../../products-v3/' not in svg

    assert "candidate_generation_mode:'strict-preflight-replacement'" in runtime
    assert "image_preflight:'replaced_after_reject'" in runtime
    print('PASS preflight replacements: 13 unsafe old visuals quarantined, 13 safe replacements generated; 465 generation / 21 review / 3 locked / 11 hold = 500.')

if __name__=='__main__': main()
