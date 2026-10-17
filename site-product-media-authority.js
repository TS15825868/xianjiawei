"use strict";
/* 仙加味官網產品圖片唯一執行權威｜2026-10-17 genuine pack-only main media
 * mainImage：首頁／產品總覽／怎麼選／試喝／推薦／產品卡／產品 Hero，使用原廠實拍盒裝／實體罐袋主圖，無附加山水、原料或台座；舊候選情境素材僅供歷史比對。
 * detailImages：只允許「查看介紹」Modal 與獨立產品頁的詳細內容備援使用，以原廠實拍標示及盒內圖為主；DM另行保留，不得混為單品主圖。
 * identityReference：只供包裝身份與比例檢查，不作一般公開主圖。
 * 已核對合格的其他廠牌主圖可指定；其餘以 partner-catalog.json 最新商品資料為準，不鎖舊版。
 */
(function(){
  const DATA={
  "version": "20261017-owner-approved-carton-jar-detail-v3",
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
      "mainImage": "images/catalog-pure-v20261017/guilu-gao-main-framed.webp",
      "detailImages": [
        "images/catalog-user-original-v20261017/guilu-gao-box-jar-owner-selected-detail-v20261017.webp"
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
        "images/catalog-user-detail-cutouts-v20261017/siwuyin-original-back.webp"
      ]
    },
    "danshen-tea-collection": {
      "mainImage": "images/catalog-pure-v20261017/danshen-tea-collection-main.webp",
      "detailImages": [
        "images/catalog-pure-v20261017/tea-leisure-main.webp",
        "images/catalog-pure-v20261017/tea-wudahan-main.webp",
        "images/catalog-pure-v20261017/tea-fiber-main.webp",
        "images/catalog-pure-v20261017/tea-white-main.webp",
        "images/catalog-pure-v20261017/tea-refresh-main.webp",
        "images/catalog-user-detail-cutouts-v20261017/tea-rose-fruit-original-back.webp",
        "images/catalog-user-detail-cutouts-v20261017/tea-leisure-original-back.webp",
        "images/catalog-user-detail-cutouts-v20261017/tea-wudahan-original-back.webp",
        "images/catalog-user-detail-cutouts-v20261017/tea-fiber-original-back.webp",
        "images/catalog-user-detail-cutouts-v20261017/tea-white-original-back.webp",
        "images/catalog-user-detail-cutouts-v20261017/tea-refresh-original-back.webp",
        "images/catalog-user-original-v20261017/rose-fruit-real-teabag.webp"
      ]
    },
    "guilu-vitality": {
      "mainImage": "images/catalog-pure-v20261017/guilu-vitality-main.webp",
      "detailImages": [
        "images/catalog-clean-studio-v20261016-v5/vitality-real-jar-detail.webp",
        "images/catalog-user-detail-cutouts-v20261017/vitality-original-label-closeup.webp"
      ]
    },
    "uboss-sizhenbao": {
      "mainImage": "images/catalog-pure-v20261017/uboss-sizhenbao-main-framed.webp",
      "detailImages": [
        "images/catalog-user-original-v20261017/sizhenbao-actual-8-blocks.webp"
      ]
    },
    "royalherb-erzhenbao-64": {
      "mainImage": "images/catalog-user-original-v20261017/erzhenbao-actual-complete-box.webp",
      "detailImages": [
        "images/catalog-user-original-v20261017/erzhenbao-open-box-2-trays-owner-v20261017.webp",
        "images/catalog-user-original-v20261017/erzhenbao-single-tray-8-pieces-owner-v20261017.webp"
      ]
    },
    "jianfeng-rose-fruit-tea": {
      "mainImage": "images/catalog-pure-v20261017/danshen-tea-collection-main.webp",
      "detailImages": [
        "images/partner-products/tea-rose-fruit-front.webp",
        "images/catalog-user-detail-cutouts-v20261017/tea-rose-fruit-original-back.webp",
        "images/catalog-user-original-v20261017/rose-fruit-real-teabag.webp"
      ]
    },
    "jianfeng-leisure-tea": {
      "mainImage": "images/catalog-pure-v20261017/tea-leisure-main.webp",
      "detailImages": [
        "images/partner-products/tea-danshen-leisure-front.webp",
        "images/catalog-user-detail-cutouts-v20261017/tea-leisure-original-back.webp"
      ]
    },
    "jianfeng-wudahan-tea": {
      "mainImage": "images/catalog-pure-v20261017/tea-wudahan-main.webp",
      "detailImages": [
        "images/partner-products/tea-wudahan-front.webp",
        "images/catalog-user-detail-cutouts-v20261017/tea-wudahan-original-back.webp"
      ]
    },
    "jianfeng-fiber-tea": {
      "mainImage": "images/catalog-pure-v20261017/tea-fiber-main.webp",
      "detailImages": [
        "images/partner-products/tea-danshen-lotus-front.webp",
        "images/catalog-user-detail-cutouts-v20261017/tea-fiber-original-back.webp"
      ]
    },
    "jianfeng-white-tea": {
      "mainImage": "images/catalog-pure-v20261017/tea-white-main.webp",
      "detailImages": [
        "images/partner-products/tea-white-danshen-front.webp",
        "images/catalog-user-detail-cutouts-v20261017/tea-white-original-back.webp"
      ]
    },
    "jianfeng-refresh-tea": {
      "mainImage": "images/catalog-pure-v20261017/tea-refresh-main.webp",
      "detailImages": [
        "images/partner-products/tea-danshen-refresh-front.webp",
        "images/catalog-user-detail-cutouts-v20261017/tea-refresh-original-back.webp"
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
