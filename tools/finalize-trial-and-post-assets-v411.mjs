import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

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
  ['單罐售價50元', '正式售價60元／罐'],
  ['售價50元／罐', '售價60元／罐'],
  ['正式售價50元／罐', '正式售價60元／罐'],
  ['買10送1，共11罐500元', '買10送1，共11罐600元'],
  ['買10送1｜11罐500元', '買10送1｜11罐600元'],
  ['買10送1（共11罐500元）', '買10送1（共11罐600元）'],
  ['買10送1｜12罐500元', '買10送1｜11罐600元'],
  ['買 10 送 2（共 12 罐 500 元）', '買 10 送 1（共 11 罐 600 元）'],
  ['共11罐500元', '共11罐600元'],
  ['12罐優惠組500元', '11罐優惠組600元'],
  ['11罐優惠組500元', '11罐優惠組600元'],
  ['30cc正式售價與12罐活動', '30cc正式售價60元與11罐600元活動'],
  ['30cc正式售價與11罐活動', '30cc正式售價60元與11罐600元活動'],
  ['買10送1，共11包2,000元', '買10送1，共11包2,000元'],
  ['買10送1｜12包2,000元', '買10送1｜11包2,000元'],
  ['買 10 送 2（共 12 包 2,000 元）', '買 10 送 1（共 11 包 2,000 元）'],
  ['共11包2,000元', '共11包2,000元'],
  ['12包優惠組2,000元', '11包優惠組2,000元'],
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
  .replaceAll('images/posts/approved-v411/00-trial-evergreen.jpg', 'images/posts/approved-v413/guilu-drink-trial-60.svg')
  .replaceAll('images/posts/approved-v412/guilu-drink-trial-evergreen.jpg', 'images/posts/approved-v413/guilu-drink-trial-60.svg')
  .replaceAll('我想了解龜鹿飲30cc正式售價與11罐活動。', '我想了解龜鹿飲30cc正式售價60元與11罐600元活動。');
writeFileSync(trialPath, trial);

const required = [
  'images/posts/approved-v413/guilu-drink-trial-60.svg',
  'images/posts/approved-v411/01-work-rest.jpg',
  'images/posts/approved-v411/21-rain-home-c.jpg',
  'images/posts/approved-v411/manifest.json',
];
for (const item of required) if (!existsSync(join(root, item))) throw new Error(`缺少正式貼文素材：${item}`);

const finalTrial = readFileSync(trialPath, 'utf8');
for (const stale of ['單罐售價50元', '11罐500元', '12罐500元']) {
  if (finalTrial.includes(stale)) throw new Error(`trial.html 仍含舊價格：${stale}`);
}
for (const requiredText of ['正式售價60元／罐', '買10送1｜11罐600元', '單包售價200元', '買10送1｜11包2,000元']) {
  if (!finalTrial.includes(requiredText)) throw new Error(`trial.html 缺少正式價格：${requiredText}`);
}

console.log('PASS website v413: 30cc正式售價60元、買10送1共11罐600元；180cc維持200元與11包2,000元。');
