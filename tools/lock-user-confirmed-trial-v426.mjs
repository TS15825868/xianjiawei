import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = process.cwd();
const SELF = 'tools/lock-user-confirmed-trial-v426.mjs';
const OFFICIAL = '資料及運費確認完成後採接單安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。';
const OFFICIAL_TRIAL = '運費與資料確認完成後採接單安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。';
const OFFICIAL_ORDER = '所有正式訂單於資料及付款方式確認完成後採接單安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。';
const OFFICIAL_SHORT = '接單後安排製作，約5～7個工作天出貨。';
const ALLOWED = new Set(['.html', '.json', '.js', '.mjs', '.md', '.txt', '.xml']);
const SKIP_DIRS = new Set(['.git', 'node_modules', 'staging']);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const path = join(dir, name);
    const info = statSync(path);
    if (info.isDirectory()) out.push(...walk(path));
    else if (ALLOWED.has(extname(path).toLowerCase())) out.push(path);
  }
  return out;
}

function normalize(text) {
  let out = String(text);
  const pairs = [
    ['運費與資料確認完成後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨，物流配送時間另計。', OFFICIAL_TRIAL],
    ['運費與資料確認後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨，物流配送時間另計。', OFFICIAL_TRIAL],
    ['資料及運費確認完成後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨，物流配送時間另計。', OFFICIAL],
    ['資料與運費確認完成後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨，物流配送時間另計。', OFFICIAL],
    ['所有正式訂單於資料及付款方式確認後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨，物流配送時間另計。', OFFICIAL_ORDER],
    ['正式訂單資料與付款方式確認後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨，另加物流配送時間。', OFFICIAL_ORDER],
    ['接單後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨。', OFFICIAL_SHORT],
    ['接單後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨', OFFICIAL_SHORT.replace(/。$/, '')],
    ['完成確認後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨。', OFFICIAL_SHORT],
    ['製作加工約需5～7個工作天；完成後才安排出貨，物流配送時間另計', '約5～7個工作天出貨，不含例假日及物流配送時間'],
    ['製作加工約需5～7個工作天；完成後才安排出貨，另加物流配送時間', '約5～7個工作天出貨，不含例假日及物流配送時間'],
    ['5～7個工作天只計製作加工，不含例假日及完成後的物流配送時間', '約5～7個工作天出貨，不含例假日及物流配送時間'],
    ['5～7個工作天僅指製作加工，不包含完成後的物流配送時間', '約5～7個工作天出貨，不含例假日及物流配送時間'],
    ['約5～7個工作天安排出貨', '約5～7個工作天出貨'],
  ];
  for (const [from, to] of pairs) out = out.split(from).join(to);
  return out;
}

let changed = 0;
for (const path of walk(ROOT)) {
  const rel = relative(ROOT, path).replaceAll('\\', '/');
  if (rel === SELF || rel.startsWith('diagnostics/')) continue;
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
  if (!text.includes('約5～7個工作天出貨')) throw new Error(`${file} 缺少正式出貨天數`);
  if (text.includes('製作加工約需5～7個工作天') || text.includes('完成後才安排出貨')) throw new Error(`${file} 仍含舊製作完成後出貨說明`);
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
writeFileSync('diagnostics/user-confirmed-trial-v426.json', JSON.stringify({
  status: 'success', version: 'v426', changed_files: changed,
  fulfillment_rule: '接單後安排製作，約5～7個工作天出貨，不含例假日及物流配送時間',
  product30: '龜鹿飲30cc玻璃罐｜30cc／罐（小玻璃罐）｜裸罐、無貼紙',
  product180: '龜鹿飲180cc鋁袋｜180cc／包（鋁袋）',
  trial: '30cc小玻璃罐3罐免費；7-11運費60元；郵局宅配100元；每位顧客／電話／地址限一次；LINE OA完成',
  promotion30: '買10送1，共11罐500元',
  promotion180: '買10送1，共11包2,000元'
}, null, 2) + '\n');
console.log(`PASS 官網 v426：使用者確認的試喝、價格、產品與約5～7個工作天出貨規則已鎖定；更新 ${changed} 個檔案。`);
