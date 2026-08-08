#!/usr/bin/env python3
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1];QUEUE=ROOT/'content/image-generation-queue-v20260808.json';PATCH=ROOT/'publishing-center-data-v11-campaign-holds.js'
EXPECTED={'POST-PRODUCT-OVERVIEW':'images/posts/generated-v20260808-priority1/product-overview.svg','POST-GAO-100':'images/posts/generated-v20260808-priority1/guilu-gao-100g.svg','POST-DRINK-30':'images/posts/generated-v20260808-priority1/guilu-drink-30cc.svg','POST-DRINK-180':'images/posts/generated-v20260808-priority1/guilu-drink-180cc.svg','POST-JIAO-600':'images/posts/generated-v20260808-priority1/guilu-jiao-600g.svg','POST-COMBO':'images/posts/generated-v20260808-priority1/guilu-gao-drink-combo.svg'}
def main():
 data=json.loads(QUEUE.read_text(encoding='utf-8'));patch=PATCH.read_text(encoding='utf-8');s=data['summary']
 assert s['total']==500 and s['publishedFinalLocked']==3 and s['campaignHold']==11
 assert s['generationRequiredActive']==0 and s['existingCandidateNeeds16PointReview']==486
 assert s['preflightRejectedNeedsRegeneration']==0 and s['preflightRejectedReplaced']==13 and s['priority1GeneratedPendingReview']==6
 batch=next((x for x in data['priorityBatches'] if x.get('priority')==1),None);assert batch and batch['status']=='generated_pending_16_point_review' and batch['count']==6 and set(batch['post_ids'])==set(EXPECTED)
 for post_id,path in EXPECTED.items():
  file=ROOT/path;assert file.is_file(),f'缺少第一優先候選圖：{path}';svg=file.read_text(encoding='utf-8');assert '1254' in svg and '<svg' in svg and 'preserveAspectRatio="xMidYMid meet"' in svg;assert path in patch and post_id in patch
 assert "candidate_generation_mode:'exact-official-original-composite'" in patch and "publish_allowed:false" in patch and "approval_required:true" in patch
 print('PASS priority1 candidates: 6 exact-original SVG candidates intact; global queue 0 missing / 486 review / 3 locked / 11 hold')
if __name__=='__main__':main()
