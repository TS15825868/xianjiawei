#!/usr/bin/env python3
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
REPLACEMENTS={
    'XJW-WORK-REST-001':('preflight-work-rest','images/posts/generated-v20260808-preflight/work-rest.svg'),
    'POST-STORAGE':('preflight-storage','images/posts/generated-v20260808-preflight/storage.svg'),
    'POST-SEASONS-RHYTHM':('preflight-four-seasons','images/posts/generated-v20260808-preflight/four-seasons.svg'),
    'POST-INGREDIENT-PRINCIPLE':('preflight-ingredient-principle','images/posts/generated-v20260808-preflight/ingredient-principle.svg'),
    'POST-DAILY-SOUP':('preflight-daily-soup','images/posts/generated-v20260808-preflight/daily-soup.svg'),
    'POST-WEATHER-HOT':('preflight-weather-hot','images/posts/generated-v20260808-preflight/weather-hot.svg'),
    'POST-WEATHER-TEMP':('preflight-weather-temp','images/posts/generated-v20260808-preflight/weather-temp.svg'),
    'POST-WEATHER-RAIN':('preflight-weather-rain','images/posts/generated-v20260808-preflight/weather-rain.svg'),
    'POST-GUIDE':('preflight-guide-use','images/posts/generated-v20260808-preflight/guide-use.svg'),
    'POST-STORE':('preflight-contact-line','images/posts/generated-v20260808-preflight/contact-line.svg'),
    'POST-RECIPES':('preflight-recipes','images/posts/generated-v20260808-preflight/recipes.svg'),
    'POST-CHOOSE':('preflight-choose-products','images/posts/generated-v20260808-preflight/choose-products.svg'),
    'POST-CHOOSE-BY-HABIT':('preflight-choose-by-habit','images/posts/generated-v20260808-preflight/choose-by-habit.svg'),
}
REPLACED=set(REPLACEMENTS)
QUARANTINED_ASSETS={'post-09','post-12','post-13','post-14','generated-daily-soup','generated-four-seasons','generated-weather-hot','generated-weather-temp','generated-weather-rain','generated-choose-habit','generated-ingredient-principle'}
def load(path):return json.loads((ROOT/path).read_text(encoding='utf-8'))
def text(path):return (ROOT/path).read_text(encoding='utf-8')
def main():
    queue=load('content/image-generation-queue-v20260808.json');manifest=load('content/post-bank-v6-manifest.json');deploy=load('deploy-version.json');assets=load('content/public-asset-library.json');runtime=text('publishing-center-data-v11-campaign-holds.js')
    s=queue['summary'];assert s['generationRequiredActive']==0 and s['existingCandidateNeeds16PointReview']==486 and s['preflightRejectedNeedsRegeneration']==0 and s['preflightRejectedReplaced']==13 and s['publishedFinalLocked']==3 and s['campaignHold']==11 and 0+486+3+11==500
    c=manifest['counts'];assert c['runtimeTotal']==500 and c['activeImageGenerationRequired']==0 and c['existingCandidateNeeds16PointReview']==486 and c['preflightRejectedNeedsRegeneration']==0 and c['preflightRejectedReplaced']==13
    p=deploy['contentAuthority'];assert p['activeImageGenerationRequired']==0 and p['existingCandidateNeeds16PointReview']==486 and p['preflightRejectedNeedsRegeneration']==0 and p['preflightRejectedReplaced']==13
    assert deploy['candidatePreflight']['oldRejectedCount']==13 and deploy['candidatePreflight']['replacementGeneratedCount']==13
    bindings=assets.get('preflightRejectedBindings',[]);assert len(bindings)==13 and {x['post_id'] for x in bindings}==REPLACED
    by_asset={x.get('id'):x for x in assets.get('assets',[])}
    for asset_id in QUARANTINED_ASSETS:assert by_asset[asset_id].get('status') in {'deprecated-reference-only','preflight-rejected-reference-only'}
    batch=next(x for x in queue['priorityBatches'] if x.get('priority')==0);assert batch['count']==13 and batch['status']=='generated_pending_16_point_review' and set(batch['post_ids'])==REPLACED
    for post_id,(asset_id,path) in REPLACEMENTS.items():
        item=by_asset.get(asset_id);assert item and item.get('path')==path and item.get('status')=='candidate-review-required'
        file=ROOT/path;assert file.is_file();svg=file.read_text(encoding='utf-8');assert '<svg' in svg and '1254' in svg
        assert post_id in runtime and path in runtime and f"id:'{asset_id}'" in runtime
    for name in ['guide-use.svg','choose-products.svg','choose-by-habit.svg']:
        svg=(ROOT/'images/posts/generated-v20260808-preflight'/name).read_text(encoding='utf-8');assert '../../products-v3/' in svg and 'preserveAspectRatio="xMidYMid meet"' in svg
    for name in ['work-rest.svg','storage.svg','four-seasons.svg','ingredient-principle.svg','daily-soup.svg','weather-hot.svg','weather-temp.svg','weather-rain.svg','contact-line.svg','recipes.svg']:
        svg=(ROOT/'images/posts/generated-v20260808-preflight'/name).read_text(encoding='utf-8');assert '../../products-v3/' not in svg
    assert "candidate_generation_mode:'strict-preflight-replacement'" in runtime and "image_preflight:'replaced_after_reject'" in runtime and 'image_asset_id:replacement.id' in runtime
    print('PASS preflight replacements: 13 unsafe old visuals quarantined and replaced; global runtime now 0 missing / 486 review / 3 locked / 11 hold')
if __name__=='__main__':main()
