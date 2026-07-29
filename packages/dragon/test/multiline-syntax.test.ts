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

  it("色番号はパーツの塗りになる", () => {
    const a = actorOf([`  - A:`, `      kind: achievement`, `      色: "#f59e0b"`]);
    expect(a.stateOverride).toEqual({ bg: "#f59e0b" });
    expect(a.tone, "色番号は箱の色にしない").toBeUndefined();
  });

  it("color でも tone でも書ける", () => {
    expect(actorOf([`  - A:`, `      kind: service`, `      color: 成功`]).tone).toBe("success");
    expect(actorOf([`  - A:`, `      kind: service`, `      tone: 成功`]).tone).toBe("success");
  });

  it("未知の色名は無視する", () => {
    const a = actorOf([`  - A:`, `      kind: service`, `      色: むらさき`]);
    expect([a.tone, a.stateOverride]).toEqual([undefined, undefined]);
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

  it("字下げが浅い行は続きに含めない", () => {
    // `- Web:` と同じ深さに書かれた項目は、 その登場人物の続きではない。 含めると
    // 書き間違いが黙って別の意味になる
    const src = [
      `title: "t"`, `type: flow`, ``, `actors:`,
      `  - Web:`, `      kind: service`,
      `  補足: "浅い字下げ"`,
      `  - B: database`, ``,
      `flow:`, `  - Web -> B: "x"`,
    ].join("\n");
    const r = parseTextDslV05(src);
    if (!r.ok) throw new Error("parse 失敗");
    expect(r.doc.actors[0]!.subtitle, "浅い行を吸い込んだ").toBeUndefined();
    expect(r.doc.actors.map((a) => a.name)).toEqual(["Web", "B"]);
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
