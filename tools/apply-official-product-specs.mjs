import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const files = [
  'data.json', 'catalog-public.json', 'geo-data.json', 'index.html', 'products.html', 'dm.html',
  'brand-facts.html', 'llms.txt', 'llms-full.txt', 'product-guilu-drink-30cc.html',
  'product-guilu-drink-180cc.html', 'product-guilu-tangkuai.html', 'product-guilu-jiao.html',
].filter(existsSync);

const textReplacements = [
  ['龜鹿飲30cc玻璃瓶', '龜鹿飲30cc玻璃罐'],
  ['30cc／瓶（小玻璃瓶）', '30cc／罐（小玻璃罐）'],
  ['30cc／瓶', '30cc／罐'],
  ['小玻璃瓶', '小玻璃罐'],
  ['600g／盒（1斤）｜32塊裝｜每塊約18.75g', '600g（1斤）／盒｜32塊裝｜每塊約18.75g'],
  ['600g／盒（1斤）', '600g（1斤）／盒'],
];

const CLEAN_IMAGE = 'images/products-v3/guilu-drink-30-clean.svg?v=411.0';
const legacyArtworkPatterns = [
  /images\/products-v3\/guilu-drink-30\.jpg(?:\?v=[^"'\s<]*)?/g,
  /images\/dm-final\/02_guilu-drink-30cc-dm\.jpg(?:\?v=[^"'\s<]*)?/g,
];

let changed = 0;
for (const file of files) {
  const before = readFileSync(file, 'utf8');
  let after = before;
  for (const [from, to] of textReplacements) after = after.split(from).join(to);
  for (const pattern of legacyArtworkPatterns) {
    pattern.lastIndex = 0;
    after = after.replace(pattern, CLEAN_IMAGE);
  }
  if (after !== before) {
    writeFileSync(file, after, 'utf8');
    changed += 1;
    console.log(`UPDATED ${file}`);
  }
}

const violations = [];
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (/龜鹿飲30cc玻璃瓶|30cc／瓶（小玻璃瓶）/.test(text)) violations.push(`${file}: legacy bottle wording`);
  if (/images\/products-v3\/guilu-drink-30\.jpg|images\/dm-final\/02_guilu-drink-30cc-dm\.jpg/.test(text)) {
    violations.push(`${file}: legacy 30cc artwork reference`);
  }
}
if (violations.length) throw new Error(`官方產品正規化未完成：\n${violations.join('\n')}`);

console.log(`Official product and 30cc artwork normalization complete; changed ${changed} files.`);
