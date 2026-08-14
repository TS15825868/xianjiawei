#!/usr/bin/env python3
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
GAO='食用時間可依個人使用習慣與作息時間安排'
DRINK_TIME='飲用時間可依個人使用習慣與作息時間安排'
DRINK30='每日 1-2罐'
DRINK180='每日一包'
GENERAL='使用時間可依個人使用習慣與作息時間安排'
OLD_GAO='每日早上及下午各一小匙'
OLD_DAY='建議白天飲用'
TEXT_REPLACEMENTS=[
 ('一般建議早上與下午各一小匙',GAO),('建議早上與下午各一小匙',GAO),('每日早上及下午各一小匙',GAO),('早上與下午各一小匙',GAO),
 ('食用時間與份量可依個人使用習慣與作息安排',GAO),('食用時間可依個人使用習慣與作息安排',GAO),
 ('每日 1 罐',DRINK30),('每日1罐',DRINK30),('每日一罐',DRINK30),('每日1～2罐',DRINK30),('每日 1～2罐',DRINK30),
 ('建議白天飲用',DRINK_TIME),('飲用時間可依個人使用習慣與作息安排',DRINK_TIME),
 ('飲用份量與時間可依個人使用習慣與作息安排',f'{DRINK180}；{DRINK_TIME}'),
 ('使用時間可依個人使用習慣與作息安排',GENERAL),('避免接近睡前食用',GAO),('避免接近睡前',GAO),
]
def replace_text(text:str)->str:
 out=text
 for old,new in TEXT_REPLACEMENTS: out=out.replace(old,new)
 for phrase in (GAO,DRINK_TIME,GENERAL):
  esc=re.escape(phrase); out=re.sub(rf'({esc})(?:[。；、，,\s]*(?:{esc}))+',phrase,out)
 return out
def deep(value):
 if isinstance(value,str): return replace_text(value)
 if isinstance(value,list):
  out=[]
  for item in value:
   v=deep(item)
   if v not in out: out.append(v)
  return out
 if isinstance(value,dict): return {k:deep(v) for k,v in value.items()}
 return value
def write(path:Path,text:str):
 old=path.read_text(encoding='utf-8') if path.exists() else ''
 if text!=old: path.write_text(text,encoding='utf-8'); return True
 return False
def write_json(path:Path,data): return write(path,json.dumps(data,ensure_ascii=False,indent=2)+'\n')
def normalize_usage(product:dict,pid:str):
 usage=[replace_text(str(x)) for x in (product.get('usage') or []) if str(x).strip()]
 def keep(*blocked): return [x for x in usage if not any(b in x for b in blocked)]
 if pid=='guilu-drink-30':
  rest=keep(DRINK30,DRINK_TIME,OLD_GAO,OLD_DAY,'每日一罐','每日1罐','每日 1 罐','每日1～2罐','每日 1～2罐')
  product['usage']=[DRINK30,DRINK_TIME,*rest]
 elif pid=='guilu-drink-180':
  rest=keep(DRINK180,DRINK_TIME,OLD_DAY,'飲用份量與時間可依個人使用習慣與作息安排',f'{DRINK180}；{DRINK_TIME}')
  product['usage']=[DRINK180,DRINK_TIME,*rest]
 elif pid=='guilu-gao':
  rest=keep(GAO,OLD_GAO,'早晚各一小匙','一天一次一小匙','避免接近睡前','睡眠受影響','口乾','食用時間與份量可依個人使用習慣與作息安排')
  product['usage']=[GAO,*rest]
 else:
  rest=keep(GENERAL); product['usage']=[GENERAL,*rest]
 product['usage']=list(dict.fromkeys(product['usage']))
