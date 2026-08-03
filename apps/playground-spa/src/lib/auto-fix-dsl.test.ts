import { describe, expect, it } from "vitest";

import {
  applyOffsetsToFlow,
  findFlowRange,
  isEdgeLine,
  parseEdgeLine,
  splitFields,
  toSourceLines,
  usableEdgeLines,
  writeOffsetToEdgeLine,
  type EdgeRef,
  type NodeRef,
} from "./auto-fix-dsl";
import type { EdgeOffset } from "./auto-fix-offsets";

/**
 * 自動修正で得た offset を DSL に書き戻す経路 (#992)。
 *
 * 判定側 (`auto-fix-offsets`) は #382 で覆ったが、 書き戻す側は component の中にあり、
 * 経路が丸ごと壊れても判定側の test は通った。
 */

const SRC = [
  "kind: flow",
  "title: 見本",
  "actors:",
  "  - user",
  "  - post",
  "flow:",
  "  - user -> post: 書く",
  "  - post -> user: 返す",
  "note: 末尾",
].join("\n");

const NODES: NodeRef[] = [
  { id: "user", title: "user" },
  { id: "post", title: "post" },
];

const EDGES: EdgeRef[] = [
  { id: "e0", from: "user", to: "post", label: "書く" },
  { id: "e1", from: "post", to: "user", label: "返す" },
];

const offsets = (...pairs: ReadonlyArray<readonly [string, EdgeOffset]>): Map<string, EdgeOffset> =>
  new Map(pairs.map(([k, v]) => [k, v]));

describe("flow の範囲", () => {
  it("次の top-level key の手前まで", () => {
    expect(findFlowRange(SRC.split("\n"))).toEqual({ start: 5, end: 8 });
  });

  it("top-level key が続かなければ文書末まで", () => {
    expect(findFlowRange(["flow:", "  - a -> b: x"])).toEqual({ start: 0, end: 2 });
  });

  it("`flow:` が無ければ null", () => {
    expect(findFlowRange(["kind: flow", "title: x"])).toBeNull();
  });

  it("値を持つ `flow: x` は範囲の始まりにしない", () => {
    expect(findFlowRange(["flow: 何か"])).toBeNull();
  });
});

describe("edge の行の判定", () => {
  it("矢印を持つ項目行だけを edge とみなす", () => {
    expect(isEdgeLine("  - user -> post: 書く")).toBe(true);
    expect(isEdgeLine("  - user")).toBe(false);
    expect(isEdgeLine("  phase: 1")).toBe(false);
  });
});

describe("inline の分割", () => {
  it("field ごとに分ける", () => {
    expect(splitFields("tone: accent, labelOffsetY: 4")).toEqual(["tone: accent", "labelOffsetY: 4"]);
  });

  it("引用符の中の `,` では切らない", () => {
    expect(splitFields('sub: "あ, い", tone: accent')).toEqual(['sub: "あ, い"', "tone: accent"]);
  });

  it("引用符の中の逃がし文字を数える", () => {
    expect(splitFields('sub: "\\", い", tone: accent')).toEqual(['sub: "\\", い"', "tone: accent"]);
  });

  it("空なら空", () => {
    expect(splitFields("")).toEqual([]);
    expect(splitFields("  ,  ")).toEqual([]);
  });
});

