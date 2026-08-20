#!/usr/bin/env python3
from __future__ import annotations
import json
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
MASTER=ROOT/'public-product-master.json'
PUBLIC_IDS=['guilu-gao','guilu-drink-30','guilu-drink-180','guilu-tangkuai','guilu-jiao','luerong-fen']
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

def normalize_file(path,master_by):
    if not path.exists(): return
    data=json.loads(path.read_text(encoding='utf-8'))
    products=data.get('products')
    if isinstance(products,list):
        data['products']=[normalize_product(x,master_by) for x in products if x.get('id') in PUBLIC_IDS]
    elif isinstance(products,dict):
        data['products']={pid:normalize_product({'id':pid,**value},master_by) for pid,value in products.items() if pid in PUBLIC_IDS}
    if 'knowledgeProductIds' in data: data['knowledgeProductIds']=list(PUBLIC_IDS)
    if 'knowledgeProductCount' in data: data['knowledgeProductCount']=6
    if 'officialProductIds' in data: data['officialProductIds']=list(PUBLIC_IDS)
    if 'officialProductCount' in data: data['officialProductCount']=6
    if 'productCount' in data: data['productCount']=6
    text=dump(path,data)
    if DEFERRED_ID in text: raise SystemExit(f'{path.name}仍含暫緩對外產品')

def main():
    master=json.loads(MASTER.read_text(encoding='utf-8'))
    ids=[p.get('id') for p in master.get('products') or []]
    if master.get('authority')!='user-confirmed-current' or master.get('productCount')!=6 or ids!=PUBLIC_IDS:
        raise SystemExit('public-product-master.json不是目前六項公開產品權威')
    by={p['id']:p for p in master['products']}
    if by['guilu-drink-30'].get('usage',[None])[0]!=CURRENT_30:
        raise SystemExit('30cc目前正式用法不是每日 1–2 罐')
    for rel in ['data.json','catalog-public.json','product-master.json']:
        normalize_file(ROOT/rel,by)
    for rel in ['assets/data/official-products.json','config/official-products.json','ai-answers.json','geo-data.json']:
        text=(ROOT/rel).read_text(encoding='utf-8')
        if DEFERRED_ID in text: raise SystemExit(f'{rel}仍含暫緩對外產品')
    print(f'PASS current public derived authority: six products, 30cc {CURRENT_30}, deferred product excluded; mode={"write" if WRITE else "check"}.')

if __name__=='__main__': main()
