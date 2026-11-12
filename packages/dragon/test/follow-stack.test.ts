// @vitest-environment jsdom
/**
 * 縦に組んだ列の図を寄って追う窓 (#3365)。
 *
 * 列の図は、箱を横に並べると箱の名前が読めない枠で、置き場を帯にして札の列の上下に積む (#3351)。
 * 縦に組んだ形が枠より広い時は、縮めずに寄って追う。
 * 段の番号の丸は図の上の見出しの右に在り、どの段でも同じ所に在るため、丸へ寄せ直すと窓が図の上端から動かず、今の段の列が窓の外に出ていた。
 * 寄って追う窓は、段で変わる列へ寄せ、見出しの文 (図の題、段の題、説明) を描かない。段の題と説明は、図の下の段の一覧と部品の帯が出す。
 *
 * 記法は、利用する頁の入札の図 (卓の形で書き、出典の行を外した物) を写した `fixtures/follow-stack-auction.dragon`。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { api } from "./diagram-support";
import { type Diagramish, overflow, place, releasePlaced } from "./follow-support";
import { draw, type Rect } from "./render-support";

/** `mounted` が置いた部品。検査ごとに片付ける */
const players: { destroy(): void }[] = [];

afterEach(() => {
  for (const player of players.splice(0)) player.destroy();
  releasePlaced();
});

const FIXTURE = join(process.cwd(), "packages/dragon/test/fixtures/follow-stack-auction.dragon");

/** 携帯の幅の頁で図を置く枠の幅 (幅 390 の頁から余白を除いた幅) */
const PHONE = 324;

interface StackedLayout {
  width: number;
  arrangement: "row" | "stack";
  lanes: (Rect & { id: string; pool: boolean })[];
  chips: (Rect & { id: string; lane: string; step: number })[];
}

/** 記法を読んだ原本。読めなければ断りの文を名指して落とす */
function auction(): Diagramish {
  const parsed = api("parseNotation")(readFileSync(FIXTURE, "utf8"), { lang: "ja" }) as {
    ok: boolean;
    diagram?: Diagramish;
    errors?: { message: string }[];
  };
  expect(parsed.errors?.map((e) => e.message) ?? [], "入札の図の記法を読めない").toEqual([]);
  return parsed.diagram as Diagramish;
}

/** 枠の幅 `width` で組んだ列の図の置き場所 */
function arranged(diagram: Diagramish, width: number): StackedLayout {
  return draw("renderDiagram")(diagram, { lang: "ja", width }).layout as unknown as StackedLayout;
}

/** 段 `step` (0 から) の出来事が書き換える列の名前 */
function changedLanes(diagram: Diagramish, step: number): Set<string> {
  const steps = diagram.steps as unknown as { events: { box?: string }[] }[];
  return new Set((steps[step]?.events ?? []).flatMap((e) => (e.box === undefined ? [] : [e.box])));
}

const union = (rects: Rect[]): Rect => {
  const x = Math.min(...rects.map((r) => r.x));
  const y = Math.min(...rects.map((r) => r.y));
  return {
    x,
    y,
    w: Math.max(...rects.map((r) => r.x + r.w)) - x,
    h: Math.max(...rects.map((r) => r.y + r.h)) - y,
  };
};

const inside = (x: number, y: number, win: Rect): boolean =>
  x >= win.x && x <= win.x + win.w && y >= win.y && y <= win.y + win.h;

/**
 * 四角 `rect` を窓 `win` が映し切れない長さ。向きごとに、窓より短い四角は全部が窓に入り、窓より長い四角は窓が四角の中に収まれば 0。
 * 縦に組んだ形の置き場の帯は窓より広いため、帯の幅を窓が全部使って映していれば入ったと数える
 */
function unshown(rect: Rect, win: Rect): number {
  const axis = (lo: number, len: number, wlo: number, wlen: number): number =>
    len <= wlen ? Math.max(0, wlo - lo, lo + len - (wlo + wlen)) : Math.max(0, lo - wlo, wlo + wlen - (lo + len));
  return Math.max(axis(rect.x, rect.w, win.x, win.w), axis(rect.y, rect.h, win.y, win.h));
}

/** 枠の幅 `width` に、見せ方を書かずに置いた図の SVG */
function mounted(diagram: Diagramish, width: number): SVGSVGElement {
  const host = document.createElement("div");
  Object.defineProperty(host, "clientWidth", { value: width });
  document.body.appendChild(host);
  players.push(draw("mountDiagram")(host, structuredClone(diagram)));
  const svg = host.querySelector<SVGSVGElement>('svg[data-dragon="figure"]');
  expect(svg, `枠の幅 ${width}px に図が無い`).not.toBeNull();
  return svg as SVGSVGElement;
}

/** 見出しの文 (図の題、段の題、説明) の部品の数 */
const headingParts = (svg: SVGSVGElement): number =>
  svg.querySelectorAll(".dg-ln-ft, [data-lineup-headline], .dg-ln-hd, .dg-ln-say").length;

