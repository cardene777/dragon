/**
 * パイプ図の値の札の前の値と、札だけを囲う点線の枠と、網型の確かめの計器と式の札 (#3990)。
 *
 * DamlのChoiceを描く図 (`fixtures/mesh-dvp-hold-write.dragon`) で、札だけを囲う枠が瓶のある枠と同じ高さに描かれて札の上下が空き、
 * 前の値が札から離れた瓶の数字の行に出て、網型では値の管がその字の上を通った。
 * 網型では、表の形でない箱 (Canton) の計器が図の左端に、式の札が離れた札入れに出た。
 * 前の値は札の中の大きな値の下に置き、札だけの枠は札を囲む高さに詰め、網型の計器は確かめた箱へ入る呼び出しの管の上に、式の札は計器の横に置く。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import * as dragon from "../src/core";
import { PIPE_LOOK } from "../src/look/pipe";
import { checkLayoutText, describeBreak } from "../src/render/layout-check";
import "../src/kind-use/pipe";
// 組み立てが本体に埋める共有のブロック集と絵柄集を、src を読む検査にも置く (#3763)
import "./built-globals";

type Point = [number, number];
interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
interface Plate extends Rect {
  party: string;
  name: string;
  step: number;
  boxed: boolean;
  row?: unknown;
  text: Rect;
  was?: Rect;
  strike?: Rect;
  tag?: Rect;
}
interface Gauge extends Rect {
  party: string;
  step: number;
  cx: number;
  cy: number;
  lamp: { x: number; y: number; r: number };
  side?: "left" | "right";
}
interface PipeLayout {
  width: number;
  height: number;
  parties: (Rect & { id: string; shape: string })[];
  housings: (Rect & { party: string; enclosed?: boolean })[];
  tanks: (Rect & { party: string })[];
  plates: Plate[];
  gauges: Gauge[];
  calls: { to: string; points: Point[] }[];
}

// 例の置き場は repo の根 (vitest を回す場所) から引く
const fixture = (name: string): string =>
  readFileSync(join(process.cwd(), "packages/dragon/test/fixtures", name), "utf8");
const example = (name: string): string =>
  readFileSync(join(process.cwd(), "packages/dragon/examples", name), "utf8");
/** 課題の DvP の記法。網型と、layout の行を外した形 (上と下の形から選ぶ) */
const DVP = fixture("mesh-dvp-hold-write.dragon");
const DVP_AUTO = DVP.replace(/^layout mesh\n/mu, "");
/** 網型で、表の形でない箱 (LiquidityPool) を確かめる見本と、表の形の箱 (USDC) を確かめる見本 */
const SWAP = fixture("side-port-patterns-swap-slipped.dragon");
const DAML = fixture("mesh-call-home-daml-400.dragon");

const draw = (text: string): { layout: PipeLayout; svg: string } => {
  const parsed = dragon.parseNotation(text);
  if (!parsed.ok) throw new Error(parsed.errors.map((e) => e.message).join(" / "));
  const drawn = dragon.renderDiagram(parsed.diagram, { lang: "ja" });
  return { layout: drawn.layout as unknown as PipeLayout, svg: drawn.svg };
};
/** 描いた図の数の端数で落ちないための許し (px) */
const D = 1;
const within = (a: Rect, b: Rect): boolean =>
  a.x >= b.x - D && a.y >= b.y - D && a.x + a.w <= b.x + b.w + D && a.y + a.h <= b.y + b.h + D;
const insideFrame = (r: Rect, L: PipeLayout): boolean =>
  r.x >= -D && r.y >= -D && r.x + r.w <= L.width + D && r.y + r.h <= L.height + D;
