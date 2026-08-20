#!/usr/bin/env python3
from __future__ import annotations

import json
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CURRENT_30='每日 1–2 罐'
PUBLIC_PAGES=["index.html","products.html","dm.html","choose.html","combo.html","guide.html","recipes.html","faq.html","brand.html","brand-facts.html","ingredients.html","quality.html","craft.html","knowledge.html","video.html","hanfang-baike.html","sources.html","contact.html","trial.html","product-guilu-gao.html","product-guilu-drink-30cc.html","product-guilu-drink-180cc.html","product-guilu-tangkuai.html","product-guilu-jiao.html","product-luerong-fen.html"]
TECHNICAL_VISIBLE=["products-v2","products-v3","GitHub Web","runtime","快取版本","機器可讀產品母本","/mnt/data/","ERP秘密","Token","Secret"]
RETIRED_VISIBLE=["30cc玻璃瓶","30cc／瓶","30cc瓶裝","一天一次一小匙","早晚各一小匙","每日 1-2罐","每日 1-2 罐","每日 1～2 罐"]

class VisibleText(HTMLParser):
 def __init__(self):super().__init__();self.hidden_depth=0;self.parts=[]
 def handle_starttag(self,tag,attrs):
  if tag in {'script','style','template','noscript'}:self.hidden_depth+=1
 def handle_endtag(self,tag):
  if tag in {'script','style','template','noscript'} and self.hidden_depth:self.hidden_depth-=1
 def handle_data(self,data):
  if not self.hidden_depth:
   value=' '.join(data.split())
   if value:self.parts.append(value)

def visible(path):
 p=VisibleText();p.feed((ROOT/path).read_text(encoding='utf-8'));return ' '.join(p.parts)
def req(ok,msg):
 if not ok:raise AssertionError(msg)
def load(path):return json.loads((ROOT/path).read_text(encoding='utf-8'))
def local(path):return str(path or '').split('?',1)[0].lstrip('/')
def compact(value):return ''.join(str(value or '').split())