def update_official(rel:str,public=False):
 path=ROOT/rel; data=deep(json.loads(path.read_text(encoding='utf-8'))); data['version']='2026-08-15-personal-routine-usage-v3'
 products={p.get('id'):p for p in data.get('products',[])}; gao=products.get('guilu-gao') or {}
 if 'usage_primary' in gao or not public: gao['usage_primary']=GAO
 if public and 'usagePrimary' in gao: gao['usagePrimary']=GAO
 if 'usage_detail' in gao: gao['usage_detail']=[x for x in gao['usage_detail'] if '睡前' not in str(x) and x not in {GAO,'食用時間與份量可依個人使用習慣與作息安排'}]
 d30=products.get('guilu-drink-30') or {}; d180=products.get('guilu-drink-180') or {}
 if public and any('usagePrimary' in p for p in data.get('products',[])):
  d30['usagePrimary']=DRINK30; d30['usageTiming']=DRINK_TIME; d180['usagePrimary']=DRINK180; d180['usageTiming']=DRINK_TIME
 else:
  d30['usage_primary']=DRINK30; d30['usage_timing']=DRINK_TIME; d180['usage_primary']=DRINK180; d180['usage_timing']=DRINK_TIME
 rules=[str(x) for x in data.get('forbidden_rules',[]) if OLD_GAO not in str(x) and OLD_DAY not in str(x) and '一天一次' not in str(x) and '早晚各一小匙' not in str(x) and '每日1～2罐' not in str(x) and '每日 1～2罐' not in str(x) and '食用時間與份量' not in str(x)]
 rules.extend([f'龜鹿膏不設定固定早上／下午時段；目前原則為「{GAO}」',f'龜鹿飲不設定固定白天時段；30cc目前使用方式為「{DRINK30}」；{DRINK_TIME}',f'龜鹿飲180cc保留目前份量「{DRINK180}」；{DRINK_TIME}','所有產品的使用時間依個人使用習慣與作息時間安排，不以固定時段作為唯一規則'])
 data['forbidden_rules']=list(dict.fromkeys(rules)); return write_json(path,data)
changed=[]
for rel,pub in [('config/official-products.json',False),('assets/data/official-products.json',True)]:
 if update_official(rel,pub): changed.append(rel)
for rel in ['data.json','catalog-public.json','geo-data.json','content/visual-production-spec-current.json','content/ai-brand-control-v20260807.json','content/public-post-library.json']:
 path=ROOT/rel
 if not path.exists(): continue
 data=deep(json.loads(path.read_text(encoding='utf-8')))
 if rel in {'data.json','catalog-public.json'}:
  for p in data.get('products',[]): normalize_usage(p,str(p.get('id') or ''))
 if rel=='content/visual-production-spec-current.json':
  products=data.get('products') or {}
  if isinstance(products,dict):
   products.setdefault('guilu-gao',{})['usage_primary']=GAO
   products.setdefault('guilu-drink-30',{})['usage_primary']=DRINK30; products['guilu-drink-30']['usage_timing']=DRINK_TIME
   products.setdefault('guilu-drink-180',{})['usage_primary']=DRINK180; products['guilu-drink-180']['usage_timing']=DRINK_TIME
 if write_json(path,data): changed.append(rel)
for path in [*ROOT.glob('*.html'),ROOT/'site.js',ROOT/'site-product-data-authority.js',ROOT/'publishing-center-data-current-authority-guard.js',ROOT/'llms.txt',ROOT/'llms-full.txt']:
 if not path.exists(): continue
 new=replace_text(path.read_text(encoding='utf-8'))
 if path.name=='site-product-data-authority.js':
  for marker,array in [("if(product.id==='guilu-drink-30')","normalized.usage=['每日 1-2罐','可直接飲用或隔水溫熱後飲用','飲用時間可依個人使用習慣與作息時間安排','避免冰飲','開罐後請儘速飲用完畢']"),("if(product.id==='guilu-drink-180')","normalized.usage=['每日一包','可直接飲用或隔水溫熱後飲用','飲用時間可依個人使用習慣與作息時間安排','避免冰飲','開封後請儘速飲用完畢']"),("if(product.id==='guilu-gao')","normalized.usage=['食用時間可依個人使用習慣與作息時間安排','初次可先從半匙開始','可直接取用或加入約100～300mL溫熱水化開']")]:
   start=new.find(marker)
   if start>=0:
    pos=new.find('normalized.usage=',start); end=new.find(';',pos)
    if pos>=0 and end>=0: new=new[:pos]+array+new[end:]
 if write(path,new): changed.append(path.relative_to(ROOT).as_posix())
