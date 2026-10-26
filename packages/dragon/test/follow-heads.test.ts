// @vitest-environment jsdom
/**
 * 寄って追う時系列図で、頭の箱の列を窓の上端に貼る (#3118)。
 *
 * 頭の箱は図の上端に、段の線は図の下の方に在り、窓に両方は入らない。頭の箱の字の書き換えが窓の外で起き、見えなかった。
 * 頭の列を窓の上端に貼り、窓が横に動く時だけ一緒に動かす。線は頭の列の下の残りの高さで真ん中に見せる。
 * 頭の列は窓を切り抜く部品の中の `.dg-hd` で、地の四角 `.dg-hd-bg` の高さが頭の列の高さ、横に動かす部品が `.dg-hd > .dg-a`。
 */
import { afterEach, describe, expect, it } from "vitest";
import { exampleJson } from "./diagram-support";
import { overflow, place, type Placed, releasePlaced, round } from "./follow-support";
import { draw } from "./render-support";

/** 編集画面の幅 390px (携帯) と 860px (記法と並べた時) の、図の枠の幅 */
const WIDTHS = [390, 560] as const;
/** oauth で頭の字が書き換わる段 (0 から数える) と、書き換わる箱と、書き換わった字 */
const SWAPS: [number, string, string][] = [
  [8, "アプリ", "トークンを持つ"],
  [10, "API", "データを返した"],
  [11, "ブラウザ", "ログイン済み"],
];
/**
 * oauth の頭の字が書き換わらない段で、窓が止まる左上 (図の上の位置)。
 * 頭の列の下の残りの高さで線を真ん中に見せる位置で、頭の列を貼る前より頭の列の高さの半分 (48px) 上に在り、図の上端と下端で止まる。
 * 頭の列を貼る試しの形で、枠の幅ごとに測った `[段, x, y]`
 */
const UNDER: Record<number, [number, number, number][]> = {
  390: [
    [1, 0, 0],
    [2, 99.5, 0],
    [3, 35, 57],
    [4, 36.5, 177],
    [5, 36.5, 297],
    [6, 103.55, 389],
    [7, 115, 438],
    [8, 252, 502],
    [10, 185.75, 615],
  ],
  560: [
    [1, 0, 0],
    [2, 82.89, 0],
    [3, 18.39, 7],
    [4, 19.89, 127],
    [5, 19.89, 247],
    [6, 86.95, 339],
    [7, 98.39, 388],
    [8, 235.39, 452],
    [10, 169.14, 565],
  ],
};

afterEach(releasePlaced);

interface Strip {
  el: Element;
  /** 頭の列の高さ */
  h: number;
  /** 頭の列を横に動かす部品 */
  mover: Element;
}

/** 窓の上端に貼った頭の列 */
function stripOf(p: Placed): Strip {
  const el = p.figure.querySelector('g[clip-path^="url(#dg-vp-"] > g.dg-hd');
  expect(el, `${p.name} / 枠の幅 ${p.width}px の窓に頭の列が無い`).not.toBeNull();
  const bg = el?.querySelector(":scope > rect.dg-hd-bg");
  const mover = el?.querySelector(":scope > g.dg-a");
  expect(bg, `${p.name} / 枠の幅 ${p.width}px の頭の列に地が無い`).not.toBeNull();
  expect(mover, `${p.name} / 枠の幅 ${p.width}px の頭の列に横に動かす部品が無い`).not.toBeNull();
  return { el: el as Element, h: Number(bg?.getAttribute("height")), mover: mover as Element };
}

/** 時刻 `t` 秒の頭の列の横と縦のずれ */
function stripShift(p: Placed, strip: Strip, t: number): [number, number] {
  const [x = 0, y = 0] = p.value(strip.mover, "transform", t) ?? [];
  return [x, y];
}

