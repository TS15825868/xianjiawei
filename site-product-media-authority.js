"use strict";
/* 仙加味官網產品圖片唯一執行權威｜2026-09-30 main-dm-v12
 * mainImage：首頁／產品總覽／怎麼選／試喝／推薦／產品卡／產品 Hero，目前公開四款使用原始像素保真山水情境 WebP；舊透明 PNG 與 JPG 保留為備援和來源核對。
 * detailImages：只允許「查看介紹」Modal 與獨立產品頁的詳細內容備援使用，以真實實物照片的新背景圖為主；DM另行保留，不得混為單品主圖。
 * identityReference：只供包裝身份與比例檢查，不作一般公開主圖。
 */
(function(){
  const DATA={
  "version": "20261016-real-pixel-clean-studio-main-and-detail-v5",
  "scope": "website-product-media",
  "rules": {
    "generalDisplay": "one verified original-photo main per product; images/catalog-real-v20261016; retail box first when sold as complete gift box",
    "productDetailHero": "identical original-photo product image for home, product card and detail hero; real outer carton first where available",
    "productDetailMedia": "details can show real item, actual portions and manufacturer original label; do not redraw packaging; deer-antler powder must remain sealed",
    "identityReference": "validation/reference only; never general public main image",
    "luerongFenVisual": "official 75g jar fully closed and sealed only; never show opened jar, loose powder, spoonfuls, bowls of powder, or mixing drinks in product images"
  },
  "products": {
    "guilu-gao": {
      "mainImage": "images/catalog-clean-studio-v20261016-v5/guilu-gao-main.webp",
      "detailImages": [
        "images/catalog-clean-studio-v20261016-v5/guilu-gao-box-jar-detail.webp",
        "images/product-main/gao-packaging-v20261016/box-jar-original.jpg"
],
      "identityReference": "images/guilu-gao.jpg"
    },
    "guilu-drink-30": {
      "mainImage": "images/catalog-clean-studio-v20261016-v5/guilu-drink-30-main.webp",
      "detailImages": [
        "images/catalog-clean-studio-v20261016-v5/guilu-drink-30-closed-detail.webp"
],
      "identityReference": "images/guilu-drink-30cc-glass.jpg"
    },
    "guilu-drink-180": {
      "mainImage": "images/catalog-clean-studio-v20261016-v5/guilu-drink-180-main.webp",
      "detailImages": [
        "images/catalog-clean-studio-v20261016-v5/guilu-drink-180-closed-detail.webp"
],
      "identityReference": "images/guilu-drink-180cc.jpg"
    },
    "luerong-fen": {
      "visualPolicy": "sealed-original-75g-jar-exterior-only",
      "showContents": false,
      "mainImage": "images/catalog-clean-studio-v20261016-v5/luerong-fen-main.webp",
      "detailImages": [
        "images/catalog-clean-studio-v20261016-v5/luerong-fen-closed-detail.webp"
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
