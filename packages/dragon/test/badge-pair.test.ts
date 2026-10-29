/**
 * 短い線の段の番号を線の始まりに置き、往復する線と 1 つの辺に集まる線で番号どうしを重ねない (#3189)。
 *
 * 区画の帯の間と行の間は 43px ほどしかなく、44px より短い線の番号は線の中ほどに置かれていた。
 * 往復する 2 本の線は 10px しか離れないので、2 つの番号が同じ高さで重なっていた。
 * 短い線でも番号は線の始まり (出る箱の縁から番号の半径と 1px だけ進んだ所) に置く。
 * 線の上で前の番号を避けられない時だけ、ほかの線に乗らない側の、線の脇へずらす。
 * 44px 以上の線の番号は今までどおり、線の始まりから `LOOK.badge.along` だけ進んだ所に置く。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { along, type Layout, type Point, type SceneEdge } from "../src/layout/scene";
import { LOOK } from "../src/look/values";
import { parseNotation } from "../src/parser";
import { describeOverlap, type Overlap } from "../src/render/ink";
import { renderDiagram } from "../src/render/svg";
import type { Diagram } from "../src/schema";

const FIXTURES = join(process.cwd(), "packages/dragon/test/fixtures");

function fixture(file: string): Diagram {
  const parsed = parseNotation(readFileSync(join(FIXTURES, file), "utf8"));
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => e.message).join(" / "));
  return parsed.diagram;
}

/** 重なりを `段 N: 文` の形に並べる。落ちた時にどの段で何が重なったかを読めるようにする */
const report = (overlaps: Overlap[]): string[] => overlaps.map((o) => `段 ${o.step + 1}: ${describeOverlap(o)}`);

const lengthOf = (points: Point[]): number => points.slice(1).reduce((sum, [x, y], i) => sum + Math.hypot(x - (points[i] as Point)[0], y - (points[i] as Point)[1]), 0);

/** 点から折れ線までの最も近い距離 */
function distanceTo(point: Point, points: Point[]): number {
  let best = Number.POSITIVE_INFINITY;
  for (let i = 1; i < points.length; i++) {
    const [ax, ay] = points[i - 1] as Point;
    const [bx, by] = points[i] as Point;
    const dx = bx - ax;
    const dy = by - ay;
    const t = dx === 0 && dy === 0 ? 0 : Math.max(0, Math.min(1, ((point[0] - ax) * dx + (point[1] - ay) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(point[0] - (ax + dx * t), point[1] - (ay + dy * t)));
  }
  return best;
}

/** 段 `step` (0 から) の番号の点と、その段で最初に引く線 */
function badgeOf(layout: Layout, step: number): { point: Point; edge: SceneEdge } {
  const badge = layout.badges.find((b) => b.step === step);
  const edge = layout.edges.find((e) => e.step === step && e.points.length > 1);
  if (!badge || !edge) throw new Error(`段 ${step + 1} の番号か線が無い`);
  return { point: [badge.x, badge.y], edge };
}

describe("短い線の段の番号を線の始まりに置く (#3189)", () => {
  it("badge-pair-band-no-overlaps", () => {
    expect(report(renderDiagram(fixture("pair-band.dragon")).overlaps)).toEqual([]);
  });

  it("badge-pair-row-no-overlaps", () => {
    expect(report(renderDiagram(fixture("pair-row.dragon")).overlaps)).toEqual([]);
  });

  it("badge-shared-side-no-overlaps", () => {
    for (const file of ["shared-side.dragon", "crowd-side.dragon"]) {
      expect(report(renderDiagram(fixture(file)).overlaps), `${file} で字が重なる`).toEqual([]);
    }
  });

  it("badge-short-line-at-start", () => {
    const { layout } = renderDiagram(fixture("pair-band.dragon"));
    for (const step of [0, 1]) {
      const { point, edge } = badgeOf(layout, step);
      expect(lengthOf(edge.points), `段 ${step + 1} の線が短い線ではない`).toBeLessThan(LOOK.badge.short);
      const want = along(edge.points, LOOK.badge.r + 1);
      expect(Math.hypot(point[0] - want[0], point[1] - want[1]), `段 ${step + 1} の番号が線の始まりに無い`).toBeLessThanOrEqual(0.5);
    }
  });

  it("badge-crowd-aside-clear-of-lines", () => {
    const { layout } = renderDiagram(fixture("crowd-side.dragon"));
    const aside = layout.badges.flatMap((b) => {
      const { point, edge } = badgeOf(layout, b.step);
      return distanceTo(point, edge.points) > 0.5 ? [{ step: b.step, point, edge }] : [];
    });
    expect(aside.length, "線の脇へずれた番号が無い").toBeGreaterThan(0);
    for (const { step, point, edge } of aside) {
      expect(distanceTo(point, edge.points), `段 ${step + 1} の番号が自分の線から離れすぎる`).toBeLessThanOrEqual(LOOK.badge.r * 2 + LOOK.badge.inset);
      for (const other of layout.edges.filter((e) => e !== edge && e.points.length > 1)) {
        expect(distanceTo(point, other.points), `段 ${step + 1} の番号が ${other.from} から ${other.to} への線に乗る`).toBeGreaterThanOrEqual(LOOK.badge.r);
      }
    }
  });

  it("badge-long-line-unchanged", () => {
    const { layout } = renderDiagram(fixture("pair-row.dragon"));
    const { point, edge } = badgeOf(layout, 0);
    expect(lengthOf(edge.points), "段 1 の線が長い線ではない").toBeGreaterThanOrEqual(LOOK.badge.short);
    const want = along(edge.points, LOOK.badge.along);
    expect(Math.hypot(point[0] - want[0], point[1] - want[1]), "長い線の番号が線の始まりから along の所に無い").toBeLessThanOrEqual(0.5);
  });
});
