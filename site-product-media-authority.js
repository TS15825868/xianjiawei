"use strict";
/* 仙加味官網產品圖片唯一執行權威｜2026-09-29 product-media-v8
 * mainImage：首頁／產品總覽／怎麼選／試喝／推薦／產品卡／產品 Hero，只允許 images/product-main/。
 * detailImages：只允許產品完整介紹頁詳細圖片區，只允許 images/dm-final/。
 * identityReference：只供包裝身份與比例檢查，不作一般公開主圖。
 */
(function(){
  const DATA={
  "version": "20260929-product-media-v8",
  "scope": "website-product-media",
  "rules": {
    "generalDisplay": "one product, one mainImage; source must be images/product-main/",
    "productDetailHero": "same mainImage as all other general product displays",
    "productDetailMedia": "detailImages only; source must be images/dm-final/",
    "identityReference": "validation/reference only; never general public main image"
  },
  "products": {
    "guilu-gao": {
      "mainImage": "images/product-main/guilu-gao.jpg",
      "detailImages": [
        "images/dm-final/01_guilu-gao-100g-dm.jpg"
      ],
      "identityReference": "images/guilu-gao.jpg"
    },
    "guilu-drink-30": {
      "mainImage": "images/product-main/guilu-drink-30.jpg",
      "detailImages": [
        "images/dm-final/02_guilu-drink-30cc-dm-official-v20260814.jpg"
      ],
      "identityReference": "images/guilu-drink-30cc-glass.jpg"
    },
    "guilu-drink-180": {
      "mainImage": "images/product-main/guilu-drink-180.jpg",
      "detailImages": [
        "images/dm-final/03_guilu-drink-180cc-dm.jpg"
      ],
      "identityReference": "images/guilu-drink-180cc.jpg"
    },
    "guilu-tangkuai": {
      "mainImage": "images/product-main/guilu-tangkuai.jpg",
      "detailImages": [
        "images/dm-final/05_guilu-tangkuai-75g-dm.jpg"
      ],
      "identityReference": "images/products-v2/guilu-tangkuai-open-new.jpg"
    },
    "guilu-jiao": {
      "mainImage": "images/product-main/guilu-jiao.jpg",
      "detailImages": [
        "images/dm-final/06_guilu-jiao-600g-dm.jpg"
      ],
      "identityReference": "images/products-v2/guilu-jiao-open-new.jpg"
    },
    "luerong-fen": {
      "mainImage": "images/product-main/luerong-fen.jpg",
      "detailImages": [
        "images/dm-final/04_luerong-fen-75g-dm.jpg"
      ],
      "identityReference": "images/lurong.jpg"
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
