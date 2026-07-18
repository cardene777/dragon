/**
 * unit test = binding 経由 state 共有の compile 結果 verify。
 * counter1.n の value が arc1 側で render input として使われるか (state id が counteractor1__n に unify)。
 */
import { textDslToDiagram } from '/Users/cardene/Desktop/projects/dragon/packages/dragon/src/index.ts';
import { partsCounterActor, partsArcGauge, partsPercentRing } from '/Users/cardene/Desktop/projects/dragon/apps/playground-spa/src/topics/catalog/parts.cdl.ts';

const partsCatalog = {
  'parts-counter-actor': partsCounterActor, 'counter-actor': partsCounterActor,
  'parts-arc-gauge': partsArcGauge, 'arc-gauge': partsArcGauge,
  'parts-percent-ring': partsPercentRing, 'percent-ring': partsPercentRing,
};

console.log("=== Binding unit test ===\n");
const tests = [];
function test(label, condition, detail) {
  const pass = condition;
  tests.push({ label, pass, detail });
  console.log(`  ${pass ? "✅" : "❌"} ${label} — ${detail}`);
}

// TEST 1: counter + arc-gauge binding
const src1 = `title: "test"
type: sequence

actors:
  - user
  - api
  - counter1: { kind: counter-actor }
  - arc1: { kind: arc-gauge, bind: counter1.n }

flow:
  - user -> api: "click"
`;
const d1 = textDslToDiagram(src1, { partsCatalog });
const stateIds1 = d1.states.map((s) => s.id);
const counterN = stateIds1.filter((id) => id === "counter1__n").length;
const arc1V = stateIds1.filter((id) => id === "arc1__v").length;
test("T1a: counter1__n exists (source state)", counterN === 1, `counter1__n = ${counterN}`);
test("T1b: arc1__v does NOT exist (should be unified to counter1__n)", arc1V === 0, `arc1__v = ${arc1V}`);

// arc-gauge の shape が state 参照するので、 shape.angle template も verify
const arcNode = d1.nodes.find((n) => n.id === "arc1__arc");
if (arcNode && arcNode.shape) {
  const shapeJson = JSON.stringify(arcNode.shape);
  const usesCounterN = shapeJson.includes("{counter1__n}");
  const usesArc1V = shapeJson.includes("{arc1__v}");
  test("T1c: arc shape refs {counter1__n} (source state)", usesCounterN, `shape includes counter1__n = ${usesCounterN}`);
  test("T1d: arc shape does NOT ref {arc1__v}", !usesArc1V, `shape includes arc1__v = ${usesArc1V}`);
}

// tween 検証 = counter1 の phase tween が counter1__n を drive、 arc1 の bind でも同 state を read
const counterTweens = d1.phases.flatMap((p) => p.tweens.filter((t) => t.stateId === "counter1__n"));
test("T1e: counter1__n の tween が phase に登録済 (counter parts の phase 由来)", counterTweens.length >= 1, `tween count = ${counterTweens.length}`);

// TEST 2: counter + percent-ring binding
const src2 = `title: "test2"
type: sequence

actors:
  - user
  - api
  - c1: { kind: counter-actor }
  - r1: { kind: percent-ring, bind: c1.n }

flow:
  - user -> api: "click"
`;
const d2 = textDslToDiagram(src2, { partsCatalog });
const stateIds2 = d2.states.map((s) => s.id);
test("T2a: c1__n exists", stateIds2.includes("c1__n"), stateIds2.join(","));
test("T2b: r1__v does NOT exist", !stateIds2.includes("r1__v"), stateIds2.join(","));

// TEST 3: bind field なし = 従来通り prefix (isolate)
const src3 = `title: "test3"
type: sequence

actors:
  - user
  - api
  - c1: { kind: counter-actor }
  - a1: { kind: arc-gauge }

flow:
  - user -> api: "click"
`;
const d3 = textDslToDiagram(src3, { partsCatalog });
const stateIds3 = d3.states.map((s) => s.id);
test("T3a (no bind): c1__n exists (isolated)", stateIds3.includes("c1__n"), stateIds3.join(","));
test("T3b (no bind): a1__v exists (isolated, not unified)", stateIds3.includes("a1__v"), stateIds3.join(","));

// TEST 4: 無効 bind format (dot 無し) = warn + skip (壊さない)
const src4 = `title: "test4"
type: sequence

actors:
  - user
  - api
  - c1: { kind: counter-actor }
  - a1: { kind: arc-gauge, bind: invalid_no_dot }

flow:
  - user -> api: "click"
`;
const d4 = textDslToDiagram(src4, { partsCatalog });
const stateIds4 = d4.states.map((s) => s.id);
test("T4 (invalid bind): a1__v exists (fallback = isolated)", stateIds4.includes("a1__v"), stateIds4.join(","));

console.log("\n=== SUMMARY ===");
const passed = tests.filter((t) => t.pass).length;
console.log(`${passed}/${tests.length} PASS`);
process.exit(passed === tests.length ? 0 : 1);
