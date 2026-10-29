/**
 * 構成図で同じ箱へ戻る線を、状態遷移図と同じ箱の下の輪で描く (#3186)。
 *
 * 輪は箱の下端の右から出て下へ膨らみ、箱の下端の左へ戻る。段の番号は輪の右に、線の名前は輪の下に置く。
 * 運ぶ物は輪の上を通って、箱の置き場に着く。
 * 輪を持つ箱の真下に別の箱が在っても、輪と名前と番号はその箱に重ならず、区画の中の箱なら区画の中に収まる。
 * 輪を持つ箱から出入りするほかの線は、輪と名前の置き場を通らず、箱の脇から列の間へ回る。
 * 列の間を回る線は、列で一番幅の広い箱の外を通る。
 *
 * 状態遷移図の同じ状態へ戻る輪と、時系列図の自分への矢印は今のまま。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type Layout, LOOP_ROOM, type Point, type Rect, type SceneEdge } from "../src/layout/scene";
import { LOOK } from "../src/look/values";
import { parseNotation } from "../src/parser";
import { describeOverlap, type Overlap } from "../src/render/ink";
import { renderDiagram } from "../src/render/svg";
import type { Diagram } from "../src/schema";

const FIXTURES = join(process.cwd(), "packages/dragon/test/fixtures");

function parse(text: string): Diagram {
  const parsed = parseNotation(text);
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => e.message).join(" / "));
  return parsed.diagram;
}

const fixture = (file: string): Diagram => parse(readFileSync(join(FIXTURES, file), "utf8"));

/** 重なりを `段 N: 文` の形に並べる。落ちた時にどの段で何が重なったかを読めるようにする */
const report = (overlaps: Overlap[]): string[] => overlaps.map((o) => `段 ${o.step + 1}: ${describeOverlap(o)}`);

/** 同じ箱 `id` へ戻る線と、その箱と、その段の番号の丸の四角と線の名前の四角 */
function selfLine(layout: Layout, id: string): { edge: SceneEdge; box: Rect; badge: Rect; label: Rect } {
  const edge = layout.edges.find((e) => e.from === id && e.to === id);
  const box = layout.boxes.find((b) => b.id === id);
  if (!edge || !box) throw new Error(`${id} へ戻る線か箱が無い`);
  const badge = layout.badges.find((b) => b.step === edge.step);
  const label = layout.labels.find((l) => l.step === edge.step && l.event === edge.event);
  if (!badge || !label) throw new Error(`${id} へ戻る線の番号か名前が無い`);
  const r = LOOK.badge.r;
  return { edge, box, badge: { x: badge.x - r, y: badge.y - r, w: r * 2, h: r * 2 }, label };
}

const bottomOf = (rect: Rect): number => rect.y + rect.h;
const deepest = (points: Point[]): number => Math.max(...points.map(([, y]) => y));
const rightmost = (points: Point[]): number => Math.max(...points.map(([x]) => x));
/** 2 つの四角が食い込む (縁が触れただけは数えない) */
const bites = (a: Rect, b: Rect): boolean => Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x) > 0.5 && Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y) > 0.5;
const inside = (outer: Rect, inner: Rect): boolean => inner.x >= outer.x - 0.5 && inner.y >= outer.y - 0.5 && inner.x + inner.w <= outer.x + outer.w + 0.5 && inner.y + inner.h <= outer.y + outer.h + 0.5;
/** 折れ線を囲む四角 */
const boundsOf = (points: Point[]): Rect => {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
};

/** 折れ線の区間ごとの四角。縦か横の区間は幅か高さが 0 になるので、食い込みを数えられるよう 1 だけ持たせる */
const segmentsOf = (points: Point[]): Rect[] =>
  points.slice(1).map((p, i) => {
    const rect = boundsOf([points[i] as Point, p]);
    return { ...rect, w: Math.max(rect.w, 1), h: Math.max(rect.h, 1) };
  });

/** 描いた SVG から、札 `text` を運ぶ物が通る点を、動きの keyframes の順に取り出す */
function carrierPath(svg: string, text: string): Point[] {
  const found = new RegExp(`<g class="dg-a" style="animation-name:([\\w-]+)"><rect class="dg-car"[^>]*/><text[^>]*>${text}</text>`).exec(svg);
  if (!found) throw new Error(`札 ${text} の運ぶ物が無い`);
  const start = svg.indexOf(`@keyframes ${found[1]}{`);
  const end = svg.indexOf("@keyframes", start + 1);
  const body = svg.slice(start, end === -1 ? undefined : end);
  return [...body.matchAll(/translate\((-?[\d.]+)px,(-?[\d.]+)px\)/g)].map((m): Point => [Number(m[1]), Number(m[2])]);
}

