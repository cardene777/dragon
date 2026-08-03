/**
 * 大きすぎる入力を組み立てる前に止める (#1005)。
 *
 * 組み立てにかかる時間は要素数の 2 乗で伸びる (実測 = 1,000 件 104ms / 2,000 件 346ms /
 * 5,000 件 1,647ms / 10,000 件 7,622ms)。 待機の後に同じ流れの中で走るため、 大きな本文を
 * 貼ると editor が操作を受け付けなくなる。
 *
 * 見本は 1 図あたり平均 4 要素、 最も多い file でも平均 7 要素。 上限 (2,000 件) との差は
 * 桁が 2-3 つあるので、 正当な図には当たらない。
 */
import { describe, it, expect } from "vitest";
import {
  textDslToDiagram,
  jsonToDiagram,
  MAX_INPUT_ELEMENTS,
  MAX_INPUT_BYTES,
  countBytes,
  countDiagramElements,
  describeOversize,
} from "../src/index";

/** 要素だけを n 件並べた本文 */
function actorsOnly(n: number): string {
  const actors = Array.from({ length: n }, (_, i) => `  - A${i}`).join("\n");
  return `title: "size"\ntype: sequence\n\nactors:\n${actors}\n\nflow: []\n`;
}

describe("大きすぎる入力は組み立てない (#1005)", () => {
  it("上限を超える要素数は投げる", () => {
    expect(() => textDslToDiagram(actorsOnly(MAX_INPUT_ELEMENTS + 1))).toThrow(/要素が/);
  });

  it("投げる文に件数と上限が入る (何をどう直せばよいか分かる)", () => {
    try {
      textDslToDiagram(actorsOnly(MAX_INPUT_ELEMENTS + 1));
      expect.unreachable("投げていない");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      expect(msg).toContain((MAX_INPUT_ELEMENTS + 1).toLocaleString());
      expect(msg).toContain(MAX_INPUT_ELEMENTS.toLocaleString());
    }
  });

  it("上限ちょうどは通る", () => {
    // 境界の内側。 上限を「以上」 で判定していると、 ここで落ちる
    const d = textDslToDiagram(actorsOnly(MAX_INPUT_ELEMENTS));
    expect(d.nodes.length).toBeGreaterThan(0);
  });

  it("実用の規模は当たらない", () => {
    const d = textDslToDiagram(actorsOnly(20));
    expect(d.nodes.length).toBeGreaterThan(0);
  });

  it("JSON の経路も同じ上限で止まる", () => {
    const json = {
      title: "size",
      type: "sequence",
      actors: Array.from({ length: MAX_INPUT_ELEMENTS + 1 }, (_, i) => `A${i}`),
      flow: [],
    };
    expect(() => jsonToDiagram(json)).toThrow(/要素が/);
  });

  it("JSON の経路も上限内なら通る", () => {
    const json = {
      title: "size",
      type: "sequence",
      actors: ["A", "B"],
      flow: [{ from: "A", to: "B", label: "go" }],
    };
    expect(jsonToDiagram(json).nodes.length).toBeGreaterThan(0);
  });
});

describe("大きすぎる本文は読み取る前に止める (#1005)", () => {
  it("上限を超える本文は投げる", () => {
    // 要素数が少なくても、 本文そのものが巨大なら読み取りで待たされる (11.9MB で記憶 200MB)
    const huge = `title: "${"あ".repeat(MAX_INPUT_BYTES)}"\ntype: sequence\n\nactors:\n  - A\n\nflow: []\n`;
    expect(countBytes(huge)).toBeGreaterThan(MAX_INPUT_BYTES);
    expect(() => textDslToDiagram(huge)).toThrow(/本文が/);
  });

  it("上限内の本文は通る", () => {
    const ok = `title: "${"あ".repeat(1000)}"\ntype: sequence\n\nactors:\n  - A\n  - B\n\nflow:\n  - A -> B: "go"\n`;
    expect(countBytes(ok)).toBeLessThan(MAX_INPUT_BYTES);
    expect(textDslToDiagram(ok).nodes.length).toBeGreaterThan(0);
  });

  it("50,000 byte でも要素が少なければ通る", () => {
    // 止めているのは要素数で、 本文の長さではない。 長い説明文を持つ図は大きくても通る。
    //
    // 同じ 50,000 byte でも、 要素だけを並べた形 (約 5,000 件) は止まる。 組み立ての重さは
    // 本文の長さではなく要素数で決まるため (実測 = 5,000 件で 1,647ms)。
    const long = "あ".repeat(16000); // 3 byte × 16,000 ≈ 48,000 byte
    const src = `title: "図"\ntype: sequence\n\nactors:\n  - A\n  - B\n\nflow:\n  - A -> B: "${long}"\n`;
    expect(countBytes(src)).toBeGreaterThan(45000);
    expect(textDslToDiagram(src).nodes.length).toBeGreaterThan(0);
  });
});

