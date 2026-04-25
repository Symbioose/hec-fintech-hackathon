/**
 * Export the Lovable frontend mocks to JSON for the Python backend to seed.
 *
 * Frontend is source of truth — re-run this whenever Lovable/src/mocks/*.ts changes.
 *
 *     cd backend
 *     npx --yes tsx scripts/export_mocks.ts
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { PRODUCTS } from "../../Lovable/src/mocks/products";
import { ASSET_MANAGERS } from "../../Lovable/src/mocks/assetManagers";
import { PURCHASE_HISTORY } from "../../Lovable/src/mocks/purchaseHistory";
import { MARKET_VIEWS } from "../../Lovable/src/mocks/marketViews";

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, "../app/data");

function writeJson<T>(file: string, data: readonly T[]): void {
  const target = resolve(dataDir, file);
  writeFileSync(target, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`✓ ${file.padEnd(36)} (${data.length} records)`);
}

writeJson("sample_products.json", PRODUCTS);
writeJson("sample_asset_managers.json", ASSET_MANAGERS);
writeJson("sample_purchase_history.json", PURCHASE_HISTORY);
writeJson("sample_market_views.json", MARKET_VIEWS);
