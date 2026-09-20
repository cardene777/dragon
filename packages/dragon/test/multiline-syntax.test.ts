import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05/parser";
import { compileToCdl } from "../src/compile";
import type { DslActor } from "../src/types";

/**
 * 項目を縦に並べて書けるようにする。
 *
 * 1 行の形 (`- API: service 失敗`) は短く書けるが、 項目が増えると横に伸びる。 また、
 * 何を指定できるかが行から読み取れない。
 *
 * パーツの状態名は `bg` / `v` / `net` / `mem` など様々で、 書く人が推測できない。 縦に並べる
 * 形なら、 項目名を見て何を変えられるか分かる。
 *
 * 測るのは「複数行が parse を通るか」 ではなく、 **1 行で書いた時と同じ結果になるか**。
 */

const actorOf = (body: string[]): DslActor => {
  const src = [
    `title: "t"`, `type: flow`, ``, `actors:`,
    ...body, `  - Z`, ``,
    `flow:`, `  - Z -> Z: "y"`,
  ].join("\n");
  const r = parseTextDslV05(src);
  if (!r.ok) throw new Error(`parse 失敗: ${r.errors.map((e) => e.message).join(" / ")}`);
  return r.doc.actors[0]!;
};

const fields = (a: DslActor) => ({
  name: a.name, kind: a.kind, tone: a.tone, subtitle: a.subtitle,
  rows: a.rows, value: a.value, partId: a.partId, stateOverride: a.stateOverride,
});

describe("1 行で書いた時と同じ結果になる", () => {
  const SAME: Array<[string, string[], string]> = [
    ["種類", [`  - Web:`, `      kind: service`], `  - Web: service`],
    ["種類と色", [`  - Web:`, `      kind: service`, `      色: 失敗`], `  - Web: service 失敗`],
    ["種類と補足", [`  - Web:`, `      kind: service`, `      補足: "本体"`], `  - Web: service "本体"`],
    ["行", [`  - 表:`, `      kind: storage`, `      行: ["id: PK"]`], `  - 表: storage ["id: PK"]`],
    ["パーツの状態", [`  - g:`, `      kind: arc-gauge`, `      v: 80`], `  - g: arc-gauge v=80`],
  ];

  for (const [label, multi, single] of SAME) {
    it(label, () => {
      expect(fields(actorOf(multi))).toEqual(fields(actorOf([single])));
    });
  }
});

describe("色は 1 つの項目で両方書ける", () => {
  it("意味の色は箱の色になる", () => {
    const a = actorOf([`  - A:`, `      kind: service`, `      色: 失敗`]);
    expect([a.tone, a.stateOverride]).toEqual(["error", undefined]);
  });

  it("色番号は組み立て時に解決する値として持つ", () => {
    // どの状態に入れるかはパーツごとに違うので、 解析の時点では名前を決めない
    const a = actorOf([`  - A:`, `      kind: achievement`, `      色: "#f59e0b"`]);
    expect(a.colorHex).toBe("#f59e0b");
    expect(a.tone, "色番号は箱の色にしない").toBeUndefined();
  });

  it("color でも tone でも書ける", () => {
    expect(actorOf([`  - A:`, `      kind: service`, `      color: 成功`]).tone).toBe("success");
    expect(actorOf([`  - A:`, `      kind: service`, `      tone: 成功`]).tone).toBe("success");
  });

  it("未知の色名は誤りとして知らせる (#1304)", () => {
    // 黙って既定色に落とすと「書いたのに色が変わらない」 が手掛かりなしで起きる。
    // 位置 / 大きさ が読めない値を知らせるのと同じ形に揃える
    const src = [
      `title: "t"`, `type: flow`, ``, `actors:`,
      `  - A:`, `      kind: service`, `      色: むらさき`, `  - Z`, ``,
      `flow:`, `  - Z -> Z: "y"`,
    ].join("\n");
    const r = parseTextDslV05(src);
    expect(r.ok, "読めない色名は parse を通さない").toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => e.message)).toContain('色の名前が読めません: "むらさき"');
    expect(r.errors[0]?.line, "書いた行を指す").toBe(7);
  });
});

describe("項目名は日本語でも英語でも書ける", () => {
  const PAIRS: Array<[string, string]> = [
    ["kind", "種類"],
    ["subtitle", "補足"],
    ["rows", "行"],
    ["value", "値"],
  ];

  for (const [en, ja] of PAIRS) {
    it(`${en} と ${ja} が同じ`, () => {
      const v = en === "rows" ? `["a", "b"]` : `"x"`;
      const a = actorOf([`  - A:`, `      kind: storage`, `      ${en}: ${v}`]);
      const b = actorOf([`  - A:`, `      kind: storage`, `      ${ja}: ${v}`]);
      expect(fields(a)).toEqual(fields(b));
    });
  }
});

