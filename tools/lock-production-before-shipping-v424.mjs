import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = process.cwd();
const SELF = 'tools/lock-production-before-shipping-v424.mjs';
const OFFICIAL = '資料及運費確認完成後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨，物流配送時間另計。';
const OFFICIAL_TRIAL = '運費與資料確認完成後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨，物流配送時間另計。';
const OFFICIAL_ORDER = '所有正式訂單於資料及付款方式確認後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨，物流配送時間另計。';
const OFFICIAL_SHORT = '接單後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨。';
const ALLOWED = new Set(['.html', '.json', '.js', '.mjs', '.md', '.txt', '.yml', '.yaml', '.xml']);
const SKIP = new Set(['.git', 'node_modules', 'staging']);

function walk(directory) {
  const files = [];
  for (const name of readdirSync(directory)) {
    if (SKIP.has(name)) continue;
    const path = join(directory, name);
    const info = statSync(path);
    if (info.isDirectory()) files.push(...walk(path));
    else if (ALLOWED.has(extname(path).toLowerCase())) files.push(path);
  }
  return files;
}

function normalize(text) {
  let output = String(text);
  const pairs = [
    ['資料及運費確認完成後採接單安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。', OFFICIAL],
    ['資料與運費確認完成後採接單安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。', OFFICIAL],
    ['資料及運費確認後採接單安排製作，約5～7個工作天出貨；不含例假日及物流配送時間', OFFICIAL.replace(/。$/, '')],
    ['資料與運費確認後採接單安排製作，約5～7個工作天出貨；不含例假日及物流配送時間', OFFICIAL.replace(/。$/, '')],
    ['運費與資料確認完成後，採接單安排製作，約5～7個工作天出貨；不含例假日及物流配送時間。', OFFICIAL_TRIAL],
    ['運費與資料確認後採接單安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。', OFFICIAL_TRIAL],
    ['所有正式訂單於資料及付款方式確認後安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。', OFFICIAL_ORDER],
    ['所有正式訂單於資料及付款方式確認後安排製作加工，約5～7個工作天出貨，不含例假日及物流配送時間。', OFFICIAL_ORDER],
    ['完成確認後安排製作加工，約5～7個工作天出貨。', OFFICIAL_SHORT],
    ['完成確認後安排製作，約5～7個工作天出貨。', OFFICIAL_SHORT],
    ['接單後安排製作，約5～7個工作天出貨', OFFICIAL_SHORT.replace(/。$/, '')],
    ['接單後約5～7個工作天出貨', OFFICIAL_SHORT.replace(/。$/, '')],
    ['約5～7個工作天出貨，不含例假日及物流配送時間', '製作加工約需5～7個工作天；完成後才安排出貨，物流配送時間另計'],
    ['約5～7個工作天出貨；不含例假日及物流配送時間', '製作加工約需5～7個工作天；完成後才安排出貨，物流配送時間另計'],
  ];
  for (const [from, to] of pairs) output = output.split(from).join(to);
  output = output.replace(/(?<!製作加工)約5～7個工作天出貨/g, '製作加工約需5～7個工作天；完成後才安排出貨');
  return output;
}

let changed = 0;
for (const path of walk(ROOT)) {
  const rel = relative(ROOT, path).replaceAll('\\', '/');
  if (rel === SELF) continue;
  let before;
  try { before = readFileSync(path, 'utf8'); } catch { continue; }
  const after = normalize(before);
  if (after !== before) {
    writeFileSync(path, after);
    changed += 1;
    console.log(`UPDATED ${rel}`);
  }
}

for (const file of ['index.html', 'trial.html', 'tools/apply-trial-site-entry.mjs']) {
  if (!existsSync(file)) throw new Error(`缺少必要檔案：${file}`);
  const text = readFileSync(file, 'utf8');
  if (!text.includes('製作加工約需5～7個工作天') || !text.includes('完成後才安排出貨')) {
    throw new Error(`${file} 缺少製作加工完成後才出貨規則`);
  }
  if (text.includes('約5～7個工作天出貨')) {
    throw new Error(`${file} 仍把5～7個工作天誤寫為出貨天數`);
  }
}

const trial = readFileSync('trial.html', 'utf8');
for (const required of [
  '30cc小玻璃罐×3罐', '試喝品免費', '運費60元', '運費100元',
  '買10送1，共11罐500元', '買10送1，共11包2,000元',
  'images/posts/approved-v412/guilu-drink-trial-evergreen.jpg', 'LINE'
]) {
  if (!trial.includes(required)) throw new Error(`trial.html 缺少正式內容：${required}`);
}

mkdirSync('diagnostics', { recursive: true });
writeFileSync('diagnostics/production-before-shipping-v424.json', JSON.stringify({
  status: 'success',
  version: 'v424',
  changed_files: changed,
  production_rule: '製作加工約需5～7個工作天；完成後才安排出貨，物流配送時間另計',
  trial: '30cc小玻璃罐3罐免費；7-11運費60元；郵局宅配100元；每位顧客／電話／地址限一次；LINE OA完成',
  promotion30: '買10送1，共11罐500元',
  promotion180: '買10送1，共11包2,000元'
}, null, 2) + '\n');
console.log(`PASS 官網：5～7個工作天只計製作加工，完成後才安排出貨；更新 ${changed} 個檔案。`);
