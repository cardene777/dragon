// @vitest-environment jsdom
/**
 * 寄って追う図で、今の段の番号の丸を窓に入れる (#3046)。
 *
 * 窓は、その段で動く物を全部囲んだ範囲の真ん中へ寄る。範囲が窓より大きい段では、範囲の端に在る番号の丸が窓から外れていた。
 * 丸が外れる段だけ、丸を起点に、丸に近い動く物から順に窓に収まる間だけ囲み、その真ん中へ寄せる。
 * 窓の置き方の読み方は `follow-support.ts` が持つ。
 */
import { afterEach, describe, expect, it } from "vitest";
import { overflow, place, releasePlaced, round } from "./follow-support";
import type { Rect } from "./render-support";

/** 時系列図と構成図の見本 */
const SAMPLES = [
  ["oauth", "oauth.json"],
  ["ccip", "ccip.json"],
] as const;
/** 編集画面の幅 390px (携帯) と 860px (記法と並べた時) の、図の枠の幅 */
const WIDTHS = [390, 560] as const;
/**
 * 構成図 (ccip) で、寄り方を変える前 (`ba9784a2`) に丸が窓に全部見えていた段と、その時の窓の左上 (図の上の位置)。
 * 丸が外れない段は寄り方を変えないので、この位置のまま残る。枠の幅ごとに `[段, x, y]` を並べる。
 * 段 8 と 9 は、箱 Indexer が絵柄の横に運ぶ物の置き場を持って 5px 広がった図 (#3176) での位置で、動く物を囲んだ範囲の真ん中のまま。
 * 390px の段 10 と 11、560px の段 8 から 12 は、窓が表を除いた図の下端で止まる高さ (#3270)。
 * 時系列図は窓の上端に頭の列を貼り、窓をその下の残りの高さで寄せるので、位置は `follow-heads.test.ts` が持つ (#3118)
 */
const KEPT: Record<number, [number, number, number][]> = {
  390: [
    [1, 119.79, 0],
    [2, 392.58, 0],
    [3, 525.57, 0],
    [4, 648.06, 0],
    [5, 493.57, 0],
    [6, 525.57, 24],
    [7, 525.57, 83],
    [8, 402.2, 142],
    [9, 124.42, 142],
    [10, 9.7, 165],
    [11, 0, 165],
  ],
  560: [
    [1, 34.79, 0],
    [2, 307.58, 0],
    [3, 440.57, 0],
    [4, 496.28, 0],
    [5, 408.57, 0],
    [6, 440.57, 0],
    [7, 440.57, 33],
    [8, 317.2, 65],
    [9, 39.42, 65],
    [10, 0, 65],
    [11, 0, 65],
    [12, 181.04, 65],
  ],
};

afterEach(releasePlaced);

describe("寄って追う図で今の段の番号の丸を窓に入れる (#3046)", () => {
  it("follow-window-shows-step-badge", () => {
    const out: string[] = [];
    for (const [name, file] of SAMPLES) {
      for (const width of WIDTHS) {
        const placed = place(name, file, width);
        for (let s = 0; s < placed.steps; s++) {
          const b = placed.badgeAt(s);
          const over = overflow({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, placed.windowAt(s));
          if (over > 0.01) out.push(`${name} / 枠の幅 ${width}px / 段 ${s + 1} の丸が窓から ${round(over)}px 外れる`);
        }
      }
    }
    expect(out, "番号の丸が窓から外れる段").toEqual([]);
  });

  it("follow-window-keeps-fitting-steps", () => {
    const moved: string[] = [];
    for (const width of WIDTHS) {
      const placed = place("ccip", "ccip.json", width);
      // 構成図には頭の列を貼らない。窓の中身を覆わず、窓の位置も変えない
      expect(placed.figure.querySelector(".dg-hd"), `ccip / 枠の幅 ${width}px に頭の列が在る`).toBeNull();
      for (const [step, x, y] of KEPT[width] ?? []) {
        const win = placed.windowAt(step - 1);
        if (Math.abs(win.x - x) > 0.01 || Math.abs(win.y - y) > 0.01) moved.push(`ccip / 枠の幅 ${width}px / 段 ${step} の窓が (${x}, ${y}) から (${round(win.x)}, ${round(win.y)}) へ動いた`);
      }
    }
    expect(moved, "丸が見えていた段で窓が動いた").toEqual([]);
  });

  it("follow-window-holds-badge-neighbors", () => {
    const out: string[] = [];
    for (const width of WIDTHS) {
      // ccip の段 13 の最初の線は OffRamp から出る。丸はその始まりに在り、OffRamp の箱が丸の隣になる
      const ccip = place("ccip", "ccip.json", width);
      const offRamp = ccip.layout.boxes.find((b) => b.id === "OffRamp");
      expect(offRamp, "ccip に OffRamp の箱が無い").toBeDefined();
      const over = overflow(offRamp as Rect, ccip.windowAt(12));
      if (over > 0.01) out.push(`ccip / 枠の幅 ${width}px / 段 13 の OffRamp の箱が窓から ${round(over)}px 外れる`);
      // oauth の段 9、11、12 は、書き換わる頭の箱が図の上端に、線が図の下の方に在り、両方は窓に入らない。丸の側の線を入れる
      const oauth = place("oauth", "oauth.json", width);
      for (const s of [8, 10, 11]) {
        const win = oauth.windowAt(s);
        const edges = oauth.layout.edges.filter((e) => e.step === s);
        expect(edges.length, `oauth の段 ${s + 1} に線が無い`).toBeGreaterThan(0);
        for (const e of edges) {
          for (const [x, y] of [e.points[0], e.points[e.points.length - 1]] as [number, number][]) {
            const o = overflow({ x, y, w: 0, h: 0 }, win);
            if (o > 0.01) out.push(`oauth / 枠の幅 ${width}px / 段 ${s + 1} の線の端 (${x}, ${y}) が窓から ${round(o)}px 外れる`);
          }
        }
      }
    }
    expect(out, "丸の近くの物が窓から外れる").toEqual([]);
  });
});
