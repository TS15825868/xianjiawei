import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlFiles = fs.readdirSync(root).filter((name) => name.endsWith('.html')).sort();
const errors = [];
const warnings = [];
const GUILU_JIAO_SPEC = '600g／盒（1斤）｜32塊裝｜每塊約18.75g';
const SOUP_SPEC = '75g／盒｜8塊裝｜每塊約9.375g';
const DRINK30_SPEC = '30cc／罐（小玻璃罐）';

function fail(file, message) { errors.push(`${file}: ${message}`); }
function warn(file, message) { warnings.push(`${file}: ${message}`); }
function stripQuery(value) { return value.split('#')[0].split('?')[0]; }
function isExternal(value) { return /^(?:https?:|mailto:|tel:|javascript:|data:|\/\/)/i.test(value) || value.startsWith('#'); }
function localPath(fromFile, value) {
  const clean = decodeURIComponent(stripQuery(value)).trim();
  if (!clean || isExternal(clean)) return null;
  if (clean.startsWith('/xianjiawei/')) return path.join(root, clean.slice('/xianjiawei/'.length));
  if (clean.startsWith('/')) return null;
  return path.resolve(root, path.dirname(fromFile), clean);
}
function isOwnershipVerificationFile(file, html) {
  return /^(?:google|bing|baidu|yandex|pinterest)[a-z0-9_-]*\.html$/i.test(file) && !/<html\b/i.test(html);
}
function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (!value) continue;
    if (seen.has(value)) duplicates.add(value);
    else seen.add(value);
  }
  return [...duplicates].sort();
}

