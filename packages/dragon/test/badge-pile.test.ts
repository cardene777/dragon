/**
 * 同じ所に置く段の番号を 1 つの丸にまとめ、後の段が始まると数字を入れ替える (#3184)。
 *
 * 同じ線を何度も通る時、その線を通る段の番号は全て同じ所に置き、後の段が始まると前の段の番号を消す。
 * 線の無い段が同じ箱か中身の帯を続けて書き換える時も、番号は同じ角に置いて同じように入れ替える。
 * 状態遷移図で同じ線に同じ名前が付く段は、名前も前の名前の所に重ねて 1 つにまとめる。
 * 前の段の番号と名前が後の段と同じ時刻に見えていないことは、同じ所に置いたうえで重なり (`overlaps`) が 0 件であることで確かめる。
 *
 * 同じ線を 1 度しか通らない段の番号は、今までどおり済んだ後も縁取りで残す。
 * 時系列図は同じ 2 つの箱の間を何度行き来しても行が分かれるので、番号はそれぞれの行の線に置く。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { parseNotation } from "../src/parser";
import { describeOverlap, type Overlap } from "../src/render/ink";
import { renderDiagram, renderLayout } from "../src/render/svg";
import type { Diagram } from "../src/schema";

type Point = [number, number];
type Spot = { x: number; y: number };

const FIXTURES = join(process.cwd(), "packages/dragon/test/fixtures");
const EXAMPLES = join(process.cwd(), "packages/dragon/examples");

function parse(text: string): Diagram {
  const parsed = parseNotation(text);
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => e.message).join(" / "));
  return parsed.diagram;
}

const fixture = (file: string): Diagram => parse(readFileSync(join(FIXTURES, file), "utf8"));

/** 重なりを `段 N: 文` の形に並べる。落ちた時にどの段で何が重なったかを読めるようにする */
const report = (overlaps: Overlap[]): string[] => overlaps.map((o) => `段 ${o.step + 1}: ${describeOverlap(o)}`);

const sameSpot = (a: Spot, b: Spot): boolean => Math.hypot(a.x - b.x, a.y - b.y) <= 0.5;

/** 点から折れ線までの最短の距離 */
function distanceToLine([px, py]: Point, points: Point[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1] as Point;
    const [bx, by] = points[i] as Point;
    const length = (bx - ax) ** 2 + (by - ay) ** 2;
    const t = length === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / length));
    best = Math.min(best, Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay))));
  }
  return best;
}

/** 画面が API に注文を送り、状態を 2 回聞く時系列図。同じ向きの線を 3 段で引く */
const SEQUENCE = [
  "sequence 状態を何度も聞く",
  "",
  "box 画面",
  "box API",
  "",
  "step 注文する",
  "  say 画面が注文を送る。",
  "  画面 -> API: 注文を送る",
  "",
  "step 受け付ける",
  "  say API が受け付けたと返す。",
  "  API -> 画面: 受け付けた",
  "",
  "step 1 回目",
  "  say 画面が状態を聞く。",
  "  画面 -> API: 状態を聞く",
  "",
  "step まだ",
  "  say API がまだと返す。",
  "  API -> 画面: まだ",
  "",
  "step 2 回目",
  "  say 画面がもう一度聞く。",
  "  画面 -> API: 状態を聞く",
].join("\n");

