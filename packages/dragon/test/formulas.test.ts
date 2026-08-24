/**
 * つまみの値から決まる値 (`formulas:`) の検査 (#1391)。
 *
 * 記法には `values:` があるが、これは段が動かす状態を読む経路 (`derived`) で、つまみが
 * 握る値を読む経路 (`formulas`) とは描画側で別の欄になる。 「動く見本」 11 件が式だけを
 * 理由に記法を持てなかった。
 *
 * ## この検査が見るもの
 *
 * 書いた式が図の `formulas` まで届くこと。 記法と JSON の 2 経路で見る。
 *
 * 併せて 2 つ。 式を描画側の parser に通していること (自前で書き方を決めると、通ったのに
 * 描画側が解けない式を受ける) と、どこにも書かれていない名前を読む式を知らせること。
 */
import { describe, it, expect } from "vitest";

import { textDslToDiagram, validateDragonJson, jsonToDiagram, compileToCdl } from "../src";
import { parseTextDslV05 } from "../src/v05";
import { diagramJsonSchema } from "../src/schema";
import type { CompileNotice } from "../src/compile";

type 図 = { formulas?: { id: string; expression: string }[] };

const 記法 = (行: string) =>
  textDslToDiagram(`title: "t"
type: flow

lanes:
  l: { x: 0, width: 400 }

inputs:
  input: { kind: slider, min: 0, max: 100, defaultValue: 50 }

formulas:
${行}

actors:
  - A: { kind: card, lane: l, stack: 0 }

animation:
  - step: "p" 1s
`);

const 式たち = (d: unknown) => (d as 図).formulas;

const JSONの図 = (formulas: unknown) => ({
  title: "t",
  type: "flow",
  lanes: { l: { x: 0, width: 400 } },
  flow: [],
  inputs: [{ id: "input", kind: "slider", min: 0, max: 100, defaultValue: 50 }],
  formulas,
  actors: [{ name: "A", kind: "card", lane: "l", stack: 0 }],
  animation: [{ step: "p", duration: 1 }],
});

describe("記法に書いた式が図に届く (#1391)", () => {
  it("書かなければ欄ごと付かない", () => {
    const d = textDslToDiagram(`title: "t"
type: flow

lanes:
  l: { x: 0, width: 400 }

actors:
  - A: { kind: card, lane: l, stack: 0 }

animation:
  - step: "p" 1s
`);
    expect(式たち(d)).toBeUndefined();
  });

  it("書いた順のまま図に載る", () => {
    // 式は他の式を読める。 並び順が変わると、読む相手より先に自分が解かれる形になりうる
    const d = 記法('  doubled: "input * 2"\n  clamped: "Math.min(doubled, 80)"');
    expect(式たち(d)).toEqual([
      { id: "doubled", expression: "input * 2" },
      { id: "clamped", expression: "Math.min(doubled, 80)" },
    ]);
  });

  it.each([
    ["四則と括弧", "(input + 2) * 3 / 4"],
    ["比較", "input >= 100"],
    ["三項", "input >= 100 ? 1 : 0"],
    ["関数", "Math.max(input, 10)"],
  ])("%s を書ける", (_名, 式) => {
    expect(式たち(記法(`  v: "${式}"`))?.[0]?.expression).toBe(式);
  });

  it("名前は中括弧で囲っても囲わなくても同じ名前を読む", () => {
    /*
     * **描画側の parser が両方を受ける** (実測 = `parseFormula("{input} * 2")` と
     * `parseFormula("input * 2")` はどちらも識別子 `input` を返す)。
     *
     * `values:` から書き写した式がそのまま通るということなので、記法側で片方を
     * 拒まない。 拒むと、動く書き方を記法だけが止める形になる。
     */
    expect(式たち(記法('  v: "{input} * 2"'))?.[0]?.expression).toBe("{input} * 2");
    expect(式たち(記法('  v: "input * 2"'))?.[0]?.expression).toBe("input * 2");
  });

  it("中括弧で囲った名前も、どこにも無ければ知らせる相手になる", () => {
    // 囲う / 囲わないで解ける名前が変わらないことを、知らせの側からも見る
    expect(() => 記法('  v: "{missing} +"')).toThrow(/式 "v" を読めません/);
  });

  it("読めない式は行番号付きで知らせる", () => {
    expect(() => 記法('  v: "input *"')).toThrow(/式 "v" を読めません/);
  });

  it("空の式は知らせる", () => {
    expect(() => 記法('  v: ""')).toThrow(/式 "v" が空です/);
  });

  it("名前の規則は状態と揃える", () => {
    expect(() => 記法('  1v: "input * 2"')).toThrow(/invalid value name/);
  });

  it("1 行にまとめた形は受けない", () => {
    expect(() =>
      textDslToDiagram(`title: "t"
type: flow

lanes:
  l: { x: 0, width: 400 }

formulas: { v: "input * 2" }

actors:
  - A: { kind: card, lane: l, stack: 0 }

animation:
  - step: "p" 1s
`),
    ).toThrow(/1 行にまとめて書けない/);
  });
});