const forbiddenPublicContact = [
  ['台北市萬華區西昌街52號', '完整門市地址'],
  ['台北市萬華區西昌街 52 號', '完整門市地址'],
  ['西昌街52號', '門市街道地址'],
  ['西昌街 52 號', '門市街道地址'],
  ['(02)2381-2990', '公開電話'],
  ['(02) 2381-2990', '公開電話'],
  ['maps.app.goo.gl/NQCTS6qSfR41URA99', 'Google地圖門市連結'],
];

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  if (isOwnershipVerificationFile(file, html)) {
    console.log(`SKIP 搜尋引擎驗證檔：${file}`);
    continue;
  }
  const isUtility = /^(?:404|post-image-)/.test(file);

  if (!/<html\b[^>]*\blang=["']zh-Hant-TW["']/i.test(html)) fail(file, '缺少正確的繁體中文lang');
  if (!/<meta\b[^>]*name=["']viewport["']/i.test(html)) fail(file, '缺少viewport');
  if (!/<title>[^<]+<\/title>/i.test(html)) fail(file, '缺少title');
  if (!isUtility) {
    if (!/<meta\b[^>]*(?:name=["']description["'][^>]*content=["'][^"']+["']|content=["'][^"']+["'][^>]*name=["']description["'])/i.test(html)) fail(file, '缺少meta description');
    if (!/<link\b[^>]*(?:rel=["']canonical["'][^>]*href=["']https:\/\/ts15825868\.github\.io\/xianjiawei\/|href=["']https:\/\/ts15825868\.github\.io\/xianjiawei\/[^"']*["'][^>]*rel=["']canonical["'])/i.test(html)) fail(file, '缺少正式canonical');
  }

  for (const [phrase, label] of forbiddenPublicContact) {
    if (html.includes(phrase)) fail(file, `官網不得公開${label}`);
  }
  if (/"@type"\s*:\s*"LocalBusiness"/i.test(html) && /"address"\s*:/i.test(html)) fail(file, '公開結構化資料不得包含門市地址');

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt\s*=\s*["'][^"']*["']/i.test(match[0])) fail(file, `圖片缺少alt：${match[0].slice(0, 100)}`);
  }
  const refs = [...html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)].map((match) => match[1]);
  for (const ref of refs) {
    const target = localPath(file, ref);
    if (target && !fs.existsSync(target)) fail(file, `本機連結或素材不存在：${ref}`);
  }

  const styles = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)].map((match) => stripQuery(match[1]));
  const duplicateStyles = styles.filter((item, index) => styles.indexOf(item) !== index);
  if (duplicateStyles.length) warn(file, `重複載入樣式：${[...new Set(duplicateStyles)].join('、')}`);
}

const requiredFiles = [
  'site.js', 'site-core-v410.js', 'site-product-image-safety.js', 'site.css',
  'contact-v411.css', 'contact-v412.css', 'data.json', 'catalog-public.json', 'geo-data.json',
  'brand.html', 'products.html', 'contact.html', 'faq.html', 'images/logo.png',
  'images/guilu-drink-30cc-glass.jpg', 'images/products-v3/guilu-drink-30-clean.svg',
];
for (const file of requiredFiles) if (!fs.existsSync(path.join(root, file))) fail('全站', `缺少核心檔案${file}`);

const requiredProducts = new Map([
  ['guilu-gao', ['龜鹿膏', '100g／罐']],
  ['guilu-drink-30', ['龜鹿飲30cc玻璃罐', DRINK30_SPEC]],
  ['guilu-drink-180', ['龜鹿飲180cc鋁袋', '180cc／包（鋁袋）']],
  ['guilu-tangkuai', ['龜鹿湯塊', SOUP_SPEC]],
  ['guilu-jiao', ['龜鹿膠', GUILU_JIAO_SPEC]],
  ['luerong-fen', ['鹿茸粉', '75g／罐']],
]);

for (const dataFile of ['data.json', 'catalog-public.json']) {
  if (!fs.existsSync(path.join(root, dataFile))) continue;
  const data = JSON.parse(fs.readFileSync(path.join(root, dataFile), 'utf8'));
  const products = Array.isArray(data.products) ? data.products : [];
  const duplicateProductIds = duplicateValues(products.map((product) => product?.id));
  if (duplicateProductIds.length) fail(dataFile, `產品id不可重複：${duplicateProductIds.join('、')}`);
  if (products.length !== 6) fail(dataFile, `正式產品必須剛好6項，目前${products.length}項`);
  for (const [id, [name, size]] of requiredProducts) {
    const item = products.find((product) => product.id === id);
    if (!item) {
      fail(dataFile, `缺少正式產品${id}`);
      continue;
    }
    if (item.name !== name) fail(dataFile, `${id}名稱應為「${name}」，目前為「${item.name}」`);
    const actualSize = item.size || item.specification || item.spec;
    if (actualSize !== size) fail(dataFile, `${id}規格應為「${size}」，目前為「${actualSize}」`);
  }
  const drink30 = products.find((product) => product.id === 'guilu-drink-30');
  if (dataFile === 'data.json') {
    if (!String(drink30?.image || '').includes('guilu-drink-30-clean.svg')) fail(dataFile, '30cc產品卡必須使用乾淨正式原圖包裝SVG');
    if (!String(drink30?.dmImage || '').includes('guilu-drink-30-clean.svg')) fail(dataFile, '30cc DM入口必須使用乾淨正式原圖包裝SVG');
  }
}

if (fs.existsSync(path.join(root, 'images/products-v3/guilu-drink-30-clean.svg'))) {
  const svg = fs.readFileSync(path.join(root, 'images/products-v3/guilu-drink-30-clean.svg'), 'utf8');
  if (!svg.includes('../guilu-drink-30cc-glass.jpg')) fail('guilu-drink-30-clean.svg', '必須引用正式三罐裸小玻璃罐原圖');
  if (!svg.includes('preserveAspectRatio="xMidYMid meet"')) fail('guilu-drink-30-clean.svg', '必須使用contain等比例完整呈現');
  if (/guilu-drink-30\.jpg|dm-final\/02_guilu-drink-30cc-dm/.test(svg)) fail('guilu-drink-30-clean.svg', '不得從舊產品DM或舊含字圖片裁切');
}

for (const file of ['products.html', 'product-guilu-jiao.html']) {
  if (!fs.existsSync(path.join(root, file))) continue;
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  if (!html.includes(GUILU_JIAO_SPEC)) fail(file, `缺少龜鹿膠正式規格「${GUILU_JIAO_SPEC}」`);
}

if (fs.existsSync(path.join(root, 'contact.html'))) {
  const contact = fs.readFileSync(path.join(root, 'contact.html'), 'utf8');
  for (const text of ['仙加味官方 LINE', '@762jybnm', '週一至週六 09:30－18:30', 'images/line-qr.jpg', '前往 LINE 詢問／下單', '官網不公開即時價格與活動']) {
    if (!contact.includes(text)) fail('contact.html', `LINE專用聯絡頁缺少必要內容：${text}`);
  }
  for (const forbidden of ['查看門市資訊', '萬華門市', '門市自取', 'Google 地圖', 'LocalBusiness', 'streetAddress']) {
    if (contact.includes(forbidden)) fail('contact.html', `LINE專用聯絡頁不得出現：${forbidden}`);
  }
  const baseStyleIndex = contact.indexOf('site-ux-v410.css');
  const contactStyleIndex = contact.indexOf('contact-v411.css');
  const mobileFixIndex = contact.indexOf('contact-v412.css');
  if (baseStyleIndex < 0 || contactStyleIndex < 0 || mobileFixIndex < 0 || !(baseStyleIndex < contactStyleIndex && contactStyleIndex < mobileFixIndex)) fail('contact.html', '聯絡頁樣式載入順序錯誤');
}

if (fs.existsSync(path.join(root, 'brand.html'))) {
  const brand = fs.readFileSync(path.join(root, 'brand.html'), 'utf8');
  const years = [...new Set(brand.match(/(?:19|20)\d{2}/g) || [])];
  if (years.length < 2) fail('brand.html', '品牌故事時間軸年份不足，至少需明確顯示兩個年份');
}

const siteEntry = fs.existsSync(path.join(root, 'site.js')) ? fs.readFileSync(path.join(root, 'site.js'), 'utf8') : '';
const siteCore = fs.existsSync(path.join(root, 'site-core-v410.js')) ? fs.readFileSync(path.join(root, 'site-core-v410.js'), 'utf8') : '';
const imageSafety = fs.existsSync(path.join(root, 'site-product-image-safety.js')) ? fs.readFileSync(path.join(root, 'site-product-image-safety.js'), 'utf8') : '';
if (!siteEntry.includes('site-core-v410.js') || !siteEntry.includes('site-product-image-safety.js')) fail('site.js', '入口必須依序載入完整核心與產品圖片守門');
for (const token of ['aria-expanded', 'aria-hidden', 'Escape', 'product-modal', 'data-close-menu']) {
  if (!siteCore.includes(token)) fail('site-core-v410.js', `缺少互動與無障礙契約：${token}`);
}
if (!imageSafety.includes('guilu-drink-30-clean.svg')) fail('site-product-image-safety.js', '30cc圖片守門未指向乾淨正式圖');

const cssText = fs.readdirSync(root)
  .filter((name) => /^(?:site.*|contact.*)\.css$/i.test(name))
  .map((name) => fs.readFileSync(path.join(root, name), 'utf8'))
  .join('\n');
if (!/object-fit\s*:\s*contain/i.test(cssText)) fail('全站CSS', '缺少圖片等比例完整顯示object-fit: contain');
if (!/:focus-visible/i.test(cssText)) warn('全站CSS', '建議補充鍵盤focus-visible樣式');

for (const message of warnings) console.warn(`WARN ${message}`);
if (errors.length) {
  console.error(`網站檢查失敗，共${errors.length}項：`);
  for (const message of errors) console.error(`- ${message}`);
  process.exit(1);
}
console.log(`PASS全站檢查：${htmlFiles.length}個HTML；六項產品、30cc正式原圖、LINE專用聯絡頁、連結素材、SEO與互動契約均通過。`);
