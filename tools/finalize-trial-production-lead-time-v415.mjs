import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const files = [
  'index.html',
  'trial.html',
  'docs/trial-site-entry-trigger.md',
  'tools/apply-trial-site-entry.mjs',
];

const replacements = [
  ['資料與運費確認完成後，採接單安排製作，約5～7個工作天出貨；不含例假日及物流配送時間。', '資料與運費確認完成後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨，另加物流配送時間。'],
  ['資料與運費確認完成後採接單安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。', '資料與運費確認完成後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨，另加物流配送時間。'],
  ['所有正式訂單於資料及付款方式確認後安排製作，約5～7個工作天出貨，不含例假日及物流配送時間。', '所有正式訂單於資料及付款方式確認後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨，另加物流配送時間。'],
  ['訂單資料與付款方式確認完成後，約5～7個工作天安排出貨，不含例假日及物流時間。', '訂單資料與付款方式確認完成後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨，另加物流配送時間。'],
  ['完成確認後安排製作，約5～7個工作天出貨。', '完成確認後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨。'],
  ['接單後安排製作，約5～7個工作天出貨', '接單後安排製作加工，製作加工約需5～7個工作天；完成後才安排出貨'],
  ['約5～7個工作天出貨', '製作加工約需5～7個工作天；完成後才安排出貨'],
  ['5～7個工作天出貨', '製作加工約需5～7個工作天；完成後才安排出貨'],
];

for (const file of files) {
  if (!existsSync(file)) continue;
  let text = readFileSync(file, 'utf8');
  for (const [from, to] of replacements) text = text.split(from).join(to);
  writeFileSync(file, text);
}

for (const file of ['index.html', 'trial.html']) {
  const text = readFileSync(file, 'utf8');
  if (/約5～7個工作天出貨|5～7個工作天安排出貨/.test(text)) {
    throw new Error(`${file} 仍把5～7個工作天寫成出貨天數`);
  }
  if (!text.includes('製作加工約需5～7個工作天')) {
    throw new Error(`${file} 缺少正式製作加工天數說明`);
  }
}

console.log('PASS：網站已統一為製作加工約需5～7個工作天，完成後才安排出貨。');
