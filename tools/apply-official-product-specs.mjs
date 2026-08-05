import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const files = [
  'data.json', 'catalog-public.json', 'geo-data.json', 'index.html', 'products.html', 'dm.html',
  'brand-facts.html', 'llms.txt', 'llms-full.txt', 'product-guilu-drink-30cc.html',
  'product-guilu-drink-180cc.html', 'product-guilu-tangkuai.html', 'product-guilu-jiao.html',
].filter(existsSync);

const replacements = [
  ['龜鹿飲30cc玻璃瓶', '龜鹿飲30cc玻璃罐'],
  ['30cc／瓶（小玻璃瓶）', '30cc／罐（小玻璃罐）'],
  ['30cc／瓶', '30cc／罐'],
  ['小玻璃瓶', '小玻璃罐'],
  ['600g／盒（1斤）｜32塊裝｜每塊約18.75g', '600g（1斤）／盒｜32塊裝｜每塊約18.75g'],
  ['600g／盒（1斤）', '600g（1斤）／盒'],
];

let changed = 0;
for (const file of files) {
  const before = readFileSync(file, 'utf8');
  let after = before;
  for (const [from, to] of replacements) after = after.split(from).join(to);
  if (after !== before) {
    writeFileSync(file, after, 'utf8');
    changed += 1;
    console.log(`UPDATED ${file}`);
  }
}
console.log(`Official product normalization complete; changed ${changed} files.`);
