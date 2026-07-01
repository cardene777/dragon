/**
 * Border case 4 diagram の layout 結果を細粒詳細出力する inspect script。
 * routing v6 設計のため、 各 node cx/cy/w/h + edge d + labelX/labelY を確認。
 */
import { patternFanIn, patternRollback } from "../src/topics/catalog/patterns.cdl.ts";
import { presetInfrastructure, presetStateMachine } from "../src/topics/catalog/presets.cdl.ts";
import { layout } from "@cardenelabs/cdl";

const targets = [
  ["pattern-fan-in", patternFanIn],
  ["pattern-rollback", patternRollback],
  ["infra-demo", presetInfrastructure],
  ["fsm-demo", presetStateMachine],
];

for (const [name, diagram] of targets) {
  console.log(`\n=== ${name} ===`);
  const laid = layout(diagram);
  console.log(`  nodes ...`);
  for (const n of laid.nodes) {
    console.log(`    ${n.id.padEnd(12)} cx=${n.cx.toFixed(0)} cy=${n.cy.toFixed(0)} w=${n.w} h=${n.h} lane=${n.lane}`);
  }
  console.log(`  edges ...`);
  for (const e of laid.edges) {
    console.log(`    ${e.id.padEnd(20)} from=${e.from}→${e.to} side=${e.fromSide}→${e.toSide} labelX=${e.labelX.toFixed(0)} labelY=${e.labelY.toFixed(0)} anchor=${e.labelAnchor}`);
    console.log(`      d = ${e.d.replace(/\s+/g, " ").trim()}`);
  }
}
