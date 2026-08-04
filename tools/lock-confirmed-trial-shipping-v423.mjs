import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const self = 'tools/lock-confirmed-trial-shipping-v423.mjs';
const officialSentence = '資料及運費確認完成後採接單安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。';
const officialShort = '接單後安排製作，約5～7個工作天出貨';
const productionPhrase = ['製作加工約需', '5～7個工作天'].join('');
const onlyProductionPhrase = ['5～7個工作天只計', '製作加工'].join('');
const onlyProductionPhrase2 = ['5～7個工作天僅指', '製作加工'].join('');
const textExtensions = new Set(['.html', '.json', '.js', '.mjs', '.md', '.txt', '.yml', '.yaml', '.xml']);
const excludedDirectories = new Set(['.git', 'node_modules']);

function extension(path) {
  const index = path.lastIndexOf('.');
  return index >= 0 ? path.slice(index).toLowerCase() : '';
}

function walk(directory) {
  const files = [];
  for (const name of readdirSync(directory)) {
    if (excludedDirectories.has(name)) continue;
    const full = join(directory, name);
    const info = statSync(full);
    if (info.isDirectory()) files.push(...walk(full));
    else if (textExtensions.has(extension(full))) files.push(full);
  }
  return files;
}

function normalize(text) {
  let output = String(text);
  const exactPairs = [
    [`資料與運費確認完成後安排製作加工，${productionPhrase}；完成後才安排出貨，物流配送時間另計。`, officialSentence],
    [`資料及運費確認完成後安排製作加工，${productionPhrase}；完成後才安排出貨，物流配送時間另計。`, officialSentence],
    [`資料與運費確認完成後安排製作加工，${productionPhrase}；完成後才安排出貨，另加物流配送時間。`, officialSentence],
    [`資料及運費確認完成後安排製作加工，${productionPhrase}；完成後才安排出貨，另加物流配送時間。`, officialSentence],
    [`資料與運費確認後採接單安排製作，${productionPhrase}；完成後才安排出貨，不含例假日及物流配送時間。`, officialSentence],
    [`資料及運費確認後採接單安排製作，${productionPhrase}；完成後才安排出貨，不含例假日及物流配送時間。`, officialSentence],
    [`接單後安排製作加工，${productionPhrase}；完成後才安排出貨`, officialShort],
    [`${productionPhrase}；完成後才安排出貨，物流配送時間另計`, '約5～7個工作天出貨，不含例假日及物流配送時間'],
    [`${productionPhrase}；完成後才安排出貨，另加物流配送時間`, '約5～7個工作天出貨，不含例假日及物流配送時間'],
    [`${productionPhrase}；完成後才安排出貨`, '約5～7個工作天出貨'],
    [`${onlyProductionPhrase}，不含例假日及完成後的物流配送時間`, '約5～7個工作天出貨，不含例假日及物流配送時間'],
    [`${onlyProductionPhrase2}，不包含完成後的物流配送時間`, '約5～7個工作天出貨，不含例假日及物流配送時間'],
    ['製作加工約5～7工作天，完成後出貨', officialShort],
    ['製作加工約5～7個工作天，完成後出貨', officialShort],
    ['約5～7個工作天安排出貨', '約5～7個工作天出貨'],
  ];
  for (const [from, to] of exactPairs) output = output.split(from).join(to);
  output = output.replace(/(?:正式訂單)?資料與付款方式確認後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨，另加物流配送時間[。；]?/g, officialSentence);
  output = output.replace(/運費與資料確認(?:完成)?後，?採接單安排製作，製作加工約需5～7個工作天；完成後才安排出貨[；，]?(?:不含例假日及物流配送時間)?[。]?/g, officialSentence);
  output = output.replace(/完成確認後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨[。]?/g, officialShort);
  return output;
}

let changed = 0;
for (const file of walk(root)) {
  const rel = relative(root, file).replaceAll('\\', '/');
  if (rel === self) continue;
  const before = readFileSync(file, 'utf8');
  const after = normalize(before);
  if (after !== before) {
    writeFileSync(file, after);
    changed += 1;
    console.log(`UPDATED ${rel}`);
  }
}

const trialPath = join(root, 'trial.html');
const indexPath = join(root, 'index.html');
for (const path of [trialPath, indexPath]) {
  if (!existsSync(path)) throw new Error(`缺少必要頁面：${relative(root, path)}`);
  const text = readFileSync(path, 'utf8');
  if (text.includes(productionPhrase) || text.includes(onlyProductionPhrase) || text.includes(onlyProductionPhrase2)) {
    throw new Error(`${relative(root, path)} 仍含舊製作天數說明`);
  }
  if (!text.includes('約5～7個工作天出貨')) throw new Error(`${relative(root, path)} 缺少正式出貨天數`);
}

const trial = readFileSync(trialPath, 'utf8');
for (const required of [
  '30cc小玻璃罐×3罐', '試喝品免費', '運費60元', '運費100元',
  '買10送1，共11罐500元', '買10送1，共11包2,000元',
  'images/posts/approved-v412/guilu-drink-trial-evergreen.jpg', 'LINE'
]) {
  if (!trial.includes(required)) throw new Error(`trial.html 缺少正式內容：${required}`);
}

mkdirSync(join(root, 'diagnostics'), { recursive: true });
writeFileSync(join(root, 'diagnostics/confirmed-trial-shipping-v423.json'), JSON.stringify({
  status: 'success',
  rule: '接單後安排製作，約5～7個工作天出貨，不含例假日及物流配送時間',
  product30: '龜鹿飲30cc玻璃罐｜30cc／罐（小玻璃罐）｜裸罐、無貼紙',
  product180: '龜鹿飲180cc鋁袋｜180cc／包（鋁袋）',
  trial: '30cc小玻璃罐3罐免費；7-11運費60元；郵局宅配100元；每位顧客／電話／地址限一次；LINE OA完成',
  promotion30: '買10送1，共11罐500元',
  promotion180: '買10送1，共11包2,000元',
  changed_files: changed
}, null, 2) + '\n');

console.log(`PASS 官網正式試喝規則鎖定；更新 ${changed} 個檔案。`);
