/**
 * 大きすぎる見本を取り込まないことの検証 (#1015)。
 *
 * 上限を超えたまま取り込むと、既定の 400x200 の枠を確保した場所に中身が全て展開される。
 * 上限 (#1005) を置いた目的も達成されない = 上限は測定にしか効いていなかった。
 *
 * 見るのは「取り込まれた箱が 0 件であること」 と「知らせが出ること」 の 2 点。
 * 黙って落とすと「書いたのに出ない」 になり、綴りを疑うことになる。
 */
import { describe, it, expect } from "vitest";
import { diagram } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import {
  textDslToDiagram,
  MAX_INPUT_ELEMENTS,
  countDiagramElements,
  partIsMeasurable,
} from "../src/index";
import type { CompileNotice } from "../src/compile";

/** 普通の見本。 */
const OK: CdlDiagram = diagram("ok", { topic: "ok" })
  .lane("l", { width: 400 })
  .node("n", { lane: "l", stack: 0, kind: "card", title: "ok", w: 400, h: 300 })
  .build();

/** 上限を超える見本。 箱を上限より 1 つ多く持つ。 */
function makeOversize(): CdlDiagram {
  const b = diagram("big", { topic: "big" }).lane("l", { width: 400 });
  for (let i = 0; i <= MAX_INPUT_ELEMENTS; i += 1) {
    b.node(`n${i}`, { lane: "l", stack: i, kind: "card", title: `n${i}`, w: 100, h: 40 });
  }
  return b.build();
}

/**
 * 単体では配置計算が通らない見本。 存在しない縦列を指す箱を持つ。
 *
 * 取り込みは縦列を張り替えるため、この形でも取り込みは成功する。 配置計算で弾くと
 * 動いている本文が描けなくなるので、落とす条件には入れていない。
 */
const UNLAYOUTABLE: CdlDiagram = {
  id: "unlayoutable",
  topic: "unlayoutable",
  lanes: [{ id: "l", x: 0, width: 400 }],
  nodes: [
    { id: "a", lane: "l", stack: 0, kind: "card", title: "a", w: 200, h: 100 },
    { id: "orphan", lane: "missing", stack: 0, kind: "actor", title: "O" },
  ] as CdlDiagram["nodes"],
  edges: [],
  states: [],
  phases: [] as CdlDiagram["phases"],
};

const SRC = `title: "t"
type: flow

actors:
  - Web: service
  - p: { kind: target }

flow:
  - Web -> Web: "x"
`;

/** 取り込まれた箱の数と、出た知らせを返す。 */
function build(part: CdlDiagram): { merged: number; notices: CompileNotice[] } {
  const notices: CompileNotice[] = [];
  const d = textDslToDiagram(SRC, {
    partsCatalog: { target: part, "parts-target": part },
    onNotice: (n) => notices.push(n),
  });
  return { merged: d.nodes.filter((n) => n.id.startsWith("p__")).length, notices };
}

describe("大きすぎる見本は取り込まない (#1015)", () => {
  it("普通の見本は取り込む", () => {
    const got = build(OK);
    expect(got.merged, "取り込まれていない").toBeGreaterThan(0);
    expect(got.notices.filter((n) => n.kind === "part-not-drawn").length).toBe(0);
  });

  it("上限を超える見本は取り込まない", () => {
    const got = build(makeOversize());
    expect(got.merged, "上限を超えた図が取り込まれている").toBe(0);
    const n = got.notices.find((x) => x.kind === "part-not-drawn");
    expect(n, "知らせが出ていない").toBeDefined();
    expect(n!.message).toContain("大きすぎる");
  });

  it("単体で配置計算が通らない見本は落とさない", () => {
    // 取り込みは縦列を張り替えるので、この形でも取り込みは成功する。
    // 配置計算で弾くと、動いている本文が描けなくなる
    const got = build(UNLAYOUTABLE);
    expect(got.merged, "取り込めるはずの図を落としている").toBeGreaterThan(0);
    expect(got.notices.filter((n) => n.kind === "part-not-drawn").length).toBe(0);
  });

  it("残りの図は壊れない", () => {
    // 1 件が落ちても本体と他の見本は描ける
    const notices: CompileNotice[] = [];
    const src = `title: "t"
type: flow

actors:
  - Web: service
  - bad: { kind: big }
  - good: { kind: ok }

flow:
  - Web -> Web: "x"
`;
    const big = makeOversize();
    const d = textDslToDiagram(src, {
      partsCatalog: { big, "parts-big": big, ok: OK, "parts-ok": OK },
      onNotice: (n) => notices.push(n),
    });
    expect(d.nodes.filter((n) => n.id.startsWith("bad__")).length, "落とせていない").toBe(0);
    expect(d.nodes.filter((n) => n.id.startsWith("good__")).length, "巻き添えで落ちた").toBeGreaterThan(0);
    expect(d.nodes.some((n) => n.id.includes("web") || n.lane === "Web"), "本体が消えた").toBe(true);
  });

  it("判定そのもの", () => {
    expect(partIsMeasurable(OK)).toBe(true);
    expect(partIsMeasurable(makeOversize()), "上限超過を通している").toBe(false);
    expect(partIsMeasurable(UNLAYOUTABLE), "取り込める図を弾いている").toBe(true);
  });

  it("境目そのもので判定が切り替わる", () => {
    // 上限ちょうどは通し、1 つ超えたら落とす。 上限を 1 動かすとどちらかの期待が外れる。
    // 数え方は箱以外 (縦列など) も含むため、実際の数え上げから逆算する
    const withNodes = (n: number): CdlDiagram => {
      const b = diagram("edge", { topic: "edge" }).lane("l", { width: 400 });
      for (let i = 0; i < n; i += 1) {
        b.node(`n${i}`, { lane: "l", stack: i, kind: "card", title: `n${i}`, w: 100, h: 40 });
      }
      return b.build();
    };
    const overhead = countDiagramElements(withNodes(0));
    const atLimit = withNodes(MAX_INPUT_ELEMENTS - overhead);
    expect(countDiagramElements(atLimit), "上限ちょうどを作れていない").toBe(MAX_INPUT_ELEMENTS);
    expect(partIsMeasurable(atLimit), "上限ちょうどを弾いている").toBe(true);

    const overLimit = withNodes(MAX_INPUT_ELEMENTS - overhead + 1);
    expect(countDiagramElements(overLimit)).toBe(MAX_INPUT_ELEMENTS + 1);
    expect(partIsMeasurable(overLimit), "上限超過を通している").toBe(false);
  });
});