trial=ROOT/'trial.html'; t=trial.read_text(encoding='utf-8')
t=t.replace('.trial-product-card__actions{padding:8px 20px 20px;margin-top:auto}.trial-product-card__actions .btn{width:100%}', '.trial-product-card__actions{display:grid;gap:12px;padding:10px 20px 20px;margin-top:auto}.trial-product-card__actions .btn{width:100%;margin:0!important}').replace('.trial-product-card__actions{display:grid;gap:12px;padding:8px 20px 20px;margin-top:auto}', '.trial-product-card__actions{display:grid;gap:12px;padding:10px 20px 20px;margin-top:auto}').replace('.trial-product-card__actions{padding:8px 18px 20px}', '.trial-product-card__actions{gap:14px;padding:10px 18px 20px}')
if write(trial,t): changed.append('trial.html')
sync=ROOT/'tools/sync-current-derived-authority.py'; s=sync.read_text(encoding='utf-8')
for old,new in [('食用時間與份量可依個人使用習慣與作息安排',GAO),('食用時間可依個人使用習慣與作息安排',GAO),('飲用時間可依個人使用習慣與作息安排',DRINK_TIME),('使用時間可依個人使用習慣與作息安排',GENERAL),('每日1～2罐',DRINK30),('每日 1～2罐',DRINK30)]: s=s.replace(old,new)
s=s.replace("('一天一次一小匙','每日早上及下午各一小匙')",f"('一天一次一小匙','{GAO}')").replace("('早晚各一小匙','每日早上及下午各一小匙')",f"('早晚各一小匙','{GAO}')")
insert=f" ('{OLD_GAO}','{GAO}'),\n ('{OLD_DAY}','{DRINK_TIME}'),\n ('每日一罐','{DRINK30}'),\n"
if f"('{OLD_GAO}','{GAO}')" not in s: s=s.replace('REPLACEMENTS=[\n','REPLACEMENTS=[\n'+insert)
s=s.replace("current_gao='每日早上及下午各一小匙'",f"current_gao='{GAO}'")
if write(sync,s): changed.append('tools/sync-current-derived-authority.py')
for rel in ['tools/validate-site-release.py','tools/validate-site-production-release-v20260809.py','tools/validate-public-customer-pages-v20260809.py','tools/validate-canonical-facts-v20260808.py','tools/validate-visual-cohesion-v20260809.py','tools/validate-public-boundary-v20260808.py','tools/validate-post-bank-runtime-current.mjs']:
 path=ROOT/rel
 if not path.exists(): continue
 v=replace_text(path.read_text(encoding='utf-8'))
 if rel=='tools/validate-site-release.py': v=re.sub(r"RETIRED_PUBLIC_FACTS=\[[^\n]*\]", "RETIRED_PUBLIC_FACTS=['一天一次一小匙','早晚各一小匙','每日早上及下午各一小匙','建議白天飲用','每日一罐','每日1～2罐','每日 1～2罐','龜鹿飲30cc玻璃瓶','30cc／瓶','30cc瓶裝']",v)
 if rel=='tools/validate-site-production-release-v20260809.py': v=re.sub(r"RETIRED_PUBLIC_COPY=\([^\n]*\)", "RETIRED_PUBLIC_COPY=('一天一次一小匙','早晚各一小匙','每日早上及下午各一小匙','建議白天飲用','每日一罐','每日1～2罐','每日 1～2罐','龜鹿飲30cc玻璃瓶','30cc／瓶','30cc瓶裝')",v)
 if write(path,v): changed.append(rel)
subprocess.run([sys.executable,str(ROOT/'tools/sync-current-derived-authority.py')],check=True)
data=json.loads((ROOT/'data.json').read_text(encoding='utf-8')); by={p['id']:p for p in data['products']}
assert by['guilu-drink-30']['usage'][0]==DRINK30 and DRINK_TIME in by['guilu-drink-30']['usage']
assert by['guilu-drink-180']['usage'][0]==DRINK180 and DRINK_TIME in by['guilu-drink-180']['usage']
assert by['guilu-gao']['usage'][0]==GAO
blob=json.dumps(data,ensure_ascii=False)
assert OLD_DAY not in blob and OLD_GAO not in blob and '每日1～2罐' not in blob and '每日 1～2罐' not in blob and '食用時間與份量' not in blob
authority=(ROOT/'site-product-data-authority.js').read_text(encoding='utf-8')
assert "normalized.usage=['每日 1-2罐'" in authority and "normalized.usage=['每日一包'" in authority and "normalized.usage=['食用時間可依個人使用習慣與作息時間安排'" in authority
trial_text=(ROOT/'trial.html').read_text(encoding='utf-8')
assert 'trial-product-card__actions{display:grid;gap:12px;padding:10px 20px 20px' in trial_text and 'gap:14px;padding:10px 18px 20px' in trial_text
print('PASS: exact personal timing wording and trial CTA spacing applied.')
