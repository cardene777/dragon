/**
 * catalog 408 item の visualValidate 全 sweep。
 *
 * 対象 = CATALOG_ITEMS 9 category (presets / primitives / patterns / animation / parts /
 *         styles / cookbook / text-dsl / interactive) 全 diagram。
 *
 * 出力 = axis 別 warning 分布 + severity=error item list + severity=warn item list。
 * subpixel-precision は CdlEditor UI filter に準じて除外 (非致命)。
 */
import { visualValidate, compile } from "@cardenelabs/cdl";
import { CATALOG_ITEMS, loadPartsItems } from "../src/lib/catalog-items";

const HIDDEN_AXES = new Set(["subpixel-precision"]);

type ItemResult = {
  category: string;
  id: string;
  title: string;
  errors: { axis: string; detail: string }[];
  warns: { axis: string; detail: string }[];
};

async function main() {
  const results: ItemResult[] = [];
  const axisCounts = new Map<string, { errors: number; warns: number }>();

  const staticCategories = Object.entries(CATALOG_ITEMS);
  const partsItems = await loadPartsItems();
  const allCategories: [string, typeof partsItems][] = [
    ...staticCategories.map(([k, v]) => [k, v] as [string, typeof partsItems]),
    ["parts", partsItems],
  ];

  const seen = new Set<string>();
  for (const [category, items] of allCategories) {
    if (seen.has(category)) continue;
    seen.add(category);
    for (const item of items) {
      try {
        const laid = compile(item.diagram);
        const report = visualValidate(laid);
        const filtered = report.violations.filter((v) => !HIDDEN_AXES.has(v.axis));
        const errors = filtered.filter((v) => v.severity === "error");
        const warns = filtered.filter((v) => v.severity === "warn");
        results.push({
          category,
          id: item.id,
          title: item.title,
          errors: errors.map((e) => ({ axis: e.axis, detail: e.detail })),
          warns: warns.map((w) => ({ axis: w.axis, detail: w.detail })),
        });
        for (const v of filtered) {
          const cur = axisCounts.get(v.axis) ?? { errors: 0, warns: 0 };
          if (v.severity === "error") cur.errors++;
          else cur.warns++;
          axisCounts.set(v.axis, cur);
        }
      } catch (e) {
        console.error(`[compile-error] ${category}/${item.id}: ${(e as Error).message}`);
      }
    }
  }

  const totalItems = results.length;
  const cleanItems = results.filter((r) => r.errors.length === 0 && r.warns.length === 0);
  const errorItems = results.filter((r) => r.errors.length > 0);
  const warnItems = results.filter((r) => r.errors.length === 0 && r.warns.length > 0);

  console.log(`\n=== catalog sweep summary ===`);
  console.log(`total items: ${totalItems}`);
  console.log(`clean: ${cleanItems.length} (${((cleanItems.length / totalItems) * 100).toFixed(1)}%)`);
  console.log(`error items: ${errorItems.length}`);
  console.log(`warn-only items: ${warnItems.length}`);

  console.log(`\n=== axis distribution ===`);
  const sorted = Array.from(axisCounts.entries()).sort(
    (a, b) => b[1].errors + b[1].warns - (a[1].errors + a[1].warns),
  );
  for (const [axis, { errors, warns }] of sorted) {
    console.log(`  ${axis}: errors=${errors} warns=${warns}`);
  }

  if (errorItems.length > 0) {
    console.log(`\n=== error items (top 20) ===`);
    for (const r of errorItems.slice(0, 20)) {
      console.log(`  [${r.category}] ${r.id} (${r.title}):`);
      for (const e of r.errors.slice(0, 2)) {
        console.log(`    ERROR ${e.axis}: ${e.detail.slice(0, 100)}`);
      }
    }
  }

  if (warnItems.length > 0) {
    console.log(`\n=== warn-only items (top 15) ===`);
    for (const r of warnItems.slice(0, 15)) {
      console.log(`  [${r.category}] ${r.id} (${r.title}):`);
      for (const w of r.warns.slice(0, 2)) {
        console.log(`    WARN ${w.axis}: ${w.detail.slice(0, 100)}`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
