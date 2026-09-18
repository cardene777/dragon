/**
 * Performance benchmark suite
 *
 * 5 case (small / medium / large / huge / animation-heavy) で
 * parse (Text DSL → DslDocument) / compile (DslDocument → CdlDiagram) / layout (CdlDiagram → LaidDiagram)
 * の 3 stage 別に処理時間を計測し、 baseline を確立する。
 *
 * 起動 = `pnpm run test:bench`。
 *
 * **workspace に無い package を選ぶ書き方を置かない** (#2248)。 以前ここには
 * `--filter` で外から入れている依存を選ぶ書き方が載っており、打つと
 * `No projects matched the filters` と出たうえで **成功として終わる** =
 * 打った人には通ったように見え、1 件も測っていないことに気付けない。
 *
 * 測った値は repo に残さない。 残す場所を注記に書いていた時期があるが、
 * 書いた場所は git の追跡外で日ごとに掃除されるため、在ると書いても保てなかった。
 *

 * NOTE ... `textDslToDiagram` の auto-detect (isV05Source) は src 先頭 60 行で判定するため、
 * 100 actor 超では flow / animation 行が検出窓外に出て v0.4 fallback に誤 routing される。
 * bench では明示的に v0.5 parser を直接呼び出して 3 stage を個別計測する。
 */
import { bench, describe } from "vitest";
import { parseTextDslV05, compileToCdl } from "@cardenelabs/dragon";
import { layout } from "@cardenelabs/cdl";
import type { DslDocument } from "@cardenelabs/dragon";
import type { CdlDiagram } from "@cardenelabs/cdl";

function generateDiagramSource(
  nodeCount: number,
  edgeCount: number,
  phaseCount: number,
  tweenCount: number = 0,
): string {
  const actors = Array.from({ length: nodeCount }, (_, i) => `  - actor${i}`).join("\n");
  const flow =
    edgeCount > 0
      ? Array.from(
          { length: edgeCount },
          (_, i) => `  - actor${i % nodeCount} -> actor${(i + 1) % nodeCount}: "msg${i}"`,
        ).join("\n")
      : `  - actor0 -> actor${Math.min(1, nodeCount - 1)}: "msg0"`;

  let statesBlock = "";
  let animationBlock = "";
  if (phaseCount > 0) {
    if (tweenCount > 0) {
      const states = Array.from({ length: tweenCount }, (_, i) => `  s${i}: 0`).join("\n");
      statesBlock = `\nstates:\n${states}\n`;
    }
    const phases = Array.from({ length: phaseCount }, (_, i) => {
      const focusTarget = `actor${i % nodeCount}`;
      const tweens =
        tweenCount > 0
          ? `\n    tween:\n${Array.from({ length: Math.min(tweenCount, 3) }, (_, ti) => `      s${(i + ti) % tweenCount}: ${i} -> ${i + 1}`).join("\n")}`
          : "";
      return `  - step: "p${i}" 1s\n    focus: [${focusTarget}]${tweens}`;
    }).join("\n");
    animationBlock = `\nanimation:\n${phases}`;
  }

  return `title: "bench"
type: sequence
actors:
${actors}
flow:
${flow}${statesBlock}${animationBlock}
`;
}

interface BenchCase {
  label: string;
  nodes: number;
  edges: number;
  phases: number;
  tweens: number;
}

const CASES: BenchCase[] = [
  { label: "small (10 node / 5 edge / 0 phase)", nodes: 10, edges: 5, phases: 0, tweens: 0 },
  { label: "medium (100 node / 50 edge / 5 phase)", nodes: 100, edges: 50, phases: 5, tweens: 0 },
  { label: "large (500 node / 200 edge / 20 phase)", nodes: 500, edges: 200, phases: 20, tweens: 0 },
  { label: "huge (1000 node / 500 edge / 50 phase)", nodes: 1000, edges: 500, phases: 50, tweens: 0 },
  {
    label: "animation-heavy (100 node / 100 phase / 50 tween)",
    nodes: 100,
    edges: 50,
    phases: 100,
    tweens: 50,
  },
];

const PREPARED: Record<string, { src: string; doc: DslDocument; cdl: CdlDiagram }> = {};
for (const c of CASES) {
  const src = generateDiagramSource(c.nodes, c.edges, c.phases, c.tweens);
  const r = parseTextDslV05(src);
  if (!r.ok) {
    throw new Error(
      `bench setup failed for ${c.label}: ${r.errors.map((e) => `L${e.line} ${e.message}`).join(", ")}`,
    );
  }
  const cdl = compileToCdl(r.doc);
  PREPARED[c.label] = { src, doc: r.doc, cdl };
}

describe("parse (Text DSL → DslDocument)", () => {
  for (const c of CASES) {
    const { src } = PREPARED[c.label]!;
    bench(c.label, () => {
      const r = parseTextDslV05(src);
      if (!r.ok) throw new Error("parse failed during bench");
    });
  }
});

describe("compile (DslDocument → CdlDiagram)", () => {
  for (const c of CASES) {
    const { doc } = PREPARED[c.label]!;
    bench(c.label, () => {
      compileToCdl(doc);
    });
  }
});

describe("layout (CdlDiagram → LaidDiagram)", () => {
  for (const c of CASES) {
    const { cdl } = PREPARED[c.label]!;
    bench(c.label, () => {
      layout(cdl);
    });
  }
});
