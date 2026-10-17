"use strict";
/* 仙加味官網產品圖片唯一執行權威｜2026-09-30 main-dm-v12
 * mainImage：首頁／產品總覽／怎麼選／試喝／推薦／產品卡／產品 Hero，目前公開四款使用原始像素保真山水情境 WebP；舊透明 PNG 與 JPG 保留為備援和來源核對。
 * detailImages：只允許「查看介紹」Modal 與獨立產品頁的詳細內容備援使用，以真實實物照片的新背景圖為主；DM另行保留，不得混為單品主圖。
 * identityReference：只供包裝身份與比例檢查，不作一般公開主圖。
 * 已核對合格的其他廠牌主圖可指定；其餘以 partner-catalog.json 最新商品資料為準，不鎖舊版。
 */
(function(){
  const DATA={
  "version": "20261017-pure-product-v1",
  "scope": "website-product-media",
  "rules": {
    "generalDisplay": "one real photographed physical package per main image on site's original ivory surface; no additional carton-side contents or decorative scene",
    "productDetailHero": "identical intact single product photo on home, card, modal and detail page; full outer carton or primary retail unit",
    "productDetailMedia": "details can show real item, actual portions and manufacturer original label; do not redraw packaging; deer-antler powder must remain sealed",
    "identityReference": "validation/reference only; never general public main image",
    "luerongFenVisual": "official 75g jar fully closed and sealed only; never show opened jar, loose powder, spoonfuls, bowls of powder, or mixing drinks in product images"
  },
  "products": {
    "guilu-gao": {
      "mainImage": "images/catalog-pure-v20261017/guilu-gao-main.webp",
      "detailImages": [
        "images/catalog-clean-studio-v20261016-v5/guilu-gao-box-jar-detail.webp",
        "images/product-main/gao-packaging-v20261016/box-jar-original.jpg"
],
      "identityReference": "images/guilu-gao.jpg"
    },
    "guilu-drink-30": {
      "mainImage": "images/catalog-pure-v20261017/guilu-drink-30-main.png",
      "detailImages": [
        "images/catalog-clean-studio-v20261016-v5/guilu-drink-30-closed-detail.webp"
],
      "identityReference": "images/guilu-drink-30cc-glass.jpg"
    },
    "guilu-drink-180": {
      "mainImage": "images/catalog-pure-v20261017/guilu-drink-180-main.png",
      "detailImages": [
        "images/catalog-clean-studio-v20261016-v5/guilu-drink-180-closed-detail.webp"
],
      "identityReference": "images/guilu-drink-180cc.jpg"
    },
    "luerong-fen": {
      "visualPolicy": "sealed-original-75g-jar-exterior-only",
      "showContents": false,
      "mainImage": "images/catalog-pure-v20261017/luerong-fen-main.png",
      "detailImages": [
        "images/catalog-clean-studio-v20261016-v5/luerong-fen-closed-detail.webp"
],
      "identityReference": "images/lurong.jpg"
    },
    "jinan-sisheng-siwuyin": {
      "mainImage": "images/catalog-pure-v20261017/jinan-sisheng-siwuyin-main.webp",
      "detailImages": [
        "images/catalog-clean-studio-v20261016-v5/siwuyin-real-label-detail.webp"
      ]
    },
    "danshen-tea-collection": {
      "mainImage": "images/catalog-pure-v20261017/danshen-tea-collection-main.webp",
      "detailImages": [
            "images/catalog-pure-v20261017/danshen-tea-collection-main.webp",
            "images/catalog-pure-v20261017/tea-leisure-main.webp",
            "images/catalog-pure-v20261017/tea-wudahan-main.webp",
            "images/catalog-pure-v20261017/tea-fiber-main.webp",
            "images/catalog-pure-v20261017/tea-white-main.webp",
            "images/catalog-pure-v20261017/tea-refresh-main.webp",
            "images/catalog-clean-studio-v20261016-v5/tea-rose-fruit-label-detail.webp",
            "images/catalog-clean-studio-v20261016-v5/tea-leisure-label-detail.webp",
            "images/catalog-clean-studio-v20261016-v5/tea-wudahan-label-detail.webp",
            "images/catalog-clean-studio-v20261016-v5/tea-fiber-label-detail.webp",
            "images/catalog-clean-studio-v20261016-v5/tea-white-label-detail.webp",
            "images/catalog-clean-studio-v20261016-v5/tea-refresh-label-detail.webp",
            "images/catalog-real-scenic-v20261016-v8/tea-bag-pouch-real-scenic-detail.webp",
            "images/catalog-real-scenic-v20261016-v8/tea-bag-with-string-real-scenic-detail.webp"
      ]
    },
    "guilu-vitality": {
      "mainImage": "images/catalog-pure-v20261017/guilu-vitality-main.webp",
      "detailImages": [
        "images/catalog-clean-studio-v20261016-v5/vitality-real-jar-detail.webp",
        "images/catalog-clean-studio-v20261016-v5/vitality-real-back-detail.webp"
      ]
    },
    "uboss-sizhenbao": {
      "mainImage": "images/catalog-pure-v20261017/uboss-sizhenbao-main.png",
      "detailImages": [
        "images/catalog-clean-studio-v20261016-v5/sizhenbao-sealed-tray-detail.webp",
        "images/catalog-clean-studio-v20261016-v5/sizhenbao-tray-back-detail.webp"
      ]
    },
    "royalherb-erzhenbao-64": {
      "mainImage": "images/catalog-pure-v20261017/royalherb-erzhenbao-64-main.webp",
      "detailImages": [
        "images/catalog-clean-studio-v20261016-v5/erzhenbao-sealed-tray-detail.webp"
      ]
    }
  }
};
  const freezeProduct=p=>Object.freeze({...p,detailImages:Object.freeze([...(p.detailImages||[])])});
  const products=Object.fromEntries(Object.entries(DATA.products).map(([id,p])=>[id,freezeProduct(p)]));
  window.XJW_PRODUCT_MEDIA_AUTHORITY=Object.freeze({
    version:DATA.version,
    scope:DATA.scope,
    rules:Object.freeze({...DATA.rules}),
    products:Object.freeze(products),
    mainImage(id){return products[id]?.mainImage||"";},
    detailImages(id){return products[id]?.detailImages||Object.freeze([]);},
    identityReference(id){return products[id]?.identityReference||"";}
  });
})();
