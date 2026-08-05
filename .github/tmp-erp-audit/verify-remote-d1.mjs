import { readFileSync } from 'node:fs';

const inputPath = process.argv[2] || 'remote-d1-health.json';
const payload = JSON.parse(readFileSync(inputPath, 'utf8'));

function findHealthRow(value) {
  if (!value || typeof value !== 'object') return null;
  if (
    Object.prototype.hasOwnProperty.call(value, 'products')
    && Object.prototype.hasOwnProperty.call(value, 'inventory')
    && Object.prototype.hasOwnProperty.call(value, 'postCount')
  ) return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findHealthRow(item);
      if (found) return found;
    }
    return null;
  }
  for (const item of Object.values(value)) {
    const found = findHealthRow(item);
    if (found) return found;
  }
  return null;
}

const health = findHealthRow(payload);
if (!health) throw new Error(`Wrangler D1 輸出找不到健康檢查資料：${JSON.stringify(payload).slice(0, 1000)}`);

for (const key of ['products', 'productRows']) {
  const actual = Number(health[key]);
  if (actual !== 6) throw new Error(`遠端 D1 ${key} 必須剛好6項，目前 ${health[key]}`);
}

for (const key of ['inventory', 'inventoryRows', 'tasks', 'suppliers', 'templates', 'documents']) {
  const actual = Number(health[key]);
  if (!Number.isInteger(actual) || actual < 0) throw new Error(`遠端 D1 ${key} 數量異常：${health[key]}`);
}

const postCount = Number(health.postCount);
const postImageCount = Number(health.postImageCount);
const postCopyCount = Number(health.postCopyCount);
const publishReadyPostCount = Number(health.publishReadyPostCount);
if (!Number.isInteger(postCount) || postCount < 1) throw new Error(`遠端 D1 至少需要一篇貼文，目前 ${health.postCount}`);
if (!Number.isInteger(postImageCount) || postImageCount < 1) throw new Error(`遠端 D1 沒有可用貼文圖片：${health.postImageCount}`);
if (!Number.isInteger(postCopyCount) || postCopyCount < 1) throw new Error(`遠端 D1 沒有可用貼文文案：${health.postCopyCount}`);
if (!Number.isInteger(publishReadyPostCount) || publishReadyPostCount < 1) throw new Error(`遠端 D1 至少需要一篇同時具備圖片與文案的貼文，目前 ${health.publishReadyPostCount}`);

const exactZero = {
  activeUnreviewedCount: '不得有未審核卻已排程的貼文',
  obsoleteProductCount: '不得有已知舊版產品資料',
  unexpectedProductCount: '不得有六項正式產品以外的啟用產品',
  obsoleteInventoryCount: '不得有已知舊版庫存資料',
  inventoryDuplicateCount: '不得有內容完全重複的庫存資料',
  knownLegacyPriceCount: '不得有已知舊售價',
  knownLegacySpecificationCount: '不得有舊規格、錯誤名稱、單位或不完整正式規格',
  fulfillmentPolicyMismatchCount: '龜鹿飲與預先備貨商品的出貨政策不得套錯',
};
for (const [key, label] of Object.entries(exactZero)) {
  const actual = Number(health[key] ?? 0);
  if (actual !== 0) throw new Error(`遠端 D1 ${label}：${key}=${health[key]}`);
}

if (Number(health.officialPriceMigrationMarkerCount) < 1) throw new Error(`遠端 D1 正式售價遷移標記缺失：${health.officialPriceMigrationMarkerCount}`);
if (Number(health.officialSpecificationMigrationMarkerCount) < 1) throw new Error(`遠端 D1 六項正式規格與出貨政策遷移標記缺失：${health.officialSpecificationMigrationMarkerCount}`);

const pendingReviewCount = Number(health.pendingReviewCount);
if (!Number.isInteger(pendingReviewCount) || pendingReviewCount < 0 || pendingReviewCount > postCount) throw new Error(`遠端 D1 待審貼文數量異常：${health.pendingReviewCount}/${postCount}`);

console.log(JSON.stringify(health, null, 2));
console.log(`PASS 遠端D1：六項正式產品；舊資料、額外產品、重複庫存與未審核排程皆為0；待審${pendingReviewCount}篇。`);
