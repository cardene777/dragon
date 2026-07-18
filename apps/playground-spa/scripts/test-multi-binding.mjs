import { textDslToDiagram } from '/Users/cardene/Desktop/projects/dragon/packages/dragon/src/index.ts';
import { partsCounterActor, partsArcGauge, partsPercentRing, partsHorizontalBar, partsWaveGauge, partsBucketReservoir, partsCountup } from '/Users/cardene/Desktop/projects/dragon/apps/playground-spa/src/topics/catalog/parts.cdl.ts';

const partsCatalog = {
  'counter-actor': partsCounterActor, 'countup': partsCountup,
  'arc-gauge': partsArcGauge, 'percent-ring': partsPercentRing,
  'horizontal-bar': partsHorizontalBar, 'wave-gauge': partsWaveGauge,
  'bucket-reservoir': partsBucketReservoir,
};

const tests = [];
function test(label, pass, detail) { tests.push({label, pass}); console.log(`  ${pass?"✅":"❌"} ${label} — ${detail}`); }

// TEST A: 1 counter に 3 sink (arc + ring + bar) を bind
console.log("\n[A] 1 counter → 3 sinks (arc + ring + bar)");
const srcA = `title: "multi"
type: sequence
actors:
  - u
  - a
  - c1: { kind: counter-actor }
  - s1: { kind: arc-gauge, bind: c1.n }
  - s2: { kind: percent-ring, bind: c1.n }
  - s3: { kind: horizontal-bar, bind: c1.n }
flow:
  - u -> a: "click"
`;
const dA = textDslToDiagram(srcA, { partsCatalog });
const stateIdsA = dA.states.map(s => s.id).sort();
// 期待 = c1__n 1 個のみ (全 sink が unify)
test("A1: c1__n が唯一の bind target state (3 sink 全 unify)", stateIdsA.filter(id => id === 'c1__n').length === 1, `states=${stateIdsA.join(",")}`);
test("A2: s1__v / s2__v / s3__pv が存在しない (unify されて消失)",
  !stateIdsA.includes('s1__v') && !stateIdsA.includes('s2__v') && !stateIdsA.includes('s3__pv'),
  `states=${stateIdsA.join(",")}`);

// TEST A phase tween 検証 = c1__n の tween は 1 個 (source 由来のみ、 3 sink の tween は除外)
const tweenA = dA.phases.flatMap(p => p.tweens.filter(t => t.stateId === 'c1__n'));
test("A3: c1__n tween が単一 (3 sink の重複除外済)", tweenA.length === 1, `count=${tweenA.length}, tweens=${JSON.stringify(tweenA)}`);

// TEST A shape 参照 verify = 3 sink の shape が {c1__n} を参照
const s1Node = dA.nodes.find(n => n.id === 's1__arc');
const s2Node = dA.nodes.find(n => n.id === 's2___h' || n.id === 's2__h' || n.id?.startsWith('s2__'));
const s3Node = dA.nodes.find(n => n.id === 's3__bar');
test("A4: arc-gauge shape が {c1__n} を参照", JSON.stringify(s1Node?.shape).includes('{c1__n}'), `s1 shape angle: ${s1Node?.shape?.angle}`);
test("A5: horizontal-bar shape が {c1__n} を参照", JSON.stringify(s3Node?.shape).includes('{c1__n}'), `s3 shape source: ${s3Node?.shape?.source}`);

// TEST B: 2 source × 2 sink cross-combination
console.log("\n[B] 2 counter × 2 sink (別々の binding pair が独立動作)");
const srcB = `title: "cross"
type: sequence
actors:
  - u
  - a
  - c1: { kind: counter-actor }
  - c2: { kind: countup }
  - s1: { kind: arc-gauge, bind: c1.n }
  - s2: { kind: wave-gauge, bind: c2.n }
flow:
  - u -> a: "click"
`;
const dB = textDslToDiagram(srcB, { partsCatalog });
const stateIdsB = dB.states.map(s => s.id).sort();
test("B1: c1__n exists (source 1)", stateIdsB.includes('c1__n'), stateIdsB.join(","));
test("B2: c2__n exists (source 2)", stateIdsB.includes('c2__n'), stateIdsB.join(","));
test("B3: s1__v does NOT exist (unified to c1__n)", !stateIdsB.includes('s1__v'), stateIdsB.join(","));
test("B4: s2__lv does NOT exist (unified to c2__n)", !stateIdsB.includes('s2__lv'), stateIdsB.join(","));

// TEST C: 全 sink kind × counter 組合せ (5 sink × 1 counter = 5 combination)
console.log("\n[C] 5 sink kind × counter 全組合せ (10 combination のうち counter side 5 kind)");
const sinkKinds = ['arc-gauge', 'percent-ring', 'horizontal-bar', 'wave-gauge', 'bucket-reservoir'];
const sinkStateMap = {
  'arc-gauge': 'v', 'percent-ring': 'v', 'horizontal-bar': 'pv',
  'wave-gauge': 'lv', 'bucket-reservoir': 'water',
};
for (const sinkKind of sinkKinds) {
  const sinkState = sinkStateMap[sinkKind];
  const src = `title: "test"
type: sequence
actors:
  - u
  - a
  - c1: { kind: counter-actor }
  - sink1: { kind: ${sinkKind}, bind: c1.n }
flow:
  - u -> a: "click"
`;
  const d = textDslToDiagram(src, { partsCatalog });
  const ids = d.states.map(s => s.id);
  const hasCn = ids.includes('c1__n');
  const noSinkState = !ids.includes(`sink1__${sinkState}`);
  test(`C-${sinkKind}: c1__n exists + sink1__${sinkState} unified out`, hasCn && noSinkState, ids.join(","));
}

// TEST D: countup source × 全 sink kind
console.log("\n[D] countup source × 全 sink kind (5 combination)");
for (const sinkKind of sinkKinds) {
  const sinkState = sinkStateMap[sinkKind];
  const src = `title: "test"
type: sequence
actors:
  - u
  - a
  - c1: { kind: countup }
  - sink1: { kind: ${sinkKind}, bind: c1.n }
flow:
  - u -> a: "click"
`;
  const d = textDslToDiagram(src, { partsCatalog });
  const ids = d.states.map(s => s.id);
  const hasCn = ids.includes('c1__n');
  const noSinkState = !ids.includes(`sink1__${sinkState}`);
  test(`D-${sinkKind}: countup + ${sinkKind} = c1__n unified`, hasCn && noSinkState, ids.join(","));
}

console.log("\n=== SUMMARY ===");
const passed = tests.filter(t => t.pass).length;
console.log(`${passed}/${tests.length} PASS`);
process.exit(passed === tests.length ? 0 : 1);
