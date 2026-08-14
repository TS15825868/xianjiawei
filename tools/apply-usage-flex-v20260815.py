#!/usr/bin/env python3
from __future__ import annotations
import json,re,subprocess,sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
GAO='食用時間與份量可依個人使用習慣與作息安排'
DRINK_TIME='飲用時間可依個人使用習慣與作息安排'
DRINK30='每日1～2罐'
DRINK180='飲用份量與時間可依個人使用習慣與作息安排'
GENERAL='使用時間可依個人使用習慣與作息安排'
OLD_GAO='每日早上及下午各一小匙'
OLD_DAY='建議白天飲用'

TEXT_REPLACEMENTS=[
 ('建議早上與下午各一小匙',GAO),('每日早上及下午各一小匙',GAO),('早上與下午各一小匙',GAO),
 ('每日 1 罐',DRINK30),('每日1罐',DRINK30),('每日一罐',DRINK30),
 ('每日一包',DRINK180),('建議白天飲用',DRINK_TIME),
 ('避免接近睡前食用',GAO),('避免接近睡前',GAO),
]

def replace_text(text:str)->str:
 out=text
 for old,new in TEXT_REPLACEMENTS: out=out.replace(old,new)
 # Collapse accidental repeated flexible guidance caused by replacing more than one old timing sentence.
 for phrase in (GAO,DRINK_TIME,DRINK180,GENERAL):
  esc=re.escape(phrase)
  out=re.sub(rf'({esc})(?:[。；、，,\s]*(?:{esc}))+',phrase,out)
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
 def keep(*blocked):
  return [x for x in usage if not any(b in x for b in blocked)]
 if pid=='guilu-drink-30':
  rest=keep(DRINK30,DRINK_TIME,DRINK180,OLD_GAO,OLD_DAY,'每日一罐','每日1罐','每日 1 罐')
  product['usage']=[DRINK30,DRINK_TIME,*rest]
 elif pid=='guilu-drink-180':
  rest=keep(DRINK180,DRINK_TIME,'每日一包',OLD_DAY)
  product['usage']=[DRINK180,*rest]
 elif pid=='guilu-gao':
  rest=keep(GAO,OLD_GAO,'早晚各一小匙','一天一次一小匙','避免接近睡前','睡眠受影響','口乾')
  product['usage']=[GAO,*rest]
 else:
  rest=keep(GENERAL)
  product['usage']=[GENERAL,*rest]
 # de-duplicate while preserving order
 product['usage']=list(dict.fromkeys(product['usage']))

def update_official(rel:str,public=False):
 path=ROOT/rel; data=deep(json.loads(path.read_text(encoding='utf-8')))
 data['version']='2026-08-15-personal-routine-usage-v1'
 products={p.get('id'):p for p in data.get('products',[])}
 gao=products.get('guilu-gao') or {}; gao['usage_primary']=GAO if 'usage_primary' in gao or public else gao.get('usage_primary',GAO)
 if public: gao['usage_primary']=GAO
 if 'usage_detail' in gao: gao['usage_detail']=[x for x in gao['usage_detail'] if '睡前' not in str(x) and x!=GAO]
 d30=products.get('guilu-drink-30') or {}; d180=products.get('guilu-drink-180') or {}
 key='usagePrimary' if public and any('usagePrimary' in p for p in data.get('products',[])) else 'usage_primary'
 d30[key]=f'{DRINK30}；{DRINK_TIME}'
 d180[key]=DRINK180
 rules=[str(x) for x in data.get('forbidden_rules',[]) if OLD_GAO not in str(x) and OLD_DAY not in str(x) and '一天一次' not in str(x) and '早晚各一小匙' not in str(x)]
 rules.extend([
  f'龜鹿膏不設定固定早上／下午時段；目前使用原則為「{GAO}」',
  f'龜鹿飲不得使用「{OLD_DAY}」固定時段；30cc目前使用方式為「{DRINK30}」，且{DRINK_TIME}',
  '所有產品使用時間依個人使用習慣與作息安排，不以固定時段作為唯一使用規則',
 ])
 data['forbidden_rules']=list(dict.fromkeys(rules))
 return write_json(path,data)

changed=[]
for rel,pub in [('config/official-products.json',False),('assets/data/official-products.json',True)]:
 if update_official(rel,pub): changed.append(rel)

# Structured public/AI data.
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
   products.setdefault('guilu-drink-30',{})['usage_primary']=f'{DRINK30}；{DRINK_TIME}'
   products.setdefault('guilu-drink-180',{})['usage_primary']=DRINK180
 if write_json(path,data): changed.append(rel)

# Public page/runtime text. Current user instructions supersede previous fixed-time copy.
for path in [*ROOT.glob('*.html'),ROOT/'site.js',ROOT/'site-product-data-authority.js',ROOT/'publishing-center-data-current-authority-guard.js',ROOT/'llms.txt',ROOT/'llms-full.txt']:
 if path.exists():
  old=path.read_text(encoding='utf-8'); new=replace_text(old)
  if write(path,new): changed.append(path.relative_to(ROOT).as_posix())