/** 画面が API に送り、API が自分で確かめる時系列図 */
const SEQUENCE = ["sequence 自分で確かめる", "", "box 画面", "box API", "", "step 送る", "  say 画面が送る。", "  画面 -> API: 送る", "", "step 確かめる", "  say API が自分で確かめる。", "  API -> API: 中身を確かめる"].join("\n");

describe("構成図で同じ箱へ戻る線を箱の下の輪で描く (#3186)", () => {
  it("architecture-self-line-no-overlaps", () => {
    for (const file of ["arch-self-loop.dragon", "self-line.dragon", "arch-self-below.dragon", "arch-self-region.dragon", "arch-self-side.dragon", "arch-self-wide.dragon"]) {
      expect(report(renderDiagram(fixture(file)).overlaps), `${file} で字が重なる`).toEqual([]);
    }
  });

  it("architecture-self-line-loops-below-box", () => {
    const { edge, box } = selfLine(renderDiagram(fixture("arch-self-loop.dragon")).layout, "API");
    const bottom = bottomOf(box);
    const [first, last] = [edge.points[0] as Point, edge.points[edge.points.length - 1] as Point];
    expect(Math.abs(first[1] - bottom), "輪が箱の下端から出ない").toBeLessThanOrEqual(0.5);
    expect(last[1] - bottom, "輪が箱の下端へ戻らない").toBeGreaterThanOrEqual(-0.5);
    expect(last[1] - bottom, "輪が箱の下端へ戻らない").toBeLessThanOrEqual(LOOK.edge.inset + 0.5);
    expect(first[0], "輪が箱の下端の右から出ない").toBeGreaterThan(last[0]);
    expect(Math.min(...edge.points.map(([, y]) => y)), "輪が箱の中へ入る").toBeGreaterThanOrEqual(bottom - 0.5);
    expect(deepest(edge.points) - bottom, "輪が箱の下へ膨らまない").toBeGreaterThanOrEqual(LOOK.state.loop.h * 0.75);
    for (const [x] of edge.points) expect(x >= box.x && x <= box.x + box.w, "輪が箱の幅から横へはみ出す").toBe(true);
  });

  it("architecture-self-line-badge-and-label", () => {
    const { edge, badge, label } = selfLine(renderDiagram(fixture("arch-self-loop.dragon")).layout, "API");
    const top = (edge.points[0] as Point)[1];
    const deep = deepest(edge.points);
    expect(badge.x, "番号が輪の右に無い").toBeGreaterThanOrEqual(rightmost(edge.points));
    const middle = badge.y + badge.h / 2;
    expect(middle > top && middle < deep, "番号が輪の高さの間に無い").toBe(true);
    expect(label.y, "名前が輪の下に無い").toBeGreaterThanOrEqual(deep);
    const [x0, x1] = [Math.min(...edge.points.map(([x]) => x)), rightmost(edge.points)];
    const centre = label.x + label.w / 2;
    expect(Math.abs(centre - (x0 + x1) / 2), "名前が輪の真下に無い").toBeLessThanOrEqual(LOOK.state.loop.w);
  });

  it("architecture-self-line-carrier-on-loop", () => {
    const rendered = renderDiagram(fixture("arch-self-loop.dragon"));
    const { box } = selfLine(rendered.layout, "API");
    const path = carrierPath(rendered.svg, "確認中");
    expect(path.length, "札 確認中 の動きの点が無い").toBeGreaterThan(2);
    expect(Math.max(...path.map(([, y]) => y)) - bottomOf(box), "札が輪の上を通って箱の下へ出ない").toBeGreaterThanOrEqual(LOOK.state.loop.h / 2);
    const rest = path[path.length - 1] as Point;
    expect(inside(box, { x: rest[0], y: rest[1], w: 0, h: 0 }), "札が箱の置き場に着かない").toBe(true);
  });

  it("architecture-self-line-clear-of-box-below", () => {
    const { layout } = renderDiagram(fixture("arch-self-below.dragon"));
    const { edge, box, badge, label } = selfLine(layout, "画面");
    const below = layout.boxes.find((b) => b.id === "台帳");
    if (!below) throw new Error("台帳の箱が無い");
    expect(below.y, "台帳が画面の真下に無い").toBeGreaterThan(bottomOf(box));
    expect(deepest(edge.points), "画面の下に輪が無い").toBeGreaterThan(bottomOf(box) + LOOK.state.loop.h / 2);
    expect(bites(boundsOf(edge.points), below), "輪が台帳に重なる").toBe(false);
    expect(bites(badge, below), "番号が台帳に重なる").toBe(false);
    expect(bites(label, below), "名前が台帳に重なる").toBe(false);
  });

  it("architecture-self-line-inside-region", () => {
    const { layout } = renderDiagram(fixture("arch-self-region.dragon"));
    const { edge, box, badge, label } = selfLine(layout, "API");
    const region = layout.regions.find((r) => r.id === "店");
    if (!region) throw new Error("区画 店 が無い");
    expect(deepest(edge.points), "API の下に輪が無い").toBeGreaterThan(bottomOf(box) + LOOK.state.loop.h / 2);
    expect(inside(region, boundsOf(edge.points)), "輪が区画の外へ出る").toBe(true);
    expect(inside(region, badge), "番号が区画の外へ出る").toBe(true);
    expect(inside(region, label), "名前が区画の外へ出る").toBe(true);
  });

  it("architecture-other-lines-avoid-loop", () => {
    for (const file of ["arch-self-region.dragon", "arch-self-side.dragon", "arch-self-wide.dragon"]) {
      const { layout } = renderDiagram(fixture(file));
      const zones = layout.edges.filter((e) => e.from === e.to).map((e) => {
        const { box } = selfLine(layout, e.from);
        return { id: e.from, rect: { x: box.x, y: bottomOf(box), w: box.w, h: LOOP_ROOM } };
      });
      expect(zones.length, `${file} に同じ箱へ戻る線が無い`).toBeGreaterThan(0);
      for (const edge of layout.edges.filter((e) => e.from !== e.to)) {
        for (const zone of zones) {
          const crossed = segmentsOf(edge.points).some((segment) => bites(segment, zone.rect));
          expect(crossed, `${file} で ${edge.from} から ${edge.to} への線が ${zone.id} の輪と名前の置き場を通る`).toBe(false);
        }
      }
    }
  });

  it("architecture-detour-clear-of-wide-box", () => {
    const { layout } = renderDiagram(fixture("arch-self-wide.dragon"));
    const wide = layout.boxes.find((b) => b.id === "とても長い名前の受け付け");
    const api = layout.boxes.find((b) => b.id === "API");
    const edge = layout.edges.find((e) => e.from === "API" && e.to === "とても長い名前の受け付け");
    if (!wide || !api || !edge) throw new Error("幅の広い箱か API か、その間の線が無い");
    expect(wide.w, "上の箱が API より幅広くない").toBeGreaterThan(api.w);
    expect(edge.points.length, "API から上の箱への線が脇を回らない").toBeGreaterThan(2);
    // 箱の縁から 1px 内側に食い込む区間を数える (縁に着く矢じりは数えない)
    const inner: Rect = { x: wide.x + 1, y: wide.y + 1, w: wide.w - 2, h: wide.h - 2 };
    expect(segmentsOf(edge.points).some((segment) => bites(segment, inner)), "脇を回る線が幅の広い箱の中を通る").toBe(false);
  });

  it("sequence-self-message-unchanged", () => {
    const rendered = renderDiagram(parse(SEQUENCE));
    const edge = rendered.layout.edges.find((e) => e.from === "API" && e.to === "API");
    const lifeline = rendered.layout.lifelines.find((l) => l.id === "API");
    if (!edge || !lifeline) throw new Error("API の自分への矢印か生存線が無い");
    const [first, last] = [edge.points[0] as Point, edge.points[edge.points.length - 1] as Point];
    expect(Math.abs(first[0] - lifeline.x), "自分への矢印が生存線から出ない").toBeLessThanOrEqual(LOOK.edge.inset + 0.5);
    expect(Math.abs(last[0] - lifeline.x), "自分への矢印が生存線へ戻らない").toBeLessThanOrEqual(LOOK.edge.inset + 0.5);
    expect(rightmost(edge.points) - lifeline.x, "自分への矢印が生存線の右へ出ない").toBeCloseTo(LOOK.sequence.selfW, 1);
    expect(last[1], "自分への矢印が下で戻らない").toBeGreaterThan(first[1]);
    expect(report(rendered.overlaps)).toEqual([]);
  });
});