describe("段の中身も数える (#1005)", () => {
  it("1 段に大量の相手を書いた形も止まる", () => {
    // 段の数だけを見ると 1 件として通る。 組み立ての中で約 100 万件に展開され、
    // 呼び出しの深さが上限を超えて落ちる (review が実測で再現した形)
    const targets = Array.from({ length: MAX_INPUT_ELEMENTS + 1 }, (_, i) => `A${i % 3}`).join(", ");
    const src = `title: "anim"
type: sequence

actors:
  - A0
  - A1
  - A2

flow:
  - A0 -> A1: "go"

animation:
  - step: "s" 1.0s
    focus: [${targets}]
`;
    expect(() => textDslToDiagram(src)).toThrow(/要素が/);
  });

  it("段の中身が少なければ従来どおり通る", () => {
    const src = `title: "anim"
type: sequence

actors:
  - A
  - B

flow:
  - A -> B: "go"

animation:
  - step: "s" 1.0s
    focus: [A, B]
`;
    expect(textDslToDiagram(src).nodes.length).toBeGreaterThan(0);
  });
});

describe("組み立て済みの図からも数える (#1005)", () => {
  it("要素が多い図は上限を超えると判定できる", () => {
    const big = {
      nodes: Array.from({ length: MAX_INPUT_ELEMENTS + 1 }, (_, i) => ({ id: `n${i}` })),
      edges: [],
      lanes: [],
      states: [],
      phases: [],
    };
    expect(countDiagramElements(big)).toBe(MAX_INPUT_ELEMENTS + 1);
    expect(describeOversize({ elements: countDiagramElements(big), bytes: 0 })).toContain("要素が");
  });

  it("空の図は 0 件", () => {
    expect(countDiagramElements({})).toBe(0);
  });

  it("全ての種類を合算する", () => {
    expect(
      countDiagramElements({ nodes: [1], edges: [1, 2], lanes: [1], states: [1, 2, 3], phases: [1] }),
    ).toBe(8);
  });
});

describe("大きさの判定そのもの (#1005)", () => {
  it("上限を 1 byte 超えた時、 表示上も上限より大きいと分かる", () => {
    // MB 小数 1 桁だと「0.5MB / 上限 0.5MB」 と同じ数字が並び、 制限内なのに拒まれたように読める
    const msg = describeOversize({ elements: 0, bytes: MAX_INPUT_BYTES + 1 });
    expect(msg).toContain("513KB");
    expect(msg).toContain("512KB");
  });

  it("上限ちょうどは通る", () => {
    expect(describeOversize({ elements: 0, bytes: MAX_INPUT_BYTES })).toBeNull();
  });

  it("収まっていれば null", () => {
    expect(describeOversize({ elements: 10, bytes: 100 })).toBeNull();
  });

  it("要素数を先に見る (両方超えていても件数を伝える)", () => {
    const msg = describeOversize({ elements: MAX_INPUT_ELEMENTS + 1, bytes: MAX_INPUT_BYTES + 1 });
    expect(msg).toContain("要素が");
  });

  it("大きさ 0 を渡すと大きさは見ない (合流点で件数だけ見る用)", () => {
    expect(describeOversize({ elements: 10, bytes: 0 })).toBeNull();
  });

  it("文字数ではなく byte で数える", () => {
    // 日本語は 1 文字 3 byte。 文字数で数えると 3 倍見逃す
    expect(countBytes("あ")).toBe(3);
    expect(countBytes("a")).toBe(1);
  });
});
