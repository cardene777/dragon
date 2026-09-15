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

import { createFormulaComputeds, createInputSignals } from "@cardenelabs/cdl";
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

describe("記法で式に名札を書ける (#1916)", () => {
  /*
   * 描画側は式の `label` を操作部の名前に描き、中身の名前も名札に置き換える (cdl#853)。
   * 記法が `名前: "式"` の 1 形しか受けないと、組み立て関数で書いた名札を記法の見本に
   * 写せず、カタログの 3 つの書き方が食い違う。
   *
   * 巻き取り (`intro: { start: 0.9, label: "..." }`) と同じ組の形にそろえる。
   */
  it("組の形で書いた名札が図の式に載る", () => {
    const d = 記法('  total: { expression: "input + 1", label: "合計" }');
    expect(式たち(d)).toEqual([{ id: "total", expression: "input + 1", label: "合計" }]);
  });

  it("文字列の形と組の形を混ぜて書け、文字列の形の式は `label` を持たない", () => {
    const d = 記法('  doubled: "input * 2"\n  total: { expression: "doubled + 1", label: "合計" }');
    expect(式たち(d)).toEqual([
      { id: "doubled", expression: "input * 2" },
      { id: "total", expression: "doubled + 1", label: "合計" },
    ]);
  });

  it("名札を書かない組の形は `label` を持たない", () => {
    expect(式たち(記法('  total: { expression: "input + 1" }'))).toEqual([
      { id: "total", expression: "input + 1" },
    ]);
  });

  it("`,` を含む式を引用符で囲えば、組の形でも式が割れない", () => {
    const d = 記法('  gas: { label: "上限つき", expression: "Math.min(input, 60) * 2" }');
    expect(式たち(d)).toEqual([
      { id: "gas", expression: "Math.min(input, 60) * 2", label: "上限つき" },
    ]);
  });

  it("中括弧で名前を囲った式は、引用符の有無によらず組の形と取り違えない", () => {
    // `{input}` は名前を囲っただけで、項目名 (`expression:`) を持たない
    expect(式たち(記法('  v: "{input} * 2"'))).toEqual([{ id: "v", expression: "{input} * 2" }]);
    expect(式たち(記法("  v: {input} * 2"))).toEqual([{ id: "v", expression: "{input} * 2" }]);
    expect(式たち(記法("  v: {input}"))).toEqual([{ id: "v", expression: "{input}" }]);
  });

  it.each([
    ["式が無い", '  v: { label: "名札" }', /式 "v" が空です/],
    ["式が空", '  v: { expression: "", label: "名札" }', /式 "v" が空です/],
    ["名札が空", '  v: { expression: "input", label: "" }', /式 "v" の名札が空です/],
    [
      "知らない項目名",
      '  v: { expression: "input", title: "名札" }',
      /式 "v" の項目名が読めません: "title"/,
    ],
    ["項目の形でない欄", "  v: { expression: input, 60 }", /式 "v" の項目が読めません: "60"/],
    ["読めない式", '  v: { expression: "input *" }', /式 "v" を読めません/],
  ])("組の形で %s 時は行番号付きで知らせる", (_名, 行, 知らせ) => {
    expect(() => 記法(行)).toThrow(知らせ);
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

  it("つまみ / 先に書いた式 の名前は知らせない", () => {
    const 出た = 知らせを集める(元('  a: "input + 1"\n  b: "a * 2"'));
    expect(出た.filter((n) => n.kind === "formula-unresolved")).toEqual([]);
  });

  it("状態は formula の参照元ではないため知らせて式を載せない", () => {
    const r = parseTextDslV05(元('  a: "s * 2"'));
    if (!r.ok) throw new Error("読めない");
    const 出た: CompileNotice[] = [];
    const d = compileToCdl(r.doc, { onNotice: (n) => 出た.push(n) }) as unknown as 図;
    expect(出た.some((n) => n.kind === "formula-unresolved" && n.line > 0)).toBe(true);
    expect(d.formulas).toBeUndefined();
  });

  it("後から書く式は engine が読めないため知らせて先の式だけを載せる", () => {
    const r = parseTextDslV05(元('  a: "b * 2"\n  b: "input + 1"'));
    if (!r.ok) throw new Error("読めない");
    const 出た: CompileNotice[] = [];
    const d = compileToCdl(r.doc, { onNotice: (n) => 出た.push(n) }) as unknown as 図;
    expect(出た.some((n) => n.kind === "formula-unresolved")).toBe(true);
    expect(d.formulas).toEqual([{ id: "b", expression: "input + 1" }]);
    expect(() => {
      const signals = createInputSignals(d as never);
      createFormulaComputeds(d as never, signals);
    }).not.toThrow();
  });

  it("どこにも無い名前は知らせる", () => {
    const 出た = 知らせを集める(元('  a: "missing * 2"'));
    const 知らせ = 出た.filter((n) => n.kind === "formula-unresolved");
    expect(知らせ.length, "知らせが出ていない").toBe(1);
    expect(知らせ[0]?.actor).toBe("a");
    expect(知らせ[0]?.message).toContain("missing");
  });

  it("知らせた式は落とし、図全体が runtime error になるのを防ぐ", () => {
    const r = parseTextDslV05(元('  a: "missing * 2"'));
    if (!r.ok) throw new Error("読めない");
    const d = compileToCdl(r.doc) as unknown as 図;
    expect(d.formulas).toBeUndefined();
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

  it("組の形で書いた名札が図の式に載り、文字列の形の式は `label` を持たない (#1916)", () => {
    const json = JSONの図({
      doubled: "input * 2",
      total: { expression: "Math.min(doubled, 60) + 1", label: "合計" },
      bare: { expression: "input" },
    });
    const v = validateDragonJson(json);
    expect(v.ok, v.ok ? "" : v.errors.map((e) => `${e.path} ${e.message}`).join(" / ")).toBe(true);
    expect(式たち(jsonToDiagram(json as never))).toEqual([
      { id: "doubled", expression: "input * 2" },
      { id: "total", expression: "Math.min(doubled, 60) + 1", label: "合計" },
      { id: "bare", expression: "input" },
    ]);
  });

  it.each([
    ["式が無い", { label: "名札" }, "$.formulas.a.expression"],
    ["式が空", { expression: " ", label: "名札" }, "$.formulas.a.expression"],
    ["式が文字列でない", { expression: 2 }, "$.formulas.a.expression"],
    ["名札が空", { expression: "input", label: "" }, "$.formulas.a.label"],
    ["名札が文字列でない", { expression: "input", label: 1 }, "$.formulas.a.label"],
    ["知らない項目名", { expression: "input", title: "名札" }, "$.formulas.a.title"],
    ["読めない式", { expression: "input *" }, "$.formulas.a"],
    ["並び", ["input"], "$.formulas.a"],
    ["null", null, "$.formulas.a"],
  ])("組の形で %s 時は場所を示して拒む (#1916)", (_名, 値, 場所) => {
    const r = validateDragonJson(JSONの図({ a: 値 }));
    expect(r.ok, "読めない組が通っている").toBe(false);
    if (!r.ok) expect(r.errors.map((e) => e.path)).toContain(場所);
  });

  it("組の誤りを知らせた後、文字列の形の知らせを重ねない (#1916 / #2006)", () => {
    // 組の検査は「読めたか」 を値と別の欄で返す。 誤りを値 (`null` / 印) で表すと、
    // 呼び手が組の誤りを素通しの値と取り違えて、同じ場所に 2 つ目の知らせを積む
    const 組の誤り = validateDragonJson(JSONの図({ a: { label: "名札" } }));
    expect(組の誤り.ok, "式の無い組が通っている").toBe(false);
    if (!組の誤り.ok) {
      const 道 = 組の誤り.errors.map((e) => e.path);
      expect(道, "組の誤りを知らせていない").toContain("$.formulas.a.expression");
      expect(道, "組の誤りに文字列の形の知らせが重なっている").not.toContain("$.formulas.a");
    }

    // 陽性側 = 組でない値は素通しして、文字列の形の検査が `$.formulas.a` を知らせる。
    // これが出ないなら上の `not.toContain` は空振りで、何を書いても通る
    const 素通し = validateDragonJson(JSONの図({ a: null }));
    expect(素通し.ok, "組でない値が通っている").toBe(false);
    if (!素通し.ok) {
      expect(素通し.errors.map((e) => e.path), "文字列の形の知らせが出ていない").toContain(
        "$.formulas.a",
      );
    }
  });

  it("組の形の式も、前方参照を拒む (#1916)", () => {
    const r = validateDragonJson(
      JSONの図({
        a: { expression: "b * 2", label: "前" },
        b: { expression: "input + 1", label: "後" },
      }),
    );
    expect(r.ok, "後から書く式を読む組が通っている").toBe(false);
  });

  it("input と同じ名前、前方参照、文字列 input の参照を拒む", () => {
    const collision = validateDragonJson(JSONの図({ input: "input * 2" }));
    expect(collision.ok).toBe(false);

    const forward = validateDragonJson(JSONの図({ a: "b * 2", b: "input + 1" }));
    expect(forward.ok).toBe(false);

    const stringInput = JSONの図({ a: "input * 2" });
    stringInput.inputs = [{ id: "input", kind: "text", defaultValue: "x" }] as never;
    expect(validateDragonJson(stringInput).ok).toBe(false);
  });
});

describe("公開している形が式を持つ (#1391)", () => {
  type 値の形 = {
    type?: string;
    minLength?: number;
    pattern?: string;
    required?: string[];
    additionalProperties?: boolean;
    properties?: Record<string, { type?: string; minLength?: number; pattern?: string }>;
  };
  const 形 = (
    diagramJsonSchema as unknown as {
      properties: Record<string, { type?: string; additionalProperties?: { oneOf?: 値の形[] } }>;
    }
  ).properties.formulas;
  const 値の形たち = 形?.additionalProperties?.oneOf ?? [];

  it("公開している形を読めている", () => {
    expect(形, "公開している形に formulas が無い").toBeDefined();
    expect(値の形たち.length, "値の形を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(
      0,
    );
  });

  it("名前を鍵、空でない文字列か `expression` と `label` の組を値に取る (#1916)", () => {
    // 記法 / JSON validator / 公開している形 の 3 つで受ける形が割れると、
    // 書けるのに拒まれる (逆もある) 状態が生まれる
    expect(形?.type).toBe("object");
    expect(値の形たち.map((v) => v.type)).toEqual(["string", "object"]);
    const [文字列, 組] = 値の形たち;
    expect(文字列?.minLength).toBe(1);
    expect(組?.required).toEqual(["expression"]);
    expect(組?.additionalProperties).toBe(false);
    expect(Object.keys(組?.properties ?? {}).sort()).toEqual(["expression", "label"]);
    expect(組?.properties?.expression?.minLength).toBe(1);
    expect(組?.properties?.label?.minLength).toBe(1);
  });
});