describe("どこにも書かれていない名前を読む式を知らせる (#1391)", () => {
  const 知らせを集める = (src: string): CompileNotice[] => {
    const r = parseTextDslV05(src);
    if (!r.ok) throw new Error(r.errors.map((e) => e.message).join(" / "));
    const 出た: CompileNotice[] = [];
    compileToCdl(r.doc, { onNotice: (n) => 出た.push(n) });
    return 出た;
  };

  const 元 = (行: string) => `title: "t"
type: flow

lanes:
  l: { x: 0, width: 400 }

inputs:
  input: { kind: slider, min: 0, max: 100, defaultValue: 50 }

states:
  s: 1

formulas:
${行}

actors:
  - A: { kind: card, lane: l, stack: 0 }

animation:
  - step: "p" 1s
`;

  it("つまみ / 状態 / 他の式 の名前は知らせない", () => {
    // 4 つの出どころのどれかにあれば解ける。 知らせると正しい式で毎回警告が出る
    const 出た = 知らせを集める(元('  a: "input + s"\n  b: "a * 2"'));
    expect(出た.filter((n) => n.kind === "formula-unresolved")).toEqual([]);
  });

  it("どこにも無い名前は知らせる", () => {
    const 出た = 知らせを集める(元('  a: "missing * 2"'));
    const 知らせ = 出た.filter((n) => n.kind === "formula-unresolved");
    expect(知らせ.length, "知らせが出ていない").toBe(1);
    expect(知らせ[0]?.actor).toBe("a");
    expect(知らせ[0]?.message).toContain("missing");
  });

  it("知らせても図は出る", () => {
    // 描画側は解けない名前を含む式も受け取る。 止めると書きかけの図が見られない
    const r = parseTextDslV05(元('  a: "missing * 2"'));
    if (!r.ok) throw new Error("読めない");
    const d = compileToCdl(r.doc) as unknown as 図;
    expect(d.formulas).toEqual([{ id: "a", expression: "missing * 2" }]);
  });
});

describe("JSON でも式を書ける (#1391)", () => {
  it("正しい形は通り、図まで届く", () => {
    const json = JSONの図({ doubled: "input * 2" });
    const v = validateDragonJson(json);
    expect(v.ok, v.ok ? "" : v.errors.map((e) => e.path).join(" ")).toBe(true);
    expect(式たち(jsonToDiagram(json as never))).toEqual([
      { id: "doubled", expression: "input * 2" },
    ]);
  });

  it.each([
    ["並び", [{ id: "a", expression: "input" }]],
    ["数", 1],
    ["文字列", "input * 2"],
  ])("object でない形 (%s) を拒む", (_名, 値) => {
    const r = validateDragonJson(JSONの図(値));
    expect(r.ok, "object でない formulas が通っている").toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain("$.formulas");
  });

  it.each([
    ["空文字", ""],
    ["空白だけ", "   "],
    ["数", 2],
  ])("式が %s の形を拒む", (_名, 値) => {
    const r = validateDragonJson(JSONの図({ a: 値 }));
    expect(r.ok, "読めない式が通っている").toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain("$.formulas.a");
  });

  it("読めない式を拒む", () => {
    const r = validateDragonJson(JSONの図({ a: "input *" }));
    expect(r.ok, "読めない式が通っている").toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain("$.formulas.a");
  });

  it("名前の規則は状態と揃える", () => {
    const r = validateDragonJson(JSONの図({ "1a": "input * 2" }));
    expect(r.ok, "使えない名前が通っている").toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain("$.formulas.1a");
  });
});

describe("公開している形が式を持つ (#1391)", () => {
  const 形 = (
    diagramJsonSchema as unknown as {
      properties: Record<
        string,
        { type?: string; additionalProperties?: { type?: string; minLength?: number } }
      >;
    }
  ).properties.formulas;

  it("公開している形を読めている", () => {
    expect(形, "公開している形に formulas が無い").toBeDefined();
  });

  it("名前を鍵、空でない文字列を値に取る", () => {
    // 記法 / JSON validator / 公開している形 の 3 つで受ける形が割れると、
    // 書けるのに拒まれる (逆もある) 状態が生まれる
    expect(形?.type).toBe("object");
    expect(形?.additionalProperties?.type).toBe("string");
    expect(形?.additionalProperties?.minLength).toBe(1);
  });
});