describe("edge の行への書込み", () => {
  it("inline が無ければ足す", () => {
    expect(writeOffsetToEdgeLine("  - a -> b: x", { offsetY: 12 })).toBe("  - a -> b: x { labelOffsetY: 12 }");
  });

  it("既存の指定を残す", () => {
    // 丸ごと捨てると `tone` 等の指定まで消える。
    expect(writeOffsetToEdgeLine("  - a -> b: x { tone: accent }", { offsetY: 12 })).toBe(
      "  - a -> b: x { tone: accent, labelOffsetY: 12 }",
    );
  });

  it("既存の labelOffset は置き換える (積み増さない)", () => {
    expect(writeOffsetToEdgeLine("  - a -> b: x { labelOffsetY: 4 }", { offsetY: 12 })).toBe(
      "  - a -> b: x { labelOffsetY: 12 }",
    );
    expect(writeOffsetToEdgeLine("  - a -> b: x { labelOffsetX: 4, tone: accent }", { offsetY: 12 })).toBe(
      "  - a -> b: x { tone: accent, labelOffsetY: 12 }",
    );
  });

  it("引用符の中の同じ名前は壊さない", () => {
    // 正規表現で消す形だと `sub: ""` になった (codex review Round 1 の実測)。
    expect(writeOffsetToEdgeLine('  - a -> b: x { sub: "labelOffsetY: 4" }', { offsetY: 12 })).toBe(
      '  - a -> b: x { sub: "labelOffsetY: 4", labelOffsetY: 12 }',
    );
  });

  it("小数の値も丸ごと外す", () => {
    // 整数だけを消す形だと `.5` が残った。
    expect(writeOffsetToEdgeLine("  - a -> b: x { labelOffsetY: 4.5 }", { offsetY: 12 })).toBe(
      "  - a -> b: x { labelOffsetY: 12 }",
    );
    expect(writeOffsetToEdgeLine("  - a -> b: x { labelOffsetY: +4 }", { offsetY: 12 })).toBe(
      "  - a -> b: x { labelOffsetY: 12 }",
    );
    expect(writeOffsetToEdgeLine("  - a -> b: x { labelOffsetY: 1e2 }", { offsetY: 12 })).toBe(
      "  - a -> b: x { labelOffsetY: 12 }",
    );
  });

  it("名前が前方一致するだけの key は残す", () => {
    expect(writeOffsetToEdgeLine("  - a -> b: x { labelOffsetYY: 4 }", { offsetY: 12 })).toBe(
      "  - a -> b: x { labelOffsetYY: 4, labelOffsetY: 12 }",
    );
  });

  it("X と Y の両方を書ける", () => {
    expect(writeOffsetToEdgeLine("  - a -> b: x", { offsetY: 12, offsetX: -3 })).toBe(
      "  - a -> b: x { labelOffsetY: 12, labelOffsetX: -3 }",
    );
  });

  it("空の指定になれば波括弧ごと消す", () => {
    expect(writeOffsetToEdgeLine("  - a -> b: x { labelOffsetY: 4 }", {})).toBe("  - a -> b: x");
  });
});

describe("edge の行の読み取り", () => {
  it("from / to / label を読む", () => {
    expect(parseEdgeLine("  - user -> post: 書く")).toEqual({ from: "user", to: "post", label: "書く" });
  });

  it("label が無い形も読む", () => {
    expect(parseEdgeLine("  - user -> post")).toEqual({ from: "user", to: "post", label: "" });
  });

  it("inline は label に混ぜない", () => {
    expect(parseEdgeLine("  - user -> post: 書く { tone: accent }")).toEqual({
      from: "user",
      to: "post",
      label: "書く",
    });
  });

  it("引用符を外す", () => {
    expect(parseEdgeLine('  - "Web Front" -> "API Server": 呼ぶ')).toEqual({
      from: "Web Front",
      to: "API Server",
      label: "呼ぶ",
    });
  });

  it("edge でない行は null", () => {
    expect(parseEdgeLine("  - user")).toBeNull();
  });
});

