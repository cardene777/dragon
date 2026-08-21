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

const 解析 = (actors: string) => parseTextDslV05(`title: "t"\ntype: flow\n\nactors:\n${actors}\n`);

/** 読めない項目名の知らせだけを取り出す。 誤りが 0 件なら空 (`ok: true` で `errors` を持たない) */
const 読めない項目 = (r: ReturnType<typeof parseTextDslV05>): string[] =>
  r.ok
    ? []
    : r.errors.filter((e) => e.message.includes("項目名が読めません")).map((e) => e.message);

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
    const r = parseTextDslV05(
      `title: "t"\ntype: flow\n\nactors:\n  - A:\n      title: "あ"\n  - B\n`,
    );
    expect(読めない項目(r)).toEqual([`項目名が読めません: "title"`]);
  });
});

describe("中括弧で読める日本語 (#1301 で読めるようにした)", () => {
  // #1090 の時点では日本語 7 種すべてが読めず、知らせだけを出していた (「読めるようにするのは
  // 別の変更」 と書いてあった)。 #1301 が **英語が中括弧で読める欄** の日本語を読めるようにした。
  //
  // `色` / `位置` / `大きさ` は英語側 (`color` / `pos` / `size`) も中括弧では読めないため
  // 対象外 = 英語で出来ないことを日本語で出来るようにはしない (次の describe が固定する)。
  for (const key of ["行", "補足", "種類", "値"]) {
    it(`${key} を中括弧に書いても知らせが出ない`, () => {
      const 値 = key === "行" ? `["x"]` : key === "種類" ? "storage" : `"x"`;
      const r = 解析(`  - A: { ${key}: ${値} }`);
      expect(読めない項目(r)).toEqual([]);
    });
  }

  it("同じ意味の英字の名前では知らせが出ない", () => {
    const r = 解析(
      `  - A: { rows: ["x: 1"], subtitle: "あ", kind: storage, value: "9", tone: success }`,
    );
    expect(読めない項目(r)).toEqual([]);
  });
});

describe("中括弧で読めない日本語 (#1301 で範囲を固定)", () => {
  // 英語側も中括弧では読めない欄。 日本語だけを読めるようにすると、
  // 「英語で出来ないことが日本語で出来る」 という逆の非対称ができる
  for (const key of ["色", "位置", "大きさ"]) {
    it(`${key} を中括弧に書くと知らせが出る`, () => {
      const r = 解析(`  - A: { ${key}: "x" }`);
      expect(読めない項目(r)).toEqual([`項目名が読めません: "${key}"`]);
    });
  }
});

describe("知らせが入力の整形に依存しない (Round 1 review の指摘)", () => {
  // `parseInlineMapping` は値が 1 文字以上ある項目しか拾わない。 その結果を走査していた間、
  // 空白の有無で知らせが消えていた (実測 = `{title:}` と `{ title:}` は黙って通り、
  // `{ title: }` だけ知らせが出た)。 整形だけで診断が消えると、 契約が入力の書き方に依存する
  for (const [name, actor] of [
    ["空白なし", `  - A: {title:}`],
    ["前だけ空白", `  - A: { title:}`],
    ["前後に空白", `  - A: { title: }`],
    ["値あり", `  - A: { title: "あ" }`],
  ] as const) {
    it(`${name} でも知らせが出る`, () => {
      expect(読めない項目(解析(actor))).toEqual([`項目名が読めません: "title"`]);
    });
  }

  it("項目名が空の形では知らせない", () => {
    // `{ : "あ" }` は名前が無い。 空文字を名前として知らせても直しようがない
    expect(読めない項目(解析(`  - A: { : "あ" }`))).toEqual([]);
  });
});

describe("state は通常の箱では読めない (Round 1 review の指摘)", () => {
  // `extractStateOverride` はパーツの時しか状態を作らない。 通常の箱で読める扱いにすると
  // `- A: { state: { foo: 1 } }` が黙って消え、 本 file が塞ごうとしている経路が予約語で残る
  it("通常の箱に state を書くと知らせが出る", () => {
    expect(読めない項目(解析(`  - A: { state: { foo: 1 } }`))).toEqual([
      `項目名が読めません: "state"`,
    ]);
  });

  it("パーツに state を書いても知らせない", () => {
    expect(読めない項目(解析(`  - arc1: { kind: arc-gauge, state: { v: 50 } }`))).toEqual([]);
  });

  it("パーツでは state の値が実際に残る", () => {
    // 知らせないだけでなく、 書いた値が効いていることを見る。 効かないなら知らせないのは誤り
    const r = 解析(`  - arc1: { kind: arc-gauge, state: { v: 50 } }`);
    expect(r.ok, "解析に失敗した").toBe(true);
    const a = r.ok ? r.doc.actors[0] : undefined;
    expect(a?.stateOverride, "状態の上書きが残っていない").toEqual({ v: 50 });
  });
});
