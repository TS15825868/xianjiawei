import fs from 'node:fs';

const authority = JSON.parse(fs.readFileSync('assets/data/official-products.json', 'utf8'));
const source = JSON.parse(fs.readFileSync('data.json', 'utf8'));
const products = source.products || [];

for (const expected of authority.products) {
  const actual = products.find((p) => p.id === expected.id);
  if (!actual) throw new Error(`Missing official product: ${expected.id}`);
  const spec = actual.specification || actual.size || actual.spec;
  if (spec !== expected.specification) {
    throw new Error(`${expected.id} specification mismatch: ${spec} !== ${expected.specification}`);
  }
}

const raw = JSON.stringify(source);
for (const forbidden of authority.forbidden) {
  if (raw.includes(forbidden)) throw new Error(`Forbidden legacy specification found: ${forbidden}`);
}

if (products.length !== 6) throw new Error(`Official product count must be 6, got ${products.length}`);
console.log('Official product specifications verified.');
