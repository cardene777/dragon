import { textDslToDiagram } from "@cardenelabs/dragon";
import { compile } from "@cardenelabs/cdl";

const src = `title: "ログインAPI"
type: sequence

actors:
  - ユーザー
  - API
  - データベース

flow:
  - ユーザー -> API: "ログイン要求"
  - API -> データベース: "ユーザー検索"
  - データベース -> API: "結果"
  - API -> ユーザー: "認証成功" (success)

animation:
  - step: "call" 1.4s
    focus: [ユーザー, API, "ユーザー -> API"]
  - step: "query" 1.4s
    focus: [API, データベース, "API -> データベース"]
  - step: "return" 1.4s
    focus: [API, データベース, "データベース -> API"]
  - step: "ok" 1.4s
    focus: [ユーザー, API, "API -> ユーザー"]
`;

const d = textDslToDiagram(src);
const laid = compile(d);

console.log("=== laid edges full (path + label + geometry) ===");
for (const e of laid.edges) {
  console.log(`  id=${e.id}`);
  console.log(`    label="${e.label}" tone=${e.tone} style=${e.style ?? "solid"}`);
  console.log(`    d="${e.d?.slice(0, 60) ?? "(no path)"}"`);
  console.log(`    labelX=${e.labelX} labelY=${e.labelY}`);
  console.log(`    from=${e.from} to=${e.to}`);
}
console.log();
console.log("=== nodes with labels ===");
for (const n of laid.nodes) {
  if (n.title) {
    console.log(`  id=${n.id} title="${n.title}" x=${n.x} y=${n.y} w=${n.w} h=${n.h}`);
  }
}
