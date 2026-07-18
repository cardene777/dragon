import { PARTS_BINDING_CATALOG } from '/Users/cardene/Desktop/projects/dragon/apps/playground-spa/src/lib/parts-binding-catalog.ts';
import { textDslToDiagram } from '/Users/cardene/Desktop/projects/dragon/packages/dragon/src/index.ts';
import * as PartsMod from '/Users/cardene/Desktop/projects/dragon/apps/playground-spa/src/topics/catalog/parts.cdl.ts';

// 全 parts の CdlDiagram map を作成
const partsCatalog = {};
for (const v of Object.values(PartsMod)) {
  if (v && typeof v === 'object' && v.id) {
    partsCatalog[v.id] = v;
    const stripped = v.id.startsWith('parts-') ? v.id.slice(6) : v.id;
    partsCatalog[stripped] = v;
  }
}

const sources = Object.values(PARTS_BINDING_CATALOG).filter(p => p.role === 'source');
const sinks = Object.values(PARTS_BINDING_CATALOG).filter(p => p.role === 'sink');

console.log(`=== 全 combination verify: ${sources.length} source × ${sinks.length} sink = ${sources.length * sinks.length} pair ===\n`);

let passed = 0, failed = 0;
const failures = [];
for (const src of sources) {
  for (const snk of sinks) {
    const dsl = `title: "test"
type: sequence
actors:
  - u
  - a
  - src1: { kind: ${src.kind} }
  - snk1: { kind: ${snk.kind}, bind: src1.${src.bindableState} }
flow:
  - u -> a: "click"
`;
    try {
      const d = textDslToDiagram(dsl, { partsCatalog });
      const ids = d.states.map(s => s.id);
      const hasUnifiedState = ids.includes(`src1__${src.bindableState}`);
      const noSinkState = !ids.includes(`snk1__${snk.bindableState}`);
      const shapeRefs = JSON.stringify(d.nodes).includes(`{src1__${src.bindableState}}`);
      if (hasUnifiedState && noSinkState) {
        passed++;
      } else {
        failed++;
        failures.push(`${src.kind} → ${snk.kind}: unified=${hasUnifiedState}, noSink=${noSinkState}`);
      }
    } catch (e) {
      failed++;
      failures.push(`${src.kind} → ${snk.kind}: THROW ${e.message.slice(0, 80)}`);
    }
  }
}

console.log(`PASS = ${passed}/${passed + failed}`);
if (failures.length > 0) {
  console.log(`\n=== FAILURES (${failures.length}) ===`);
  for (const f of failures.slice(0, 15)) console.log(`  ❌ ${f}`);
  if (failures.length > 15) console.log(`  ... (${failures.length - 15} more)`);
}
process.exit(failed === 0 ? 0 : 1);