describe("寄って追う時系列図で頭の列を窓の上端に貼る (#3118)", () => {
  it("follow-heads-show-swapped-text", () => {
    const out: string[] = [];
    for (const width of WIDTHS) {
      const p = place("oauth", "oauth.json", width);
      const strip = stripOf(p);
      for (const [s, id, word] of SWAPS) {
        const t = p.stillAt(s);
        const win = p.windowAt(s);
        const [sx, sy] = stripShift(p, strip, t);
        const box = p.layout.boxes.find((b) => b.id === id);
        expect(box, `oauth に ${id} の箱が無い`).toBeDefined();
        const texts = [...strip.el.querySelectorAll("text")].filter((x) => x.textContent === word);
        expect(texts.length, `枠の幅 ${width}px の頭の列に「${word}」が無い`).toBeGreaterThan(0);
        const shown = Math.max(...texts.map((x) => p.opacity(x, t)));
        if (shown < 0.9) out.push(`枠の幅 ${width}px / 段 ${s + 1} の「${word}」の濃さが ${round(shown)}`);
        // 頭の列の中の箱の、窓の上での四角。窓の枠の内側で、頭の列の高さに収まる
        const at = { x: (box?.x ?? 0) + sx, y: (box?.y ?? 0) + sy, w: box?.w ?? 0, h: box?.h ?? 0 };
        const over = overflow(at, { x: 0, y: 0, w: win.w, h: strip.h });
        if (over > 0.01) out.push(`枠の幅 ${width}px / 段 ${s + 1} の ${id} の箱が窓の上端の頭の列から ${round(over)}px 外れる`);
      }
    }
    expect(out, "書き換わった字が窓に見えない段").toEqual([]);
  });

  it("follow-heads-track-window-x", () => {
    const out: string[] = [];
    for (const width of WIDTHS) {
      const p = place("oauth", "oauth.json", width);
      const strip = stripOf(p);
      // 頭の列は、図の頭の箱を全部、図と同じ並びで持つ
      const names = [...strip.el.querySelectorAll("text.dg-sn")].map((x) => x.textContent);
      expect(names, `枠の幅 ${width}px の頭の列の箱の名前`).toEqual(p.layout.boxes.map((b) => b.name));
      for (let s = 0; s < p.steps; s++) {
        const t = p.stillAt(s);
        const win = p.windowAt(s);
        const [sx, sy] = stripShift(p, strip, t);
        if (Math.abs(sx + win.x) > 0.01) out.push(`枠の幅 ${width}px / 段 ${s + 1} の頭の列の横のずれ ${round(sx)} が窓の中身 ${round(-win.x)} と違う`);
        if (Math.abs(sy) > 0.01) out.push(`枠の幅 ${width}px / 段 ${s + 1} の頭の列が縦に ${round(sy)}px 動く`);
      }
    }
    expect(out, "頭の列が窓の中身と同じだけ横に動かない段").toEqual([]);
  });

  it("follow-badge-below-heads", () => {
    const out: string[] = [];
    for (const width of WIDTHS) {
      const p = place("oauth", "oauth.json", width);
      const strip = stripOf(p);
      for (let s = 0; s < p.steps; s++) {
        const b = p.badgeAt(s);
        const win = p.windowAt(s);
        const under = { x: win.x, y: win.y + strip.h, w: win.w, h: win.h - strip.h };
        const over = overflow({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, under);
        if (over > 0.01) out.push(`枠の幅 ${width}px / 段 ${s + 1} の丸が頭の列より下の窓から ${round(over)}px 外れる`);
      }
    }
    expect(out, "番号の丸が頭の列に隠れるか窓から外れる段").toEqual([]);
  });

  it("follow-sequence-window-under-heads", () => {
    const moved: string[] = [];
    for (const width of WIDTHS) {
      const p = place("oauth", "oauth.json", width);
      for (const [step, x, y] of UNDER[width] ?? []) {
        const win = p.windowAt(step - 1);
        if (Math.abs(win.x - x) > 0.01 || Math.abs(win.y - y) > 0.01) moved.push(`枠の幅 ${width}px / 段 ${step} の窓が (${x}, ${y}) でなく (${round(win.x)}, ${round(win.y)})`);
      }
    }
    expect(moved, "頭の字が書き換わらない段の窓の位置").toEqual([]);
  });

  it("fixed-view-has-no-heads-strip", () => {
    for (const file of ["oauth.json", "ccip.json"]) {
      const { svg } = draw("renderDiagram")(exampleJson(file));
      // 部品の見た目の CSS はどの図にも同じ字で入るので、字ではなく部品の有無を見る
      const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
      expect(doc.documentElement.getAttribute("data-view"), `${file} の止めて見せる図`).toBe("fixed");
      expect(doc.querySelector(".dg-hd"), `${file} の止めて見せる図に頭の列が在る`).toBeNull();
    }
  });
});
