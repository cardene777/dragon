/**
 * 構成図の区画の外の箱を書いた所の帯に置き、行の下を回る線を行で最も高い箱から離す (#3546)。
 *
 * skillの評価でAIが書いた構成図のうち、2件が`dragon check --layout`の崩れを残していた。
 * 1件は2つの区画の間に書いた共有の`+bridge`が下の区画の下へ回り、上の区画から橋への線が下の区画を貫いて箱の字を横切った。
 * 区画の外の箱を全て最後の帯にまとめていたため。
 * もう1件は1行に並べた箱のうちアーチの形の箱だけが字を収めるために高く (#3520)、行の下を回る線がその箱の底に余白より近く沿って走った。
 * 回る線の高さを、行で最も高い箱ではなく線が出る低い箱の底から測っていたため。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";

/* 見た目の値の元の code を、検査の外 (この file を読む段) で先に読む。検査の中で初めて読むと、混んだ機械で上限の10秒に近づく (#3410) */
const { LOOK } = await import("../src/look/values");

const FIXTURES = join(process.cwd(), "packages/dragon/test/fixtures/layout");
/** 区画`l1`と`l2`の間に区画の外の`+bridge`を書いた構成図 */
const BETWEEN = join(FIXTURES, "loose-between-groups.dragon");
/** 1行に並べた箱のうち、アーチの形の`+bridge`だけが高い構成図。段4の線が行の下を回る */
const DETOUR = join(FIXTURES, "detour-shaped-box.dragon");
/** 足し引きの丸めの誤差 */
const EPSILON = 1e-6;

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
type Point = [number, number];
interface Drawn {
  regions: (Rect & { id: string })[];
  boxes: (Rect & { id: string; name: string })[];
  edges: { step: number; from: string; to: string; points: Point[] }[];
}

/** 記法を読んで描いた置き場所と、`dragon check --layout`と同じ崩れ */
function draw(file: string): { layout: Drawn; breaks: unknown[] } {
  const text = readFileSync(file, "utf8");
  const parsed = dragon.parseNotation(text, { lang: "ja" });
  if (!parsed.ok) throw new Error(`${file} を読めない: ${JSON.stringify(parsed.errors)}`);
  const layout = dragon.renderDiagram(parsed.diagram, { lang: "ja" }).layout as unknown as Drawn;
  return { layout, breaks: dragon.checkLayoutText(text, { lang: "ja" }) };
}

describe("構成図の区画の外の箱と、行の下を回る線 (#3546)", () => {
  it("layout-loose-box-between-groups", () => {
    const { layout, breaks } = draw(BETWEEN);
    const region = (id: string): Rect => {
      const found = layout.regions.find((r) => r.id === id);
      if (!found) throw new Error(`区画 ${id} が無い`);
      return found;
    };
    const [l1, l2] = [region("l1"), region("l2")];
    const bridge = layout.boxes.find((b) => b.id === "bridge");
    expect(bridge, "区画の外のブリッジの箱が無い").toBeDefined();
    if (!bridge) return;
    expect(bridge.y, "ブリッジの箱の上端が上の区画 Ethereum の下の枠より上に在る").toBeGreaterThanOrEqual(l1.y + l1.h);
    expect(bridge.y + bridge.h, "ブリッジの箱の下端が下の区画 Base の上の枠より下に在る").toBeLessThanOrEqual(l2.y);
    expect(breaks, "区画の間のブリッジの図の崩れ").toEqual([]);
  });

  it("layout-detour-clears-shaped-box", () => {
    const { layout, breaks } = draw(DETOUR);
    const byId = new Map(layout.boxes.map((b) => [b.id, b]));
    const [bridge, base] = [byId.get("br"), byId.get("base")];
    // アーチの箱が線の出る箱より高くなければ、この図は低い箱の底から測る誤りを確かめない
    expect(bridge && base && bridge.h > base.h, "アーチの箱が Base の箱より高くない").toBe(true);
    // 段4は0から数えて3。Base から利用者の財布への線は、間の箱を避けて行の下を回る
    const line = layout.edges.find((e) => e.step === 3 && e.from === "base" && e.to === "user");
    expect(line, "段4に Base から利用者の財布への線が無い").toBeDefined();
    if (!line) return;
    const runs = line.points.slice(1).flatMap((q, k): [Point, Point][] => {
      const p = line.points[k] as Point;
      return p[1] === q[1] && p[0] !== q[0] ? [[p, q]] : [];
    });
    expect(runs.length, "段4の線に横に走る所が無い (行の下を回らない)").toBeGreaterThan(0);
    const measured: string[] = [];
    for (const [p, q] of runs) {
      const [x0, x1] = [Math.min(p[0], q[0]), Math.max(p[0], q[0])];
      for (const box of layout.boxes) {
        if (box.x + box.w <= x0 || box.x >= x1 || box.y + box.h > p[1]) continue;
        measured.push(box.id);
        expect(p[1] - (box.y + box.h), `段4の線と「${box.name}」の底の間`).toBeGreaterThanOrEqual(LOOK.margin - EPSILON);
      }
    }
    // 比べる箱が無ければ、間の検査は当たり前に通る。線の上にはアーチの箱が在る
    expect(measured, "段4の線の上にアーチの箱を数えない").toContain("br");
    expect(breaks, "アーチの箱の下を回る図の崩れ").toEqual([]);
  });
});
