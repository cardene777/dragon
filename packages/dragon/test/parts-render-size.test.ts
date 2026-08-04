/**
 * パーツ 1 個を描く大きさ (`partRenderSize`) の検証 (Issue #937)。
 *
 * 画面はパーツを実寸で描く。 渡す値が実際に描かれる大きさと違うと、 SVG が
 * `preserveAspectRatio` で縮めて余白ができたり、 逆に潰れたりする。
 *
 * ここで確かめるのは 2 点。 図枠 (`viewBox`) を返すこと (箱の外接矩形ではない) と、
 * 箱を持たないパーツでも潰れないこと。 後者は catalog 80 件のうち 17 件が該当し、
 * 実体は操作パネルの部品 (`readouts`) で、箱は 1x1 の見えない 1 個しか持たない。
 *
 * 図枠は場所を確保するだけで、図の中に何か描かれることは保証しない。 この 17 件は図の中に
 * 描く部品を持たず、重ねても図には出ない (`partDrawsInDiagram`、#1017)。
 *
 * 値は配置計算に依存するため固定値では書かない。 「箱より大きい」 「潰れない」 の
 * 関係で書く。
 */
import { describe, it, expect } from "vitest";
import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { partRenderSize, partVisualSize } from "../src/compile";

/** 箱を 1 個持つ普通のパーツ。 */
const BOXED: CdlDiagram = diagram("boxed", { topic: "boxed" })
  .lane("l", { width: 400 })
  .node("box", { lane: "l", stack: 0, kind: "card", title: "箱", w: 400, h: 300 })
  .build();

/**
 * 箱を持たないパーツ。 catalog の readout 系 (percent-ring / arc-gauge 等) と同じ形で、
 * 実体は `readouts` が描き、 箱は位置決めのための 1x1 が 1 個だけ。
 */
const READOUT_ONLY: CdlDiagram = {
  id: "parts-percent-ring",
  topic: "percent-ring",
  lanes: [{ id: "l", x: 0, width: 400 }],
  nodes: [
    { id: "hidden", lane: "l", stack: 0, kind: "actor", w: 1, h: 1 },
  ] as CdlDiagram["nodes"],
  edges: [],
  states: [{ id: "v", initial: 50 }],
  phases: [
    { id: "p", duration: 1000, title: "静止", body: "", activate: [], tweens: [], sets: [] },
  ] as CdlDiagram["phases"],
  readouts: [
    { id: "ring", kind: "gauge", source: "{v}", nodeId: "hidden" },
  ] as CdlDiagram["readouts"],
};

describe("partRenderSize", () => {
  it("箱の外接矩形ではなく図枠を返す", () => {
    const render = partRenderSize(BOXED);
    const visual = partVisualSize(BOXED);
    // 図枠は箱の周りの余白を含むため、 どちらの辺も箱より大きい
    expect(render.w).toBeGreaterThan(visual.w);
    expect(render.h).toBeGreaterThan(visual.h);
  });

  it("箱を持たないパーツでも潰れない", () => {
    const visual = partVisualSize(READOUT_ONLY);
    // 箱だけを見ると 1x1 になる。 この値で描くと画面上で点になる
    expect(visual.w).toBeLessThanOrEqual(2);
    expect(visual.h).toBeLessThanOrEqual(2);

    const render = partRenderSize(READOUT_ONLY);
    // 図枠なら実体を描ける大きさが出る
    expect(render.w).toBeGreaterThan(100);
    expect(render.h).toBeGreaterThan(100 * 0.2);
    expect(render.w).toBeGreaterThan(visual.w * 10);
  });

  it("組み立てられない図では既定の大きさに落ちる", () => {
    const render = partRenderSize({} as CdlDiagram);
    expect(render).toEqual({ w: 400, h: 200 });
  });
});
