"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const siteJsPath = path.join(root, "site.js");
const cssPath = path.join(root, "site.css");
const assetPath = path.join(root, "images", "brand", "xianjiawei-mascot.jpg");

function replaceRequired(source, search, replacement, label) {
  const next = source.replace(search, replacement);
  if (next === source) throw new Error(`找不到更新位置：${label}`);
  return next;
}

if (!fs.existsSync(assetPath) || fs.statSync(assetPath).size < 8000) {
  throw new Error("小老闆圖片檔案異常");
}

let site = fs.readFileSync(siteJsPath, "utf8");
if (!site.includes("renderMascotGuide();")) {
  site = replaceRequired(
    site,
    "    renderPage();\n    initReveal();",
    "    renderPage();\n    renderMascotGuide();\n    initReveal();",
    "網站初始化"
  );
}

if (!site.includes("function renderMascotGuide()")) {
  const block = `
const MASCOT_IMAGE = 'images/brand/xianjiawei-mascot.jpg?v=300.5';

function renderMascotGuide() {
  const page = document.body?.dataset?.page || '';
  const config = {
    home: {
      eyebrow: '仙加味小老闆',
      title: '帶你認識產品，也陪你找到日常使用方式',
      text: '先依固定安排、方便即飲、沖泡燉湯、家庭規格或自行調飲來比較；產品規格與價格仍以正式產品資料為準。',
      actions: \`${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="products.html">看產品</a>\`
    },
    choose: {
      eyebrow: '小老闆帶你選',
      title: '先從平常想怎麼使用開始',
      text: '想固定安排、方便即飲、沖泡燉湯或自行搭配飲品，都可以從使用習慣開始比較。',
      actions: \`${lineButton('幫我推薦', '幫我推薦')}<a class="btn btn-outline" href="products.html">看全部產品</a>\`
    },
    combo: {
      eyebrow: '小老闆搭配導覽',
      title: '依生活節奏查看搭配組合',
      text: '搭配卡會保留原有產品內容、每組價格、組數選擇與加入購物車功能，小老闆只負責導覽，不改動產品規格。',
      actions: \`${lineButton('搭配組合', '搭配組合')}<a class="btn btn-outline" href="products.html">先看產品</a>\`
    },
    brand: {
      eyebrow: '品牌導覽角色',
      title: '仙加味小老闆｜親切、專業、傳承與安心',
      text: '角色延續米白中式上衣、深橄欖綠圍裙、仙加味紅印章，以及分開的小鹿與小烏龜圖案，用於網站與 LINE 的品牌導覽。',
      actions: \`${lineButton('看產品', '看產品')}<a class="btn btn-outline" href="contact.html">聯絡我們</a>\`
    }
  }[page];

  if (!config || document.getElementById('mascot-guide')) return;
  const hero = document.querySelector('main .hero');
  if (!hero) return;

  const section = document.createElement('section');
  section.id = 'mascot-guide';
  section.className = 'section mascot-guide-section';
  section.innerHTML = \`
    <article class="mascot-guide-card reveal">
      <div class="mascot-guide-card__media">
        <img src="\${MASCOT_IMAGE}" alt="仙加味小老闆，穿米白中式上衣與深橄欖綠圍裙" width="360" height="450" loading="eager" decoding="async">
      </div>
      <div class="mascot-guide-card__copy">
        <p class="eyebrow">\${config.eyebrow}</p>
        <h2>\${config.title}</h2>
        <p>\${config.text}</p>
        <div class="hero-actions">\${config.actions}</div>
      </div>
    </article>
  \`;
  hero.insertAdjacentElement('afterend', section);
}

`;
  site = replaceRequired(site, "function renderHome() {", block + "function renderHome() {", "小老闆導覽函式");
}

site = site.replace(/fetch\('data\.json\?v=[^']+'\)/, "fetch('data.json?v=300.5')");
fs.writeFileSync(siteJsPath, site, "utf8");

let css = fs.readFileSync(cssPath, "utf8");
if (!css.includes("/* v300.5 仙加味小老闆 */")) {
  css += `

/* v300.5 仙加味小老闆 */
.mascot-guide-section{padding-top:0}
.mascot-guide-card{
  display:grid;
  grid-template-columns:minmax(210px,320px) minmax(0,1fr);
  align-items:center;
  gap:28px;
  overflow:hidden;
  background:linear-gradient(135deg,#fffaf2 0%,#f4ead8 100%);
  border:1px solid rgba(123,30,30,.14);
  border-radius:28px;
  box-shadow:var(--shadow-strong);
  padding:24px 30px;
}
.mascot-guide-card__media{align-self:end;display:flex;justify-content:center}
.mascot-guide-card__media img{
  width:min(100%,280px);
  max-height:350px;
  object-fit:contain;
  object-position:center bottom;
  background:transparent;
  border-radius:22px;
}
.mascot-guide-card__copy{min-width:0}
.mascot-guide-card__copy h2{color:var(--brand);max-width:760px}
.mascot-guide-card__copy p:not(.eyebrow){max-width:760px;color:#4b5563}
@media(max-width:760px){
  .mascot-guide-card{grid-template-columns:112px minmax(0,1fr);gap:16px;padding:18px 16px;border-radius:20px}
  .mascot-guide-card__media img{width:112px;max-height:170px;border-radius:16px}
  .mascot-guide-card__copy h2{font-size:22px}
  .mascot-guide-card__copy .hero-actions{gap:8px}
}
@media(max-width:480px){
  .mascot-guide-card{grid-template-columns:1fr;text-align:center}
  .mascot-guide-card__media img{width:150px;max-height:188px}
  .mascot-guide-card__copy .hero-actions{justify-content:center}
}
`;
}
fs.writeFileSync(cssPath, css, "utf8");

for (const name of fs.readdirSync(root).filter((name) => name.endsWith(".html"))) {
  const file = path.join(root, name);
  let html = fs.readFileSync(file, "utf8");
  html = html.replace(/site\.css\?v=[0-9.]+/g, "site.css?v=300.5");
  html = html.replace(/site\.js\?v=[0-9.]+/g, "site.js?v=300.5");
  fs.writeFileSync(file, html, "utf8");
}

console.log("Applied mascot integration v300.5");
