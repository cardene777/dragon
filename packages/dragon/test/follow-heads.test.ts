// @vitest-environment jsdom
/**
 * 寄って追う時系列図で、頭の箱の列を窓の上端に貼る (#3118)。
 *
 * 頭の箱は図の上端に、段の線は図の下の方に在り、窓に両方は入らない。頭の箱の字の書き換えが窓の外で起き、見えなかった。
 * 頭の列を窓の上端に貼り、窓が横に動く時だけ一緒に動かす。線は頭の列の下の残りの高さで真ん中に見せる。
 * 頭の列は窓を切り抜く部品の中の `.dg-hd` で、地の四角 `.dg-hd-bg` の高さが頭の列の高さ、横に動かす部品が `.dg-hd > .dg-a`。
 * 頭の列の頭の箱は、アイコンを外した名前と下の字の 2 段にして、線を見せる高さを広げる (#3120)。
 * 窓の横の全体図の四角は、頭の列の下の線を見せる所だけを囲む (#3122)。
 */
import { afterEach, describe, expect, it } from "vitest";
import { exampleJson } from "./diagram-support";
import { type Diagramish, overflow, place, type Placed, releasePlaced, round } from "./follow-support";
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
 * 頭の列の下の残りの高さで線を真ん中に見せる位置で、頭の列の高さの半分 (28px) だけ上に寄り、
 * 図の頭の箱の下 (図の上から 96px) から線を見せ始める位置と、図の下端で止まる。
 * 2 段の頭の列を貼る試しの形 (#3120) で、枠の幅ごとに測った `[段, x, y]`
 */
const UNDER: Record<number, [number, number, number][]> = {
  390: [
    [1, 0, 40],
    [2, 99.5, 40],
    [3, 35, 77],
    [4, 36.5, 197],
    [5, 36.5, 317],
    [6, 103.55, 409],
    [7, 115, 458],
    [8, 252, 522],
    [10, 185.75, 635],
  ],
  560: [
    [1, 0, 40],
    [2, 82.89, 40],
    [3, 18.39, 40],
    [4, 19.89, 147],
    [5, 19.89, 267],
    [6, 86.95, 359],
    [7, 98.39, 408],
    [8, 235.39, 472],
    [10, 169.14, 585],
  ],
};
/** 頭の列の高さと、頭の列の頭の箱の高さ (#3120) */
const STRIP_H = 56;
const HEAD_H = 40;
/** 枠の幅ごとの、頭の列の下の線を見せる高さ (#3120) */
const LINE_ROOM: Record<number, number> = { 390: 264, 560: 364 };

/**
 * 段 4 で線を 6 本引く時系列図。段 4 の線と札の並び (312px) は、頭の列の下の残りの高さ (224px) より高く、窓の高さ (320px) より低い。
 * 丸を窓に入れるかを窓の高さ全部で見ると、段 4 の丸が頭の列に隠れる
 */
const send = (from: string, to: string, label: string): Diagramish => ({ type: "edge", from, to, label, carry: { kind: "envelope" } });
const TALL: Diagramish = {
  version: 1,
  kind: "sequence",
  title: "1 段で線を 6 本引く",
  boxes: [
    { id: "A", name: "受け付け", color: "blue" },
    { id: "B", name: "仲立ち", color: "violet" },
    { id: "C", name: "台帳", color: "green" },
  ],
  steps: [
    { title: "頼む", body: "受け付けが仲立ちに頼む。", events: [send("A", "B", "頼む")] },
    { title: "記す", body: "仲立ちが台帳に記す。", events: [send("B", "C", "記す")] },
    { title: "返す", body: "台帳が受け付けに返す。", events: [send("C", "A", "返す")] },
    {
      title: "まとめて送る",
      body: "受け付けと仲立ちと台帳が 6 件をまとめて送り合う。",
      events: [send("A", "B", "1 件目"), send("B", "C", "2 件目"), send("C", "B", "3 件目"), send("B", "A", "4 件目"), send("A", "B", "5 件目"), send("B", "C", "6 件目")],
    },
    { title: "確かめる", body: "台帳が仲立ちに確かめる。", events: [send("C", "B", "確かめる")] },
    { title: "終える", body: "仲立ちが受け付けに終わりを返す。", events: [send("B", "A", "終える")] },
  ],
  sequence: { lifelines: ["A", "B", "C"] },
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
        // 頭の列の箱は、図の頭の箱と同じ並びで描く。頭の列で描いた箱の四角を読む (図の頭の箱と高さが違う、#3120)
        const k = p.layout.boxes.findIndex((b) => b.id === id);
        const card = strip.mover.querySelectorAll("rect.dg-st")[k];
        expect(card, `枠の幅 ${width}px の頭の列に ${id} の箱が無い`).toBeDefined();
        const texts = [...strip.el.querySelectorAll("text")].filter((x) => x.textContent === word);
        expect(texts.length, `枠の幅 ${width}px の頭の列に「${word}」が無い`).toBeGreaterThan(0);
        const shown = Math.max(...texts.map((x) => p.opacity(x, t)));
        if (shown < 0.9) out.push(`枠の幅 ${width}px / 段 ${s + 1} の「${word}」の濃さが ${round(shown)}`);
        // 頭の列の中の箱の、窓の上での四角。窓の枠の内側で、頭の列の高さに収まる
        const n = (attr: string): number => Number(card?.getAttribute(attr));
        const at = { x: n("x") + sx, y: n("y") + sy, w: n("width"), h: n("height") };
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
    for (const [name, source] of [
      ["oauth", "oauth.json"],
      ["線を 6 本引く段", TALL],
    ] as const) {
      for (const width of WIDTHS) {
        const p = place(name, source, width);
        const strip = stripOf(p);
        for (let s = 0; s < p.steps; s++) {
          const b = p.badgeAt(s);
          const win = p.windowAt(s);
          const under = { x: win.x, y: win.y + strip.h, w: win.w, h: win.h - strip.h };
          const over = overflow({ x: b.x - b.r, y: b.y - b.r, w: b.r * 2, h: b.r * 2 }, under);
          if (over > 0.01) out.push(`${name} / 枠の幅 ${width}px / 段 ${s + 1} の丸が頭の列より下の窓から ${round(over)}px 外れる`);
        }
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

  it("follow-heads-two-rows", () => {
    for (const width of WIDTHS) {
      const p = place("oauth", "oauth.json", width);
      const strip = stripOf(p);
      expect(strip.h, `枠の幅 ${width}px の頭の列の高さ`).toBe(STRIP_H);
      // 頭の箱はアイコンの地 (.dg-ic) も絵 (.dg-gl) も持たず、名前と下の字の 2 段
      expect(strip.el.querySelectorAll(".dg-ic, .dg-gl").length, `枠の幅 ${width}px の頭の列のアイコン`).toBe(0);
      const cards = [...strip.mover.querySelectorAll("rect.dg-st")];
      expect(cards.length, `枠の幅 ${width}px の頭の列の箱の数`).toBe(p.layout.boxes.length);
      expect(
        cards.map((c) => Number(c.getAttribute("height"))),
        `枠の幅 ${width}px の頭の列の箱の高さ`,
      ).toEqual(p.layout.boxes.map(() => HEAD_H));
      for (const c of cards) {
        const y = Number(c.getAttribute("y"));
        expect(y >= 0 && y + HEAD_H <= STRIP_H, `枠の幅 ${width}px の頭の列の箱 (y ${y}) が頭の列からはみ出す`).toBe(true);
      }
      // 箱ごとに、名前の基準線が下の字より上に在り、どちらも箱の中に在る
      for (const group of strip.mover.querySelectorAll(":scope > g")) {
        const y = Number(group.querySelector("rect.dg-st")?.getAttribute("y"));
        const name = group.querySelector("text.dg-sn");
        const subs = [...group.querySelectorAll('text[class^="dg-ss"]')].map((x) => Number(x.getAttribute("y")));
        const ny = Number(name?.getAttribute("y"));
        const inside = (v: number): boolean => v > y && v <= y + HEAD_H;
        expect(subs.length, `枠の幅 ${width}px の頭の列の「${name?.textContent}」に下の字が無い`).toBeGreaterThan(0);
        expect(inside(ny) && subs.every((v) => inside(v) && v > ny), `枠の幅 ${width}px の頭の列の「${name?.textContent}」の字 (名前 ${ny}、下の字 ${subs.join(", ")}) が箱 (${y} から ${y + HEAD_H}) の中に 2 段で並ばない`).toBe(true);
      }
    }
  });

  it("follow-heads-leave-line-room", () => {
    for (const width of WIDTHS) {
      const p = place("oauth", "oauth.json", width);
      const strip = stripOf(p);
      expect(p.windowAt(0).h - strip.h, `枠の幅 ${width}px の頭の列の下の線を見せる高さ`).toBe(LINE_ROOM[width]);
    }
  });

  it("follow-heads-cover-figure-heads", () => {
    const out: string[] = [];
    for (const width of WIDTHS) {
      const p = place("oauth", "oauth.json", width);
      const strip = stripOf(p);
      for (let s = 0; s < p.steps; s++) {
        const win = p.windowAt(s);
        for (const box of p.layout.boxes) {
          // 図の頭の箱の下端が、頭の列の下端より上に在れば、頭の列の地に隠れるか窓の上に出る
          const shown = box.y + box.h - (win.y + strip.h);
          if (shown > 0.01) out.push(`枠の幅 ${width}px / 段 ${s + 1} の図の ${box.id} の頭の箱が頭の列の下に ${round(shown)}px 見える`);
        }
      }
    }
    expect(out, "図の頭の箱が頭の列より下の窓に見える段").toEqual([]);
  });

  it("fixed-view-cards-match-layout", () => {
    // 箱の縁を描く部分は頭の列の箱と共に使う (#3120)。止めて見せる図の箱の縁は、置き場所の箱と同じ四角に在る
    for (const file of ["oauth.json", "ccip.json"]) {
      const { svg, layout } = draw("renderDiagram")(exampleJson(file));
      const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
      const cards = [...doc.querySelectorAll("rect.dg-st")].map((c) => ["x", "y", "width", "height"].map((a) => Number(c.getAttribute(a))));
      expect(cards, `${file} の止めて見せる図の箱の縁`).toEqual(layout.boxes.map((b) => [b.x, b.y, b.w, b.h].map(round)));
    }
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

/** 全体図を出す枠の幅。440px より狭い枠では縦長の全体図を出さない */
const MAP_WIDTHS = [560, 1000] as const;

/** 全体図の四角を、図の上の四角に直す。四角は全体図の倍率で縮め、窓と同じ時刻に動かして描く */
function overviewBoxAt(p: Placed, step: number): { x: number; y: number; w: number; h: number } {
  const vp = p.figure.querySelector(".dg-mm-vp");
  const world = p.figure.querySelector(".dg-mm-world");
  expect(vp, `${p.name} / 枠の幅 ${p.width}px の全体図に四角が無い`).not.toBeNull();
  expect(world, `${p.name} / 枠の幅 ${p.width}px の全体図に図の地が無い`).not.toBeNull();
  const n = (el: Element | null, name: string): number => Number(el?.getAttribute(name) ?? 0);
  const k = n(world, "width") / p.layout.width;
  const [tx = 0, ty = 0] = p.value(vp as Element, "transform", p.stillAt(step)) ?? [];
  return {
    x: round((tx + n(vp, "x") - n(world, "x")) / k),
    y: round((ty + n(vp, "y") - n(world, "y")) / k),
    w: round(n(vp, "width") / k),
    h: round(n(vp, "height") / k),
  };
}

describe("寄って追う図の全体図の四角が、窓に見えている所を囲む (#3122)", () => {
  it("overview-frames-line-region", () => {
    // 頭の箱は窓の上の頭の列に常に出ているので、四角は頭の列の下の線を見せる所だけを囲む
    const out: string[] = [];
    for (const width of MAP_WIDTHS) {
      const p = place("oauth", "oauth.json", width);
      for (let s = 0; s < p.steps; s++) {
        const win = p.windowAt(s);
        const want = { x: round(win.x), y: round(win.y + STRIP_H), w: round(win.w), h: round(win.h - STRIP_H) };
        const got = overviewBoxAt(p, s);
        const off = Math.max(...(["x", "y", "w", "h"] as const).map((key) => Math.abs(got[key] - want[key])));
        if (off > 0.5) out.push(`枠の幅 ${width}px / 段 ${s + 1} の全体図の四角 ${JSON.stringify(got)} が、線を見せる所 ${JSON.stringify(want)} と違う`);
      }
    }
    expect(out, "全体図の四角が頭の列の下の線を見せる所を囲まない段").toEqual([]);
  });

  it("overview-clears-head-bars", () => {
    const out: string[] = [];
    for (const width of MAP_WIDTHS) {
      const p = place("oauth", "oauth.json", width);
      const bars = [...p.figure.querySelectorAll(".dg-mm-card")].map((c) => [Number(c.getAttribute("y")), Number(c.getAttribute("y")) + Number(c.getAttribute("height"))]);
      expect(bars.length, `枠の幅 ${width}px の全体図に頭の箱の帯が無い`).toBe(p.layout.boxes.length);
      const top = Math.min(...bars.map(([a]) => a as number));
      const bottom = Math.max(...bars.map(([, b]) => b as number));
      const vp = p.figure.querySelector(".dg-mm-vp") as Element;
      for (let s = 0; s < p.steps; s++) {
        const [, ty = 0] = p.value(vp, "transform", p.stillAt(s)) ?? [];
        const y1 = ty + Number(vp.getAttribute("y") ?? 0);
        const y2 = y1 + Number(vp.getAttribute("height"));
        for (const y of [y1, y2]) {
          if (y > top + 0.01 && y < bottom - 0.01) out.push(`枠の幅 ${width}px / 段 ${s + 1} の全体図の四角の線 (y ${round(y)}) が頭の箱の帯 (y ${round(top)} から ${round(bottom)}) を横切る`);
        }
      }
    }
    expect(out, "全体図の四角の線が頭の箱の帯を横切る段").toEqual([]);
  });

  it("overview-architecture-frames-window", () => {
    // 構成図は頭の列を持たないので、四角は窓の全体を囲む
    const out: string[] = [];
    for (const width of MAP_WIDTHS) {
      const p = place("ccip", "ccip.json", width);
      expect(p.figure.querySelector(".dg-hd"), `ccip / 枠の幅 ${width}px に頭の列が在る`).toBeNull();
      for (let s = 0; s < p.steps; s++) {
        const win = p.windowAt(s);
        const want = { x: round(win.x), y: round(win.y), w: round(win.w), h: round(win.h) };
        const got = overviewBoxAt(p, s);
        const off = Math.max(...(["x", "y", "w", "h"] as const).map((key) => Math.abs(got[key] - want[key])));
        if (off > 0.5) out.push(`枠の幅 ${width}px / 段 ${s + 1} の全体図の四角 ${JSON.stringify(got)} が、窓 ${JSON.stringify(want)} と違う`);
      }
    }
    expect(out, "構成図の全体図の四角が窓の全体を囲まない段").toEqual([]);
  });
});
