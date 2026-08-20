/**
 * 矢印の `overlay` を記法から書けること (#1267)。
 *
 * `overlay` は説明文を矢印の線の上に重ねる指定で、分岐図の条件ラベル (`true` / `false`)
 * のために cdl 側が持っている。 記法にはこれを書く手段が無く、カタログの見本
 * `presetFlowchart` を記法で書くと説明文の位置が変わっていた (実測 = x=883 対 x=946)。
 *
 * **書ける入口は 2 つある** (文字の記法と JSON の記法)。 片方だけ通すと、通っていない側で
 * 黙って落ちる。 この repo では同じ取りこぼしを 3 回踏んでいるため両方を検査する。
 *
 * **組み立ての経路も 4 つある**。 段の動きを持つ図は専用の組み立てを通り、持たない図は
 * cdl の組み立てを通ってから後段で上書きする。 種別ごとに経路が違うので、
 * 代表を 1 つずつ通す。
 */
import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05";
import { compileToCdl } from "../src/compile";
import { jsonToDiagram, validateDragonJson, diagramJsonSchema } from "../src/index";

const 段 = `
animation:
  - step: "1" 0.9s
    focus: [A]
    body: "b"
`;

const 記法 = (type: string, 動きあり: boolean): string =>
  `title: "t"
type: ${type}

actors:
  - A: { kind: card }
  - B: { kind: card }
  - C: { kind: card }

flow:
  - A -> B: "true" (success, solid) { overlay: true }
  - B -> C: "false" (warning, solid)
${動きあり ? 段 : ""}`;

const 矢印 = (yaml: string): { label: string; overlay?: boolean }[] => {
  const r = parseTextDslV05(yaml);
  if (!r.ok) throw new Error(JSON.stringify(r.errors));
  return compileToCdl(r.doc).edges.map((e) => ({ label: e.label, overlay: e.overlay }));
};

describe("矢印の overlay (#1267)", () => {
  describe("文字の記法", () => {
    // 4 経路の代表。 `swimlane` と `flow` は段の有無で組み立てが分かれ、
    // `sequence` は専用の組み立てを持ち、段の無い図は cdl の組み立てを通る。
    for (const [名, type, 動きあり] of [
      ["段のある swimlane", "swimlane", true],
      ["段のない swimlane", "swimlane", false],
      ["段のある sequence", "sequence", true],
      ["段のない flow", "flow", false],
    ] as const) {
      it(`${名} で overlay が矢印に届く`, () => {
        const e = 矢印(記法(type, 動きあり));
        const 重ねる = e.find((x) => x.label === "true");
        const 重ねない = e.find((x) => x.label === "false");
        expect(重ねる, `${名} で "true" の矢印が見つからない (検査が空振りしている)`).toBeDefined();
        expect(重ねない, `${名} で "false" の矢印が見つからない (検査が空振りしている)`).toBeDefined();
        expect(重ねる?.overlay).toBe(true);
        // **書かなかった矢印に付いてはいけない**。 全部に付けてしまう実装でも
        // 上の検査だけなら通るため、付けない側も見る
        expect(重ねない?.overlay).toBeUndefined();
      });
    }

    it("overlay: false と書けば false が届く", () => {
      const yaml = `title: "t"
type: flow

actors:
  - A: { kind: card }
  - B: { kind: card }

flow:
  - A -> B: "x" { overlay: false }
`;
      expect(矢印(yaml)[0]?.overlay).toBe(false);
    });

    it("読めない値は書かなかった扱いになる", () => {
      const yaml = `title: "t"
type: flow

actors:
  - A: { kind: card }
  - B: { kind: card }

flow:
  - A -> B: "x" { overlay: maybe }
`;
      // 真偽として読めない語は落とす。 真に倒すと、綴りを間違えた時に
      // 書いていない指定が効く
      expect(矢印(yaml)[0]?.overlay).toBeUndefined();
    });
  });

  describe("JSON の記法", () => {
    const 素 = {
      title: "t",
      type: "flow",
      actors: ["A", "B", "C"],
      flow: [
        { from: "A", to: "B", label: "true", overlay: true },
        { from: "B", to: "C", label: "false" },
      ],
    };

    it("決まり書きに overlay がある", () => {
      // 決まり書き (`diagram.json`) は LLM が読む説明で、`validateDragonJson` は
      // これを解釈しない (実測 = 矢印の項目に `zzz: 1` を足しても通る)。
      // したがって「入口で弾かれないこと」 を見ても決まり書きの検査にならない。
      // 決まり書きに項目が載っていることを直接見る
      const 矢印の項目 = (
        diagramJsonSchema as {
          properties: { flow: { items: { properties: Record<string, { type?: string }> } } };
        }
      ).properties.flow.items.properties;
      expect(Object.keys(矢印の項目).length, "矢印の項目が空 (検査が空振りしている)").toBeGreaterThan(0);
      expect(矢印の項目.overlay?.type).toBe("boolean");
    });

    it("入口を通る", () => {
      const r = validateDragonJson(素);
      expect(r.ok, r.ok ? "" : JSON.stringify(r.errors)).toBe(true);
    });

    it("overlay が矢印に届く", () => {
      const d = jsonToDiagram(素);
      expect(d.edges.find((e) => e.label === "true")?.overlay).toBe(true);
      expect(d.edges.find((e) => e.label === "false")?.overlay).toBeUndefined();
    });

    // 真偽でない値を入口で弾くことは主張しない。 実測すると JSON の記法は矢印の項目の
    // 型を一切見ておらず、`tone: "zzz"` も `labelOffsetX: "10"` も通る。
    // overlay だけ弾くと入口の振る舞いが項目ごとに割れるため、ここでは触らない。
  });
});
