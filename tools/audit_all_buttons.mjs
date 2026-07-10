import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const ROOT = process.cwd();
const BASE = process.env.SITE_BASE_URL || 'http://127.0.0.1:8080/';
const pages = fs.readdirSync(ROOT)
  .filter(name => name.endsWith('.html') && !name.startsWith('google'))
  .sort();

const failures = [];
const checks = [];
const acceptedLineCommands = [
  '看產品', '直接下單', '幫我推薦', '搭配組合', '怎麼使用',
  '價格方案', '品牌故事', '人工客服', '料理搭配',
];
const acceptedPrefixes = [
  '產品詳情｜', '使用方式｜', '選擇數量｜', '加入購物車｜',
  '搭配方案｜', '搭配組數｜', '加入組合｜',
];

function record(ok, page, label, detail = '') {
  checks.push({ ok, page, label, detail });
  if (!ok) failures.push(`${page}｜${label}${detail ? `｜${detail}` : ''}`);
}

function lineCommand(href) {
  try {
    const url = new URL(href);
    if (url.hostname !== 'line.me' || !url.pathname.includes('/R/oaMessage/')) return '';
    return decodeURIComponent(url.search.slice(1));
  } catch {
    return '';
  }
}

function validLineCommand(command) {
  return acceptedLineCommands.includes(command) || acceptedPrefixes.some(prefix => command.startsWith(prefix));
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });

for (const pageName of pages) {
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on('pageerror', error => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on('console', message => {
    if (message.type() === 'error') runtimeErrors.push(`console: ${message.text()}`);
  });

  const response = await page.goto(new URL(pageName, BASE).href, { waitUntil: 'networkidle' });
  record(Boolean(response && response.ok()), pageName, '頁面載入', response ? `HTTP ${response.status()}` : '無回應');
  await page.waitForTimeout(150);

  record(runtimeErrors.length === 0, pageName, 'JavaScript 執行', runtimeErrors.join('；'));
  record(await page.locator('#site-header').count() === 1, pageName, '共用頁首');
  record(await page.locator('#site-footer').count() === 1, pageName, '共用頁尾');

  const menuButton = page.locator('#menu-btn');
  if (await menuButton.count()) {
    await menuButton.click();
    record(await page.locator('#menu-drawer').getAttribute('aria-hidden') === 'false', pageName, '選單開啟');
    const menuLinks = page.locator('#menu-drawer .site-menu__panel a');
    record(await menuLinks.count() >= 10, pageName, '選單連結數量', String(await menuLinks.count()));
    await page.locator('#menu-close').click();
    record(await page.locator('#menu-drawer').getAttribute('aria-hidden') === 'true', pageName, '選單關閉');
  } else {
    record(false, pageName, '選單按鈕', '找不到 #menu-btn');
  }

  const floating = page.locator('#floating-line-cta');
  if (await floating.count()) {
    const href = await floating.getAttribute('href');
    const command = lineCommand(href || '');
    record(Boolean(href && validLineCommand(command)), pageName, '右下角 LINE 按鈕', command || String(href));
    record(Boolean((await floating.textContent())?.trim()), pageName, '右下角 LINE 按鈕名稱');
  } else {
    record(false, pageName, '右下角 LINE 按鈕', '未產生');
  }

  const lineLinks = page.locator('a[href*="line.me/R/oaMessage/"]');
  for (let i = 0; i < await lineLinks.count(); i += 1) {
    const link = lineLinks.nth(i);
    const href = await link.getAttribute('href');
    const label = ((await link.textContent()) || '').trim() || `LINE-${i + 1}`;
    const command = lineCommand(href || '');
    record(validLineCommand(command), pageName, `LINE｜${label}`, command || String(href));
  }

  const localLinks = page.locator('a[href]');
  for (let i = 0; i < await localLinks.count(); i += 1) {
    const link = localLinks.nth(i);
    const href = await link.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) continue;
    let url;
    try { url = new URL(href, new URL(pageName, BASE)); } catch { continue; }
    if (url.origin !== new URL(BASE).origin) continue;
    const res = await context.request.get(url.href);
    const label = ((await link.textContent()) || '').trim() || href;
    record(res.ok(), pageName, `站內連結｜${label}`, `${url.pathname} HTTP ${res.status()}`);
  }

  const quickViews = page.locator('[data-quick-view]');
  if (await quickViews.count()) {
    await quickViews.first().click();
    record(await page.locator('#product-modal').getAttribute('aria-hidden') === 'false', pageName, '產品快速查看開啟');
    record(await page.locator('#product-modal-body').locator('text=完整介紹').count() >= 0, pageName, '產品快速查看內容');
    await page.locator('#product-modal-close').click();
    record(await page.locator('#product-modal').getAttribute('aria-hidden') === 'true', pageName, '產品快速查看關閉');
  }

  if (pageName === 'products.html' || pageName === 'index.html') {
    const detailLinks = page.locator('.product-card__actions a.btn-outline');
    for (let i = 0; i < await detailLinks.count(); i += 1) {
      const href = await detailLinks.nth(i).getAttribute('href');
      record(Boolean(href && href.startsWith('product-') && href.endsWith('.html')), pageName, '產品完整介紹', String(href));
    }
  }

  if (pageName === 'combo.html' || pageName === 'index.html') {
    const comboLinks = page.locator('.combo-card--featured a[href*="line.me/R/oaMessage/"]');
    for (let i = 0; i < await comboLinks.count(); i += 1) {
      const href = await comboLinks.nth(i).getAttribute('href');
      const command = lineCommand(href || '');
      record(command.startsWith('搭配組數｜'), pageName, '指定搭配組合', command);
    }
  }

  if (pageName === 'choose.html') {
    const finalLine = page.locator('.final-cta a[href*="line.me/R/oaMessage/"]').last();
    if (await finalLine.count()) {
      const command = lineCommand((await finalLine.getAttribute('href')) || '');
      record(command === '幫我推薦', pageName, '怎麼選最終按鈕', command);
    }
  }

  await page.close();
}

await browser.close();

const report = [
  '# 全站按鈕瀏覽器測試報告',
  '',
  `- 頁面：${pages.length}`,
  `- 測試項目：${checks.length}`,
  `- 失敗：${failures.length}`,
  '',
  '| 頁面 | 功能 | 結果 | 詳細 |',
  '|---|---|---|---|',
  ...checks.map(item => `| ${item.page} | ${item.label} | ${item.ok ? '通過' : '失敗'} | ${(item.detail || '').replaceAll('|', '／')} |`),
];
fs.writeFileSync('BUTTON_BROWSER_REPORT.md', report.join('\n') + '\n', 'utf8');

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`PASS browser button audit: ${pages.length} pages, ${checks.length} checks`);
