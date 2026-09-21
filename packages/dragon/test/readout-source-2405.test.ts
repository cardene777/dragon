/*
 * 読み取り値 (`readouts:`) が読む元に無い名前を書いた時に知らせる (#2405)。
 *
 * 読み取り値は `source: done` の形で、別の所に書いた値を名前で指す。 指す先は
 * `states:` / `inputs:` / `formulas:` の 3 つ。 **その名前が在るかを誰も見ていなかった**。
 *
 * 直す前は、状態を指す図も、どこにも無い名前を指す図も、大文字小文字を間違えた図も、
 * すべて知らせ 0 件で同じ形のまま描く側へ渡っていた。 描く側は知らない名前を読むと
 * 何も出さないので、書いた人には「部品を置いたのに数字が出ない」 だけが残る。
 *
 * ## 名前を指す欄は `source` だけではない
 *
 * 部品の表 (`readout-table.generated.ts`) の 107 種を数えると、名前を指す欄は 24 種類ある。
 * `source` を持たない種類もあり (`stacked-bar` は `sourceA` / `sourceB` だけ)、
 * `source` だけを見る形にするとその種類が黙ったまま残る。
 *
 * **欄を手で並べない**。 綴りの規則 (`source` / `〜Source` / `sourceA` の形) で決め、
 * 規則から外れた欄が名前を指していないことを別の検査で固定する。
 */
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import type { CompileNotice } from "../src/compile/notice";
import { parseTextDslV05 } from "../src/v05/parser";
import { 部品の表 } from "../src/v05/readout-table.generated";

/** 状態 `v` ・ つまみ `sl` ・ 式 `d` を持つ図。 読み取り値の行だけを差し替えて使う */
const 本文 = (読み取り値の行: string): string => `title: "しらべ"
type: flow

actors:
  - A

states:
  v: 0

inputs:
  sl: { kind: slider, min: 0, max: 10, defaultValue: 5 }

formulas:
  d: "{sl} * 2"

readouts:
  ${読み取り値の行}
`;

type 測った結果 = { 知らせ: CompileNotice[]; 図: string };

function 測る(読み取り値の行: string): 測った結果 {
  const p = parseTextDslV05(本文(読み取り値の行));
  if (!p.ok) throw new Error(`読めません: ${p.errors.map((e) => e.message).join(" / ")}`);
  const 知らせ: CompileNotice[] = [];
  const d = compileToCdl(p.doc, { onNotice: (n) => 知らせ.push(n) });
  return { 知らせ, 図: JSON.stringify(d) };
}

/** 読み取り値の元についての知らせだけを取り出す */
const 元の知らせ = (r: 測った結果): CompileNotice[] =>
  r.知らせ.filter((n) => n.kind === "readout-source-missing");

const 元の文 = (r: 測った結果): string =>
  元の知らせ(r)
    .map((n) => `${n.message} ${n.hint ?? ""}`)
    .join("\n");

describe("読み取り値が読む元を突き合わせる (#2405)", () => {
  it("状態 ・ つまみ ・ 式 の 3 通りは、どれも知らせ 0 件で通る", () => {
    const 弾いた = ["v", "sl", "d"].filter(
      (名) => 元の知らせ(測る(`r: { kind: bar, source: ${名}, min: 0, max: 10 }`)).length > 0,
    );
    expect(弾いた, "正しく書いたのに知らせが出た名前").toEqual([]);
  });

  it("無い名前 ・ 大文字小文字違い ・ 日本語 の 3 通りは、どれも知らせが 1 件出る", () => {
    const 黙った = ["zzz", "V", "待ち"].filter(
      (名) => 元の知らせ(測る(`r: { kind: bar, source: ${名}, min: 0, max: 10 }`)).length === 0,
    );
    expect(黙った, "知らせが 1 件も出なかった名前").toEqual([]);
  });

  it("知らせに部品の名前と、書いた名前と、書ける名前の一覧が入る", () => {
    const s = 元の文(測る("r: { kind: bar, source: zzz, min: 0, max: 10 }"));
    expect(s).toContain("r");
    expect(s).toContain("zzz");
    expect(s).toContain("v");
    expect(s).toContain("sl");
    expect(s).toContain("d");
  });

  it("知らせは書いた行を指す", () => {
    // 読み取り値を 2 行書き、2 行目だけを間違える。
    // **行の番号は手で数えない** = 本文を 1 行足しただけで検査が古くなる。
    // 誤りを書いた行を本文から引いて突き合わせる
    const 行 =
      "ok: { kind: bar, source: v, min: 0, max: 10 }\n  ng: { kind: bar, source: zzz, min: 0, max: 10 }";
    const 正しい行 = 本文(行).split("\n").findIndex((x) => x.includes("zzz")) + 1;
    expect(正しい行, "本文に誤りの行が無い (検査が空振りしている)").toBeGreaterThan(0);
    const n = 元の知らせ(測る(行));
    expect(n).toHaveLength(1);
    expect(n[0]?.line).toBe(正しい行);
  });

  it("`source` 以外の欄も見る", () => {
    // `stacked-bar` は `source` を持たず `sourceA` / `sourceB` だけを持つ。
    // `source` だけを見る形にすると、この種類が丸ごと黙る
    const r = 測る("r: { kind: stacked-bar, sourceA: v, sourceB: zzz, min: 0, max: 10 }");
    expect(元の知らせ(r), "sourceB の誤りを見ていない").toHaveLength(1);
    expect(元の文(r)).toContain("sourceB");
  });

  it("1 つの部品で 2 つの欄が外れたら、2 件とも出る", () => {
    // 片方で打ち切ると、直した次の回にもう片方が初めて出る
    const r = 測る("r: { kind: stacked-bar, sourceA: xxx, sourceB: zzz, min: 0, max: 10 }");
    expect(元の知らせ(r)).toHaveLength(2);
  });

  it("`〜Source` で終わる欄も見る", () => {
    const r = 測る("r: { kind: notification, kindSource: v, titleSource: zzz }");
    expect(元の知らせ(r), "titleSource の誤りを見ていない").toHaveLength(1);
  });
});