def main():
 for rel in PUBLIC_PAGES:
  req((ROOT/rel).exists(),f'缺少公開顧客頁：{rel}')
  value=visible(rel)
  for phrase in TECHNICAL_VISIBLE:req(phrase not in value,f'{rel} 可見文案仍含內部／技術用語：{phrase}')
  for phrase in RETIRED_VISIBLE:req(phrase not in value,f'{rel} 可見文案仍含退役正式資料：{phrase}')

 # 一般產品頁／首頁不公開全系列售價；正式試喝頁是目前核准活動例外。
 for rel in [p for p in PUBLIC_PAGES if p!='trial.html']:
  value=compact(visible(rel))
  req('正式售價60元' not in value and '11罐600元' not in value and '單包200元' not in value and '11包2,000元' not in value,f'{rel} 不應公開試喝活動價格')

 home=visible('index.html');products=visible('products.html');faq=visible('faq.html');guide=visible('guide.html')
 req('七項' in home and '柒玄茶・龜鹿調飲粉' in home,'首頁必須說明七項文字產品知識與柒玄茶')
 req('七項' in products and '柒玄茶・龜鹿調飲粉' in products,'產品總覽必須說明七項文字產品知識與柒玄茶')
 req('六項產品，一次看懂' not in products and '看六項產品' not in home,'公開頁不得把六項核准媒體誤寫成全部產品')

 req('食用時間可依個人使用習慣與作息時間安排' in visible('product-guilu-gao.html'),'龜鹿膏詳頁未顯示目前使用方式')
 req('食用時間可依個人使用習慣與作息時間安排' in guide,'使用方式頁未同步龜鹿膏目前用法')
 p30=visible('product-guilu-drink-30cc.html')
 req('30cc／罐（小玻璃罐）' in p30 and '裸罐' in p30 and '無貼紙' in p30,'30cc詳頁包裝事實不完整')
 req(CURRENT_30 in p30 and CURRENT_30 in faq and CURRENT_30 in guide and CURRENT_30 in products,'30cc每日 1–2 罐未同步產品頁／FAQ／指南／總覽')
 p180=visible('product-guilu-drink-180cc.html')
 req('180cc／包（鋁袋）' in p180 and '每日一包' in p180,'180cc詳頁規格／使用方式不完整')

 req('75g （2兩）／盒｜8塊裝' in products,'產品總覽龜鹿湯塊目前規格錯誤')
 req('600g （1斤）／盒｜32塊裝' in products,'產品總覽龜鹿膠目前規格錯誤')
 req('每塊約9.375g' in products,'產品總覽應顯示龜鹿湯塊每塊約9.375g')
 req('每塊約18.75g' in products,'產品總覽應顯示龜鹿膠每塊約18.75g')
 req('每塊約9.375g' in visible('product-guilu-tangkuai.html'),'龜鹿湯塊詳頁缺每塊約9.375g')
 req('每塊約18.75g' in visible('product-guilu-jiao.html'),'龜鹿膠詳頁缺每塊約18.75g')

 dm=visible('dm.html')
 req('六項' in dm and '產品' in dm and 'DM' in dm,'產品DM頁應明確是六項已有核准DM的媒體入口')
 req('待審核' not in dm and '毫米尺寸未知' not in dm,'產品DM頁仍露出內部審核／製圖說明')

 formal=load('data/formal-media-authority-v20260810.json')
 req(len(formal.get('products') or [])==6,'formal media目前應為六項核准產品媒體')
 trial_authority=formal.get('trial') or {};trial_media=local(trial_authority.get('image') or trial_authority.get('path'))
 req(trial_authority.get('status')=='approved_user_original' and trial_authority.get('render_mode')=='poster' and trial_media,'目前formal authority沒有核准試喝顧客海報')
 trial_source=(ROOT/'trial.html').read_text(encoding='utf-8'); trial=visible('trial.html'); trial_compact=compact(trial)
 req('<iframe' not in trial_source.lower(),'trial.html 不得使用iframe')
 req(trial_media in trial_source,'trial.html 必須使用目前formal authority核准試喝圖')
 req('object-fit:contain' in trial_source.replace(' ',''),'trial.html 正式試喝圖必須contain，不得裁切')
 req('3罐' in str(trial_authority.get('free') or ''),'formal authority 試喝免費數量不完整')
 shipping=trial_authority.get('shipping') or []
 req(any('60元' in str(x) for x in shipping) and any('100元' in str(x) for x in shipping),'formal authority 試喝運費不完整')
 req('5～7' in str(trial_authority.get('lead_time') or ''),'formal authority 試喝交期不完整')
 for phrase in ['龜鹿飲試喝組','3罐','試喝品免費','運費自付','7-11 店到店','60元','郵局宅配','100元','30cc／罐（小玻璃罐）','180cc／包（鋁袋）','買10送1']:
  req(phrase in trial,f'trial.html 缺少目前核准正式試喝資訊：{phrase}')
 for phrase in ['正式售價60元／罐','11罐600元','單包200元','11包2,000元']:
  req(phrase in trial_compact,f'trial.html 缺少目前核准正式價格／活動：{phrase}')

 quality=visible('quality.html');req('ERP' not in quality,'品質頁仍把內部平台管理當成顧客內容')
 cleanup=(ROOT/'site-public-content-cleanup-v20260809.js').read_text(encoding='utf-8');req('.page-updated' in cleanup and 'removeUpdatedNotes' in cleanup,'舊知識頁的資料更新註記沒有前台防回退清理')
 authority=(ROOT/'site-product-data-authority.js').read_text(encoding='utf-8')
 req("const CURRENT_30_USAGE='每日 1–2 罐'" in authority,'官網產品權威未鎖定30cc目前用法')
 req('images/products-v3/' in authority,'官網仍需保留products-v3作產品身份校正參考')
 req('officialImagePolicy' in authority and 'contain-no-crop' in authority,'產品身份／顧客顯示層未保留禁止重畫與contain/no-crop能力')
 print(f'PASS public customer pages: {len(PUBLIC_PAGES)} pages follow seven-product text authority, six approved DM media, exact 30cc daily 1–2 cans, current tangkuai/jiao details and current trial content.')

if __name__=='__main__':main()
