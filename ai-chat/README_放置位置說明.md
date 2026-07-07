# 官網 AI 聊天設定放置位置

- AI 指令 / System Prompt：貼 `01_SystemPrompt_官網AI聊天.md`
- 知識庫 / FAQ / Knowledge Base：貼 `02_KnowledgeBase_產品資料_FAQ.md`
- 歡迎訊息：貼 `03_WelcomeMessage_歡迎詞.txt`
- 快捷按鈕：用 `04_QuickButtons_快捷按鈕.json` 的文字建立按鈕

重點：官網聊天只介紹產品、使用方式、保存、怎麼選；價格、優惠、下單全部導到 LINE OA：@762jybnm。

注意：GitHub Pages 是靜態網站，不要把 OpenAI API Key 直接寫在前端程式碼。若要接 AI，建議使用外掛式聊天工具，或用後端服務代理 API。


## v282 補充：GitHub 上傳與測試

`ai-chat/` 是聊天工具的「設定資料」，不是聊天程式本體。直接上傳 GitHub 不會自動產生 AI 聊天功能。

建議流程：
1. 先選一個可嵌入網站的聊天工具。
2. 將本資料夾內容貼到聊天工具後台。
3. 取得聊天工具提供的嵌入碼。
4. 把嵌入碼放進網站共用頁腳或每頁 HTML 的 `</body>` 前。
5. 用 `05_TestQuestions_測試清單.md` 測試。

GitHub Pages 靜態網站不要直接放 OpenAI API Key。
