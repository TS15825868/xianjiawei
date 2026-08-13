# 仙加味三系統正式用圖對照表｜2026-08-13 v8

> 最高原則：正式產品主圖、詳細 DM、試喝內容是不同媒體角色，不可互相取代。新版正確資料取代舊版；products-v3 保留作真實產品外觀、包裝與比例校正。

## 官網試喝頁

官網自 v8 起不再使用舊 `trial-small-boss.webp/jpg/png` 當主圖，原因不是副檔名，而是這批檔案共用的來源像素已出現花圖／色塊；即使檔案容器可以解碼，也不屬於可上線視覺。

官網正式試喝呈現：
- render mode：`component`
- component：`trial-showcase-v20260813`
- 小老闆情境輔助：`/images/post-library/userzip3-v20260811/self-care-family-2.webp`
- 30cc 正式產品圖：`/images/customer-display-v20260812/guilu-drink-30cc.avif`
- 標題：`龜鹿飲試喝組｜先試喝，再決定`
- 3罐試喝品免費、運費自付、每位顧客／電話／地址限一次、約5～7個工作天出貨。

官網已退役：
- `trial.webp`
- `trial-clean-v4.svg`
- `trial-small-boss.webp`
- `trial-small-boss.jpg`
- `trial-small-boss.png`
- 舊試喝 DM aliases

**LINE OA 與官網媒體要分開驗證。** LINE 端若仍有既有 JPEG 路徑，不可因官網 v8 直接刪檔或假設已同步；需在 TS-LINE 正式流程另行確認後再更新，避免誤傷現有回覆。

## 六張正式產品主圖

| 產品 | 官網目前正式產品圖 | 主規格 |
|---|---|---|
| 龜鹿膏 | `/images/customer-display-v20260812/guilu-gao.avif` | 100g／罐 |
| 龜鹿飲30cc玻璃罐 | `/images/customer-display-v20260812/guilu-drink-30cc.avif` | 30cc／罐（小玻璃罐） |
| 龜鹿飲180cc鋁袋 | `/images/customer-display-v20260812/guilu-drink-180cc-product.jpg` | 180cc／包（鋁袋） |
| 龜鹿湯塊 | `/images/customer-display-v20260812/guilu-tangkuai.avif` | 75g／盒｜8塊裝 |
| 龜鹿膠 | `/images/customer-display-v20260812/guilu-jiao.avif` | 600g（1斤）／盒｜32塊裝 |
| 鹿茸粉 | `/images/customer-display-v20260812/luerong-fen.avif` | 75g／罐 |

180cc 正式產品主圖：
- exact approved master：1122×1402
- bytes：315,576
- SHA256：`719bd0a0823693c17e288ee2e4445874c9730710ce08de722c2d54c66e840e62`
- 詳細 DM：`/images/dm-approved-v20260810/guilu-drink-180cc.webp`
- 產品圖與 DM 禁止互換。

產品圖硬規則：
- 30cc 必須小玻璃罐、裸罐、無貼紙，不改罐型與比例。
- 180cc 必須鋁袋，不改袋型與比例。
- 龜鹿湯塊「每塊約9.375g」只放詳細資料，不放產品主圖／DM主規格。
- 龜鹿膠「每塊約18.75g」只放詳細資料，不放產品主圖／DM主規格。
- 官網產品卡、產品詳頁、Modal 使用正式產品主圖；不得回退 `*-clean.svg` 或錯誤角色 DM。

## 六張正式詳細 DM

詳細 DM 由目前 `data/formal-media-authority-v20260810.json` 與 `images/formal-display/manifest.json` 管理，只在明確 DM／詳細圖用途出現。

- 龜鹿膏：核准 JPEG fallback
- 30cc：核准修正版 DM
- 180cc：`/images/dm-approved-v20260810/guilu-drink-180cc.webp`
- 龜鹿湯塊：核准修正版 DM
- 龜鹿膠：核准修正版 DM
- 鹿茸粉：核准 DM

**DM 不得取代產品主圖，產品圖也不得冒充 DM。**

## 小老闆角色使用

- 官網：首頁 CTA、試喝、FAQ、怎麼選、LINE 導流、聯絡我們可使用核准 Q 版小老闆情境圖。
- LINE OA：歡迎、試喝、FAQ、怎麼選產品、下單流程要使用 LINE 端已驗證素材。
- 貼文：試喝、FAQ、品牌故事、季節情境、LINE 導流可使用核准情境圖，但需依最新貼文素材 authority 與16項審核。
- 小老闆不可嵌入正式產品主圖改變產品身份。
- 角色固定為 Q 版小男孩、米白中式上衣、深橄欖綠圍裙、胸前紅色直式「仙加味」印章；小鹿與小烏龜為分開角色。

## 守門員規則

1. 只驗證目前最新 authority，不鎖死舊版本號或舊檔名。
2. 產品圖／詳細 DM／trial 元件必須分開。
3. 官網不得再選取已知花圖 trial aliases。
4. 180cc 產品用途固定使用正式高清產品主圖；詳細 DM 只在 DM 用途使用。
5. 30cc 與 180cc 外觀、包裝、尺寸比例不得重畫或變形。
6. 圖文不符、黑塊、花圖、損壞檔、產品重畫、角色裁切都不可核准。
7. 換圖、改圖或重生成後，一律回 `pending_review` 並重新跑16項審核。
8. 三系統收尾期間守門員維持提示／手動驗證模式；完成正式驗收後才恢復阻擋模式。

## 三系統資料來源

- 官網：`data/formal-media-authority-v20260810.json` + `images/formal-display/manifest.json` + `site-product-image-safety.js`
- LINE OA：TS-LINE 自己的正式產品／trial authority，必須獨立驗證
- 貼文中心／內部發佈：xianjiawei-internal 的 current formal-media policy

本表 v8 取代任何把官網產品圖、DM、試喝圖混用或把已花圖 trial alias 當作官網正式主圖的舊對照。