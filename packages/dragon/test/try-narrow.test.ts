// @vitest-environment jsdom
/**
 * 狭い枠の試す図 (#3366)。
 *
 * 試す図は網と待ち行列とブロックの鎖を上から積み、ブロックの鎖はブロック 3 つを横に並べるため、図の幅が 740px ある。
 * 携帯の幅の枠 (324px) に縮めると字が 5.7px になり、寄って追うの窓では網と作ったブロックが同時に見えない。
 * 狭い枠では縮めずに全体で描く並べ方を足す。網はノードを枠の幅に詰め、待ち行列は枠の幅いっぱいに置き、ブロックは上から縦に積む。
 * 見た目の元は `docs/design/interactive/tx-block-narrow.pen` の案A (本人が選んだ、全てのブロックを縦に積む形)。
 * 置き場所は描く部品が返す値 (`layout`) で確かめ、見せ方と描き直しは置いた部品の SVG で確かめる。
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { textWidth } from "../src/layout/measure";
import { TYPE } from "../src/look/values";
import { TRY_LOOK } from "../src/look/try";
import type { Json } from "./diagram-support";
import { draw, type Rendered } from "./render-support";
import { mountTry, parsedTry, press, releaseTry, send, sessionOf } from "./try-support";

afterEach(releaseTry);

/** 携帯の幅の頁で図を置く枠の幅 (幅 390 の頁から余白を除いた幅) */
const PHONE = 324;
/** 字が読める大きさの下限 (`READABLE_PX`) */
const READABLE = 10.5;
const CHAIN = "機械の列";

/** 見本 `tx-block.dragon` を読んだ原本 */
const example = (): Json =>
  parsedTry(readFileSync(join(process.cwd(), "packages/dragon/examples/tx-block.dragon"), "utf8"));

interface Narrow {
  width: number;
  height: number;
  routes: { nodes: { id: string; x: number; y: number }[] }[];
  chains: { id: string; w: number; h: number }[];
  moments: { blocks: Record<string, [number, number] | null> }[];
}

/** 枠の幅 `width` で描いた図 */
const rendered = (diagram: unknown, width?: number): Rendered =>
  draw("renderDiagram")(diagram, { lang: "ja", ...(width === undefined ? {} : { width }) });

const layoutOf = (r: Rendered): Narrow => r.layout as unknown as Narrow;

/** 最後の出来事の後に出ているブロックの番号と左上 */
function shownBlocks(layout: Narrow): { n: number; x: number; y: number }[] {
  const last = layout.moments[layout.moments.length - 1];
  return Object.entries(last?.blocks ?? {}).flatMap(([key, at]) =>
    at === null || !key.startsWith(`${CHAIN}/`) ? [] : [{ n: Number(key.slice(CHAIN.length + 1)), x: at[0], y: at[1] }],
  ).sort((a, b) => a.n - b.n);
}

/** 置いた図の SVG */
const figureOf = (host: HTMLElement): SVGSVGElement | null => host.querySelector<SVGSVGElement>('svg[data-dragon="figure"]');

/** SVG の描いた幅 (`viewBox` の幅) */
const drawnWidth = (svg: SVGSVGElement | null): number => Number((svg?.getAttribute("viewBox") ?? "").split(" ")[2]);

