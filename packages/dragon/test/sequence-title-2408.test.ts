/**
 * 順序図で面に題を付けても、名前で指した言づてと帯がその面に付くことの検査 (#2408)。
 *
 * 見出しに出すのは書いた題、 矢印の端と帯は名前で指す。 直す前は組み立て器へ題を面の名前として
 * 渡していたため、 名前で指した端が 1 度も見つからず、 番号 0 (先頭の面) に倒れていた。
 *
 * 実測 (面 3 つ・言づて 3 本、 直す前)。
 *
 * | 題の付け方 | 言づての `[from, to]` |
 * |---|---|
 * | 付けない | `[0,1] [1,2] [2,1]` |
 * | `API` だけに付ける | `[0,0] [0,2] [2,0]` |
 * | 全ての面に付ける | `[0,0] [0,0] [0,0]` |
 *
 * ## 走査の組み方
 *
 * **基準は「題を付けない図」** で、 題の付け方だけを変えた図の端と帯がそれと一致するかを見る。
 * 期待値を手で書かないので、 面や言づてを足しても検査が古くならない。
 *
 * 題の付け方 5 通り (付けない / 1 面 / 全面 / 2 面に同じ題 / 始まりの印) × 帯 (書く / 書かない)。
 * **始まりの印** は題を書かなくても見出しが空になる (`箱の題`) ため、 題を書いた面と同じ経路を通る。
 */
import { describe, it, expect } from "vitest";
import { sequenceBoardMetrics } from "@cardenelabs/cdl";
import { textDslToDiagram } from "../src/index";

/** 板の中身の型は組み立て器の測り方から取る = 自前で写すと組み立て器の型が変わった時にずれる */
type 板の中身 = Parameters<typeof sequenceBoardMetrics>[0];
type 板 = { kind?: string; w: number; h: number; sequenceData?: 板の中身 };

/** 面 3 つ + 始まりの印 1 つの順序図。 面の行と帯の行だけを差し替える */
const 本文 = (面の行: string[], 帯: boolean): string =>
  [
    `title: "t"`,
    `type: sequence`,
    ``,
    `actors:`,
    ...面の行,
    ``,
    `flow:`,
    `  - Client -> API: "ask"`,
    `  - API -> DB: "read"`,
    `  - DB -> API: "rows"`,
    ...(帯 ? [``, `bands:`, `  - API: 1..3`, `  - DB: 2..2`] : []),
    ``,
    `animation:`,
    `  - step: "p1" 1s`,
    `    focus: ["Client -> API"]`,
    `  - step: "p2" 1s`,
    `    focus: ["API -> DB"]`,
    `  - step: "p3" 1s`,
    `    focus: ["DB -> API"]`,
  ].join("\n");

const 板を取る = (src: string): 板 => {
  const d = textDslToDiagram(src) as unknown as { nodes: 板[] };
  const n = d.nodes.find((x) => x.kind === "sequence-board");
  if (!n?.sequenceData) throw new Error("順序図の板が無い");
  return n;
};

const 端 = (b: 板) => b.sequenceData!.messages.map((m) => [m.from, m.to]);
const 帯の面 = (b: 板) => b.sequenceData!.bands.map((x) => [x.actor, x.from, x.to]);
const 見出し = (b: 板) => b.sequenceData!.actors.map((a) => a.name);

const 題なし = ["  - Client", "  - API", "  - DB"];
const 題の付け方: readonly (readonly [string, string[], string[]])[] = [
  ["1 面だけ", ["  - Client", '  - API: { title: "受付口" }', "  - DB"], ["Client", "受付口", "DB"]],
  [
    "全ての面",
    ['  - Client: { title: "利用者" }', '  - API: { title: "受付口" }', '  - DB: { title: "保管庫" }'],
    ["利用者", "受付口", "保管庫"],
  ],
  ["2 面に同じ題", ["  - Client", '  - API: { title: "窓口" }', '  - DB: { title: "窓口" }'], ["Client", "窓口", "窓口"]],
];

describe("順序図で面に題を付けても、言づてと帯が名前で指した面に付く (#2408)", () => {
  for (const 帯 of [false, true]) {
    const 帯の名札 = 帯 ? "帯を書く" : "帯を書かない";

    it(`${帯の名札} — 題の付け方を変えても端と帯が題なしと同じ`, () => {
      const 基準 = 板を取る(本文(題なし, 帯));
      const ずれた: string[] = [];
      for (const [名札, 行] of 題の付け方) {
        const b = 板を取る(本文(行, 帯));
        if (JSON.stringify(端(b)) !== JSON.stringify(端(基準)))
          ずれた.push(`${名札} の端 = ${JSON.stringify(端(b))}`);
        if (JSON.stringify(帯の面(b)) !== JSON.stringify(帯の面(基準)))
          ずれた.push(`${名札} の帯 = ${JSON.stringify(帯の面(b))}`);
      }
      expect(ずれた, `基準の端 ${JSON.stringify(端(基準))} / 帯 ${JSON.stringify(帯の面(基準))}`).toEqual([]);
    });
  }

  it("基準の図は 3 つの面を全て使う (走査が空振りしていない)", () => {
    // 基準が潰れていると、 潰れた図同士が一致して通る
    const 基準 = 板を取る(本文(題なし, false));
    expect(端(基準)).toEqual([
      [0, 1],
      [1, 2],
      [2, 1],
    ]);
    expect(new Set(帯の面(基準).map(([a]) => a))).toEqual(new Set([0, 1, 2]));
  });

  it("見出しには題が出る", () => {
    for (const [名札, 行, 期待] of 題の付け方) {
      expect(見出し(板を取る(本文(行, false))), 名札).toEqual(期待);
    }
  });

  it("板の大きさは見出しの字幅で決まり、 端の番号に依らない", () => {
    // 見出しで組んだ板を土台にし、 端だけを写す形の前提。 組み立て器が端の番号を大きさに
    // 使うようになったら、 写した端と大きさが食い違うのでここで気付く
    for (const [名札, 行] of 題の付け方) {
      const b = 板を取る(本文(行, true));
      const 測り直し = sequenceBoardMetrics(b.sequenceData!);
      expect([b.w, b.h], 名札).toEqual([測り直し.w, 測り直し.h]);
    }
  });

  it("始まりの印を含む図でも、 端が印と面を取り違えない", () => {
    // 印は題を書かなくても見出しが空になり、 題を付けた面と同じ経路を通る。 印を 2 つ置くと
    // 見出しが空で重なり、 直す前は印を指す端がどちらも同じ番号に潰れていた
    const src = [
      `title: "t"`,
      `type: sequence`,
      ``,
      `actors:`,
      `  - begin: mark-start`,
      `  - Client`,
      `  - API`,
      `  - end: mark-end`,
      ``,
      `flow:`,
      `  - begin -> Client: "開く"`,
      `  - Client -> API: "ask"`,
      `  - API -> end: "閉じる"`,
    ].join("\n");
    expect(端(板を取る(src))).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
  });
});