describe("縦に組んだ列の図を寄って追う窓 (#3365)", () => {
  it("follow-stack-window-shows-changed-lane", () => {
    const diagram = auction();
    const placed = place("入札の図", diagram, PHONE);
    expect(placed.figure.getAttribute("data-lineup-arrangement"), "幅 324 の枠で縦に組まない").toBe("stack");
    const layout = arranged(diagram, PHONE);
    for (let step = 0; step < placed.steps; step++) {
      const win = placed.windowAt(step);
      const lanes = layout.lanes.filter((l) => changedLanes(diagram, step).has(l.id));
      expect(lanes.length, `段 ${step + 1} で変わる列が図に無い`).toBeGreaterThan(0);
      // 変わる列を全部囲んだ所の高さが窓に収まる段は、変わる列の真ん中が全部窓に入る。
      // 収まらない段は、真ん中が窓に入る列が少なくとも 1 本在る。携帯の幅のボードは帯を上から積むので (#3624)、
      // 入札の図の段 2 で変わる 3 本の帯は、高さ 320 の窓に全部は入らない
      const centered = lanes.filter((lane) => inside(lane.x + lane.w / 2, lane.y + lane.h / 2, win)).map((lane) => lane.id);
      const where = `段 ${step + 1} の窓 (${Math.round(win.x)}, ${Math.round(win.y)}) に真ん中が入る列`;
      if (union(lanes).h <= win.h) expect(centered, where).toEqual(lanes.map((lane) => lane.id));
      else expect(centered.length, where).toBeGreaterThan(0);
      // 変わる列を全部囲んだ所を、窓が映せるだけ映す
      expect(
        Math.round(unshown(union(lanes), win)),
        `段 ${step + 1} で変わる列 (${lanes.map((l) => l.id).join("、")}) を窓が映し切れない長さ`,
      ).toBe(0);
    }
    // 最初の段の窓に、メモリプールの列と自分のチップが入る
    const first = placed.windowAt(0);
    const pool = layout.lanes.find((l) => l.id === "メモリプール");
    const mine = layout.chips.find((c) => c.id === "自分" && c.step === 0);
    expect(pool, "メモリプールの列が無い").toBeDefined();
    expect(mine, "段 1 に自分のチップが無い").toBeDefined();
    expect(Math.round(unshown(pool as Rect, first)), "段 1 の窓がメモリプールの列を映し切れない長さ").toBe(0);
    // 携帯の幅のボードの札は帯の幅いっぱいに 2 枚ずつ並ぶので (#3624)、帯が窓より広い分だけ、札も左右の端が窓の外に出うる。
    // 縦は全部入り、横は帯が窓からはみ出す幅 (左右の片側) を超えてはみ出さない
    const chip = mine as Rect;
    const lane = pool as Rect;
    expect(Math.round(overflow({ ...chip, x: first.x, w: first.w }, first)), "段 1 の窓から自分のチップが上か下にはみ出す長さ").toBe(0);
    expect(Math.round(overflow({ ...chip, y: first.y, h: first.h }, first)), "段 1 の窓から自分のチップが左か右にはみ出す長さ").toBeLessThanOrEqual(Math.ceil(Math.max(0, (lane.w - first.w) / 2)));
  });

  it("follow-lineup-hides-heading", () => {
    const diagram = auction();
    // 全体の見せ方は見出しを描く (見出しの部品を名指す選び方が正しいことの対照)
    expect(headingParts(mounted(diagram, 880)), "幅 880 の全体の見せ方に見出しの文が無い").toBeGreaterThan(0);
    // 縦に組んだ形と横に並べた形のどちらを寄って追っても、窓は見出しの文を描かない
    for (const width of [PHONE, 700]) {
      const placed = place("入札の図", diagram, width);
      expect(
        headingParts(placed.figure),
        `幅 ${width}px の寄って追う窓 (${placed.figure.getAttribute("data-lineup-arrangement")}) の見出しの文の部品の数`,
      ).toBe(0);
    }
  });

  it("follow-stack-keeps-size", () => {
    const diagram = auction();
    const placed = place("入札の図", diagram, PHONE);
    const layout = arranged(diagram, PHONE);
    expect(layout.arrangement, "幅 324 の枠で縦に組まない").toBe("stack");
    // 縦に組んだ形は枠より広く、全体を出すと縮む。寄って追う窓は縮めずに描いた大きさで出す
    expect(layout.width, "縦に組んだ形の幅").toBeGreaterThan(PHONE);
    const [, , vw, vh] = (placed.figure.getAttribute("viewBox") ?? "").split(" ").map(Number);
    expect(Number(placed.figure.getAttribute("width")), "SVG の幅と描いた幅").toBe(vw);
    expect(Number(placed.figure.getAttribute("height")), "SVG の高さと描いた高さ").toBe(vh);
    expect(vw, "寄って追う図の幅").toBeLessThanOrEqual(PHONE);
    for (const lane of layout.lanes)
      expect(
        placed.figure.querySelector(`[data-lineup-lane="${lane.id}"]`),
        `寄って追う窓に ${lane.id} の列が無い`,
      ).not.toBeNull();
  });

  it("follow-stack-wide-stays-row", () => {
    const diagram = auction();
    const svg = mounted(diagram, 880);
    expect(svg.getAttribute("data-view"), "幅 880 の枠の見せ方").toBe("fixed");
    expect(svg.getAttribute("data-lineup-arrangement"), "幅 880 の枠の並べ方").toBe("row");
  });
});
