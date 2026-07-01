/**
 * Border case 10 diagram の visualValidate 全 violation を出力する baseline capture script。
 * cdl routing v6 設計のインプットに使う。 test file は触らず、 直接 import + validate 実行。
 */
import * as cookbook from "../src/topics/catalog/cookbook.cdl.ts";
import * as patterns from "../src/topics/catalog/patterns.cdl.ts";
import * as presets from "../src/topics/catalog/presets.cdl.ts";
import * as primitives from "../src/topics/catalog/primitives.cdl.ts";
import * as primitivesExtra from "../src/topics/catalog/primitives-extra.cdl.ts";
import * as textDsl from "../src/topics/catalog/text-dsl.cdl.ts";
import * as animation from "../src/topics/catalog/animation.cdl.ts";
import * as styles from "../src/topics/catalog/styles.cdl.ts";
import { visualValidateAll } from "@cardenelabs/cdl";

const BORDER = new Set([
  "pattern-fan-in",
  "pattern-rollback",
  "infra-demo",
  "pattern-call-rw",
  "pattern-loop",
  "pattern-schedule",
  "fsm-demo",
  "er-demo",
  "tree-demo",
  "mind-demo",
]);

function collect(mod) {
  const out = [];
  for (const value of Object.values(mod)) {
    if (
      typeof value === "object" &&
      value !== null &&
      typeof value.id === "string" &&
      Array.isArray(value.nodes) &&
      Array.isArray(value.edges) &&
      Array.isArray(value.lanes) &&
      Array.isArray(value.phases)
    ) {
      out.push(value);
    }
  }
  return out;
}

const sources = [
  ["cookbook", cookbook],
  ["patterns", patterns],
  ["presets", presets],
  ["primitives", primitives],
  ["primitives-extra", primitivesExtra],
  ["text-dsl", textDsl],
  ["animation", animation],
  ["styles", styles],
];

const all = [];
for (const [name, mod] of sources) {
  for (const d of collect(mod)) {
    if (BORDER.has(d.id)) all.push({ source: name, diagram: d });
  }
}

console.log(`total border diagrams found = ${all.length}`);
for (const { source, diagram } of all) {
  const report = visualValidateAll([diagram]);
  const r = report.reports[0];
  const errors = r.violations.filter((v) => v.severity === "error");
  console.log(`\n=== ${diagram.id} (source=${source}, nodes=${diagram.nodes.length}, edges=${diagram.edges.length}) ===`);
  console.log(`  errors ... ${errors.length} 件`);
  const byAxis = new Map();
  for (const v of errors) {
    const arr = byAxis.get(v.axis) ?? [];
    arr.push(v);
    byAxis.set(v.axis, arr);
  }
  for (const [axis, vs] of byAxis) {
    console.log(`  [${axis}] ${vs.length} 件`);
    for (const v of vs) {
      console.log(`    - ${v.detail}`);
    }
  }
}