describe("切れ目を間違えない", () => {
  it("次の登場人物を前の続きに含めない", () => {
    const src = [
      `title: "t"`, `type: flow`, ``, `actors:`,
      `  - A:`, `      kind: service`, `      色: 失敗`,
      `  - B:`, `      kind: database`, ``,
      `flow:`, `  - A -> B: "x"`,
    ].join("\n");
    const r = parseTextDslV05(src);
    if (!r.ok) throw new Error("parse 失敗");
    expect(r.doc.actors.map((a) => [a.name, a.kind, a.tone])).toEqual([
      ["A", "service", "error"],
      ["B", "database", undefined],
    ]);
  });

  it("次の section を続きに含めない", () => {
    const src = [
      `title: "t"`, `type: flow`, ``, `actors:`,
      `  - A:`, `      kind: service`, ``,
      `flow:`, `  - A -> A: "x"`,
    ].join("\n");
    const r = parseTextDslV05(src);
    if (!r.ok) throw new Error("parse 失敗");
    expect(r.doc.actors).toHaveLength(1);
    expect(r.doc.flow).toHaveLength(1);
  });

  it("字下げが浅い行は続きに含めず、読めない行として知らせる", () => {
    /*
     * `- Web:` と同じ深さに書かれた項目は、 その登場人物の続きではない。 含めると
     * 書き間違いが黙って別の意味になる。
     *
     * **含めない代わりに知らせる** (#2400)。 以前はこの行を捨てていたので、書いた人には
     * 「1 行書いたのに何も増えない」 だけが残った。 1 件の頭にもしない = `補足` という
     * 名前の登場人物になり、書き間違いが別の意味に化ける
     */
    const src = [
      `title: "t"`, `type: flow`, ``, `actors:`,
      `  - Web:`, `      kind: service`,
      `  補足: "浅い字下げ"`,
      `  - B: database`, ``,
      `flow:`, `  - Web -> B: "x"`,
    ].join("\n");
    const r = parseTextDslV05(src);
    expect(r.ok, "浅い行を知らせていない").toBe(false);
    if (r.ok) return;
    expect(r.errors.map((e) => `L${e.line} ${e.message}`)).toEqual([
      `L7 登場人物の行が読めません: "補足: "浅い字下げ""`,
    ]);
  });

  it("1 行と複数行を混ぜられる", () => {
    const src = [
      `title: "t"`, `type: flow`, ``, `actors:`,
      `  - A: service`,
      `  - B:`, `      kind: database`, `      色: 失敗`,
      `  - C`, ``,
      `flow:`, `  - A -> B: "x"`,
    ].join("\n");
    const r = parseTextDslV05(src);
    if (!r.ok) throw new Error("parse 失敗");
    expect(r.doc.actors.map((a) => [a.name, a.kind])).toEqual([
      ["A", "service"], ["B", "database"], ["C", "actor"],
    ]);
    expect(r.doc.actors[1]!.tone).toBe("error");
  });
});

describe("組み立てまで通る", () => {
  it("複数行で書いた図が描ける", () => {
    const src = [
      `title: "t"`, `type: flow`, ``, `actors:`,
      `  - Web:`, `      kind: service`, `      補足: "本体"`, `      色: 失敗`,
      `  - DB: database`, ``,
      `flow:`, `  - Web -> DB: "検索" 成功`, ``,
      `animation:`, `  - step: "s" 1.0s`, `    focus: [Web, DB]`,
    ].join("\n");
    const r = parseTextDslV05(src);
    if (!r.ok) throw new Error("parse 失敗");
    const d = compileToCdl(r.doc);
    const web = d.nodes.find((n) => n.title === "Web");
    expect(web?.tone).toBe("error");
    expect(web?.subtitle).toBe("本体");
  });
});

