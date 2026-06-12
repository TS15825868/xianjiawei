仙加味 v127 最終正式上線母本版

本版重點：
1. 網站全站來源追蹤與 LINE 深度連結。
2. LINE OA 保留原購物車、數量、優惠、付款、出貨流程。
3. LINE OA 新增精準產品適合度 Flex 回覆。
4. 客人回「好／嗯／不知道」會回到不卡住的選擇卡。
5. Google Sheet CRM 升級：訂單來源、客戶來源、主購商品、回購天數、客戶等級、出貨狀態下拉、CRM儀表板。
6. 門市自取地址統一：台北市萬華區西昌街52號（客服確認取貨時間）。

上線檢查：
- Render/Railway 部署後開 /healthz，需顯示 v127。
- Google Apps Script 使用 Code.gs 重新部署 Web App。
- CRM_URL 更新到 LINE OA 環境變數。
- GitHub Pages 上傳網站後強制刷新。
