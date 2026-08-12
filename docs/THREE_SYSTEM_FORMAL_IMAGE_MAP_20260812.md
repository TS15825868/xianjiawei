# 仙加味三系統正式用圖對照表｜2026-08-12

> 唯一原則：六張產品圖、六張詳細 DM、試喝正式主圖是三個獨立媒體角色，不可互相取代。products-v3 原圖保留作真實產品外觀、包裝、標示與比例校正。

## 龜鹿飲試喝組

- 正式主圖：`/images/customer-display-v20260812/trial-small-boss.webp`
- LINE 相容版：`/images/customer-display-v20260812/trial-small-boss.jpg`
- 標題：`龜鹿飲試喝組｜先試喝，再決定`
- 官網：試喝頁、首頁試喝導流、試喝申請相關卡片固定使用正式小老闆試喝主圖。
- LINE OA：試喝關鍵字、試喝介紹、申請導流固定使用同一張正式主圖的 JPEG 相容版。
- 貼文中心：所有試喝類文案固定對應正式試喝主圖；不得自行重生成、不得回退舊 evergreen／trial.webp。
- 試喝圖不可當成六張產品主圖或六張詳細 DM。

## 六張正式產品圖

| 產品 | 正式產品圖 | 主規格 |
|---|---|---|
| 龜鹿膏 | `/images/customer-display-v20260812/guilu-gao.webp` | 100g／罐 |
| 龜鹿飲30cc玻璃罐 | `/images/customer-display-v20260812/guilu-drink-30cc.webp` | 30cc／罐（小玻璃罐） |
| 龜鹿飲180cc鋁袋 | `/images/customer-display-v20260812/guilu-drink-180cc.webp` | 180cc／包（鋁袋） |
| 龜鹿湯塊 | `/images/customer-display-v20260812/guilu-tangkuai.webp` | 75g／盒｜8塊裝 |
| 龜鹿膠 | `/images/customer-display-v20260812/guilu-jiao.webp` | 600g（1斤）／盒｜32塊裝 |
| 鹿茸粉 | `/images/customer-display-v20260812/luerong-fen.webp` | 75g／罐 |

產品圖規則：
- 30cc 必須是小玻璃罐、裸罐、無貼紙，不改罐型與比例。
- 180cc 必須是鋁袋，不改袋型與比例。
- 龜鹿湯塊「每塊約9.375g」只放詳細資料，不放產品主圖／DM主規格。
- 龜鹿膠「每塊約18.75g」只放詳細資料，不放產品主圖／DM主規格。
- 官網產品卡、產品詳頁、Modal 使用這六張正式產品圖；不得再回退 `*-clean.svg`。

## 六張正式詳細 DM

詳細 DM 固定由 `images/dm-approved-v20260810/` 與目前 authority／manifest 管理，只在明確「詳細／DM」用途出現。DM 不得取代產品主圖，產品圖也不得冒充 DM。

## 小老闆角色使用

- 官網：首頁 CTA、試喝頁、FAQ、依需求挑選、LINE 導流、聯絡我們可使用核准 Q 版小老闆情境圖。
- LINE OA：歡迎、試喝、FAQ、怎麼選產品、下單流程可使用核准相容圖。
- 貼文：試喝、FAQ、品牌故事、季節情境、LINE 導流可使用核准情境圖。
- 小老闆不可嵌入六張產品主圖。
- 角色固定為 Q 版小男孩、米白中式上衣、深橄欖綠圍裙、胸前紅色直式「仙加味」印章；小鹿與小烏龜為分開角色。

## 守門員規則

1. 驗證目前最新正式圖，不鎖死舊版本號或舊檔名。
2. 六張產品圖／六張詳細 DM／試喝正式主圖必須分開。
3. 試喝類只允許 `trial-small-boss` 正式主圖；`trial.webp`、舊 evergreen、舊試喝 DM 均視為退役。
4. 30cc 與 180cc 外觀、包裝、尺寸比例不得重畫或變形。
5. 圖文不符、黑塊、花圖、損壞檔、拼貼、產品重畫、角色裁切都不可核准。
6. 換圖、改圖或重生成後，一律回 `pending_review` 並重新跑 16 項審核。
7. 三系統收尾期間守門員維持提示模式；完成正式驗收後才恢復阻擋模式。

## 三系統資料來源

- 官網：`data/formal-media-authority-v20260810.json` + `images/formal-display/manifest.json` + `site-product-image-safety.js`
- LINE OA：`TS-LINE/assets/data/official-products.json` + `content/trial-campaign-visual.json`
- 貼文中心／內部發佈：`xianjiawei-internal/assets/js/formal-media-policy-v20260810.js`

本表以 2026-08-12 最新確認規則為準，取代任何把產品圖、DM、試喝圖混用的舊對照。
