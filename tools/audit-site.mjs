import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlFiles = fs.readdirSync(root).filter((name) => name.endsWith('.html')).sort();
const errors = [];
const warnings = [];

function fail(file, message) {
  errors.push(`${file}: ${message}`);
}

function warn(file, message) {
  warnings.push(`${file}: ${message}`);
}

function stripQuery(value) {
  return value.split('#')[0].split('?')[0];
}

function isExternal(value) {
  return /^(?:https?:|mailto:|tel:|javascript:|data:|\/\/)/i.test(value) || value.startsWith('#');
}

function localPath(fromFile, value) {
  const clean = decodeURIComponent(stripQuery(value)).trim();
  if (!clean || isExternal(clean)) return null;
  if (clean.startsWith('/xianjiawei/')) return path.join(root, clean.slice('/xianjiawei/'.length));
  if (clean.startsWith('/')) return null;
  return path.resolve(root, path.dirname(fromFile), clean);
}

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const isUtility = /^(?:404|post-image-)/.test(file);

  if (!/<html\b[^>]*\blang=["']zh-Hant-TW["']/i.test(html)) fail(file, '缺少正確的繁體中文 lang');
  if (!/<meta\b[^>]*name=["']viewport["']/i.test(html)) fail(file, '缺少 viewport');
  if (!/<title>[^<]+<\/title>/i.test(html)) fail(file, '缺少 title');

  if (!isUtility) {
    if (!/<meta\b[^>]*name=["']description["'][^>]*content=["'][^"']+["']/i.test(html)
      && !/<meta\b[^>]*content=["'][^"']+["'][^>]*name=["']description["']/i.test(html)) {
      fail(file, '缺少 meta description');
    }
    if (!/<link\b[^>]*rel=["']canonical["'][^>]*href=["']https:\/\/ts15825868\.github\.io\/xianjiawei\//i.test(html)
      && !/<link\b[^>]*href=["']https:\/\/ts15825868\.github\.io\/xianjiawei\/[^"]*["'][^>]*rel=["']canonical["']/i.test(html)) {
      fail(file, '缺少正式 canonical');
    }
  }

  for (const match of html.matchAll(/<img\b[^>]*>/gi)) {
    if (!/\balt\s*=\s*["'][^"']*["']/i.test(match[0])) fail(file, `圖片缺少 alt：${match[0].slice(0, 100)}`);
  }

  const refs = [];
  for (const match of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/gi)) refs.push(match[1]);
  for (const ref of refs) {
    const target = localPath(file, ref);
    if (!target) continue;
    if (!fs.existsSync(target)) fail(file, `本機連結或素材不存在：${ref}`);
  }

  const styles = [...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi)].map((m) => stripQuery(m[1]));
  const duplicateStyles = styles.filter((item, index) => styles.indexOf(item) !== index);
  if (duplicateStyles.length) warn(file, `重複載入樣式：${[...new Set(duplicateStyles)].join('、')}`);
}

const requiredFiles = ['site.js', 'site.css', 'data.json', 'brand.html', 'products.html', 'contact.html', 'faq.html', 'images/logo.png'];
for (const file of requiredFiles) if (!fs.existsSync(path.join(root, file))) fail('全站', `缺少核心檔案 ${file}`);

if (fs.existsSync(path.join(root, 'data.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'data.json'), 'utf8'));
  const products = Array.isArray(data.products) ? data.products : [];
  const requiredProducts = new Map([
    ['guilu-gao', ['龜鹿膏', '100g／罐']],
    ['guilu-drink-30', ['龜鹿飲30cc玻璃罐', '30cc／罐（小玻璃罐）']],
    ['guilu-drink-180', ['龜鹿飲180cc鋁袋', '180cc／包（鋁袋）']],
    ['guilu-tangkuai', ['龜鹿湯塊', '75g／盒｜8塊裝｜每塊約9.375g']],
    ['guilu-jiao', ['龜鹿膠', '600g／盒（1斤）｜32塊裝｜每塊約18.75g']],
    ['luerong-fen', ['鹿茸粉', '75g／罐']]
  ]);
  for (const [id, [name, size]] of requiredProducts) {
    const item = products.find((product) => product.id === id);
    if (!item) {
      fail('data.json', `缺少正式產品 ${id}`);
      continue;
    }
    if (item.name !== name) fail('data.json', `${id} 名稱應為「${name}」，目前為「${item.name}」`);
    if (item.size !== size) fail('data.json', `${id} 規格應為「${size}」，目前為「${item.size}」`);
    for (const key of ['image', 'detailPage']) {
      if (!item[key]) fail('data.json', `${id} 缺少 ${key}`);
      else {
        const target = localPath('data.json', item[key]);
        if (target && !fs.existsSync(target)) fail('data.json', `${id} 的 ${key} 不存在：${item[key]}`);
      }
    }
  }
}

if (fs.existsSync(path.join(root, 'brand.html'))) {
  const brand = fs.readFileSync(path.join(root, 'brand.html'), 'utf8');
  const years = [...new Set(brand.match(/(?:19|20)\d{2}/g) || [])];
  if (years.length < 2) fail('brand.html', '品牌故事時間軸年份不足，至少需明確顯示兩個年份');
}

if (fs.existsSync(path.join(root, 'site.js'))) {
  const js = fs.readFileSync(path.join(root, 'site.js'), 'utf8');
  for (const token of ['aria-expanded', 'aria-hidden', 'Escape', 'product-modal', 'data-close-menu']) {
    if (!js.includes(token)) fail('site.js', `缺少互動與無障礙契約：${token}`);
  }
}

const cssText = fs.readdirSync(root)
  .filter((name) => /^site.*\.css$/i.test(name))
  .map((name) => fs.readFileSync(path.join(root, name), 'utf8'))
  .join('\n');
if (!/object-fit\s*:\s*contain/i.test(cssText)) fail('全站 CSS', '缺少圖片等比例完整顯示 object-fit: contain');
if (!/:focus-visible/i.test(cssText)) warn('全站 CSS', '建議補充鍵盤 focus-visible 樣式');

for (const message of warnings) console.warn(`WARN ${message}`);
if (errors.length) {
  console.error(`網站檢查失敗，共 ${errors.length} 項：`);
  for (const message of errors) console.error(`- ${message}`);
  process.exit(1);
}

console.log(`PASS 全站檢查：${htmlFiles.length} 個 HTML；連結、素材、SEO、圖片 alt、產品規格、時間軸與互動契約均通過。`);
