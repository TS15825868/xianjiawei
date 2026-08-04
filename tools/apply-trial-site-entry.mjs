import { readFileSync, writeFileSync } from 'node:fs';

const path = 'index.html';
let html = readFileSync(path, 'utf8');

const trialButton = '<a class="btn btn-line" data-line-message="我想申請龜鹿飲30cc試喝組。" href="https://lin.ee/sHZW7NkR" rel="noopener noreferrer" target="_blank">申請龜鹿飲試喝</a>';
if (!html.includes('>申請龜鹿飲試喝</a>')) {
  html = html.replace(
    '<div class="hero-actions">',
    `<div class="hero-actions">\n        ${trialButton}`,
  );
}

const section = `
  <section class="section section--narrow" id="guilu-drink-trial">
    <div class="section-heading">
      <p class="eyebrow">先試喝，再決定</p>
      <h2>龜鹿飲30cc小玻璃罐試喝組</h2>
      <p>3罐試喝品免費，僅需自行負擔運費。所有申請、運費確認與正式下單統一在仙加味LINE OA完成。</p>
    </div>
    <article class="card reveal">
      <div class="home-choice-grid">
        <div class="card"><h3>試喝內容</h3><p>30cc小玻璃罐×3罐</p></div>
        <div class="card"><h3>7-11店到店</h3><p>運費60元</p></div>
        <div class="card"><h3>郵局宅配</h3><p>運費100元</p></div>
      </div>
      <p>每位顧客、聯絡電話及收件地址限申請一次。運費與資料確認後採接單安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。</p>
      <p><strong>正式售價50元／罐；買10送1，共11罐500元。另有販售180cc鋁袋，單包200元；買10送1，共11包2,000元。</strong></p>
      <div class="final-cta__actions">
        <a class="btn btn-line" data-line-message="我想申請龜鹿飲30cc試喝組。" href="https://lin.ee/sHZW7NkR" rel="noopener noreferrer" target="_blank">加入LINE申請試喝</a>
        <a class="btn btn-outline" href="trial.html">查看完整試喝說明</a>
      </div>
    </article>
  </section>
`;

if (!html.includes('id="guilu-drink-trial"')) {
  const marker = '  <section class="section">\n    <div class="section-heading">\n      <p class="eyebrow">延伸了解</p>';
  if (!html.includes(marker)) throw new Error('找不到首頁試喝區插入位置');
  html = html.replace(marker, `${section}\n${marker}`);
}

html = html.replace(/<meta[^>]+name="description"[^>]*>/, '<meta content="仙加味承接萬華四代龜鹿工序；龜鹿飲30cc小玻璃罐提供3罐長期試喝方案，試喝品免費、運費自付，申請與下單統一由LINE OA協助。" name="description"/>');
html = html.replace(/"dateModified":"[^"]+"/, '"dateModified":"2026-08-04"');
writeFileSync(path, html);

const sitePath = 'site.js';
let site = readFileSync(sitePath, 'utf8');
if (!site.includes('{ href: "trial.html", label: "申請試喝"')) {
  site = site.replace(
    '{ href: "contact.html", label: "聯絡我們", keys: ["contact"] }',
    '{ href: "trial.html", label: "申請試喝", keys: ["trial"] },\n      { href: "contact.html", label: "聯絡我們", keys: ["contact"] }',
  );
}
if (!site.includes('trial: "我想申請龜鹿飲30cc試喝組。"')) {
  site = site.replace(
    '    contact: "我想聯絡仙加味。",',
    '    trial: "我想申請龜鹿飲30cc試喝組。",\n    contact: "我想聯絡仙加味。",',
  );
}
if (!site.includes('<a href="trial.html">申請試喝</a>')) {
  site = site.replace(
    '<a href="contact.html">聯絡我們</a>',
    '<a href="trial.html">申請試喝</a>\n          <a href="contact.html">聯絡我們</a>',
  );
}
if (!site.includes('href="trial.html">試喝')) {
  site = site.replace(
    '<a class="btn btn-outline" href="products.html">查看產品</a>',
    '<a class="btn btn-line" href="trial.html">試喝</a>\n          <a class="btn btn-outline" href="products.html">查看產品</a>',
  );
}
writeFileSync(sitePath, site);
console.log('PASS：首頁、全站選單、頁尾與LINE預填訊息已加入長期試喝入口。');