describe("色番号はパーツごとの色の状態に届く", () => {
  // 色を保持する状態の名前はパーツごとに違う (`bg` / `stFill` / `gFill` / `hue` など 17 種)。
  // `bg` 決め打ちにすると、 別の名前を使うパーツで色を書いても何も起きない。
  const partWith = (stateId: string, initial: string) => ({
    id: "p", topic: "p",
    lanes: [{ id: "l", x: 0, width: 300 }],
    nodes: [{ id: "body", lane: "l", stack: 0, kind: "dyn-circle", title: "x",
      shape: { kind: "circle", radius: 100, fill: `{${stateId}}` } }],
    edges: [], states: [{ id: stateId, initial }], phases: [],
  }) as never;

  const stateOf = (part: unknown, color?: string) => {
    const body = color
      ? [`  - p:`, `      kind: mypart`, `      色: "${color}"`]
      : [`  - p: mypart`];
    const src = [
      `title: "t"`, `type: flow`, ``, `actors:`, ...body, `  - X`, ``,
      `flow:`, `  - X -> X: "y"`,
    ].join("\n");
    const r = parseTextDslV05(src);
    if (!r.ok) throw new Error("parse 失敗");
    const d = compileToCdl(r.doc, { partsCatalog: { mypart: part as never } });
    return d.states.map((s) => [s.id.replace("p__", ""), s.initial]);
  };

  it("bg という名前でなくても届く", () => {
    expect(stateOf(partWith("stFill", "#22c55e"), "#ff0000")).toEqual([["stFill", "#ff0000"]]);
    expect(stateOf(partWith("gFill", "#22c55e"), "#ff0000")).toEqual([["gFill", "#ff0000"]]);
  });

  it("色を書かなければ既定のまま", () => {
    expect(stateOf(partWith("stFill", "#22c55e"))).toEqual([["stFill", "#22c55e"]]);
  });

  it("色でない状態は変えない", () => {
    const part = {
      id: "p", topic: "p",
      lanes: [{ id: "l", x: 0, width: 300 }],
      nodes: [{ id: "body", lane: "l", stack: 0, kind: "service", title: "x", subtitle: "{v}" }],
      edges: [], states: [{ id: "v", initial: 50 }, { id: "bg", initial: "#22c55e" }], phases: [],
    } as never;
    expect(stateOf(part, "#ff0000")).toEqual([["v", 50], ["bg", "#ff0000"]]);
  });

  it("名前を指定して書いた値が優先", () => {
    const src = [
      `title: "t"`, `type: flow`, ``, `actors:`,
      `  - p:`, `      kind: mypart`, `      色: "#ff0000"`, `      stFill: "#0000ff"`,
      `  - X`, ``, `flow:`, `  - X -> X: "y"`,
    ].join("\n");
    const r = parseTextDslV05(src);
    if (!r.ok) throw new Error("parse 失敗");
    const d = compileToCdl(r.doc, { partsCatalog: { mypart: partWith("stFill", "#22c55e") } });
    expect(d.states.map((s) => s.initial)).toEqual(["#0000ff"]);
  });
});

describe("位置と大きさを書ける", () => {
  // 位置は posX と posY が両方揃わないと効かない。 別々に書けると片方だけ書いて
  // 「効かない」 になるので、 1 つの項目にまとめる形を用意する。
  const posOf = (body: string[]) => {
    const a = actorOf(body);
    return [a.posX, a.posY, a.posW, a.posH];
  };

  it("1 行で @x,y と書ける", () => {
    expect(posOf([`  - A: service @300,200`])).toEqual([300, 200, undefined, undefined]);
  });

  it("色と並べても取り違えない", () => {
    const a = actorOf([`  - A: service 失敗 @300,200`]);
    expect([a.posX, a.posY, a.tone, a.kind]).toEqual([300, 200, "error", "service"]);
  });

  it("縦に並べて 位置: と書ける", () => {
    expect(posOf([`  - A:`, `      kind: service`, `      位置: 300,200`])).toEqual([300, 200, undefined, undefined]);
  });

  it("pos でも posX/posY でも書ける", () => {
    expect(posOf([`  - A:`, `      kind: service`, `      pos: 300,200`])).toEqual([300, 200, undefined, undefined]);
    expect(posOf([`  - A:`, `      kind: service`, `      posX: 300`, `      posY: 200`])).toEqual([300, 200, undefined, undefined]);
  });

  it("大きさも同じ形で書ける", () => {
    expect(posOf([`  - A:`, `      kind: service`, `      位置: 300,200`, `      大きさ: 400,180`]))
      .toEqual([300, 200, 400, 180]);
  });

  it("入れ子で書いた時と同じ結果になる", () => {
    const short = actorOf([`  - A: service @300,200`]);
    const nested = actorOf([`  - A: { kind: service, posX: 300, posY: 200 }`]);
    expect([short.posX, short.posY, short.kind]).toEqual([nested.posX, nested.posY, nested.kind]);
  });

  it("書かなければ自動配置のまま", () => {
    expect(posOf([`  - A: service`])).toEqual([undefined, undefined, undefined, undefined]);
  });

  it("数字でない値は位置にしない", () => {
    // `@` で始まるだけの語を位置と誤読しない
    expect(actorOf([`  - A: service @abc`]).posX).toBeUndefined();
    // `,` を含んでいても数字でなければ位置ではない。 緩く取ると NaN が座標に入る
    const a = actorOf([`  - A: service @abc,def`]);
    expect([a.posX, a.posY], "数字でない値を座標にした").toEqual([undefined, undefined]);
  });

  it("図まで届く", () => {
    const src = [
      `title: "t"`, `type: flow`, ``, `actors:`,
      `  - A:`, `      kind: service`, `      位置: 300,200`,
      `  - X`, ``,
      `flow:`, `  - A -> X: "y"`, ``,
      `animation:`, `  - step: "s" 1.0s`, `    focus: [A, X]`,
    ].join("\n");
    const r = parseTextDslV05(src);
    if (!r.ok) throw new Error("parse 失敗");
    const d = compileToCdl(r.doc);
    const n = d.nodes.find((x) => x.title === "A");
    expect([n?.posX, n?.posY]).toEqual([300, 200]);
  });
});
