#!/usr/bin/env python3
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MASTER=ROOT/'public-product-master.json'
REQUIRED_CURRENT_IDS=['guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen']
DEFERRED_ID='qixuan-guilu-drink-powder'
CURRENT_30='每日 1–2 罐'
WRITE='--write' in sys.argv


def dump(path,data):
    text=json.dumps(data,ensure_ascii=False,indent=2)+'\n'
    if WRITE: path.write_text(text,encoding='utf-8')
    return text

def normalize_product(item,master_by):
    pid=item.get('id')
    source=master_by.get(pid)
    if not source: return item
    out=dict(item)
    out['name']=source['name']
    for key in ['specification','size','spec']:
        if key in out or key=='specification': out[key]=source['specification']
    if source.get('package'): out['package']=source['package']
    if source.get('ingredients'): out['ingredients']=list(source['ingredients'])
    if source.get('usage'):
        out['usage']=list(source['usage'])
        out['usagePrimary']=source['usage'][0]
    if source.get('usageTiming'): out['usageTiming']=source['usageTiming']
    if source.get('detail'): out['detailUnitApprox']=source['detail']
    return out

def normalize_file(path,master_by,public_ids):
    if not path.exists(): return
    data=json.loads(path.read_text(encoding='utf-8'))
    products=data.get('products')
    if isinstance(products,list):
        data['products']=[normalize_product(x,master_by) for x in products if x.get('id') in public_ids]
    elif isinstance(products,dict):
        data['products']={pid:normalize_product({'id':pid,**value},master_by) for pid,value in products.items() if pid in public_ids}
    if 'knowledgeProductIds' in data: data['knowledgeProductIds']=list(public_ids)
    if 'knowledgeProductCount' in data: data['knowledgeProductCount']=len(public_ids)
    if 'officialProductIds' in data: data['officialProductIds']=list(public_ids)
    if 'officialProductCount' in data: data['officialProductCount']=len(public_ids)
    if 'productCount' in data: data['productCount']=len(public_ids)
    text=dump(path,data)
    if DEFERRED_ID in text: raise SystemExit(f'{path.name}仍含暫緩對外產品')

def main():
    master=json.loads(MASTER.read_text(encoding='utf-8'))
    ids=[str(p.get('id') or '').strip() for p in master.get('products') or [] if str(p.get('id') or '').strip()]
    if master.get('authority')!='user-confirmed-current' or not ids or master.get('productCount')!=len(ids) or len(set(ids))!=len(ids):
        raise SystemExit('public-product-master.json目前公開產品權威／productCount不一致')
    for pid in REQUIRED_CURRENT_IDS:
        if pid not in ids: raise SystemExit(f'目前核心公開產品缺失：{pid}')
    if DEFERRED_ID in ids: raise SystemExit('暫緩產品不得由舊固定產品數重新加入官網')
    by={p['id']:p for p in master['products']}
    public_ids=ids
    if by['guilu-drink-30'].get('usage',[None])[0]!=CURRENT_30:
        raise SystemExit(f'30cc目前正式用法不是 {CURRENT_30}')
    for rel in ['data.json','catalog-public.json','product-master.json']:
        normalize_file(ROOT/rel,by,public_ids)
    for rel in ['assets/data/official-products.json','config/official-products.json','ai-answers.json','geo-data.json']:
        text=(ROOT/rel).read_text(encoding='utf-8')
        if DEFERRED_ID in text: raise SystemExit(f'{rel}仍含暫緩對外產品')
    print(f'PASS current public derived authority: {len(public_ids)} products, 30cc {CURRENT_30}, deferred product excluded; mode={"write" if WRITE else "check"}.')

if __name__=='__main__': main()
