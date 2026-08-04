import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';

const ROOT = process.cwd();
const allowed = new Set(['.html', '.json', '.mjs', '.js', '.md', '.txt']);
const skipped = new Set(['.git', 'node_modules', 'staging']);
const officialTrial = '運費與資料確認後採接單安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。';
const officialOrder = '所有正式訂單於資料及付款方式確認後安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。';

const replacements = [
  ['運費與資料確認後採接單安排製作，製作加工約需5～7個工作天；完成後才安排出貨，不含例假日及物流配送時間。', officialTrial],
  ['運費與資料確認完成後，採接單安排製作，製作加工約需5～7個工作天；完成後才安排出貨；不含例假日及物流配送時間。', '運費與資料確認完成後，採接單安排製作，約5～7個工作天出貨；不含例假日及物流配送時間。'],
  ['所有正式訂單於資料及付款方式確認後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨，另加物流配送時間。', officialOrder],
  ['完成確認後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨。', '完成確認後安排製作，約5～7個工作天出貨。'],
  ['製作加工約需5～7個工作天；完成後才安排出貨，不含例假日及物流配送時間', '約5～7個工作天出貨，不含例假日及物流配送時間'],
  ['製作加工約需5～7個工作天；完成後才安排出貨；不含例假日及物流配送時間', '約5～7個工作天出貨；不含例假日及物流配送時間'],
  ['製作加工約需5～7個工作天；完成後才安排出貨，另加物流配送時間', '約5～7個工作天出貨，不含例假日及物流配送時間'],
  ['製作加工約需5～7個工作天，完成後出貨', '接單後約5～7個工作天出貨'],
  ['5～7個工作天是製作加工時間，製作完成後才安排出貨', '接單安排製作後約5～7個工作天出貨'],
];

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    if (skipped.has(name)) continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...walk(path));
    else if (allowed.has(extname(path))) files.push(path);
  }
  return files;
}

let changed = 0;
for (const path of walk(ROOT)) {
  if (path.endsWith('finalize-confirmed-trial-shipping-v417.mjs')) continue;
  let text;
  try { text = readFileSync(path, 'utf8'); } catch { continue; }
  let next = text;
  for (const [from, to] of replacements) next = next.split(from).join(to);
  if (next !== text) {
    writeFileSync(path, next);
    changed += 1;
  }
}

const index = readFileSync('index.html', 'utf8');
const trial = readFileSync('trial.html', 'utf8');
const publicText = `${index}\n${trial}`;
for (const required of [
  '龜鹿飲30cc小玻璃罐試喝組',
  '30cc小玻璃罐×3罐',
  '試喝品免費',
  '7-11店到店',
  '運費60元',
  '郵局宅配',
  '運費100元',
  '約5～7個工作天出貨',
  '買10送1，共11罐500元',
  '買10送1，共11包2,000元',
  '加入LINE申請試喝',
]) {
  if (!publicText.includes(required)) throw new Error(`公開頁面缺少正式內容：${required}`);
}
for (const legacy of [
  '買10送2',
  '共12罐500元',
  '共12包2,000元',
  '龜鹿飲30cc玻璃瓶',
  '30cc／瓶（小玻璃瓶）',
  '製作加工約需5～7個工作天',
]) {
  if (publicText.includes(legacy)) throw new Error(`公開頁面仍含舊內容：${legacy}`);
}

const report = {
  status: 'success',
  checked_at: new Date().toISOString(),
  changed_files: changed,
  trial: '30cc小玻璃罐×3罐免費；運費自付；約5～7個工作天出貨',
  drink30: '50元／罐；買10送1，共11罐500元',
  drink180: '200元／包；買10送1，共11包2,000元',
  line: '@762jybnm',
  poster_policy: '使用老闆確認的原海報，不再覆寫海報文字',
};
writeFileSync('diagnostics/trial-shipping-v417.json', JSON.stringify(report, null, 2) + '\n');
console.log(`PASS：官網正式試喝與出貨規則已統一，共修正 ${changed} 個檔案。`);
