#!/usr/bin/env python3
from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]
QUEUE=ROOT/'content/image-generation-queue-v20260808.json'
PATCH=ROOT/'publishing-center-data-v11-campaign-holds.js'
EXPECTED={
 'POST-PRODUCT-OVERVIEW':'images/posts/generated-v20260808-priority1/product-overview.svg',
 'POST-GAO-100':'images/posts/generated-v20260808-priority1/guilu-gao-100g.svg',
 'POST-DRINK-30':'images/posts/generated-v20260808-priority1/guilu-drink-30cc.svg',
 'POST-DRINK-180':'images/posts/generated-v20260808-priority1/guilu-drink-180cc.svg',
 'POST-JIAO-600':'images/posts/generated-v20260808-priority1/guilu-jiao-600g.svg',
 'POST-COMBO':'images/posts/generated-v20260808-priority1/guilu-gao-drink-combo.svg',
}

def main():
 data=json.loads(QUEUE.read_text(encoding='utf-8'))
 patch=PATCH.read_text(encoding='utf-8')
 summary=data['summary']
 assert summary['total']==500
 assert summary['publishedFinalLocked']==3
 assert summary['campaignHold']==11
 assert summary['generationRequiredActive']==478
 assert summary['existingCandidateNeeds16PointReview']==8
 assert summary['preflightRejectedNeedsRegeneration']==13
 assert summary['priority1GeneratedPendingReview']==6
 batch=next((item for item in data['priorityBatches'] if item.get('priority')==1),None)
 assert batch is not None,'找不到第一優先候選批次'
 assert batch['status']=='generated_pending_16_point_review'
 assert batch['count']==6
 assert batch['assets']==EXPECTED
 for post_id,path in EXPECTED.items():
  file=ROOT/path
  assert file.is_file(),f'缺少第一優先候選圖：{path}'
  text=file.read_text(encoding='utf-8')
  assert '1254' in text and '<svg' in text
  assert 'preserveAspectRatio="xMidYMid meet"' in text
  assert path in patch and post_id in patch
 assert "candidate_generation_mode:'exact-official-original-composite'" in patch
 assert "publish_allowed:false" in patch
 assert "approval_required:true" in patch
 print('PASS priority1 candidates: 6 exact-original SVG review cards; strict queue 478 generation / 8 review / 13 rejected aligned')

if __name__=='__main__':main()
