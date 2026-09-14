/**
 * 記法が数と真偽の読めない値を誤りとして知らせることの検証 (#1306)。
 *
 * 記法の値はすべて文字列なので「型」 は無いが、**欄ごとに読める形は決まっている**。
 * `posX` は数、`overlay` は真偽で、それ以外の値は入れようがない。
 *
 * これまでは読めない値を `undefined` に落としていたため、書いた欄が無かったことになり、
 * 誤りも警告も出なかった。 書いた人には「書いたのに図が変わらない」 としか見えない。
 *
 * ```text
 * - Web:
 *     位置: あああ      →  位置の書き方が読めません: "あああ"  (知らせが出る)
 *     posX: あああ      →  (何も出ない。 posX が無かったことになる)
 * ```
 *
 * ## 何を測るか
 *
 * 欄を手で並べると、欄が増えた時に検査だけが古くなる。 実装の表 (`*_VALUE_KINDS`) を
 * 出どころにして、**全欄** に対して 2 方向を見る。
 *
 * | 向き | 見ること |
 * |---|---|
 * | 読めない値 | その行を指す誤りが返る |
 * | 読める値 | 誤りが返らず、値が届く (厳しくしすぎていない) |
 */
import { describe, it, expect } from "vitest";
import {
  parseTextDslV05,
  VIEWPORT_VALUE_KINDS,
  LANE_VALUE_KINDS,
  ACTOR_INLINE_VALUE_KINDS,
  ACTOR_BLOCK_VALUE_KINDS,
  FLOW_INLINE_VALUE_KINDS,
  OFFSET_VALUE_KINDS,
} from "../src/v05/parser";

/** 位置のずらしの欄の値は `layoutPos` の片方に届く (#1971) */
const ずらしの値 = (layoutPos: { x: number; y: number } | undefined, 欄: string): unknown =>
  欄 === "offsetX" ? layoutPos?.x : layoutPos?.y;

type 値の形 = "数" | "真偽";

/** 読めない値と読める値は形から導く = 欄ごとに手で書かない */
const 形ごとの値: Record<値の形, { 読めない: string; 読める: string; 届く: number | boolean }> = {
  数: { 読めない: "q", 読める: "12", 届く: 12 },
  真偽: { 読めない: "maybe", 読める: "true", 届く: true },
};

/**
 * 欄を 1 つだけ書いた本文と、値が届いたかの読み取り方。
 *
 * 場所ごとに書き方が違うため、本文の組み立てはここ 1 か所に集める。 `行` は値を書いた
 * 行番号 (1 始まり) で、知らせがその行を指すことを見る。
 */
const 場所 = {
  "図全体 (中括弧)": {
    表: VIEWPORT_VALUE_KINDS,
    組む: (欄: string, v: string) => ({
      本文: `title: "t"\ntype: flow\nviewport: { ${欄}: ${v} }\n\nactors:\n  - A\n  - B\n\nflow:\n  - A -> B: "x"\n`,
      行: 3,
      読む: (doc: any) => doc.viewport?.[欄],
    }),
  },
  "図全体 (縦)": {
    表: VIEWPORT_VALUE_KINDS,
    組む: (欄: string, v: string) => ({
      本文: `title: "t"\ntype: flow\nviewport:\n  ${欄}: ${v}\n\nactors:\n  - A\n  - B\n\nflow:\n  - A -> B: "x"\n`,
      行: 4,
      読む: (doc: any) => doc.viewport?.[欄],
    }),
  },
  縦列: {
    表: LANE_VALUE_KINDS,
    組む: (欄: string, v: string) => ({
      本文: `title: "t"\ntype: flow\nlanes:\n  L1: { ${欄}: ${v} }\n\nactors:\n  - A\n  - B\n\nflow:\n  - A -> B: "x"\n`,
      行: 4,
      読む: (doc: any) => doc.lanes?.L1?.[欄],
    }),
  },
  "箱 (中括弧)": {
    表: ACTOR_INLINE_VALUE_KINDS,
    組む: (欄: string, v: string) => ({
      本文: `title: "t"\ntype: flow\n\nactors:\n  - A: { kind: card, ${欄}: ${v} }\n  - B\n\nflow:\n  - A -> B: "x"\n`,
      行: 5,
      読む: (doc: any) => doc.actors[0]?.[欄],
    }),
  },
  "箱 (縦)": {
    表: ACTOR_BLOCK_VALUE_KINDS,
    組む: (欄: string, v: string) => ({
      本文: `title: "t"\ntype: flow\n\nactors:\n  - A:\n      kind: card\n      ${欄}: ${v}\n  - B\n\nflow:\n  - A -> B: "x"\n`,
      行: 7,
      読む: (doc: any) => doc.actors[0]?.[欄],
    }),
  },
  // 位置のずらし (#1971)。 箱の 2 つの書き方と縦列で同じ表を読み、`layoutPos` に届く
  "位置のずらし (箱の中括弧)": {
    表: OFFSET_VALUE_KINDS,
    組む: (欄: string, v: string) => ({
      本文: `title: "t"\ntype: flow\n\nactors:\n  - A: { kind: card, ${欄}: ${v} }\n  - B\n\nflow:\n  - A -> B: "x"\n`,
      行: 5,
      読む: (doc: any) => ずらしの値(doc.actors[0]?.layoutPos, 欄),
    }),
  },
  "位置のずらし (箱の縦)": {
    表: OFFSET_VALUE_KINDS,
    組む: (欄: string, v: string) => ({
      本文: `title: "t"\ntype: flow\n\nactors:\n  - A:\n      kind: card\n      ${欄}: ${v}\n  - B\n\nflow:\n  - A -> B: "x"\n`,
      行: 7,
      読む: (doc: any) => ずらしの値(doc.actors[0]?.layoutPos, 欄),
    }),
  },
  "位置のずらし (縦列)": {
    表: OFFSET_VALUE_KINDS,
    組む: (欄: string, v: string) => ({
      本文: `title: "t"\ntype: flow\nlanes:\n  L1: { ${欄}: ${v} }\n\nactors:\n  - A\n  - B\n\nflow:\n  - A -> B: "x"\n`,
      行: 4,
      読む: (doc: any) => ずらしの値(doc.lanes?.L1?.layoutPos, 欄),
    }),
  },
  矢印: {
    表: FLOW_INLINE_VALUE_KINDS,
    組む: (欄: string, v: string) => ({
      本文: `title: "t"\ntype: flow\n\nactors:\n  - A\n  - B\n\nflow:\n  - A -> B: "x" { ${欄}: ${v} }\n`,
      行: 9,
      読む: (doc: any) => doc.flow[0]?.[欄],
    }),
  },
} as const satisfies Record<
  string,
  {
    表: Record<string, 値の形>;
    組む: (
      欄: string,
      v: string,
    ) => { 本文: string; 行: number; 読む: (doc: any) => unknown };
  }