describe("狭い枠の試す図 (#3366)", () => {
  it("try-narrow-fixed-readable", () => {
    const r = rendered(example(), PHONE);
    const view = draw("chooseView")(r, PHONE);
    expect(view.mode, "枠324pxの見せ方").toBe("fixed");
    expect(view.textPx, "枠324pxに収めた箱の名前の字の大きさ").toBeGreaterThanOrEqual(READABLE);
    const { host } = mountTry(example(), PHONE);
    expect(figureOf(host)?.getAttribute("data-view"), "枠324pxに置いた部品の見せ方").toBe("fixed");
  });

  it("try-narrow-stacks-blocks", () => {
    const layout = layoutOf(rendered(example(), PHONE));
    const chain = layout.chains.find((c) => c.id === CHAIN);
    expect(chain, "機械の列の置き場所が無い").toBeDefined();
    const blocks = shownBlocks(layout);
    const one = blocks.find((b) => b.n === 1);
    const two = blocks.find((b) => b.n === 2);
    expect(one && two, "最後の段にブロック 1 と 2 が出ていない").toBeTruthy();
    if (!one || !two || !chain) return;
    expect(two.y, "ブロック 2 の上の端がブロック 1 の下の端より下に無い").toBeGreaterThanOrEqual(one.y + chain.h);
    expect(Math.abs(two.x - one.x), "ブロック 2 とブロック 1 の左の端のずれ").toBeLessThan(1);
    for (const b of blocks)
      expect(b.x + chain.w, `ブロック ${b.n} の右の端が枠324pxからはみ出す`).toBeLessThanOrEqual(PHONE);
  });

  it("try-narrow-route-fits", () => {
    const r = rendered(example(), PHONE);
    const layout = layoutOf(r);
    expect(layout.width, "枠324pxで描いた図の幅").toBeLessThanOrEqual(PHONE);
    const nodes = layout.routes.flatMap((route) => route.nodes);
    expect(nodes.length, "網のノードの数").toBe(7);
    const radius = TRY_LOOK.route.r;
    for (const node of nodes) {
      expect(node.x - radius, `ノード ${node.id} の丸の左の端`).toBeGreaterThanOrEqual(0);
      expect(node.x + radius, `ノード ${node.id} の丸の右の端`).toBeLessThanOrEqual(PHONE);
      const half = textWidth(node.id, TYPE.tryNode) / 2;
      expect(node.x - half, `ノード ${node.id} の名前の左の端`).toBeGreaterThanOrEqual(0);
      expect(node.x + half, `ノード ${node.id} の名前の右の端`).toBeLessThanOrEqual(PHONE);
    }
    expect((r as unknown as { overlaps?: unknown[] }).overlaps ?? [], "枠324pxで描いた図の字の重なり").toEqual([]);
  });

  it("try-narrow-new-block-fits", () => {
    const { host, player } = mountTry(example(), PHONE);
    send(host, { 送り手: "Dan", 宛先: "Bob", 量: "4", 手数料: "11" });
    press(host, "ブロックを作る");
    const svg = figureOf(host);
    expect(svg?.getAttribute("data-view"), "作った後の部品の見せ方").toBe("fixed");
    expect(drawnWidth(svg), "作った後に描き直した図の幅").toBeLessThanOrEqual(PHONE);
    const layout = layoutOf(rendered(sessionOf(player), PHONE));
    const chain = layout.chains.find((c) => c.id === CHAIN);
    const blocks = shownBlocks(layout);
    const made = blocks.at(-1);
    expect(made?.n, "作ったブロックの番号").toBe(4);
    if (!made || !chain) return;
    expect(made.x, "作ったブロックの左の端").toBeGreaterThanOrEqual(0);
    expect(made.x + chain.w, "作ったブロックの右の端").toBeLessThanOrEqual(PHONE);
    expect(made.y + chain.h, "作ったブロックの下の端").toBeLessThanOrEqual(layout.height);
  });

  it("try-wide-keeps-layout", () => {
    const wide = rendered(example(), 880);
    const plain = rendered(example());
    expect(JSON.stringify(wide.layout), "枠880pxの置き場所が枠の幅を渡さない時と違う").toBe(JSON.stringify(plain.layout));
    const blocks = shownBlocks(layoutOf(wide));
    const [one, two, three] = blocks;
    expect(blocks.length, "最後の段に出ているブロックの数").toBe(3);
    expect(two?.y, "ブロック 2 とブロック 1 の上の端が揃わない").toBe(one?.y);
    expect(three?.x ?? 0, "ブロック 3 がブロック 2 の右に無い").toBeGreaterThan(two?.x ?? 0);
    expect(draw("chooseView")(wide, 880).mode, "枠880pxの見せ方").toBe("fixed");
    const { host } = mountTry(example(), 880);
    expect(figureOf(host)?.getAttribute("data-view"), "枠880pxに置いた部品の見せ方").toBe("fixed");
  });
});
