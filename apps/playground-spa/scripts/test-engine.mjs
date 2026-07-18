import { diagram, compile } from "@cardenelabs/cdl";
import { computeStateValues } from "@cardenelabs/cdl/dist/index.js" ;

// merged v2 と同構造
const d = diagram("test-pilot", { topic: "test" })
  .lane("l", { x: 0, width: 400 })
  .state("s1", { initial: 0 })
  .state("total", { initial: 0 })
  .node("r1", { lane: "l", stack: 0, kind: "dyn-wave", title: "test", subtitle: "{s1}%", w: 200, h: 200,
    shape: { kind: "wave", level: "{s1}", amplitude: 100, frequency: 2, waveHeight: 6, fill: "#4e9dc4" } })
  .phase("p1", { duration: 1500, title: "p1" }, (p) => p.activate("r1").tween("s1", 0, 100).tween("total", 0, 100).badge("s1"))
  .phase("p2", { duration: 1500, title: "p2" }, (p) => p.activate("r1").tween("s1", 100, 100).badge("s2"))
  .build();

const laid = compile(d);
console.log("phases:", laid.phases.length);
console.log("phase 0 tweens:", JSON.stringify(laid.phases[0].tweens));
console.log("phase 1 tweens:", JSON.stringify(laid.phases[1].tweens));

for (const [name, phaseIdx, progress] of [["start", 0, 0], ["p1 mid", 0, 0.5], ["p1 end", 0, 1.0], ["p2 mid", 1, 0.5]]) {
  const vals = computeStateValues(laid, phaseIdx, progress);
  console.log(`${name}: ${JSON.stringify(vals)}`);
}
