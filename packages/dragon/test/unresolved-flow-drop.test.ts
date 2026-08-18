/**
 * 解決できない矢印で図が壊れる件 (#1219)。
 *
 * `#1209` は動きを書いた 2 経路 (汎用 / 順序図) で矢印を落としたが、 それ以外は手付かずだった。
 * 知らせ (`flow-actor-missing`) は出るのに **図まで壊れる** 状態が残っていた。
 *
 * 実測すると Issue の表と 2 点違った。
 *
 * | Issue の表 | 実測 |
 * |---|---|
 * | 9 図種が壊れる (`mind` を含む) | **8 図種**。 `mind` は `#1177` で 1 箱の種別に寄せた時に直っていた |
 * | 動きを書いた図は `#1209` で塞いだ | `sequence` / `solidity` / `class` / `c4` は **動きを書いても壊れる** |
 *
 * 扱いは図種ごとの表 (`解決できない矢印の扱い`) が持ち、 `Record<PresetType, ...>` なので
 * 図種を足した時に決め忘れると型検査が落ちる。
 */
import { describe, it, expect } from "vitest";
import { compile } from "@cardenelabs/cdl";
import { textDslToDiagram } from "../src/index";
import type { CompileNotice } from "../src/index";

/** 記法の全図種 */
const 図種 = [
  "sequence",
  "flow",
  "swimlane",
  "er",
  "state",
  "topology",
  "solidity",
  "gantt",
  "class",
  "pie",
  "bar",
  "line",
  "funnel",
  "tree",
  "journey",
  "quadrant",
  "c4",
  "mind",
] as const;

const 記法 = (type: string, opts: { 動き?: boolean; 矢印?: string } = {}): string => {
  const 矢印 = opts.矢印 ?? "  - A -> 居ない人: \"x\"";
  return [
    'title: "t"',
    `type: ${type}`,
    "",
    "actors:",
    '  - A: "10"',
    '  - B: "20"',
    "",
    "flow:",
    矢印,
    ...(opts.動き ? ["", "animation:", '  - step: "s" 1.0s', "    focus: [A]"] : []),
    "",
  ].join("\n");
};

const 組む = (src: string): { 図: ReturnType<typeof textDslToDiagram>; 知らせ: CompileNotice[] } => {
  const 知らせ: CompileNotice[] = [];
  const 図 = textDslToDiagram(src, { onNotice: (n) => 知らせ.push(n) });
  return { 図, 知らせ };
};

describe("解決できない矢印を書いても、 どの図種でも組み立てが通る", () => {
  for (const type of 図種) {
    for (const 動き of [false, true]) {
      it(`${type} / 動き=${動き ? "あり" : "なし"}`, () => {
        // **`compile` まで通す**。 組み立てが返っただけでは足りない = 壊れた図は描画の直前に
        // `unknown-ref` で落ちる形だった
        const { 図 } = 組む(記法(type, { 動き }));
        expect(() => compile(図)).not.toThrow();
      });
    }
  }
});

describe("落としても書いた人には届く", () => {
  it("矢印を落とした図種でも知らせは出る", () => {
    // 知らせは落とす前の矢印を見る。 落とした後を渡すと、 外した矢印が届かなくなる
    const { 知らせ } = 組む(記法("sequence"));
    const 該当 = 知らせ.filter((n) => n.kind === "flow-actor-missing");
    expect(該当).toHaveLength(1);
    expect(該当[0]!.actor).toBe("居ない人");
  });

  it("全ての矢印が解決できない図でも知らせは出る", () => {
    const { 知らせ } = 組む(記法("state", { 矢印: '  - 居ない人 -> 別の居ない人: "x"' }));
    const 該当 = 知らせ.filter((n) => n.kind === "flow-actor-missing");
    expect(該当.map((n) => n.actor).sort()).toEqual(["別の居ない人", "居ない人"]);
  });
});

describe("落とすのは解決できない矢印だけ", () => {
  it("解決できる矢印は残る", () => {
    const { 図 } = 組む(記法("state", { 矢印: '  - A -> B: "渡す"' }));
    expect(図.edges).toHaveLength(1);
    expect(図.edges[0]!.label).toBe("渡す");
  });

  it("解決できる矢印と解決できない矢印が混ざっても、 解決できる方は残る", () => {
    const src = [
      'title: "t"',
      "type: state",
      "",
      "actors:",
      "  - A",
      "  - B",
      "",
      "flow:",
      '  - A -> B: "渡す"',
      '  - A -> 居ない人: "落ちる"',
      "",
    ].join("\n");
    const { 図 } = 組む(src);
    expect(図.edges.map((e) => e.label)).toEqual(["渡す"]);
    expect(() => compile(図)).not.toThrow();
  });
});

describe("1 箱で描く図種は中央で落とさない", () => {
  it("木の独自の知らせが引き続き出る", () => {
    // 中央で外すと、 木が「書いていない名前を親にしています」 と言えなくなる
    const { 知らせ } = 組む(記法("tree", { 矢印: '  - 居ない人 -> A: "x"' }));
    const 該当 = 知らせ.filter((n) => n.message.includes("type: tree で書いていない名前を親に"));
    expect(該当.length, "木の独自の知らせが消えている").toBeGreaterThan(0);
  });

  it("値で描く図の本数の知らせが変わらない", () => {
    // 本数を数えて伝えるので、 中央で外すと数が減る / 全部消えると知らせごと消える
    const src = [
      'title: "t"',
      "type: pie",
      "",
      "actors:",
      '  - A: "10"',
      '  - B: "20"',
      "",
      "flow:",
      '  - A -> 居ない人: "x"',
      '  - B -> 別の居ない人: "y"',
      "",
    ].join("\n");
    const { 知らせ } = 組む(src);
    const 該当 = 知らせ.filter((n) => n.kind === "chart-edge-dropped");
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message, "本数が減っている").toContain("2 本");
  });

  it("放射の本数の知らせも変わらない", () => {
    const { 知らせ } = 組む(記法("mind", { 矢印: '  - A -> 居ない人: "x"' }));
    const 該当 = 知らせ.filter((n) => n.kind === "chart-edge-dropped");
    expect(該当).toHaveLength(1);
    expect(該当[0]!.message).toContain("1 本");
  });
});

describe("矢印の端から箱を作る図種 (swimlane)", () => {
  const 箱の題 = (src: string): string[] =>
    組む(src)
      .図.nodes.map((n) => n.title)
      .sort();

  it("矢印を 1 本も書かなくても登場人物が箱になる", () => {
    // この図種は矢印の端から箱を作る。 受け皿が無いと箱が 0 件で `compile` が落ちる
    // (本 Issue の前から落ちていた)
    const src = 'title: "t"\ntype: swimlane\n\nactors:\n  - A\n  - B\n';
    expect(箱の題(src)).toEqual(["A", "B"]);
    expect(() => compile(組む(src).図)).not.toThrow();
  });

  it("解決できない矢印だけの図も、 登場人物が箱になる", () => {
    expect(箱の題(記法("swimlane"))).toEqual(["A", "B"]);
  });

  it("解決できる矢印が 1 本でもあれば受け皿は働かない", () => {
    // 働かせると、 矢印に出てこない登場人物にも箱が増えて既存の図の見た目が変わる
    const src = [
      'title: "t"',
      "type: swimlane",
      "",
      "actors:",
      "  - A",
      "  - B",
      "  - C",
      "",
      "flow:",
      '  - A -> B: "x"',
      "",
    ].join("\n");
    expect(箱の題(src), "矢印に出てこない C にも箱が増えている").toEqual(["A", "B"]);
  });
});
