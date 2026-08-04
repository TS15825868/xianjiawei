import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const root = process.cwd();
const allowed = new Set(['.html', '.json', '.txt', '.md', '.js', '.xml']);
const skip = new Set(['.git', 'node_modules', 'staging', '.github']);

function walk(dir) {
  const files = [];
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) files.push(...walk(path));
    else files.push(path);
  }
  return files;
}

const replacements = [
  ['買10送2，共12罐500元', '買10送1，共11罐500元'],
  ['買10送2，共12包2,000元', '買10送1，共11包2,000元'],
  ['買10送2｜12罐500元', '買10送1｜11罐500元'],
  ['買10送2｜12包2,000元', '買10送1｜11包2,000元'],
  ['買 10 送 2（共 12 罐 500 元）', '買 10 送 1（共 11 罐 500 元）'],
  ['買 10 送 2（共 12 包 2,000 元）', '買 10 送 1（共 11 包 2,000 元）'],
  ['買10送2', '買10送1'],
  ['共12罐500元', '共11罐500元'],
  ['共12包2,000元', '共11包2,000元'],
  ['12罐優惠組500元', '11罐優惠組500元'],
  ['12包優惠組2,000元', '11包優惠組2,000元'],
  ['30cc正式售價與12罐活動', '30cc正式售價與11罐活動'],
];

for (const path of walk(root)) {
  const ext = path.slice(path.lastIndexOf('.'));
  if (!allowed.has(ext)) continue;
  let text;
  try { text = readFileSync(path, 'utf8'); } catch { continue; }
  let next = text;
  for (const [from, to] of replacements) next = next.split(from).join(to);
  if (next !== text) writeFileSync(path, next);
}

const trialPath = join(root, 'trial.html');
if (!existsSync(trialPath)) throw new Error('缺少 trial.html');
let trial = readFileSync(trialPath, 'utf8');
trial = trial
  .replace('https://ts15825868.github.io/xianjiawei/images/products-v3/guilu-drink-30.jpg', 'https://ts15825868.github.io/xianjiawei/images/posts/approved-v411/00-trial-evergreen.jpg')
  .replace('我想了解龜鹿飲30cc正式售價與12罐活動。', '我想了解龜鹿飲30cc正式售價與11罐活動。');

if (!trial.includes('trial-poster-v411')) {
  const marker = '  <section class="section section--narrow">\n    <article class="card reveal">';
  const block = `  <section class="section section--narrow trial-poster-v411">\n    <figure class="card reveal" style="padding:0;overflow:hidden">\n      <img src="images/posts/approved-v411/00-trial-evergreen.jpg" width="1200" height="1200" loading="eager" decoding="async" alt="仙加味龜鹿飲30cc三罐試喝品免費，運費自付，另有販售180cc鋁袋" style="display:block;width:100%;height:auto;object-fit:contain"/>\n    </figure>\n  </section>\n\n`;
  if (!trial.includes(marker)) throw new Error('trial.html 找不到插入位置');
  trial = trial.replace(marker, block + marker);
}
writeFileSync(trialPath, trial);

const required = [
  'images/posts/approved-v411/00-trial-evergreen.jpg',
  'images/posts/approved-v411/01-work-rest.jpg',
  'images/posts/approved-v411/21-rain-home-c.jpg',
  'images/posts/approved-v411/manifest.json',
];
for (const item of required) if (!existsSync(join(root, item))) throw new Error(`缺少正式貼文素材：${item}`);

console.log('PASS website v411: 長期試喝、買10送1、11罐／11包與22張正式貼文素材已同步。');