>;

const 全欄 = (): Array<{ 場所名: string; 欄: string; 形: 値の形 }> => {
  const out: Array<{ 場所名: string; 欄: string; 形: 値の形 }> = [];
  for (const [場所名, { 表 }] of Object.entries(場所)) {
    for (const [欄, 形] of Object.entries(表 as Record<string, 値の形>)) {
      out.push({ 場所名, 欄, 形 });
    }
  }
  return out;
};

describe("読めない値を知らせる欄を網羅している (#1306)", () => {
  it("場所を 1 つ以上持っている", () => {
    // 持っていなければ、以下の走査は 1 件も回らずに通る
    expect(Object.keys(場所).length, "場所が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("欄の異なりが 23 ある (実装から導く)", () => {
    // Issue #1306 が数えた 21 欄を、表から導いて突き合わせる。 表に欄を足して呼出側に
    // 配線し忘れると、下の 2 方向の検査が落ちる。 #1971 で位置のずらし (`offsetX` / `offsetY`) を足して 23
    const 名前 = new Set(全欄().map((f) => f.欄));
    expect(名前.size, `欄の異なりが変わった (${[...名前].sort().join(",")})`).toBe(23);
  });

  it("数の欄が 18、真偽の欄が 5", () => {
    const 欄 = 全欄();
    const 数 = new Set(欄.filter((f) => f.形 === "数").map((f) => f.欄));
    const 真偽 = new Set(欄.filter((f) => f.形 === "真偽").map((f) => f.欄));
    expect(数.size, `数の欄 = ${[...数].sort().join(",")}`).toBe(18);
    expect(真偽.size, `真偽の欄 = ${[...真偽].sort().join(",")}`).toBe(5);
  });

  it("表に出てくる形は全て、測る値を用意してある", () => {
    const 未定義 = [...new Set(全欄().map((f) => f.形))].filter((k) => !(k in 形ごとの値));
    expect(未定義, "形を足したのに測る値が無い (その形の欄は 1 度も測られない)").toEqual([]);
  });
});

describe("読めない値は行番号付きの誤りになる (#1306)", () => {
  it("全欄で、読めない値がその行を指す誤りになる", () => {
    const 欄一覧 = 全欄();
    let 測れた = 0;
    const 素通り: string[] = [];
    for (const { 場所名, 欄, 形 } of 欄一覧) {
      測れた += 1;
      const 値 = 形ごとの値[形].読めない;
      const { 本文, 行 } = (場所 as any)[場所名].組む(欄, 値);
      const r = parseTextDslV05(本文);
      if (r.ok) {
        素通り.push(`${場所名}.${欄} (${形}) が ${値} を通してしまう`);
        continue;
      }
      const 当該 = r.errors.filter((e) => e.message.includes(`"${値}"`));
      if (当該.length === 0) {
        素通り.push(`${場所名}.${欄} の誤りが値を示していない (${r.errors.map((e) => e.message).join(" / ")})`);
        continue;
      }
      if (!当該.some((e) => e.line === 行)) {
        素通り.push(`${場所名}.${欄} の誤りが ${行} 行目を指さない (${当該.map((e) => e.line).join(",")})`);
      }
    }
    expect(測れた, "欄を 1 つも測れていない (検査が空振りしている)").toBe(欄一覧.length);
    expect(素通り, "読めない値が素通りする欄がある").toEqual([]);
  });

  it("読める値は通り、値が届く (厳しくしすぎていない)", () => {
    const 欄一覧 = 全欄();
    let 測れた = 0;
    const 落ちた: string[] = [];
    for (const { 場所名, 欄, 形 } of 欄一覧) {
      測れた += 1;
      const { 読める, 届く } = 形ごとの値[形];
      const { 本文, 読む } = (場所 as any)[場所名].組む(欄, 読める);
      const r = parseTextDslV05(本文);
      if (!r.ok) {
        落ちた.push(`${場所名}.${欄}: ${r.errors.map((e) => e.message).join(" / ")}`);
        continue;
      }
      const got = 読む(r.doc);
      if (got !== 届く) 落ちた.push(`${場所名}.${欄}: 値が届かない (${JSON.stringify(got)})`);
    }
    expect(測れた, "欄を 1 つも測れていない (検査が空振りしている)").toBe(欄一覧.length);
    expect(落ちた, "読める値が誤りになるか、値が届かない").toEqual([]);
  });

  it("値を書かなかった形は誤りにしない", () => {
    // 書いていないものが効かないのは当たり前で、黙って消えているわけではない。
    // ここを誤りにすると、書きかけの本文が全部止まる
    const 落ちた: string[] = [];
    for (const { 場所名, 欄 } of 全欄()) {
      const { 本文 } = (場所 as any)[場所名].組む(欄, "");
      const r = parseTextDslV05(本文);
      if (!r.ok) 落ちた.push(`${場所名}.${欄}: ${r.errors.map((e) => e.message).join(" / ")}`);
    }
    expect(落ちた, "値が空の形を誤りにしている").toEqual([]);
  });
});

describe("同じ欄は書き方が違っても同じ知らせが出る (#1306)", () => {
  it("箱の欄は中括弧でも縦でも同じ文で知らせる", () => {
    // 書き方によって知らされたりされなかったりする状態を作らない
    const 両方で読める = Object.keys(ACTOR_BLOCK_VALUE_KINDS).filter(
      (k) => k in ACTOR_INLINE_VALUE_KINDS,
    );
    expect(両方で読める.length, "両方で読める欄が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const 欄 of 両方で読める) {
      const 文 = (場所名: string): string[] => {
        const { 本文 } = (場所 as any)[場所名].組む(欄, "q");
        const r = parseTextDslV05(本文);
        return r.ok ? [] : r.errors.map((e) => e.message);
      };
      expect(文("箱 (中括弧)"), 欄).toEqual(文("箱 (縦)"));
    }
  });

  it("図全体の欄は中括弧でも縦でも同じ文で知らせる", () => {
    for (const 欄 of Object.keys(VIEWPORT_VALUE_KINDS)) {
      const 文 = (場所名: string): string[] => {
        const { 本文 } = (場所 as any)[場所名].組む(欄, "q");
        const r = parseTextDslV05(本文);
        return r.ok ? [] : r.errors.map((e) => e.message);
      };
      expect(文("図全体 (中括弧)"), 欄).toEqual(文("図全体 (縦)"));
    }
  });
});

describe("知らせは既にある形と揃っている (#1306)", () => {
  it("倍率の別名を併記しても、読めない値を書いた行を指す", () => {
    const 本文 = [
      'title: "t"',
      "type: flow",
      "",
      "actors:",
      "  - A:",
      "      kind: sample",
      "      scale: q",
      "      倍率: 3",
      "",
    ].join("\n");
    const r = parseTextDslV05(本文);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const e = r.errors.find((x) => x.message.includes('箱の scale は数で書きます: "q"'));
    expect(e?.line, "後ろに書いた別名の行を指している").toBe(7);
  });

  it("同じ欄名が別の場所に出ても、どこの欄かが分かる", () => {
    // `width` は図全体と縦列、`posX` は箱と箱の中の要素に出る。 欄名だけを出すと
    // どこを直せばよいか読めない
    const 本文 = `title: "t"\ntype: flow\nviewport: { width: q }\n\nlanes:\n  L1: { width: q }\n\nactors:\n  - A\n  - B\n\nflow:\n  - A -> B: "x"\n`;
    const r = parseTextDslV05(本文);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const 文 = r.errors.map((e) => e.message);
    expect(文).toContain('viewport の width は数で書きます: "q"');
    expect(文).toContain('縦列 L1 の width は数で書きます: "q"');
  });

  it("真偽の欄は使える値を添えて知らせる", () => {
    const 本文 = `title: "t"\ntype: flow\n\nactors:\n  - A\n  - B\n\nflow:\n  - A -> B: "x" { overlay: yes }\n`;
    const r = parseTextDslV05(本文);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    const e = r.errors.find((x) => x.message.includes("overlay"));
    expect(e?.message).toBe('矢印の overlay は true か false で書きます: "yes"');
    expect(e?.hint, "使える値を示していない").toBe("使える値 = true, false");
  });
});
