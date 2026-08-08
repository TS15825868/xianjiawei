#!/usr/bin/env python3
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
def text(path): return (ROOT/path).read_text(encoding='utf-8')
def req(ok,msg):
    if not ok: raise AssertionError(msg)

def main():
    html=text('publishing-center.html')
    v12=text('publishing-center-data-v12-auto-candidates.js')
    v13=text('publishing-center-data-v13-character-scenes.js')
    v14=text('publishing-center-data-v14-boss-daily.js')
    v15=text('publishing-center-data-v15-companions.js')
    v16=text('publishing-center-data-v16-actual-product-photos.js')
    bridge=text('publishing-center-erp-bridge.js')
    order=['publishing-center-data-v11-campaign-holds.js','publishing-center-data-v12-auto-candidates.js','publishing-center-data-v13-character-scenes.js','publishing-center-data-v14-boss-daily.js','publishing-center-data-v15-companions.js','publishing-center-data-v16-actual-product-photos.js','publishing-center-v2.js']
    for item in order: req(item in html,f'發布中心缺少：{item}')
    req(all(html.index(order[i])<html.index(order[i+1]) for i in range(len(order)-1)),'v11→v16→v2 載入順序錯誤')
    req("String(p.characters||'').trim()" in v12,'v12沒有避開明確角色需求貼文')
    req("candidate_generation_mode:'runtime-safe-svg-v12'" in v12,'v12候選模式錯誤')
    for phrase in ['龜鹿膏','100g／罐','龜鹿飲30cc玻璃罐','30cc／罐（小玻璃罐）','龜鹿飲180cc鋁袋','180cc／包（鋁袋）','龜鹿湯塊','75g／盒｜8塊裝｜每塊約9.375g','龜鹿膠','600g（1斤）／盒｜32塊裝｜每塊約18.75g','鹿茸粉','75g／罐']:
        req(phrase in v12,f'v12缺少正式產品權威：{phrase}')
    req('images/products-v2/guilu-gao.jpeg' in v12 and 'images/products-v2/guilu-jiao-open-new.jpg' in v12,'v12未切到products-v2實際產品照片')
    req('images/products-v3/' not in v12,'v12仍把products-v3宣傳版面當產品主圖')
    req("candidate_generation_mode:'website-mascot-scene-v13'" in v13,'v13角色場景模式錯誤')
    req("new Set(['節慶','地點','萬華在地'])" in v13 or "ALLOWED=new Set(['節慶','地點','萬華在地'])" in v13,'v13分類範圍錯誤')
    req('images/brand/line-oa/' in v13,'v13未使用網站核准角色來源')
    req("candidate_generation_mode:'website-boss-daily-v14'" in v14,'v14小老闆日常模式錯誤')
    req("p.category==='小老闆與夥伴'" in v14,'v14沒有鎖小老闆日常分類')
    req('images/brand/line-oa/' in v14,'v14未使用網站核准角色來源')
    req("candidate_generation_mode:'companion-vector-v15-review'" in v15,'v15陪伴候選模式錯誤')
    req("p.category==='陪伴角色'" in v15,'v15沒有鎖陪伴角色分類')
    for phrase in ['小鹿','小烏龜','灰色小河馬娃娃','米色小鹿安撫巾']:
        req(phrase in v15,f'v15缺少陪伴角色：{phrase}')
    req('products-v2/guilu-gao.jpeg' in v16 and 'products-v2/guilu-tangkuai.jpeg' in v16,'v16沒有實際產品照片映射')
    req('/images/products-v3/' in v16 and '/images/dm-final/' in v16,'v16沒有攔截宣傳版面／舊DM')
    for layer in [v12,v13,v14,v15]:
        req("image_status:'candidate-review-required'" in layer,'runtime候選未強制待審核')
        req('publish_allowed:false' in layer and 'schedule_enabled:false' in layer,'runtime候選仍可能直接發布／排程')
    for path in [
        'images/posts/generated-v20260808-priority1/guilu-gao-100g.svg',
        'images/posts/generated-v20260808-priority1/guilu-drink-30cc.svg',
        'images/posts/generated-v20260808-priority1/guilu-drink-180cc.svg',
        'images/posts/generated-v20260808-priority1/guilu-jiao-600g.svg',
        'images/posts/generated-v20260808-priority1/product-overview.svg',
        'images/posts/generated-v20260808-priority1/guilu-gao-drink-combo.svg',
        'images/posts/generated-v20260808-preflight/guide-use.svg',
        'images/posts/generated-v20260808-preflight/choose-products.svg',
        'images/posts/generated-v20260808-preflight/choose-by-habit.svg']:
        source=text(path)
        req('products-v3/' not in source,f'{path}仍嵌products-v3宣傳版面')
        req('products-v2/' in source,f'{path}沒有實際產品照片')
    req('candidate_svg:' in bridge,'ERP交接沒有帶runtime SVG本體')
    for factory in ['XJWRuntimeCandidateFactory','XJWCharacterCandidateFactory','XJWBossCandidateFactory','XJWCompanionCandidateFactory']:
        req(factory in bridge,f'ERP交接未支援 {factory}')
    req("window.open('about:blank','_blank')" in bridge,'iPhone Safari交接未預先開啟分頁')
    req('location.replace(erpUrl)' in bridge,'預留分頁沒有安全導向ERP')
    req('486張候選待審、0張缺圖待生成' in html,'發布中心未顯示完整候選覆蓋')
    print('PASS runtime candidates v12-v16: zero missing images; products-v2 actual product photos only; all candidates remain review-only')

if __name__=='__main__': main()