/** 値の札のうち、箱の表の行 (`row`) でも箱の中の札 (`boxed`) でもない、点線の枠に並ぶ札 */
const cardsOf = (L: PipeLayout): Plate[] => L.plates.filter((p) => !p.boxed && !p.row);
/** 点から線分までの隔たり */
const distance = ([px, py]: Point, [a, b]: [Point, Point]): number => {
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const t =
    dx === 0 && dy === 0
      ? 0
      : Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy));
};
/** 計器の四角。右に添える通ったかの印まで含める */
const gaugeRect = (g: Gauge): Rect => {
  const right = Math.max(g.x + g.w, g.lamp.x + g.lamp.r * 2);
  return {
    x: g.x,
    y: Math.min(g.y, g.lamp.y),
    w: right - g.x,
    h: Math.max(g.y + g.h, g.lamp.y + g.lamp.r * 2) - Math.min(g.y, g.lamp.y),
  };
};
/** 描いた SVG の式の札。札入れへずらして描く時の `translate` も足した、画面の上の四角 */
const formulaChips = (svg: string): (Rect & { step: number })[] =>
  [
    ...svg.matchAll(
      /(?:<g transform="translate\((-?[\d.]+) (-?[\d.]+)\)">)?<g data-pipe-chip="formula" data-pipe-step="(\d+)"[^>]*><rect class="dg-pp-lab" x="(-?[\d.]+)" y="(-?[\d.]+)" width="([\d.]+)" height="([\d.]+)"/gu,
    ),
  ].map((m) => ({
    step: Number(m[3]),
    x: Number(m[4]) + Number(m[1] ?? 0),
    y: Number(m[5]) + Number(m[2] ?? 0),
    w: Number(m[6]),
    h: Number(m[7]),
  }));

