/*
 * 状態 (`states:`) とつまみ (`inputs:`) に同じ名前を書いて初期値がずれた時に知らせる (#2413)。
 *
 * 同じ名前を両方に書くのは この記法で意図された書き方で、カタログの見本 105 箇所が
 * この形で書かれている。 状態が静止した図の値を決め、つまみが読み手に値を変えさせる。
 *
 * ## ずれると状態の値は図のどこにも出ない
 *
 * 描く側は `mergeStateValues(base, overrides)` でつまみの既定値を状態の上に塗る。
 * 静止した最初の一枚 (`serverSnapshot`) にもつまみの既定値が入るため、
 * **同じ名前の状態の初期値は図のどの瞬間にも出ない**。
 *
 * 直す前は、揃えて書いた図も ずらして書いた図も知らせ 0 件だった。
 * 見本 77 組を測ると 1 組もずれていない = 書き手が全部手で揃えている決まりなのに、
 * 守れているかを確かめる仕組みが 1 つも無かった。
 *
 * ## 効く既定値を自前で導かない
 *
 * つまみの種類によって値の作り方が違い、欄の名前からは導けない
 * (`timeline` は `defaultSpeedIdx` を持つが効く既定値は 0)。
 * 描く側が書き出している `inputDefaultValue` をそのまま呼ぶ。
 *
 * ## 突き合わせは文字列で行う
 *
 * 描く側が `merged[key] = String(v)` で文字列にしてから塗るため、
 * `42` と `"42"` は同じ値として扱う。
 */
import { inputDefaultValue } from "@cardenelabs/cdl";
import { describe, expect, it } from "vitest";
import { compileToCdl } from "../src/compile";
import type { CompileNotice } from "../src/compile/notice";
import { つまみの表 } from "../src/v05/input-table.generated";
import { parseTextDslV05 } from "../src/v05/parser";

/** 状態 1 つとつまみ 1 つを書いた図。 2 行だけを差し替えて使う */
const 本文 = (つまみの行: string, 状態の値: string): string => `title: "しらべ"
type: flow

actors:
  - A: { subtitle: "{v}" }

inputs:
  ${つまみの行}

states:
  v: ${状態の値}
`;

function 組み立てる(本文: string): { 知らせ: CompileNotice[]; 図: string } {
  const p = parseTextDslV05(本文);
  if (!p.ok) throw new Error(p.errors.map((e) => `${e.line}: ${e.message}`).join(" / "));
  const 知らせ: CompileNotice[] = [];
  const 図 = compileToCdl(p.doc, { onNotice: (n) => 知らせ.push(n) });
  return { 知らせ, 図: JSON.stringify(図) };
}

const ずれの知らせ = (ns: CompileNotice[]): CompileNotice[] =>
  ns.filter((n) => n.kind === "state-shadowed-by-input");

/**
 * 種類ごとの、つまみの行と 揃えた状態の値と ずらした状態の値。
 *
 * **種類の一覧は手で並べない** = この表が `つまみの表` の 14 種を覆っているかを
 * 下の検査が突き合わせる。 種類が増えた日に、行の見本が無いことで検査が落ちる。
 */
const 種類ごとの見本: Record<string, { 行: string; 揃う: string; ずれる: string }> = {
  color: { 行: `v: { kind: color, defaultValue: "#ff0000" }`, 揃う: `"#ff0000"`, ずれる: `"#00ff00"` },
  datetime: { 行: `v: { kind: datetime, defaultValue: "2026-01-01" }`, 揃う: `"2026-01-01"`, ずれる: `"2026-02-02"` },
  dropdown: { 行: `v: { kind: dropdown, options: ["a", "b"], defaultValue: "b" }`, 揃う: `"b"`, ずれる: `"a"` },
  "multi-select": { 行: `v: { kind: multi-select, options: ["a", "b"], defaultValues: ["a", "b"] }`, 揃う: `"a,b"`, ずれる: `"a"` },
  number: { 行: `v: { kind: number, min: 0, max: 10, defaultValue: 3 }`, 揃う: `3`, ずれる: `4` },
  radio: { 行: `v: { kind: radio, options: ["a", "b"], defaultValue: "b" }`, 揃う: `"b"`, ずれる: `"a"` },
  range: { 行: `v: { kind: range, min: 0, max: 10, defaultLo: 2, defaultHi: 8 }`, 揃う: `"2,8"`, ずれる: `"3,8"` },
  slider: { 行: `v: { kind: slider, min: 0, max: 100, defaultValue: 42 }`, 揃う: `42`, ずれる: `5` },
  stepper: { 行: `v: { kind: stepper, min: 0, max: 10, defaultValue: 3 }`, 揃う: `3`, ずれる: `4` },
  tabs: { 行: `v: { kind: tabs, options: ["a", "b"], defaultValue: "b" }`, 揃う: `"b"`, ずれる: `"a"` },
  text: { 行: `v: { kind: text, defaultValue: "abc" }`, 揃う: `"abc"`, ずれる: `"abd"` },
  timeline: { 行: `v: { kind: timeline, duration: 4 }`, 揃う: `0`, ずれる: `1` },
  toggle: { 行: `v: { kind: toggle, defaultValue: true }`, 揃う: `"true"`, ずれる: `"false"` },
  xypad: { 行: `v: { kind: xypad, xMin: 0, xMax: 100, yMin: 0, yMax: 100, defaultX: 10, defaultY: 20 }`, 揃う: `"10,20"`, ずれる: `"11,20"` },
};

