/**
 * Compute expected scores for every (product, AM) pair using the frontend's
 * matchingMock.ts. The Python golden test asserts backend output matches.
 *
 *     cd backend
 *     npx --yes tsx scripts/golden_scores.ts
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { score } from "../../Lovable/src/lib/matchingMock";
import { ASSET_MANAGERS } from "../../Lovable/src/mocks/assetManagers";
import { PRODUCTS } from "../../Lovable/src/mocks/products";

const here = dirname(fileURLToPath(import.meta.url));
const fixtureDir = resolve(here, "../app/tests/fixtures");

const inputHash = createHash("sha256")
  .update(
    JSON.stringify({
      products: PRODUCTS.map((p) => p.id).sort(),
      ams: ASSET_MANAGERS.map((a) => a.id).sort(),
    }),
  )
  .digest("hex");

const results: ReturnType<typeof score>[] = [];
for (const product of PRODUCTS) {
  for (const am of ASSET_MANAGERS) {
    results.push(score(product, am));
  }
}

const fixture = {
  generated_at: new Date().toISOString(),
  product_count: PRODUCTS.length,
  am_count: ASSET_MANAGERS.length,
  input_hash: inputHash,
  results,
};

writeFileSync(
  resolve(fixtureDir, "expected_scores.json"),
  JSON.stringify(fixture, null, 2) + "\n",
  "utf-8",
);

console.log(`✓ Generated ${results.length} expected scores`);
console.log(`  fixture: app/tests/fixtures/expected_scores.json`);
console.log(`  input_hash: ${inputHash.slice(0, 12)}…`);
