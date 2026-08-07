import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";

/**
 * 中括弧に書いた読めない項目名を知らせることの検証 (#1090)。
 *
 * 縦に並べた形は既に知らせていた。 中括弧の形だけが黙って捨てており、 同じ意味を書いても
 * 書き方によって知らされたりされなかったりした。
 *
 * 実測 = 見本「プロジェクト構想」 は `- root: { title: "新プロジェクト" }` と書かれており、
 * 5 つの箱すべてで題が捨てられて識別子 (`root` 等) が出ていた。 知らせも出ないため、 書いた人
 * には「書いたのに図が変わらない」 としか見えない。
 */

const 解析 = (actors: string) =>
  parseTextDslV05(`title: "t"\ntype: flow\n\nactors:\n${actors}\n`);

/** 読めない項目名の知らせだけを取り出す。 誤りが 0 件なら空 (`ok: true` で `errors` を持たない) */
const 読めない項目 = (r: ReturnType<typeof parseTextDslV05>): string[] =>
  r.ok ? [] : r.errors.filter((e) => e.message.includes("項目名が読めません")).map((e) => e.message);

/** 行番号つきで取り出す。 知らせが 0 件なら `undefined` */
const 最初の知らせ = (r: ReturnType<typeof parseTextDslV05>) =>
  r.ok ? undefined : r.errors.find((x) => x.message.includes("項目名が読めません"));

describe("中括弧に書いた読めない項目名を知らせる (#1090)", () => {
  it("読めない項目名で知らせが出る", () => {
    const r = 解析(`  - A: { title: "あ" }`);
    expect(読めない項目(r)).toEqual([`項目名が読めません: "title"`]);
  });

  it("読める項目名では知らせが出ない", () => {
    const r = 解析(`  - A: { subtitle: "あ", kind: storage, stack: 1 }`);
    expect(読めない項目(r)).toEqual([]);
  });

  it("読める項目と読めない項目が混ざっていたら読めない方だけ知らせる", () => {
    const r = 解析(`  - A: { subtitle: "あ", title: "い" }`);
    expect(読めない項目(r)).toEqual([`項目名が読めません: "title"`]);
  });

  it("読めない項目が複数あれば全部知らせる", () => {
    // 1 件だけ知らせると、 直した後に次の 1 件が出る形になり手戻りが増える
    const r = 解析(`  - A: { title: "あ", label: "い" }`);
    expect(読めない項目(r)).toHaveLength(2);
  });

  it("知らせに行番号が入る", () => {
    const r = 解析(`  - A\n  - B: { title: "あ" }`);
    expect(最初の知らせ(r)?.line, "行番号が違う").toBe(6);
  });

  it("パーツでは知らせない", () => {
    // 中括弧に書いた名前はパーツの状態の上書きとして意味を持つ。 知らせると正しい記法が
    // 警告だらけになる
    const r = 解析(`  - arc1: { kind: arc-gauge, v: 50, foo: 1 }`);
    expect(読めない項目(r)).toEqual([]);
  });

  it("倍率は 1 度しか知らせない", () => {
    // 倍率は別経路 (`reportScaleOnNonPart`) が知らせる。 中括弧側でも読めない扱いにすると
    // 同じ名前で 2 度知らせることになる
    const r = 解析(`  - A: { scale: 2 }`);
    expect(読めない項目(r)).toHaveLength(1);
  });

  it("縦に並べた形の知らせは今までどおり出る", () => {
    const r = parseTextDslV05(`title: "t"\ntype: flow\n\nactors:\n  - A:\n      title: "あ"\n  - B\n`);
    expect(読めない項目(r)).toEqual([`項目名が読めません: "title"`]);
  });
});

describe("中括弧では日本語の項目名が読めない (#1090 で判明)", () => {
  // 実測 = 中括弧の形は日本語の項目名 7 種すべてを読まず、 英字の名前だけが効いていた
  // (`行` / `補足` / `種類` / `値` / `色` / `位置` / `大きさ`)。 縦に並べた形では読める。
  //
  // 読めるようにするのは別の変更。 ここでは **黙って捨てない** ことを固定する = 書いた人が
  // 英字で書き直せると分かる状態にする。
  for (const key of ["行", "補足", "種類", "値", "色", "位置", "大きさ"]) {
    it(`${key} を中括弧に書くと知らせが出る`, () => {
      const r = 解析(`  - A: { ${key}: "x" }`);
      expect(読めない項目(r)).toEqual([`項目名が読めません: "${key}"`]);
    });
  }

  it("同じ意味の英字の名前では知らせが出ない", () => {
    const r = 解析(`  - A: { rows: ["x: 1"], subtitle: "あ", kind: storage, value: "9", tone: success }`);
    expect(読めない項目(r)).toEqual([]);
  });
});
