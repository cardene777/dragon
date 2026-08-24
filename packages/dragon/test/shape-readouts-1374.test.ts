/**
 * 記法に足した「箱の中に描く図形」 と「値を見せる部品」 の検査 (#1374)。
 *
 * この 2 つが書けなかったため、見本帳の 9 件 (`animation` の rich 5 件 / `ethereum` 4 件) が
 * 記法を持てなかった。 コードのタブが押せず、見た図を自分で書けない状態だった。
 *
 * ## 何を見るか
 *
 * 1. 書いた指定がそのまま図に渡ること (YAML / JSON の両方)
 * 2. 2 つの記法が同じ図になること
 * 3. **読めない書き方を黙って捨てないこと** = 知らない種類 / 知らない欄 / 足りない必須の欄
 *
 * 3 が要点。 捨てると「書いたのに図に出ない」 が手掛かりなしで起きる。
 */
import { describe, it, expect } from "vitest";
import { textDslToDiagram, jsonToDiagram, parseTextDslV05, validateDragonJson } from "../src/index";

const 波の記法 = `title: "波"
type: flow

lanes:
  l: { x: 0, width: 200 }

states:
  s: 0
  total: 0

readouts:
  ring: { kind: percent-ring, source: total, max: 500, label: "全体進捗" }
  cu: { kind: countup, source: total, unit: " 行", decimals: 0 }

actors:
  - 検証: { kind: dyn-wave, lane: l, posW: 140, posH: 200, shape: { kind: wave, level: "{s}", amplitude: 100, frequency: 2, waveHeight: 6, fill: "#4e9dc4" } }

animation:
  - step: "進む" 1.5s
    focus: ["検証"]
    tween:
      s: 0 -> 100
`;

const 波のJSON = {
  title: "波",
  type: "flow" as const,
  lanes: { l: { x: 0, width: 200 } },
  states: { s: 0, total: 0 },
  readouts: [
    { id: "ring", kind: "percent-ring" as const, source: "total", max: 500, label: "全体進捗" },
    { id: "cu", kind: "countup" as const, source: "total", unit: " 行", decimals: 0 },
  ],
  actors: [
    {
      name: "検証",
      kind: "dyn-wave",
      lane: "l",
      posW: 140,
      posH: 200,
      shape: {
        kind: "wave" as const,
        level: "{s}",
        amplitude: 100,
        frequency: 2,
        waveHeight: 6,
        fill: "#4e9dc4",
      },
    },
  ],
  flow: [],
  animation: [
    { step: "進む", duration: 1.5, focus: ["検証"], tween: { s: [0, 100] as [number, number] } },
  ],
};

describe("箱の中に描く図形 (#1374)", () => {
  it("書いた指定がそのまま図に渡る", () => {
    const d = textDslToDiagram(波の記法);
    expect(d.nodes[0]?.shape).toEqual({
      kind: "wave",
      level: "{s}",
      amplitude: 100,
      frequency: 2,
      waveHeight: 6,
      fill: "#4e9dc4",
    });
  });

  it("数で書いても文字列で書いても渡る", () => {
    // 水位は状態を追いかける欄。 数を直接書く形と、状態の名前を書く形の両方を受ける
    const 数 = textDslToDiagram(波の記法.replace('level: "{s}"', "level: 80"));
    expect((数.nodes[0]?.shape as { level: unknown }).level).toBe(80);
    const 文字 = textDslToDiagram(波の記法);
    expect((文字.nodes[0]?.shape as { level: unknown }).level).toBe("{s}");
  });

  it("知らない種類は黙って捨てず知らせる", () => {
    const r = parseTextDslV05(波の記法.replace("kind: wave", "kind: そんな図形はない"));
    expect(r.ok, "読めない種類が通ってしまった").toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.message).join("\n")).toContain("図形の種類が読めません");
  });

  it("知らない欄は黙って捨てず知らせる", () => {
    const r = parseTextDslV05(波の記法.replace("frequency: 2", "frequencyy: 2"));
    expect(r.ok, "読めない欄が通ってしまった").toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.message).join("\n")).toContain("図形の の項目名が読めません");
  });

  it("必須の欄が足りなければ知らせる", () => {
    const r = parseTextDslV05(波の記法.replace(", amplitude: 100", ""));
    expect(r.ok, "必須の欄が無いのに通ってしまった").toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.message).join("\n")).toContain("amplitude は必ず書きます");
  });

  it("5 種類とも読める", () => {
    // 描画側 (`CdlDynShape`) の全種類を受ける。 1 種類でも落ちると、その形は記法で書けない
    const 形 = [
      "{ kind: rect, source: 50, fillMax: 100 }",
      "{ kind: circle, radius: 30 }",
      "{ kind: arc, angle: 135 }",
      "{ kind: wave, level: 50, amplitude: 100 }",
      "{ kind: polygon, sides: 6 }",
    ];
    for (const s of 形) {
      // **箱の行ごと置き換える**。 `shape: {...}` を正規表現で切ると、水位に書いた
      // `"{s}"` の閉じ括弧で止まって壊れた記法になる (実際に踏んだ)
      const y = 波の記法.replace(
        /^ {2}- 検証: \{.*$/m,
        `  - 検証: { kind: card, lane: l, shape: ${s} }`,
      );
      expect(y, `${s} で箱の行を置き換えられていない`).toContain(`shape: ${s}`);
      const r = parseTextDslV05(y);
      expect(r.ok, `${s} が読めない`).toBe(true);
    }
  });
});

