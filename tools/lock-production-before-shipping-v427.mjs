import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const FINAL = '製作加工約需5～7個工作天；完成後才安排出貨，物流配送時間另計';
const TRIAL_SENTENCE = `運費與資料確認完成後安排製作加工，${FINAL}。`;
const ORDER_SENTENCE = `所有正式訂單於資料及付款方式確認後安排製作加工，${FINAL}。`;
const SHORT_SENTENCE = '接單後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨。';

const files = [
  'index.html',
  'trial.html',
  'data.json',
  'catalog-public.json',
  'geo-data.json',
  'llms.txt',
  'tools/apply-trial-site-entry.mjs',
  'tools/finalize-trial-and-post-assets-v411.mjs',
].filter(existsSync);

const replacements = [
  ['運費與資料確認完成後採接單安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。', TRIAL_SENTENCE],
  ['資料與運費確認完成後採接單安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。', `資料與運費確認完成後安排製作加工，${FINAL}。`],
  ['資料及運費確認完成後採接單安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。', `資料及運費確認完成後安排製作加工，${FINAL}。`],
  ['所有正式訂單於資料及付款方式確認完成後採接單安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。', ORDER_SENTENCE],
  ['接單後安排製作，約5～7個工作天出貨。', SHORT_SENTENCE],
  ['接單後安排製作，約5～7個工作天出貨', SHORT_SENTENCE.replace(/。$/, '')],
  ['約5～7個工作天出貨，不含例假日及物流配送時間', FINAL],
  ['約5～7個工作天出貨', FINAL],
  ['買10送2，共12罐500元', '買10送1，共11罐500元'],
  ['買10送2，共12包2,000元', '買10送1，共11包2,000元'],
  ['買10送2', '買10送1'],
  ['共12罐500元', '共11罐500元'],
  ['共12包2,000元', '共11包2,000元'],
  ['龜鹿飲30cc玻璃瓶', '龜鹿飲30cc玻璃罐'],
  ['30cc／瓶（小玻璃瓶）', '30cc／罐（小玻璃罐）'],
  ['小玻璃瓶', '小玻璃罐'],
];

function normalize(text) {
  let output = String(text);
  for (const [from, to] of replacements) output = output.split(from).join(to);
  return output;
}

let changed = 0;
for (const file of files) {
  const before = readFileSync(file, 'utf8');
  const after = normalize(before);
  if (after !== before) {
    writeFileSync(file, after, 'utf8');
    changed += 1;
    console.log(`UPDATED ${file}`);
  }
}

for (const file of ['index.html', 'trial.html', 'tools/apply-trial-site-entry.mjs']) {
  if (!existsSync(file)) throw new Error(`缺少必要檔案：${file}`);
  const text = readFileSync(file, 'utf8');
  if (!text.includes('製作加工約需5～7個工作天')) throw new Error(`${file} 缺少正式製作時間`);
  if (!text.includes('完成後才安排出貨')) throw new Error(`${file} 缺少製作完成後出貨規則`);
  if (text.includes('約5～7個工作天出貨')) throw new Error(`${file} 仍把5～7個工作天誤寫為出貨時間`);
}

const combined = files.map((file) => readFileSync(file, 'utf8')).join('\n');
for (const required of [
  '30cc小玻璃罐',
  '試喝品免費',
  '運費60元',
  '運費100元',
  '買10送1，共11罐500元',
  '買10送1，共11包2,000元',
  'LINE',
]) {
  if (!combined.includes(required)) throw new Error(`官網正式內容缺少：${required}`);
}
for (const forbidden of [
  '買10送2',
  '共12罐500元',
  '共12包2,000元',
  '龜鹿飲30cc玻璃瓶',
  '30cc／瓶（小玻璃瓶）',
]) {
  if (combined.includes(forbidden)) throw new Error(`官網仍含舊內容：${forbidden}`);
}

mkdirSync('diagnostics', { recursive: true });
writeFileSync('diagnostics/production-before-shipping-v427.json', JSON.stringify({
  status: 'success',
  version: 'v427',
  checked_at: new Date().toISOString(),
  changed_files: changed,
  fulfillment_rule: FINAL,
  product30: '龜鹿飲30cc玻璃罐｜30cc／罐（小玻璃罐）｜裸罐、無貼紙',
  product180: '龜鹿飲180cc鋁袋｜180cc／包（鋁袋）',
  trial: '30cc小玻璃罐3罐免費；7-11運費60元；郵局宅配100元；每位顧客／電話／地址限一次；LINE OA完成',
  promotion30: '買10送1，共11罐500元',
  promotion180: '買10送1，共11包2,000元',
  systems_aligned: ['website', 'LINE OA', 'ERP'],
}, null, 2) + '\n');

console.log(`PASS 官網 v427：三端製作與出貨規則、試喝、規格及買10送1已統一；更新 ${changed} 個檔案。`);
