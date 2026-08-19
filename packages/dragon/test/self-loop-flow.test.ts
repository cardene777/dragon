/**
 * 自分へ戻る矢印で図が組み立たない件 (#1227)。
 *
 * 描画側は両端が同じ矢印を受けない (`validate` が `self-loop` で落とす)。 記法の側は通すため、
 * `A -> A` と書けてしまい、 落ちるのは描画の直前だった。 本文のどの行が原因かも出ない。
 *
 * `#1219` が決めた形 (組み立てから外し、 知らせは落とす前の `flow` を見る) に揃える。
 *
 * 陽性 (落として伝える) と陰性 (自分へ戻る矢印を書かない図に触らない) の両側を置く。
 * 陽性だけでは「全ての矢印を落とす」 実装が通ってしまい、 識別力を示せない。
 */
import { describe, it, expect } from "vitest";
import { compile } from "@cardenelabs/cdl";
import { textDslToDiagram } from "../src/index";
import type { CompileNotice } from "../src/index";

/** 矢印を作る図種。 図全体を 1 箱で描く種別は矢印を作らないので別に見る */
const 矢印を作る図種 = [
  "sequence",
  "flow",
  "swimlane",
  "er",
  "state",
  "topology",
  "solidity",
  "class",
  "c4",
] as const;

/** 図全体を 1 箱で描く種別。 矢印は本数を数えて別の知らせで伝える */
const 一箱の図種 = ["gantt", "pie", "bar", "line", "funnel", "tree", "journey", "quadrant", "mind"] as const;

const 記法 = (type: string, 矢印: string[]): string =>
  [
    'title: "t"',
    `type: ${type}`,
    "",
    "actors:",
    '  - A: "10"',
    '  - B: "20"',
    "",
    "flow:",
    ...矢印,
    "",
  ].join("\n");

const 組む = (src: string): { 図: ReturnType<typeof textDslToDiagram>; 知らせ: CompileNotice[] } => {
  const 知らせ: CompileNotice[] = [];
  const 図 = textDslToDiagram(src, { onNotice: (n) => 知らせ.push(n) });
  return { 図, 知らせ };
};

const 自分へ = '  - A -> A: "自分に戻る"';
const 別の人へ = '  - A -> B: "進む"';

describe("自分へ戻る矢印を書いても組み立てが通る (#1227)", () => {
  for (const type of 矢印を作る図種) {
    it(`${type}`, () => {
      // **`compile` まで通す**。 組み立てが返っただけでは足りない = 落ちるのは描画の直前だった
      const { 図 } = 組む(記法(type, [自分へ, 別の人へ]));
      expect(() => compile(図)).not.toThrow();
    });
  }

  it("自分へ戻る矢印しか書いていない図でも通る", () => {
    const { 図 } = 組む(記法("state", [自分へ]));
    expect(() => compile(図)).not.toThrow();
  });
});

describe("落としても書いた人には届く (#1227)", () => {
  it("行番号付きで伝える", () => {
    const { 知らせ } = 組む(記法("state", [自分へ, 別の人へ]));
    const 該当 = 知らせ.filter((n) => n.kind === "flow-self-loop");
    expect(該当).toHaveLength(1);
    expect(該当[0]!.actor).toBe("A");
    // `flow:` は 8 行目、 最初の矢印は 9 行目
    expect(該当[0]!.line).toBe(9);
  });

  it("直し方を 2 通り案内する", () => {
    // 矢印としては描けないので、 代わりの書き方が無いと機能が減ったままになる
    const { 知らせ } = 組む(記法("state", [自分へ]));
    const 該当 = 知らせ.find((n) => n.kind === "flow-self-loop")!;
    expect(該当.hint).toContain("2 本に分ける");
    expect(該当.hint).toContain("animation");
  });

  it("同じ人に何本書いても 1 件にまとめる", () => {
    const { 知らせ } = 組む(記法("state", [自分へ, '  - A -> A: "もう 1 本"', 別の人へ]));
    expect(知らせ.filter((n) => n.kind === "flow-self-loop")).toHaveLength(1);
  });

  it("別々の人が書けばそれぞれ伝える", () => {
    const { 知らせ } = 組む(記法("state", [自分へ, '  - B -> B: "B も"']));
    const 該当 = 知らせ.filter((n) => n.kind === "flow-self-loop");
    expect(該当.map((n) => n.actor).sort()).toEqual(["A", "B"]);
  });
});

describe("落とすのは自分へ戻る矢印だけ (#1227)", () => {
  it("他の矢印は残る", () => {
    const { 図 } = 組む(記法("state", [自分へ, 別の人へ]));
    expect(図.edges.map((e) => `${e.from}->${e.to}`)).toEqual(["a->b"]);
  });

  it("自分へ戻る矢印を書かない図は矢印が 1 本も減らない (陰性対照)", () => {
    const { 図, 知らせ } = 組む(記法("state", [別の人へ, '  - B -> A: "戻る"']));
    expect(図.edges).toHaveLength(2);
    expect(知らせ.filter((n) => n.kind === "flow-self-loop")).toHaveLength(0);
  });
});

describe("1 箱で描く種別には出さない (#1227)", () => {
  for (const type of 一箱の図種) {
    it(`${type} は矢印を作らないので二重に伝えない`, () => {
      // これらは矢印を描かず本数を数えて `chart-edge-dropped` で伝えている。 重ねて出すと
      // 同じ 1 本について 2 件並ぶ
      const { 図, 知らせ } = 組む(記法(type, [自分へ, 別の人へ]));
      expect(() => compile(図)).not.toThrow();
      expect(知らせ.filter((n) => n.kind === "flow-self-loop")).toHaveLength(0);
    });
  }
});