describe("値を見せる部品 (#1374)", () => {
  it("書いた指定がそのまま図に渡る", () => {
    const d = textDslToDiagram(波の記法);
    expect(d.readouts).toEqual([
      { id: "ring", kind: "percent-ring", source: "total", max: 500, label: "全体進捗" },
      { id: "cu", kind: "countup", source: "total", unit: " 行", decimals: 0 },
    ]);
  });

  it("知らない種類は黙って捨てず知らせる", () => {
    const r = parseTextDslV05(波の記法.replace("kind: percent-ring", "kind: そんな部品はない"));
    expect(r.ok, "読めない種類が通ってしまった").toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.message).join("\n")).toContain("部品の種類が読めません");
  });

  it("必須の欄が足りなければ知らせる", () => {
    const r = parseTextDslV05(波の記法.replace(", max: 500", ""));
    expect(r.ok, "必須の欄が無いのに通ってしまった").toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.message).join("\n")).toContain("max は必ず書きます");
  });

  it("書かなければ図は部品を持たない (陰性対照)", () => {
    // 「いつでも付く」 形なら上の検査は通っても意味を持たない
    const 無し = 波の記法.replace(/readouts:\n( {2}.*\n)+\n/, "");
    expect(無し, "readouts を落とせていない (検査が空振りしている)").not.toContain("readouts:");
    expect(textDslToDiagram(無し).readouts).toBeUndefined();
  });
});

describe("JSON の記法でも同じことが書ける (#1374)", () => {
  it("YAML と JSON が同じ図になる", () => {
    expect(jsonToDiagram(波のJSON)).toEqual(textDslToDiagram(波の記法));
  });

  it("知らない種類は検査が落とす", () => {
    const v = validateDragonJson({
      ...波のJSON,
      readouts: [{ id: "r", kind: "そんな部品はない", source: "total" }],
    });
    expect(v.ok, "読めない種類が通ってしまった").toBe(false);
    if (v.ok) return;
    expect(v.errors.map((e) => e.message).join("\n")).toContain("unknown readout kind");
  });

  it("知らない欄は検査が落とす", () => {
    const v = validateDragonJson({
      ...波のJSON,
      actors: [{ name: "A", shape: { kind: "wave", level: 1, amplitude: 100, typo: 1 } }],
    });
    expect(v.ok, "読めない欄が通ってしまった").toBe(false);
    if (v.ok) return;
    expect(v.errors.map((e) => e.path).join("\n")).toContain("$.actors[0].shape.typo");
  });

  it("必須の欄が足りなければ検査が落とす", () => {
    const v = validateDragonJson({
      ...波のJSON,
      readouts: [{ id: "r", kind: "percent-ring", source: "total" }],
    });
    expect(v.ok, "必須の欄が無いのに通ってしまった").toBe(false);
    if (v.ok) return;
    expect(v.errors.map((e) => e.message).join("\n")).toContain("max is required");
  });

  it("欄の型が違えば検査が落とす", () => {
    const v = validateDragonJson({
      ...波のJSON,
      readouts: [{ id: "r", kind: "percent-ring", source: "total", max: "500" }],
    });
    expect(v.ok, "型の違う値が通ってしまった").toBe(false);
    if (v.ok) return;
    expect(v.errors.map((e) => e.message).join("\n")).toContain("max must be 数");
  });

  it("正しい形は検査を通る (陽性対照)", () => {
    // 上は全て 0 件でない側を見る検査なので、通る側も確かめる = 検査そのものが壊れたら気付く
    expect(validateDragonJson(波のJSON).ok, "正しい形が落ちている").toBe(true);
  });
});