describe("状態とつまみの初期値がずれたら知らせる (#2413)", () => {
  it("ずれた図で、両方の値と名前を含む知らせが 1 件出る", () => {
    const { 知らせ } = 組み立てる(本文(種類ごとの見本.slider!.行, `5`));
    const 出た = ずれの知らせ(知らせ);
    expect(出た).toHaveLength(1);
    expect(出た[0]!.message).toContain(`"v"`);
    expect(出た[0]!.message).toContain("5");
    expect(出た[0]!.message).toContain("42");
    expect(出た[0]!.hint).toBeTruthy();
  });

  it("揃えた図は知らせ 0 件", () => {
    const { 知らせ } = 組み立てる(本文(種類ごとの見本.slider!.行, `42`));
    expect(ずれの知らせ(知らせ)).toHaveLength(0);
  });

  it("数と文字列の違いは ずれとみなさない (描く側が文字列にしてから塗るため)", () => {
    const { 知らせ } = 組み立てる(本文(種類ごとの見本.slider!.行, `"42"`));
    expect(ずれの知らせ(知らせ)).toHaveLength(0);
  });

  it("名前が重ならない図は知らせ 0 件", () => {
    const 本文2 = `title: "しらべ"
type: flow

actors:
  - A: { subtitle: "{v}" }

inputs:
  sl: { kind: slider, min: 0, max: 100, defaultValue: 42 }

states:
  v: 5
`;
    expect(ずれの知らせ(組み立てる(本文2).知らせ)).toHaveLength(0);
  });
});

describe("つまみの種類を手で並べない (#2413)", () => {
  it("行の見本が `つまみの表` の全種を覆う", () => {
    const 表の種類 = Object.keys(つまみの表).sort();
    const 見本の種類 = Object.keys(種類ごとの見本).sort();
    expect(見本の種類, "種類が増えたら行の見本も足す").toEqual(表の種類);
    expect(表の種類.length, "表が空なら走査が空振りする").toBeGreaterThan(0);
  });

  it("14 種すべてで、揃えた図は 0 件 ・ ずらした図は 1 件", () => {
    const 揃って黙らない: string[] = [];
    const ずれて黙る: string[] = [];
    let 走査 = 0;
    for (const [種類, 見本] of Object.entries(種類ごとの見本)) {
      走査++;
      if (ずれの知らせ(組み立てる(本文(見本.行, 見本.揃う)).知らせ).length !== 0) 揃って黙らない.push(種類);
      if (ずれの知らせ(組み立てる(本文(見本.行, 見本.ずれる)).知らせ).length !== 1) ずれて黙る.push(種類);
    }
    expect(走査, "走査した種類").toBe(Object.keys(つまみの表).length);
    expect(揃って黙らない, "揃えて書いたのに知らせが出た種類").toEqual([]);
    expect(ずれて黙る, "ずらして書いたのに黙った種類").toEqual([]);
  });

  it("効く既定値は描く側の関数と同じ値になる (写した実装を持たない)", () => {
    for (const [種類, 見本] of Object.entries(種類ごとの見本)) {
      const p = parseTextDslV05(本文(見本.行, 見本.揃う));
      if (!p.ok) throw new Error(`${種類}: ${p.errors.map((e) => e.message).join(" / ")}`);
      const input = (p.doc.inputs ?? []).find((x) => x.id === "v");
      expect(input, `${種類}: つまみが読めていない`).toBeTruthy();
      // 検査側も描く側の関数を呼ぶ = 実装が別の導き方を持っていたらここで割れる
      expect(String(inputDefaultValue(input!)), 種類).toBe(見本.揃う.replace(/^"|"$/g, ""));
    }
  });
});

describe("知らせは直す行を指す (#2413)", () => {
  it("状態を 2 行書いて 2 行目だけをずらすと、2 行目の行番号が出る", () => {
    const 本文3 = `title: "しらべ"
type: flow

actors:
  - A: { subtitle: "{a} {b}" }

inputs:
  a: { kind: slider, min: 0, max: 100, defaultValue: 1 }
  b: { kind: slider, min: 0, max: 100, defaultValue: 2 }

states:
  a: 1
  b: 99
`;
    // 行番号は手で数えない = 本文を 1 行足しただけで検査が古くなる
    const 期待する行 = 本文3.split("\n").findIndex((x) => x.includes("b: 99")) + 1;
    expect(期待する行, "目印の行が本文に無い").toBeGreaterThan(0);
    const 出た = ずれの知らせ(組み立てる(本文3).知らせ);
    expect(出た).toHaveLength(1);
    expect(出た[0]!.line).toBe(期待する行);
  });
});

describe("知らせを足しても組み上がる図は変わらない (#2413)", () => {
  it("ずれた図と揃えた図は、状態の初期値の分しか違わない", () => {
    const ずれ = 組み立てる(本文(種類ごとの見本.slider!.行, `5`));
    const 揃い = 組み立てる(本文(種類ごとの見本.slider!.行, `42`));
    expect(ずれの知らせ(ずれ.知らせ)).toHaveLength(1);
    expect(ずれ.図).not.toBe(揃い.図);
    expect(ずれ.図.replace(`"initial":5`, `"initial":42`)).toBe(揃い.図);
  });

  it("図に書いた行 (`pos`) が漏れない", () => {
    const { 図 } = 組み立てる(本文(種類ごとの見本.slider!.行, `42`));
    expect(図).not.toContain(`"pos"`);
  });
});
