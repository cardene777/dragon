/**
 * 見本 (parts) が持つ「他の値から決まる値」 が、重ねた先でも解かれることの検査 (#1180)。
 *
 * 見本は図の定義そのものなので `derived` を持てる。 一方で取り込む側は箱 / 矢印 / 縦列 /
 * 状態を写すだけで、値を写していなかった。 見本の中で値の関係を書いても重ねた先では解かれず、
 * その値を読む箱に `{名前}` の生の形が出る。
 *
 * 併せて、本文の `values:` が代入で載っていたため、仮に引き継いでも上書きで消えていた。
 *
 * **値が届いたかは実経路で見る** (`#1162` で決めた書き方)。 `layout()` →
 * `computeStateValues` を通す = 図に載っただけで届いていない形を通り抜けない。
 */
import { describe, it, expect } from "vitest";
import { computeStateValues, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { compileToCdl, type CompileNotice } from "../src/compile";
import type { DslDocument, DslValue } from "../src/types";

/**
 * 値を持つ最小の見本。
 *
 * 状態 `v` から `half` が決まり、箱の文字がその `half` を読む。 名前は前置きが付くので、
 * 重ねた先では `p1__v` / `p1__half` になる。
 */
function 見本(): CdlDiagram {
  return {
    id: "parts-derived",
    topic: "test",
    lanes: [{ id: "l", x: 0, width: 400 }],
    nodes: [{ id: "box", lane: "l", stack: 0, kind: "actor", title: "T", value: "{half}" }],
    edges: [],
    states: [{ id: "v", initial: 40 }],
    derived: [{ id: "half", expression: "{v} / 2" }],
    phases: [] as CdlDiagram["phases"],
  } as CdlDiagram;
}

/** 見本を 1 つ (または 2 つ) 重ねた図を組み立てる。 編集画面が見本を渡すのと同じ経路 */
function 組む(opts?: {
  values?: Array<{ name: string; expression: string }>;
  見本たち?: Array<{ alias: string; part: CdlDiagram }>;
  onNotice?: (n: CompileNotice) => void;
}): CdlDiagram {
  const 見本たち = opts?.見本たち ?? [{ alias: "p1", part: 見本() }];
  const doc: DslDocument = {
    title: "T",
    type: "sequence",
    actors: [
      { name: "A", kind: "actor", pos: { line: 1 } },
      ...見本たち.map((p, i) => ({
        name: p.alias,
        kind: "actor" as const,
        partId: p.alias,
        pos: { line: 2 + i },
      })),
    ],
    flow: [{ no: 1, from: "A", to: "A", label: "x", pos: { line: 9 } }],
    values: opts?.values?.map((v): DslValue => ({ ...v, pos: { line: 10 } })),
    pos: { line: 1 },
  };
  return compileToCdl(doc, {
    partsCatalog: Object.fromEntries(見本たち.map((p) => [p.alias, p.part])),
    onNotice: opts?.onNotice,
  });
}

/** その瞬間に描画側が読む値 */
const 描画が読む値 = (d: CdlDiagram): Record<string, string> => computeStateValues(layout(d), 0, 0);

describe("見本の値を引き継ぐ (#1180)", () => {
  it("見本の値が前置き付きの名前で図に載る", () => {
    const d = 組む();
    // 式は engine の木を通して組み直すため、括弧が全て付いた形になる (意味は変わらない)
    expect(d.derived).toEqual([{ id: "p1__half", expression: "(p1__v / 2)" }]);
  });

  it("式の中の参照も前置きが付く", () => {
    // 付けないと、重ねた先に同じ名前の状態があるとそちらを読む
    expect(組む().derived?.[0]?.expression).toContain("p1__v");
    expect(描画が読む値(組む()).p1__half).toBe("20");
  });

  it("波括弧なしの参照も、関数名を保ったまま前置きが付く", () => {
    // CDL engine は `v` も参照として読む。 `{v}` だけを書き換えると本文の v と混ざる
    const bare = {
      ...見本(),
      derived: [{ id: "limited", expression: "max(v, Math.min(v * 2, 50))" }],
    } as CdlDiagram;
    const d = 組む({
      見本たち: [{ alias: "p1", part: bare }],
      values: [{ name: "v", expression: "999" }],
    });

    // 関数は木の上で名前と別の種類なので取り違えない (`max` は engine の書き方に揃う)
    expect(d.derived?.find((x) => x.id === "p1__limited")?.expression).toBe(
      "Math.max(p1__v, Math.min((p1__v * 2), 50))",
    );
    expect(描画が読む値(d).p1__limited).toBe("50");
  });

  it("関数と同じ名前の状態でも、関数呼び出しを壊さない", () => {
    // 参照かどうかの判定を engine に任せているため、`min` が状態名でも関数呼び出しは残る
    const 紛らわしい = {
      ...見本(),
      states: [{ id: "min", initial: 8 }],
      derived: [{ id: "clamped", expression: "min(min, 5)" }],
    } as CdlDiagram;
    const d = 組む({ 見本たち: [{ alias: "p1", part: 紛らわしい }] });
    expect(d.derived?.find((x) => x.id === "p1__clamped")?.expression).toBe("Math.min(p1__min, 5)");
    expect(描画が読む値(d).p1__clamped).toBe("5");
  });

  it("engine が受け付ける数字始まりと $ 入りの参照にも前置きが付く", () => {
    // `{名前}` は \w+、裸の名前は $ も使える。compile 側だけ狭い正規表現だと取り残される
    const engineの名前 = {
      ...見本(),
      states: [
        { id: "1v", initial: 40 },
        { id: "$step", initial: 2 },
      ],
      derived: [{ id: "result", expression: "{ 1v } / $step" }],
    } as CdlDiagram;
    const d = 組む({ 見本たち: [{ alias: "p1", part: engineの名前 }] });

    expect(d.derived?.find((x) => x.id === "p1__result")?.expression).toBe("(p1__1v / p1__$step)");
    expect(描画が読む値(d).p1__result).toBe("20");
  });

  it("小さい数 / 大きい数を含む式も、書き換えた後で解ける", () => {
    // 木から式に戻す時、JavaScript の既定では `0.0000001` が `1e-7` になる。 engine の読み手は
    // 指数表記を読めないため、そのまま書くと元は解けていた式が書き換えた後だけ止まる (実測)
    const 数 = {
      ...見本(),
      states: [{ id: "v", initial: 40 }],
      derived: [
        { id: "tiny", expression: "0.0000001 * {v}" },
        { id: "huge", expression: "{v} * 100000000000000000000000" },
      ],
    } as CdlDiagram;
    const d = 組む({ 見本たち: [{ alias: "p1", part: 数 }] });
    const 式 = d.derived?.map((x) => x.expression).join(" | ") ?? "";
    expect(式, `指数表記が残っている: ${式}`).not.toMatch(/[eE][+-]?\d/);
    const v = 描画が読む値(d);
    expect(v.p1__tiny).toBe("0.000004");
    expect(v.p1__huge).toBeDefined();
  });

  it("数字で始まる actor 名は前置きの側で数字始まりを避ける (#1189)", () => {
    // engine は裸の名前を `[A-Za-z_$]` で始まる形でしか読まない。 値の名前空間を作る時に
    // 数字始まりを避けるため、`1p` は `p1p` になる
    const d = 組む({ 見本たち: [{ alias: "1p", part: 見本() }] });
    // 数字始まりを避けた結果、式は裸の名前で書ける形になる (中括弧で守る必要が無い)
    expect(d.derived?.find((x) => x.id === "p1p__half")?.expression).toBe("(p1p__v / 2)");
    expect(描画が読む値(d)["p1p__half"]).toBe("20");
  });

  it("引き継いだ値が描画側で解ける", () => {
    // 図に載っただけでは届いたと言えない。 実経路で値になることを見る
    const v = 描画が読む値(組む());
    expect(v.p1__v).toBe("40");
    expect(v.p1__half).toBe("20");
  });

  it("見本の箱の文字も前置き付きの名前を読む", () => {
    // 箱の文字は状態の名前だけを書き換えていたため、値を読む文字が取り残されていた
    const node = 組む().nodes.find((n) => n.id === "p1__box");
    expect(node?.value).toBe("{p1__half}");
  });

  it("本文の値と見本の値が両方とも届く", () => {
    // 代入で載せていた時は、本文に値を書くと見本の分が消えていた
    const d = 組む({ values: [{ name: "doubled", expression: "{p1__half} * 2" }] });
    const v = 描画が読む値(d);
    expect(v.p1__half).toBe("20");
    expect(v.doubled).toBe("40");
  });

  it("本文に値を書かない図でも見本の値は残る", () => {
    expect(描画が読む値(組む()).p1__half).toBe("20");
  });

  it("見本の中で値どうしが参照し合っていても解ける", () => {
    // 状態だけを書き換える形だと、値が値を読む式 (`{half} / 2`) の参照が取り残される。
    // 重ねた先に同じ名前の値があるとそちらを読むため、別の数が出る
    const 連鎖 = {
      ...見本(),
      derived: [
        { id: "half", expression: "{v} / 2" },
        { id: "quarter", expression: "{half} / 2" },
      ],
    } as CdlDiagram;
    const d = 組む({
      見本たち: [{ alias: "p1", part: 連鎖 }],
      values: [{ name: "half", expression: "999" }],
    });
    expect(d.derived?.find((x) => x.id === "p1__quarter")?.expression).toContain("p1__half");
    expect(描画が読む値(d).p1__quarter).toBe("10");
  });

  it("値を持たない見本では `derived` が生えない", () => {
    const 値なし = { ...見本(), derived: undefined } as CdlDiagram;
    const d = 組む({ 見本たち: [{ alias: "p1", part: 値なし }] });
    expect(d.derived).toBeUndefined();
  });
});

describe("書き換えても式の意味が変わらない (#1180)", () => {
  it("演算子と項の組合せを網羅しても、重ねる前と後の値が一致する", () => {
    // **1 件ずつ形を足す形では収束しなかった** (review が 8 round 続けて別の書き方の
    // 取りこぼしを見つけた)。 演算子 × 項の組合せを機械で並べ、まとめて見る。
    //
    // 項には「そのままでは書き戻せない形」 を混ぜる = 負の数 (`- -5` が `--5` になる)、
    // 小さい数 (指数表記になる)、数字始まりの名前 (裸で書けない)、関数呼び出し、三項。
    const 演算子 = ["+", "-", "*", "/", "%", ">", ">=", "<", "<=", "==", "!="];
    const 項 = [
      "{v}", "{1v}", "$s", "-5", "0.0000001", "3", "-{v}", "min({v}, 3)",
      "Math.round({v} / 7)", "({v} > 1 ? 2 : -3)", "-(-{v})",
    ];
    const 式: string[] = [];
    for (const op of 演算子) for (const a of 項) for (const b of 項) 式.push(`${a} ${op} ${b}`);
    for (const a of 項) 式.push(`-${a}`, `min(${a}, 2)`, `${a} > 0 ? ${a} : -${a}`);

    const part = {
      ...見本(),
      states: [
        { id: "v", initial: 40 },
        { id: "1v", initial: 7 },
        { id: "$s", initial: 3 },
      ],
      derived: 式.map((expression, i) => ({ id: `e${i}`, expression })),
    } as CdlDiagram;

    const 重ねた後 = 描画が読む値(組む({ 見本たち: [{ alias: "p1", part }] }));
    const 単体 = {
      ...part,
      phases: [{ id: "p", duration: 1000, title: "", body: "", activate: [], tweens: [], sets: [] }],
    } as CdlDiagram;
    const 重ねる前 = 描画が読む値(単体);

    const 違う = 式
      .map((expression, i) => ({ expression, 前: 重ねる前[`e${i}`], 後: 重ねた後[`p1__e${i}`] }))
      .filter((x) => x.前 !== x.後);
    expect(
      違う.slice(0, 8),
      `重ねた後で値が変わった (${違う.length} / ${式.length} 件)`,
    ).toHaveLength(0);
  });

  it("代表的な書き方で、重ねる前と後の値が一致する", () => {
    // **書き換えの形ではなく、解いた結果で見る**。 木から式に戻す時の取りこぼし (指数表記 /
    // 括弧の付け方 / 関数の書き方) は、どれも「重ねた後だけ値が変わる」 形で現れる。
    // 1 件ずつ形を固定するより、意味が保たれることを直接見る方が抜けにくい
    const 式 = [
      "{v} + 1",
      "-{v}",
      "{v} - -1",
      "{v} % 7",
      "{v} > 10",
      "{v} != 40",
      "min({v}, 10)",
      "Math.round({v} / 7)",
      "{v} > 10 ? 1 : 0",
      "0.0000001 * {v}",
      "(({v}))",
      "{v} / 0",
      "{half} * 3",
    ];
    const part = {
      ...見本(),
      derived: [
        { id: "half", expression: "{v} / 2" },
        ...式.map((expression, i) => ({ id: `e${i}`, expression })),
      ],
    } as CdlDiagram;

    const 重ねた後 = 描画が読む値(組む({ 見本たち: [{ alias: "p1", part }] }));
    // 重ねる前は、見本を単体で描いた時の値。 **こちらも実経路で出す** = 解く関数を直接
    // 呼ぶと、図に載っていない値でも比較が成立してしまう
    const 単体 = { ...part, phases: [{ id: "p", duration: 1000, title: "", body: "", activate: [], tweens: [], sets: [] }] } as CdlDiagram;
    const 重ねる前 = 描画が読む値(単体);

    const 違う = 式
      .map((expression, i) => ({ expression, 前: 重ねる前[`e${i}`], 後: 重ねた後[`p1__e${i}`] }))
      .filter((x) => x.前 !== x.後);
    expect(
      違う,
      `重ねた後で値が変わった: ${違う.map((x) => `${x.expression} (${x.前} → ${x.後})`).join(" / ")}`,
    ).toHaveLength(0);
  });
});

describe("見本どうしが互いの値を読まない (#1180)", () => {
  it("同じ見本を 2 つ重ねると、値が別々に解ける", () => {
    const a = { ...見本(), states: [{ id: "v", initial: 40 }] } as CdlDiagram;
    const b = { ...見本(), states: [{ id: "v", initial: 100 }] } as CdlDiagram;
    const v = 描画が読む値(組む({ 見本たち: [{ alias: "p1", part: a }, { alias: "p2", part: b }] }));
    expect(v.p1__half).toBe("20");
    expect(v.p2__half).toBe("50");
  });

  it("見本の中の値の名前は、本文の同名の値と混ざらない", () => {
    // 本文にも `half` があると、前置きが付いていなければ見本がそちらを読む
    const v = 描画が読む値(
      組む({ values: [{ name: "half", expression: "999" }] }),
    );
    expect(v.half).toBe("999");
    expect(v.p1__half).toBe("20");
  });
});

describe("英数字でない actor 名でも値が届く (#1189)", () => {
  it("日本語の actor 名に重ねた見本の値が解ける", () => {
    // `{名前}` に書ける字種は engine が英数字と `_` に限っている。 登場人物の名前をそのまま
    // 前置きにすると値が 1 つも届かないため、値の名前空間だけ英数字にする
    const 届いた: CompileNotice[] = [];
    const d = 組む({
      見本たち: [{ alias: "受付 1", part: 見本() }],
      onNotice: (n) => 届いた.push(n),
    });

    expect(描画が読む値(d)["p1__half"]).toBe("20");
    expect(届いた.filter((n) => n.kind === "value-unresolved")).toHaveLength(0);
  });

  it("箱の文字も英数字の名前を読む", () => {
    const d = 組む({ 見本たち: [{ alias: "受付 1", part: 見本() }] });
    expect(d.nodes.find((n) => n.id === "受付 1__box")?.value).toBe("{p1__half}");
  });

  it("箱 / 縦列 / 矢印の id は書いた名前のまま", () => {
    // 画面側が id から登場人物の名前を取り出す経路がある。 値の名前空間だけを変える
    const d = 組む({ 見本たち: [{ alias: "受付 1", part: 見本() }] });
    expect(d.nodes.some((n) => n.id === "受付 1__box")).toBe(true);
  });

  it("同じ形に潰れる名前は書いた順に番号で分ける", () => {
    // `受付 1` と `受付-1` はどちらも英数字だけにすると同じ形になる。 潰れたまま使うと
    // 2 つの見本が同じ名前空間を共有し、片方の値がもう片方を上書きする
    const d = 組む({
      見本たち: [
        { alias: "受付 1", part: 見本() },
        { alias: "受付-1", part: 見本() },
      ],
    });
    const v = 描画が読む値(d);
    expect(v["p1__half"]).toBe("20");
    expect(v["p1_2__half"]).toBe("20");
  });

  it("英数字の actor 名では今まで通り解ける (陰性対照)", () => {
    // 上の検査だけだと、全ての名前を作り替える形でも通ってしまう
    expect(描画が読む値(組む({ 見本たち: [{ alias: "p_1", part: 見本() }] }))["p_1__half"]).toBe("20");
  });

  it("英数字の actor 名では名前が 1 文字も変わらない (陰性対照)", () => {
    const d = 組む({ 見本たち: [{ alias: "p_1", part: 見本() }] });
    expect(d.derived?.map((x) => x.id)).toContain("p_1__half");
    expect(d.states.map((s) => s.id)).toContain("p_1__v");
  });
});

describe("名前が重なった時は本文が勝つ (#1180)", () => {
  it("本文に見本と同じ名前を書くと、本文の式を使う", () => {
    // engine は同じ名前では先に書いた式を使う。 本文を先に置くことで、書いた人の指定が勝つ
    const 届いた: CompileNotice[] = [];
    const v = 描画が読む値(
      組む({ values: [{ name: "p1__half", expression: "7" }], onNotice: (n) => 届いた.push(n) }),
    );
    expect(v.p1__half).toBe("7");
    expect(届いた.map((n) => n.kind)).toContain("value-duplicate");
    // 重複した後ろ側は見本なので、本文の values 行ではなく見本を置いた行を指す
    expect(届いた.find((n) => n.kind === "value-duplicate")?.line).toBe(2);
  });
});

describe("見本の中で解けない値も伝える (#1180)", () => {
  it("本文に値を書かなくても、見本の中で止まった値を知らせる", () => {
    // 画面には `{p1__broken}` の生の形が出る。 黙って捨てると綴りを疑うことになる
    const 壊れた = {
      ...見本(),
      derived: [{ id: "broken", expression: "{missing} + 1" }],
    } as CdlDiagram;
    const 届いた: CompileNotice[] = [];
    組む({ 見本たち: [{ alias: "p1", part: 壊れた }], onNotice: (n) => 届いた.push(n) });
    expect(届いた.map((n) => n.kind)).toContain("value-unresolved");
    expect(届いた.find((n) => n.kind === "value-unresolved")?.actor).toBe("p1__broken");
  });

  it("見本に無い参照は本文の同名の値へつながらない", () => {
    // 見本の名前空間に無い参照をそのまま残すと、取り込み先に同名の値がある時だけ偶然解ける。
    // 単体で壊れている見本の意味を、重ねた先の内容で変えない
    const 壊れた = {
      ...見本(),
      derived: [{ id: "broken", expression: "{missing} + 1" }],
    } as CdlDiagram;
    const 届いた: CompileNotice[] = [];
    const d = 組む({
      見本たち: [{ alias: "p1", part: 壊れた }],
      values: [{ name: "missing", expression: "40" }],
      onNotice: (n) => 届いた.push(n),
    });

    expect(d.derived?.find((x) => x.id === "p1__broken")?.expression).toContain("p1__missing");
    expect(描画が読む値(d).p1__broken).toBeUndefined();
    expect(届いた.find((n) => n.actor === "p1__broken")?.kind).toBe("value-unresolved");
  });

  it("見本で解けない値の知らせは、見本を置いた行を指す", () => {
    const 壊れた = {
      ...見本(),
      derived: [{ id: "broken", expression: "{missing} + 1" }],
    } as CdlDiagram;
    const 届いた: CompileNotice[] = [];
    組む({ 見本たち: [{ alias: "p1", part: 壊れた }], onNotice: (n) => 届いた.push(n) });

    expect(届いた.find((n) => n.actor === "p1__broken")?.line).toBe(2);
  });
});
