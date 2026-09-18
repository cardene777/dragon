/**
 * 速さを測る道具が使う入力 (#2250)。
 *
 * **計測の側と、その前提を確かめる検査の側の両方がここから読む**。
 * 入力の作り方を 2 か所に書くと、片方だけ直した日に「測った入力」 と
 * 「検査が確かめた入力」 が別物になる (#2240 と同じ形)。
 *
 * 計測そのものは `bench.test.ts`、前提の確認は `bench-cases-scale.test.ts`。
 */

/** 図の種類。 段によって使い分ける (理由は `bench.test.ts` の冒頭) */
export type 図の種類 = "sequence" | "flow";

export interface BenchCase {
  label: string;
  nodes: number;
  edges: number;
  phases: number;
  tweens: number;
}

export const CASES: BenchCase[] = [
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

/** 最も小さい入力と最も大きい入力 (箱の数で見る) */
export function 最小と最大(): { 最小: BenchCase; 最大: BenchCase } {
  const 並び = [...CASES].sort((a, b) => a.nodes - b.nodes);
  return { 最小: 並び[0]!, 最大: 並び[並び.length - 1]! };
}

export function 記法を作る(種類: 図の種類, c: BenchCase): string {
  const { nodes: nodeCount, edges: edgeCount, phases: phaseCount, tweens: tweenCount } = c;
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
type: ${種類}
actors:
${actors}
flow:
${flow}${statesBlock}${animationBlock}
`;
}
