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
import type { CdlDiagram } from "@cardenelabs/cdl";
import {
  textDslToDiagram,
  jsonToDiagram,
  parseTextDslV05,
  validateDragonJson,
  diagramJsonSchema,
  compileToCdl,
  MAX_INPUT_ELEMENTS,
} from "../src/index";

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

  it("shape を書いた箱は renderer が図形を描く kind に揃える", () => {
    // renderer は card の shape を見ない。 shape を保持するだけでは「書けるが描けない」ので、
    // shape.kind に対応する dyn-* kind が最終 diagram に必要。
    const d = textDslToDiagram(`title: "六角"
type: flow
actors:
  - 六角: { kind: card, shape: { kind: polygon, sides: 6, radius: 40 } }
flow:
`);
    expect(d.nodes[0]?.kind).toBe("dyn-polygon");
    expect(d.nodes[0]?.shape).toEqual({ kind: "polygon", sides: 6, radius: 40 });
  });

  it("順序図では図形が効かないことを伝える", () => {
    // #1466 で順序図は 1 枚の板になり、面ごとの箱が消えた = 図形を描く先が無い。
    // 黙って落とすと、書いた側は効いていると思い込む
    const 出た: string[] = [];
    const d = textDslToDiagram(
      `title: "六角の順序"
type: sequence
actors:
  - 六角: { kind: card, shape: { kind: polygon, sides: 6, radius: 40 } }
  - 相手
flow:
  - 六角 -> 相手
`,
      { onNotice: (n) => { if (n.kind === "actor-kind-not-honored") 出た.push(n.message); } },
    );
    expect(d.nodes.filter((n) => n.shape !== undefined), "板に図形が載っている").toEqual([]);
    expect(出た.length, "図形が黙って落ちている").toBe(1);
    expect(出た[0]).toContain("図形");
  });

  it("rect の向きは描画側が受ける 4 値に限る", () => {
    const y = 波の記法.replace(
      /^ {2}- 検証: \{.*$/m,
      "  - 検証: { kind: card, shape: { kind: rect, source: 50, fillMax: 100, orient: sideways } }",
    );
    const r = parseTextDslV05(y);
    expect(r.ok, "描画側が読めない向きが通ってしまった").toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.message).join("\n")).toContain("orient の向きが読めません");

    const v = validateDragonJson({
      ...波のJSON,
      actors: [
        {
          name: "A",
          shape: { kind: "rect", source: 50, fillMax: 100, orient: "sideways" },
        },
      ],
    });
    expect(v.ok, "JSON だけ描画側が読めない向きを通している").toBe(false);
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

  it("壊れた行と 1 行にまとめた形を黙って捨てない", () => {
    const 壊れた行 = parseTextDslV05(
      波の記法.replace(
        '  ring: { kind: percent-ring, source: total, max: 500, label: "全体進捗" }',
        "  ring { kind: percent-ring, source: total, max: 500 }",
      ),
    );
    expect(壊れた行.ok, "コロンの無い部品が黙って消えた").toBe(false);
    if (!壊れた行.ok) {
      expect(壊れた行.errors.map((e) => e.message).join("\n")).toContain("invalid readout entry");
    }

    const 一行 = parseTextDslV05(
      波の記法.replace(
        /readouts:\n( {2}.*\n)+\n/,
        "readouts: { ring: { kind: percent-ring, source: total, max: 500 } }\n\n",
      ),
    );
    expect(一行.ok, "対応していない 1 行形が黙って消えた").toBe(false);
    if (!一行.ok) {
      expect(一行.errors.map((e) => e.message).join("\n")).toContain(
        "readouts は 1 行にまとめて書けない",
      );
    }
  });

  it("parts の部品と最上位の部品を両方残す", () => {
    const part: CdlDiagram = {
      id: "readout-part",
      topic: "test",
      lanes: [{ id: "l", x: 0, width: 100 }],
      nodes: [{ id: "hidden", lane: "l", stack: 0, kind: "actor", title: "", w: 1, h: 1 }],
      edges: [],
      states: [{ id: "v", initial: 30 }],
      phases: [
        {
          id: "static",
          duration: 1000,
          title: "static",
          body: "",
          activate: [],
          tweens: [],
          sets: [],
        },
      ],
      readouts: [{ id: "part-stat", kind: "stat", source: "{v}" }],
    };
    const src = 波の記法.replace("actors:\n", "actors:\n  - side: { kind: readout-part, v: 30 }\n");
    const d = textDslToDiagram(src, { partsCatalog: { "readout-part": part } });
    expect(d.readouts?.map((r) => r.id)).toEqual(["side__part-stat", "ring", "cu"]);
  });

  it("部品の色に書かれた外部参照を出口で落とす", () => {
    const notices: { kind: string }[] = [];
    const src = 波の記法.replace(
      "max: 500, label:",
      'max: 500, color: "url(https://example.invalid/pixel)", label:',
    );
    const d = textDslToDiagram(src, { onNotice: (n) => notices.push(n) });
    const ring = d.readouts?.find((r) => r.id === "ring") as { color?: string } | undefined;
    expect(ring?.color, "外部 paint が readout に残っている").toBe("none");
    expect(notices.some((n) => n.kind === "external-paint-dropped")).toBe(true);

    const paletteSrc = 波の記法.replace(
      "readouts:\n",
      'readouts:\n  heat: { kind: heat-cell, source: total, min: 0, max: 100, colors: ["url(https://example.invalid/pixel)", "#ffffff"] }\n',
    );
    const palette = textDslToDiagram(paletteSrc).readouts?.find((r) => r.id === "heat") as
      { colors?: readonly string[] } | undefined;
    expect(palette?.colors, "配色配列の外部 paint が残っている").toEqual(["none", "#ffffff"]);
  });

  it("shape と readout の paint を閉じても入力 doc は変えない", () => {
    const r = parseTextDslV05(
      波の記法
        .replace('fill: "#4e9dc4"', 'fill: "url(https://shape.example.invalid/x)"')
        .replace(
          "readouts:\n",
          'readouts:\n  heat: { kind: heat-cell, source: total, min: 0, max: 100, colors: ["url(https://readout.example.invalid/x)", "#ffffff"] }\n',
        ),
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const before = JSON.parse(JSON.stringify(r.doc));
    compileToCdl(r.doc);
    expect(r.doc).toEqual(before);
  });

  it("readouts だけを大量に並べた入力も組み立て前の上限で止める", () => {
    const readouts = Array.from(
      { length: MAX_INPUT_ELEMENTS + 1 },
      (_, i) => `  r${i}: { kind: stat, source: v }`,
    ).join("\n");
    const src = `title: "大きすぎる部品"
type: flow
states:
  v: 1
readouts:
${readouts}
actors:
  - A
flow:
`;
    expect(() => textDslToDiagram(src)).toThrow(/要素が/);
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

  it("有限でない数は検査が落とす", () => {
    const v = validateDragonJson({
      ...波のJSON,
      readouts: [{ id: "r", kind: "percent-ring", source: "total", max: Number.NaN }],
    });
    expect(v.ok, "JSON に書けない非有限値が object API から通ってしまった").toBe(false);
  });

  it("正しい形は検査を通る (陽性対照)", () => {
    // 上は全て 0 件でない側を見る検査なので、通る側も確かめる = 検査そのものが壊れたら気付く
    expect(validateDragonJson(波のJSON).ok, "正しい形が落ちている").toBe(true);
  });
});

describe("公開 schema は実際の受理条件と揃う (#1374)", () => {
  const schema = diagramJsonSchema as unknown as Record<string, any>;
  const root = schema.properties as Record<string, any>;
  const actor = root.actors.items.oneOf.find((o: any) => o.properties !== undefined);

  function 種類別の必須(def: any, kind: string): string[] {
    const branch = def.oneOf.find((o: any) => o.properties.kind.enum[0] === kind);
    return branch.required ?? [];
  }

  it("shape の種類別必須欄と向きを宣言する", () => {
    const shape = actor.properties.shape;
    expect(種類別の必須(shape, "rect")).toEqual(["source", "fillMax"]);
    expect(種類別の必須(shape, "wave")).toEqual(["level", "amplitude"]);
    expect(shape.properties.orient.enum).toEqual(["up", "down", "left", "right"]);
  });

  it("readout の種類別必須欄を宣言する", () => {
    const readout = root.readouts.items;
    expect(種類別の必須(readout, "bar")).toEqual(["source", "min", "max"]);
    expect(種類別の必須(readout, "percent-ring")).toEqual(["source", "max"]);
    expect(種類別の必須(readout, "heat-cell")).toEqual(["source", "min", "max"]);
  });
});