describe("欄の綴りの規則が、表の全ての欄を覆っている (#2405)", () => {
  /** 名前を指す欄かどうか。 実装と同じ規則 */
  const 名前を指す = (欄名: string): boolean =>
    欄名 === "source" || 欄名.endsWith("Source") || /^source[A-Z]$/.test(欄名);

  /** 表の全ての欄の名前 (種類をまたいで重複を畳む) */
  const 全ての欄 = (): string[] => {
    const 出た = new Set<string>();
    for (const 定義 of Object.values(部品の表)) for (const 欄 of Object.keys(定義.欄)) 出た.add(欄);
    return [...出た].sort();
  };

  it("走査が空振りしていない", () => {
    expect(Object.keys(部品の表).length, "表が空").toBeGreaterThan(100);
    expect(全ての欄().filter(名前を指す).length, "規則に当たる欄が 0 件").toBeGreaterThan(20);
  });

  it("規則から外れた欄が、1 つ残らず名前を指していない", () => {
    // 名前を指す欄が規則から外れた綴りで足されると、その欄だけが黙ったまま残る。
    // 外れた欄の一覧を固定し、増えた日に人が 1 件ずつ見分ける形にする
    const 外れた = 全ての欄().filter((欄) => !名前を指す(欄));
    expect(外れた).toEqual([
      "canvasH", "canvasW", "caption", "cellGap", "cellSize", "charMs", "color", "colorA",
      "colorAccent", "colorActive", "colorActual", "colorAdd", "colorApplied", "colorB",
      "colorBar", "colorBottom", "colorDel", "colorDiscount", "colorDown", "colorFocus",
      "colorMap", "colorNeg", "colorNew", "colorOld", "colorOther", "colorPending",
      "colorPlay", "colorPos", "colorRead", "colorSelf", "colorStrong", "colorTop",
      "colorTotal", "colorUnread", "colorUp", "colorWeak", "colorWinner", "colors",
      "columnWidth", "count", "currency", "decimals", "duration", "durationMs", "fill",
      "highThreshold", "history", "innerRatio", "itemTemplate", "label", "labelA", "labelB",
      "lowThreshold", "map", "max", "maxSize", "min", "minSize", "monthName", "pathD",
      "prefix", "rMax", "rMin", "rangeAvg", "rangeBad", "segments", "showValue", "size",
      "strokeWidth", "suffix", "unit", "viewH", "viewW", "xMax", "xMin", "yMax", "yMin",
    ]);
  });
});

describe("知らせを足しても組み上がる図は変わらない (#2405)", () => {
  it("無い名前を指した読み取り値も、これまでどおりそのまま載る", () => {
    // 描く側が知らない名前を読んだ時の振る舞いは外部の部品の判断で、ここでは変えない
    const r = 測る("r: { kind: bar, source: zzz, min: 0, max: 10 }");
    expect(r.図).toContain('"source":"zzz"');
  });

  it("書いた行が図に漏れない", () => {
    // 行は知らせのために持つ。 図に混ざると、行を足しただけで図が変わる
    expect(測る("r: { kind: bar, source: v, min: 0, max: 10 }").図).not.toContain('"pos"');
  });
});
