# 仙加味公開內容母本

此資料夾只保存可公開的品牌、產品、貼文文案、圖片網址與圖片生成指令。

## 正式檔案

- `public-post-library.json`：23 篇正式貼文母本；2 篇已發布鎖定、21 篇待人工審核。
- `public-asset-library.json`：官網、產品、品牌與貼文圖片清單。
- `public-content-policy.json`：公開 Git 與私人 ERP 的資料邊界。
- `social-guilu-drink-trial-v1.json`：已發布的龜鹿飲試喝貼文正式版本。

## 不得放入公開 Git 的資料

客戶姓名、電話、地址、訂單、付款、成本、毛利、即時庫存、採購條件、供應商內部條件、平台憑證、API Key、Token、Secret、員工帳號與稽核紀錄。

## 正式分工

- 公開 `TS15825868/xianjiawei`：文案與圖片唯一母本。
- 私人 `TS15825868/xianjiawei-internal`：Cloudflare Access、D1、審核、排程、發布結果及內部營運資料。

所有貼文仍需老闆人工審核後才能發布；已發布貼文必須鎖定防止重複發布。
