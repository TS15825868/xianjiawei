# TaiShing

## 自動上傳到 GitHub（commit 後自動 push）

你問的「這要放到哪」：

- **版本控管方式（推薦）**：放在專案根目錄的 `.githooks/post-commit`
- **只限你自己本機**：放在 `.git/hooks/post-commit`

本專案已提供可版本控制的範本：`.githooks/post-commit`。

### 放置位置與啟用方式（推薦）

在專案根目錄應該長這樣：

```text
TaiShing/
├─ .githooks/
│  └─ post-commit
└─ (其他專案檔案)
```

啟用指令（在 repo 根目錄執行一次）：

```bash
git config core.hooksPath .githooks
chmod +x .githooks/post-commit
```

### 如果你要放在 `.git/hooks`（單機用）

```bash
cp .githooks/post-commit .git/hooks/post-commit
chmod +x .git/hooks/post-commit
```

> 注意：`.git/hooks` 內容不會被 Git 版控，團隊其他人不會自動拿到。

### 行為說明

- 每次 `git commit` 後，hook 會檢查目前分支。
- 只有在 `work` 分支時才會自動執行：`git push -u origin work`。
- 如果不在 `work` 分支，會略過自動推送。

### 停用自動推送

```bash
git config --unset core.hooksPath
```