describe("書き戻し", () => {
  it("from / to / label で行に当てる", () => {
    const r = applyOffsetsToFlow(SRC, EDGES, NODES, offsets(["e1", { offsetY: 9 }]));
    expect(r.applied).toEqual(["e1"]);
    expect(r.unmatched).toEqual([]);
    expect(r.src!.split("\n")[6]).toBe("  - user -> post: 書く");
    expect(r.src!.split("\n")[7]).toBe("  - post -> user: 返す { labelOffsetY: 9 }");
  });

  it("行の順番と edge の順番が違っても正しい行に当てる", () => {
    // compiler は DSL の行順どおりに edge を作らない。 実測 = `a -> c` / `c -> b` と書くと
    // `e-a-b` / `e-b-c` の順になり、 label も入れ替わる。
    const src = ["flow:", "  - a -> c: いち", "  - c -> b: に"].join("\n");
    const nodes: NodeRef[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const edges: EdgeRef[] = [
      { id: "e-a-b", from: "c", to: "b", label: "に" },
      { id: "e-b-c", from: "a", to: "c", label: "いち" },
    ];
    const r = applyOffsetsToFlow(src, edges, nodes, offsets(["e-b-c", { offsetY: 9 }]));
    expect(r.applied).toEqual(["e-b-c"]);
    expect(r.src).toBe(["flow:", "  - a -> c: いち { labelOffsetY: 9 }", "  - c -> b: に"].join("\n"));
  });

  it("DSL の名前が node の title の時も引き当てる", () => {
    const src = ["flow:", "  - Web Front -> API Server: 呼ぶ"].join("\n");
    const nodes: NodeRef[] = [
      { id: "web-front", title: "Web Front" },
      { id: "api-server", title: "API Server" },
    ];
    const edges: EdgeRef[] = [{ id: "e0", from: "web-front", to: "api-server", label: "呼ぶ" }];
    const r = applyOffsetsToFlow(src, edges, nodes, offsets(["e0", { offsetY: 9 }]));
    expect(r.src).toBe(["flow:", "  - Web Front -> API Server: 呼ぶ { labelOffsetY: 9 }"].join("\n"));
  });

  it("同じ 3 つ組で後ろの edge だけが対象でも、 その edge の行に当てる", () => {
    // 対象だけを走査すると前の行に当ててしまう (codex review Round 2 の指摘)。
    const src = ["flow:", "  - a -> b: x", "  - a -> b: x"].join("\n");
    const nodes: NodeRef[] = [{ id: "a" }, { id: "b" }];
    const edges: EdgeRef[] = [
      { id: "e0", from: "a", to: "b", label: "x" },
      { id: "e1", from: "a", to: "b", label: "x" },
    ];
    const r = applyOffsetsToFlow(src, edges, nodes, offsets(["e1", { offsetY: 9 }]));
    expect(r.applied).toEqual(["e1"]);
    expect(r.src).toBe(["flow:", "  - a -> b: x", "  - a -> b: x { labelOffsetY: 9 }"].join("\n"));
  });

  it("同じ 3 つ組の行が 2 本あれば別々の行に当てる", () => {
    const src = ["flow:", "  - a -> b: x", "  - a -> b: x"].join("\n");
    const nodes: NodeRef[] = [{ id: "a" }, { id: "b" }];
    const edges: EdgeRef[] = [
      { id: "e0", from: "a", to: "b", label: "x" },
      { id: "e1", from: "a", to: "b", label: "x" },
    ];
    const r = applyOffsetsToFlow(src, edges, nodes, offsets(["e0", { offsetY: 1 }], ["e1", { offsetY: 2 }]));
    expect(r.src).toBe(
      ["flow:", "  - a -> b: x { labelOffsetY: 1 }", "  - a -> b: x { labelOffsetY: 2 }"].join("\n"),
    );
  });

  it("対応する行が無ければ unmatched に入れる", () => {
    // 数えると本文が変わっていないのに「反映しました」 と出る。
    const edges: EdgeRef[] = [{ id: "e9", from: "居ない", to: "居ない", label: "" }];
    const r = applyOffsetsToFlow(SRC, edges, NODES, offsets(["e9", { offsetY: 9 }]));
    expect(r.applied).toEqual([]);
    expect(r.unmatched).toEqual(["e9"]);
    expect(r.src).toBeNull();
  });

  it("edge に無い id も unmatched に入れる", () => {
    const r = applyOffsetsToFlow(SRC, EDGES, NODES, offsets(["居ない", { offsetY: 9 }]));
    expect(r.unmatched).toEqual(["居ない"]);
  });

  it("範囲の外は触らない", () => {
    const src = ["flow:", "  - a -> b: x", "note:", "  - c -> d: y"].join("\n");
    const nodes: NodeRef[] = [{ id: "c" }, { id: "d" }];
    const edges: EdgeRef[] = [{ id: "e1", from: "c", to: "d", label: "y" }];
    const r = applyOffsetsToFlow(src, edges, nodes, offsets(["e1", { offsetY: 9 }]));
    expect(r.src).toBeNull();
    expect(r.unmatched).toEqual(["e1"]);
  });

  it("offset が空なら何もしない", () => {
    const r = applyOffsetsToFlow(SRC, EDGES, NODES, offsets());
    expect(r).toEqual({ src: null, applied: [], unmatched: [] });
  });

  it("`flow:` が無ければ全て unmatched", () => {
    const r = applyOffsetsToFlow("kind: flow", EDGES, NODES, offsets(["e0", { offsetY: 9 }]));
    expect(r.src).toBeNull();
    expect(r.unmatched).toEqual(["e0"]);
  });

  it("組み立て側が返した行を優先する", () => {
    // preset ごとの規則を知っているのは組み立て側だけ。 `type: flow` は from / to / label の
    // 照合でも取れない形があるので、 返ってきた行をそのまま使う (#998)。
    const src = ["flow:", "  - a -> c: いち", "  - c -> b: に"].join("\n");
    const nodes: NodeRef[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
    // `compileFlow` は actor の鎖を作るので from / to が DSL と食い違う。
    const edges: EdgeRef[] = [
      { id: "e-a-b", from: "a", to: "b", label: "に" },
      { id: "e-b-c", from: "b", to: "c", label: "いち" },
    ];
    const r = applyOffsetsToFlow(
      src,
      edges,
      nodes,
      offsets(["e-b-c", { offsetY: 9 }]),
      new Map([
        ["e-a-b", 3],
        ["e-b-c", 2],
      ]),
    );
    expect(r.applied).toEqual(["e-b-c"]);
    expect(r.src).toBe(["flow:", "  - a -> c: いち { labelOffsetY: 9 }", "  - c -> b: に"].join("\n"));
  });

  it("組み立て側が返した行が範囲の外なら使わない", () => {
    // 別の section を書き換えないため。
    const src = ["flow:", "  - a -> b: x", "note:", "  - c -> d: y"].join("\n");
    const nodes: NodeRef[] = [{ id: "a" }, { id: "b" }];
    const edges: EdgeRef[] = [{ id: "e0", from: "a", to: "b", label: "x" }];
    const r = applyOffsetsToFlow(src, edges, nodes, offsets(["e0", { offsetY: 9 }]), new Map([["e0", 4]]));
    // 範囲外は使わず、 照合で 2 行目に当たる。
    expect(r.src).toBe(["flow:", "  - a -> b: x { labelOffsetY: 9 }", "note:", "  - c -> d: y"].join("\n"));
  });

  it("組み立て側が返した行が edge 行でなければ使わない", () => {
    const src = ["flow:", "  - phase: 2", "  - a -> b: x"].join("\n");
    const nodes: NodeRef[] = [{ id: "a" }, { id: "b" }];
    const edges: EdgeRef[] = [{ id: "e0", from: "a", to: "b", label: "x" }];
    const r = applyOffsetsToFlow(src, edges, nodes, offsets(["e0", { offsetY: 9 }]), new Map([["e0", 2]]));
    expect(r.src).toBe(["flow:", "  - phase: 2", "  - a -> b: x { labelOffsetY: 9 }"].join("\n"));
  });

  it("既に同じ値なら書き換えない (applied には数える)", () => {
    const once = applyOffsetsToFlow(SRC, EDGES, NODES, offsets(["e1", { offsetY: 9 }]));
    const twice = applyOffsetsToFlow(once.src!, EDGES, NODES, offsets(["e1", { offsetY: 9 }]));
    expect(twice.src).toBeNull();
    expect(twice.applied).toEqual(["e1"]);
  });
});

describe("行番号を元の本文に戻す (#998)", () => {
  it("パーツを抜いた分だけずれた行番号を戻す", () => {
    // 組み立てに渡すのはパーツの行を抜いた本文。 戻さないと別の行を指す。
    const lineMap = [1, 2, 5, 6, 7];
    expect(toSourceLines(new Map([["e0", 3]]), lineMap)).toEqual(new Map([["e0", 5]]));
    expect(toSourceLines(new Map([["e0", 1]]), lineMap)).toEqual(new Map([["e0", 1]]));
  });

  it("表に無い行は捨てる", () => {
    // 推測で近い行に寄せると、 誤った行を書き換えて成功と報告する。
    expect(toSourceLines(new Map([["e0", 9]]), [1, 2])).toEqual(new Map());
    expect(toSourceLines(new Map([["e0", 0]]), [1, 2])).toEqual(new Map());
  });

  it("空なら空", () => {
    expect(toSourceLines(new Map(), [1, 2])).toEqual(new Map());
  });
});

describe("表を使ってよいか (#998)", () => {
  it("組み立てた時の本文と同じなら使う", () => {
    const lines = new Map([["e0", 2]]);
    expect(usableEdgeLines({ src: "x", lines }, "x")).toBe(lines);
  });

  it("本文が変わっていれば使わない", () => {
    // 入力から再描画までの間に押されると、 古い行番号が別の行を指す。
    expect(usableEdgeLines({ src: "x", lines: new Map([["e0", 2]]) }, "y")).toBeUndefined();
  });
});