# Trial CTA spacing: separate outline and LINE buttons clearly on mobile and desktop.
trial=ROOT/'trial.html'
t=trial.read_text(encoding='utf-8')
t=t.replace('.trial-product-card__actions{padding:8px 20px 20px;margin-top:auto}.trial-product-card__actions .btn{width:100%}',
            '.trial-product-card__actions{display:grid;gap:12px;padding:10px 20px 20px;margin-top:auto}.trial-product-card__actions .btn{width:100%;margin:0!important}')
t=t.replace('.trial-product-card__actions{padding:8px 18px 20px}',
            '.trial-product-card__actions{gap:14px;padding:10px 18px 20px}')
if write(trial,t): changed.append('trial.html')

# Keep the derived sync from restoring retired fixed-time instructions.
sync=ROOT/'tools/sync-current-derived-authority.py'
s=sync.read_text(encoding='utf-8')
s=s.replace("('一天一次一小匙','每日早上及下午各一小匙')",f"('一天一次一小匙','{GAO}')")
s=s.replace("('早晚各一小匙','每日早上及下午各一小匙')",f"('早晚各一小匙','{GAO}')")
insert=f" ('{OLD_GAO}','{GAO}'),\n ('{OLD_DAY}','{DRINK_TIME}'),\n ('每日一罐','{DRINK30}'),\n ('每日一包','{DRINK180}'),\n"
if f"('{OLD_GAO}','{GAO}')" not in s:
 s=s.replace('REPLACEMENTS=[\n','REPLACEMENTS=[\n'+insert)
s=s.replace("current_gao='每日早上及下午各一小匙'",f"current_gao='{GAO}'")
s=s.replace("retired=['一天一次一小匙','龜鹿飲30cc玻璃瓶','30cc／瓶']",
            "retired=['一天一次一小匙','早晚各一小匙','每日早上及下午各一小匙','建議白天飲用','每日一罐','每日一包','龜鹿飲30cc玻璃瓶','30cc／瓶']")
if write(sync,s): changed.append('tools/sync-current-derived-authority.py')

# Validators: expectations move to the new current rule; old fixed-time phrases become retired.
validator_files=[
 'tools/validate-site-release.py','tools/validate-site-production-release-v20260809.py',
 'tools/validate-public-customer-pages-v20260809.py','tools/validate-canonical-facts-v20260808.py',
 'tools/validate-visual-cohesion-v20260809.py','tools/validate-public-boundary-v20260808.py',
 'tools/validate-post-bank-runtime-current.mjs'
]
for rel in validator_files:
 path=ROOT/rel
 if not path.exists(): continue
 v=path.read_text(encoding='utf-8')
 v=v.replace(OLD_GAO,GAO).replace('每日一罐',DRINK30).replace('每日 1 罐',DRINK30).replace('每日1罐',DRINK30).replace(OLD_DAY,DRINK_TIME).replace('每日一包',DRINK180)
 # Re-add retired fixed timing phrases to the two main release retired lists without marking current flexible copy retired.
 if rel=='tools/validate-site-release.py':
  v=re.sub(r"RETIRED_PUBLIC_FACTS=\[[^\n]*\]", "RETIRED_PUBLIC_FACTS=['一天一次一小匙','早晚各一小匙','每日早上及下午各一小匙','建議白天飲用','每日一罐','每日一包','龜鹿飲30cc玻璃瓶','30cc／瓶','30cc瓶裝']", v)
 if rel=='tools/validate-site-production-release-v20260809.py':
  v=re.sub(r"RETIRED_PUBLIC_COPY=\([^\n]*\)", "RETIRED_PUBLIC_COPY=('一天一次一小匙','早晚各一小匙','每日早上及下午各一小匙','建議白天飲用','每日一罐','每日一包','龜鹿飲30cc玻璃瓶','30cc／瓶','30cc瓶裝')", v)
 if write(path,v): changed.append(rel)

# Run current derived sync once so machine-readable outputs follow the new mother rule.
subprocess.run([sys.executable,str(ROOT/'tools/sync-current-derived-authority.py')],check=True)

# Final usage contract assertions.
data=json.loads((ROOT/'data.json').read_text(encoding='utf-8'))
by={p['id']:p for p in data['products']}
assert by['guilu-drink-30']['usage'][0]==DRINK30
assert DRINK_TIME in by['guilu-drink-30']['usage']
assert OLD_DAY not in json.dumps(data,ensure_ascii=False)
assert OLD_GAO not in json.dumps(data,ensure_ascii=False)
assert by['guilu-gao']['usage'][0]==GAO
assert by['guilu-drink-180']['usage'][0]==DRINK180
trial_text=(ROOT/'trial.html').read_text(encoding='utf-8')
assert 'trial-product-card__actions{display:grid;gap:12px' in trial_text
assert 'gap:14px;padding:10px 18px 20px' in trial_text
print('updated:',*changed,sep='\n- ')