describe("パイプ図の値の札と網型の計器 (#3990)", () => {
  it("pipe-plate-only-housing-fits-cards", () => {
    // 槽を持たず値の札だけを囲う点線の枠は、札を囲む高さに詰める。瓶の枠と同じ高さで描くと、札の上下に札ほどの空きが出た
    const pad = PIPE_LOOK.housing.pad;
    for (const [name, text] of [
      ["網型", DVP],
      ["layout の行なし", DVP_AUTO],
    ] as const) {
      const L = draw(text).layout;
      const frames = L.housings.filter(
        (h) => !h.enclosed && !L.tanks.some((t) => t.party === h.party && within(t, h)),
      );
      expect(frames.length, `${name} の札だけを囲う枠`).toBeGreaterThan(0);
      for (const h of frames) {
        const cards = cardsOf(L).filter(
          (p) => p.party === h.party && p.x >= h.x - D && p.x + p.w <= h.x + h.w + D,
        );
        expect(cards.length, `${name} の ${h.party} の枠の札`).toBeGreaterThan(0);
        for (const c of cards)
          expect(within(c, h), `${name} の ${h.party} の札 ${c.name} が枠からはみ出す`).toBe(true);
        const top = Math.min(...cards.map((c) => c.y));
        const bottom = Math.max(...cards.map((c) => c.y + c.h));
        expect(h.h, `${name} の ${h.party} の札だけの枠の高さ`).toBeLessThanOrEqual(
          bottom - top + pad * 2 + D,
        );
      }
    }
  });

  it("pipe-tank-housing-keeps-height", () => {
    // 槽を囲う枠は、瓶と札を一緒に囲う枠も、瓶と瓶の下の数字の行を囲む今の高さのまま
    const P = PIPE_LOOK;
    const height = P.housing.top + P.tank.h + P.housing.text;
    for (const [name, text] of [
      ["layout の行なし の DvP", DVP_AUTO],
      ["Vault の見本", example("vault-proxy.dragon")],
    ] as const) {
      const L = draw(text).layout;
      const frames = L.housings.filter((h) =>
        L.tanks.some((t) => t.party === h.party && within(t, h)),
      );
      expect(frames.length, `${name} の槽を囲う枠`).toBeGreaterThan(0);
      for (const h of frames)
        expect(h.h, `${name} の ${h.party} の槽を囲う枠の高さ`).toBeCloseTo(height, 0);
    }
  });

  it("pipe-prev-value-struck-and-tagged", () => {
    // 前の値は線で消し、状態の語 (暫定、確定) は前の値の右に重ねずに並べる
    for (const [name, text] of [
      ["網型", DVP],
      ["layout の行なし", DVP_AUTO],
    ] as const) {
      const changed = cardsOf(draw(text).layout).filter((p) => p.was);
      expect(changed.length, `${name} の前の値を持つ札`).toBeGreaterThan(0);
      for (const p of changed) {
        const what = `${name} 段${p.step + 1} の ${p.party}.${p.name}`;
        const { was, strike, tag } = p;
        expect(was && strike && tag, `${what} の前の値か消す線か状態の語が無い`).toBeTruthy();
        if (!was || !strike || !tag) continue;
        expect(
          strike.x <= was.x + D && strike.x + strike.w >= was.x + was.w - D,
          `${what} の消す線が前の値の字の端まで届かない`,
        ).toBe(true);
        expect(
          strike.y >= was.y && strike.y + strike.h <= was.y + was.h,
          `${what} の消す線が前の値の字の高さの外`,
        ).toBe(true);
        expect(tag.x, `${what} の状態の語が前の値に重なる`).toBeGreaterThanOrEqual(was.x + was.w);
        expect(
          tag.y < was.y + was.h && was.y < tag.y + tag.h,
          `${what} の状態の語が前の値と同じ行に無い`,
        ).toBe(true);
      }
    }
  });

  it("pipe-dvp-value-pipes-clear-text", () => {
    // 網型の DvP で、値の管が前の値の字の上を通らない
    const over = checkLayoutText(DVP, { lang: "ja" })
      .map((b) => describeBreak(b, "ja"))
      .filter((t) => t.includes("値の管") && t.includes("の上を通る"));
    expect(over, "値の管が字の上を通る知らせ").toEqual([]);
  });

  it("pipe-mesh-gauge-on-incoming-call", () => {
    // 網型で表の形でない箱を確かめる計器は、その箱へ入る呼び出しの管の上に載せる。今は図の左端に残った
    for (const [name, text, party] of [
      ["DvP", DVP, "canton"],
      ["swap の崩れの見本", SWAP, "pool"],
    ] as const) {
      const L = draw(text).layout;
      const gauges = L.gauges.filter((g) => g.party === party);
      expect(gauges.length, `${name} の ${party} の計器`).toBeGreaterThan(0);
      const segs = L.calls
        .filter((c) => c.to === party)
        .flatMap((c) => c.points.slice(1).map((q, i): [Point, Point] => [c.points[i] as Point, q]));
      expect(segs.length, `${name} の ${party} へ入る呼び出しの管`).toBeGreaterThan(0);
      for (const g of gauges) {
        const gap = Math.min(...segs.map((s) => distance([g.cx, g.cy], s)));
        expect(
          gap,
          `${name} の ${party} の計器の真ん中と、${party} へ入る管の隔たり`,
        ).toBeLessThanOrEqual(D);
        expect(insideFrame(gaugeRect(g), L), `${name} の ${party} の計器が図の枠からはみ出す`).toBe(
          true,
        );
      }
    }
  });

  it("pipe-mesh-formula-beside-gauge", () => {
    // 網型の確かめの式の札は、計器と重ねず、計器の左か右の同じ高さに置く。今は離れた札入れか図の外に出た
    for (const [name, text] of [
      ["DvP", DVP],
      ["swap の崩れの見本", SWAP],
      ["Daml の見本", DAML],
    ] as const) {
      const { layout: L, svg } = draw(text);
      const chips = formulaChips(svg);
      expect(chips.length, `${name} の式の札`).toBeGreaterThan(0);
      for (const c of chips) {
        const g = L.gauges.find((x) => x.step === c.step) ?? L.gauges[0];
        expect(g, `${name} の段${c.step + 1} の計器`).toBeDefined();
        if (!g) continue;
        const r = gaugeRect(g);
        const what = `${name} の段${c.step + 1} の式の札`;
        expect(
          c.y < r.y + r.h && r.y < c.y + c.h,
          `${what} が計器と同じ高さに無い (札 y=${c.y}、計器 y=${r.y})`,
        ).toBe(true);
        expect(
          c.x + c.w <= r.x + D || c.x >= r.x + r.w - D,
          `${what} が計器の左か右に無い (札 x=${c.x}、計器 x=${r.x})`,
        ).toBe(true);
        expect(insideFrame(c, L), `${what} が図の枠からはみ出す (x=${c.x}、y=${c.y})`).toBe(true);
      }
    }
  });

  it("pipe-mesh-token-gauge-keeps-side", () => {
    // 網型で表の形の箱を確かめる計器は、今と同じく箱の左か右の、箱の上端の高さに吊るす (Tracelyth #225)
    const L = draw(DAML).layout;
    const box = L.parties.find((p) => p.id === "usdc");
    const gauges = L.gauges.filter((g) => g.party === "usdc");
    expect(box && gauges.length > 0, "Daml の見本の USDC の箱と計器").toBe(true);
    if (!box) return;
    for (const g of gauges) {
      expect(g.side === "left" || g.side === "right", "USDC の計器が箱の横に無い").toBe(true);
      expect(g.x + g.w <= box.x + D || g.x >= box.x + box.w - D, "USDC の計器が箱に重なる").toBe(
        true,
      );
      expect(Math.abs(g.y - (box.y + 4)), "USDC の計器が箱の上端の高さに無い").toBeLessThanOrEqual(
        D,
      );
    }
  });
});
