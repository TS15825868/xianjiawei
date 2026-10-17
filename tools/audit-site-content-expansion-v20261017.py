#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlsplit,unquote
from collections import Counter
from datetime import datetime,timezone
import re,json
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/"ops/audits";OUT.mkdir(parents=True,exist_ok=True)
class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True);self.skip=0;self.text=[];self.links=[];self.images=[];self.h1=[];self.inh=False;self.lang=False;self.viewport=False;self.noindex=False
    def handle_starttag(self,tag,attrs):
        a=dict(attrs)
        if tag in ("script","style"):self.skip+=1
        if tag=="html":self.lang=bool(a.get("lang"))
        if tag=="meta" and a.get("name")=="viewport":self.viewport=True
        if tag=="meta" and a.get("name")=="robots" and "noindex" in a.get("content",""):self.noindex=True
        if tag=="a" and a.get("href"):self.links.append(a["href"])
        if tag=="img":self.images.append((a.get("src",""),a.get("alt","")))
        if tag=="h1":self.inh=True
    def handle_endtag(self,tag):
        if tag in ("script","style"):self.skip=max(0,self.skip-1)
        if tag=="h1":self.inh=False
    def handle_data(self,data):
        if not self.skip:
            t=" ".join(data.split())
            if t:self.text.append(t)
            if self.inh:self.h1.append(t)
def local(value):
    if not value or value.startswith(("#","mailto:","tel:","data:","javascript:","//")):return None
    u=urlsplit(value)
    if u.scheme or u.netloc:return None
    path=unquote(u.path)
    if path.startswith("/xianjiawei/"):path=path[len("/xianjiawei/"):]
    elif path.startswith("/"):return None
    if not path:return None
    p=(ROOT/path).resolve()
    try:p.relative_to(ROOT.resolve())
    except ValueError:return None
    return p
def issue(sev,file,code,note):
    findings.append({"severity":sev,"file":file,"code":code,"detail":note})
pages=[];findings=[]
for f in sorted(ROOT.glob("*.html")):
    p=Page();p.feed(f.read_text(encoding="utf8"))
    txt=" ".join(p.text)
    hidden=p.noindex or f.name.startswith("googlec") or f.name in ("publishing-center.html","post-bank-export.html","post-image-guilu-drink.html")
    if not hidden and "台興山產" in txt:issue("error",f.name,"deprecated_brand","公開可見內容有舊商號")
    if not hidden and (not p.lang or not p.viewport):issue("warning",f.name,"mobile_metadata","缺繁中lang或viewport")
    if not hidden and not p.h1:issue("warning",f.name,"missing_h1","公開頁無H1")
    for url in p.links+[x[0] for x in p.images]:
        ref=local(url)
        if ref and not ref.exists():issue("warning",f.name,"missing_reference",url[:150])
    if not hidden:
        for term in ("調整體質","青春美麗","補氣","關節","消除疲勞","治療","改善疾病","促進新陳代謝","免疫"):
            if term in txt:issue("review",f.name,"claims_review",term+"（須人工判讀語境，原廠包裝不自行改字）")
        if any(not alt for src,alt in p.images):issue("warning",f.name,"missing_alt","有未加替代文字的圖片")
    pages.append({"file":f.name,"chars":len(txt),"hidden":hidden,"images":len(p.images),"links":len(p.links)})
own=json.loads((ROOT/"public-product-master.json").read_text(encoding="utf8"))
partner=json.loads((ROOT/"partner-catalog.json").read_text(encoding="utf8"))
os=own["products"];ps=[p for p in partner["products"] if p.get("public") is True]
ids=[x["id"] for x in os+ps]
if len(ids)!=len(set(ids)):issue("error","catalog","duplicate_ids","公開商品ID不唯一")
if len(os)!=own["productCount"]:issue("error","public-product-master.json","count","公開數量與名單不符")
hold=set(own["expansionPolicy"].get("temporarilyExcludedProductIds",[]))
if hold.intersection(ids):issue("error","catalog","deferred_leak","暫緩公開商品混入正式名單")
media_text=(ROOT/"site-product-media-authority.js").read_text(encoding="utf8")
m=re.search(r"const DATA=(\{[\s\S]*?\});",media_text)
media=json.loads(m.group(1))["products"] if m else {}
for x in os+ps:
    page=x.get("page","").split("/")[-1]
    if not (ROOT/page).is_file():issue("error",x["id"],"missing_page",page)
    path=media.get(x["id"],{}).get("mainImage","")
    if not path or not (ROOT/path).is_file():issue("error",x["id"],"missing_main",path)
    if x in ps and (not x.get("image") or not (ROOT/x["image"].split("?")[0]).is_file()):
        issue("error",x["id"],"partner_image","無正式商品主圖")
chooser=(ROOT/"site-choose-current-catalog.js").read_text(encoding="utf8")
if "categoryNames" not in chooser or "item.id" not in chooser:
    issue("error","site-choose-current-catalog.js","legacy_fixed_categories","未來新增類別／共用系列頁商品可能遺漏")
report={"reviewedAtUtc":datetime.now(timezone.utc).isoformat(),"scope":"網站根目錄所有HTML及最新公開商品資料，不包含隱藏ERP記錄","allHtmlCount":len(pages),"ownApprovedCount":len(os),"partnerApprovedCount":len(ps),"publishedEntries":len(ids),"publicIds":ids,"pages":pages,"counts":dict(Counter(x["severity"] for x in findings)),"findings":findings,"limitations":["尚未包含實際 LINE OA 回覆、ERP D1 即時值與社群平台","關於食品廣告須依法規並結合圖文上下文判斷","原廠真實包裝不自動改寫；無完整背面照則不假造"]}
(OUT/"site-content-and-future-products-20261017.json").write_text(json.dumps(report,ensure_ascii=False,indent=2)+"\n",encoding="utf8")
head=["# 仙加味：全站內容與未來商品擴充巡檢","",f"檢查時間 UTC：{report['reviewedAtUtc']}","",f"HTML頁面：{len(pages)}；目前核准公開入口 {len(ids)}（仙加味商品 {len(os)}；其他來源商品／系列 {len(ps)}）","",f"規則結果：{report['counts']}","", "## 異常與注意事項"]
for x in findings:head.append("- "+x["severity"]+" | "+x["file"]+" | "+x["code"]+" | "+x["detail"])
head += ["","## 後續商品擴充原則","所有合格公開商品集中在單一分類瀏覽；不同商品來源依真實外包裝、製造標示與最新核准狀態表示，不能把既有固定四款或九個入口當永久上限。","新增商品先補齊品名、規格、類別、完整主圖、各自詳頁、合法展示與交易屬性，使用者核准後才公開。暫緩、ERP內部、藥品或缺圖不得從舊程式回流。","","## 本檢查不能直接認定已完成","LINE OA實際對話、ERP正式資料庫、社群簡介及行動裝置真機功能仍須另行驗證。",""]
(OUT/"site-content-and-future-products-20261017.md").write_text("\n".join(head),encoding="utf8")
print(json.dumps({"html":len(pages),"public":len(ids),"result":report["counts"],"sample":findings[:15]},ensure_ascii=False))
assert len(pages)>=25
