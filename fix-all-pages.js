const fs = require("fs");
const path = require("path");

/* =========================
共用 Header（統一）
========================= */

const HEADER = `
<header class="header">
<a href="../index.html" class="logo">
<img src="../images/logo-seal.png">
<span>仙加味</span>
</a>
<div class="menu-btn">☰</div>
</header>
<div id="menuOverlay" class="menu-overlay"></div>
`;

/* =========================
共用 Footer script
========================= */

const FOOTER = `
<a class="floating-line" href="https://lin.ee/sHZW7NkR">LINE詢問</a>
<script src="../articles-data.js"></script>
<script src="../site.js"></script>
`;

/* =========================
修正文章頁
========================= */

const articlesDir = "./articles";

fs.readdirSync(articlesDir).forEach(file => {

if (!file.endsWith(".html")) return;

const filePath = path.join(articlesDir, file);
let content = fs.readFileSync(filePath, "utf8");

/* 替換 header */
content = content.replace(/<header[\s\S]*?<\/header>/, HEADER);

/* 加 menuOverlay */
if (!content.includes("menu-overlay")) {
content = content.replace("<body>", `<body>\n${HEADER}`);
}

/* 加 footer script */
if (!content.includes("site.js")) {
content = content.replace("</body>", `${FOOTER}\n</body>`);
}

/* 加 CTA（沒有才加） */
if (!content.includes("LINE詢問")) {

const CTA = `
<div style="margin:40px 0;text-align:center;">
<a href="https://lin.ee/sHZW7NkR" class="btn btn-dark">LINE詢問</a>
</div>
`;

content = content.replace("</main>", `${CTA}\n</main>`);
}

/* 寫回 */
fs.writeFileSync(filePath, content);

});

console.log("✅ 全站文章頁已自動升級完成");