describe("同じ所の段の番号を入れ替える (#3184)", () => {
  it("architecture-repeat-no-overlaps", () => {
    const rendered = renderDiagram(fixture("repeat-line.dragon"));
    expect(rendered.layout.badges, "5 段の番号が揃わない").toHaveLength(5);
    expect(report(rendered.overlaps)).toEqual([]);
  });

  it("state-loop-repeat-no-overlaps", () => {
    const rendered = renderDiagram(fixture("repeat-loop.dragon"));
    expect(rendered.layout.badges, "8 段の番号が揃わない").toHaveLength(8);
    expect(report(rendered.overlaps)).toEqual([]);
  });

  it("repeat-line-badges-share-one-spot", () => {
    for (const file of ["repeat-line.dragon", "repeat-loop.dragon"]) {
      const { layout } = renderDiagram(fixture(file));
      const lineOf = (step: number) => layout.edges.find((e) => e.step === step && e.points.length > 0);
      let compared = 0;
      for (const a of layout.badges) {
        for (const b of layout.badges) {
          if (b.step <= a.step) continue;
          const ea = lineOf(a.step);
          const eb = lineOf(b.step);
          if (!ea || !eb || JSON.stringify(ea.points) !== JSON.stringify(eb.points)) continue;
          compared++;
          expect(sameSpot(a, b), `${file} の段の番号 ${b.step + 1} が、同じ線を通る段の番号 ${a.step + 1} と別の所に在る`).toBe(true);
        }
      }
      expect(compared, `${file} に同じ線を通る段の組が無い`).toBeGreaterThan(0);
    }
  });

  it("corner-badges-share-one-spot", () => {
    const rendered = renderDiagram(fixture("repeat-corner.dragon"));
    const at = (step: number): Spot => {
      const badge = rendered.layout.badges.find((b) => b.step === step);
      if (!badge) throw new Error(`段の番号 ${step + 1} が無い`);
      return badge;
    };
    // 2 段目と 3 段目は画面を書き換え、4 段目と 5 段目は中身の帯を書き換える
    expect(sameSpot(at(1), at(2)), "画面を続けて書き換える段の番号が同じ角に無い").toBe(true);
    expect(sameSpot(at(3), at(4)), "帯を続けて書き換える段の番号が同じ角に無い").toBe(true);
    expect(report(rendered.overlaps)).toEqual([]);
  });

  it("state-same-name-once", () => {
    const loop = fixture("repeat-loop.dragon");
    const rendered = renderDiagram(loop);
    const named = rendered.layout.labels.filter((l) => l.text === "入金を確かめる");
    expect(named, "5 回確かめる段の名前が揃わない").toHaveLength(5);
    const [first] = named;
    if (!first) return;
    for (const label of named) expect(sameSpot(label, first), `${label.step + 1} 段目の「入金を確かめる」が 1 回目の名前と別の所に在る`).toBe(true);
    // 2 回目から 5 回目の段を外し、1 回だけ確かめる図と高さが同じになる
    const once = renderDiagram({ ...loop, steps: loop.steps.filter((_, i) => i < 3 || i === 7) });
    expect(rendered.layout.height, "同じ名前を重ねたのに、1 回だけ確かめる図より高い").toBe(once.layout.height);
  });

  it("single-pass-badges-stay", () => {
    // 注文の見本の段は、どれも別の線を通る。最後の段の番号を前の段の番号の所へ動かすと、最後の段で 2 つの番号の重なりを数える
    // = 前の段の番号は最後の段まで消えずに見えている
    const rendered = renderDiagram(parse(readFileSync(join(EXAMPLES, "order.dragon"), "utf8")));
    const last = rendered.layout.badges.length - 1;
    expect(last, "注文の見本の段が足りない").toBeGreaterThan(5);
    for (let i = 0; i < last; i++) {
      const layout = structuredClone(rendered.layout);
      const kept = layout.badges[i];
      const moved = layout.badges[last];
      if (!kept || !moved) throw new Error("段の番号が無い");
      Object.assign(moved, { x: kept.x, y: kept.y });
      const pairs = renderLayout(rendered.diagram, layout, rendered.timeline)
        .overlaps.filter((o) => o.step === last && o.kind === "texts")
        .map((o) => [...o.texts].sort());
      expect(pairs, `段の番号 ${i + 1} が最後の段で消えている`).toContainEqual([String(i + 1), String(last + 1)].sort());
    }
  });

  it("sequence-repeat-badges-on-own-rows", () => {
    const rendered = renderDiagram(parse(SEQUENCE));
    const { badges, edges } = rendered.layout;
    expect(badges, "5 段の番号が揃わない").toHaveLength(5);
    for (const badge of badges) {
      const line = edges.find((e) => e.step === badge.step);
      expect(line, `${badge.step + 1} 段目の線が無い`).toBeDefined();
      if (!line) continue;
      expect(distanceToLine([badge.x, badge.y], line.points), `段の番号 ${badge.step + 1} がその段の線の上に無い`).toBeLessThanOrEqual(0.5);
    }
    badges.forEach((a, i) => {
      for (const b of badges.slice(i + 1)) expect(sameSpot(a, b), `段の番号 ${a.step + 1} と ${b.step + 1} が同じ所に在る`).toBe(false);
    });
    expect(report(rendered.overlaps)).toEqual([]);
  });
});
