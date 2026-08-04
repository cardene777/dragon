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
import { diagram, layout } from "@cardenelabs/cdl";
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

  it("落とした見本は格子の枠を使わない", () => {
    // 枠を使うと、落とした見本の分だけ後続がずれる (実測 = 左端が 60 から 725 に動いた)
    const head = `title: "t"\ntype: flow\nactors:\n  - Web: service\n`;
    const tail = `\nflow:\n  - Web -> Web: "x"\n`;
    const big = makeOversize();
    const cat = { big, "parts-big": big, ok: OK, "parts-ok": OK };
    const leftOf = (src: string, alias: string): number => {
      const laid = layout(textDslToDiagram(src, { partsCatalog: cat }));
      const ns = laid.nodes.filter((n) => n.id.startsWith(`${alias}__`));
      return Math.min(...ns.map((n) => n.cx - n.w / 2));
    };
    const alone = leftOf(`${head}  - good: { kind: ok }\n${tail}`, "good");
    const withBad = leftOf(`${head}  - bad: { kind: big }\n  - good: { kind: ok }\n${tail}`, "good");
    expect(withBad, "落とした見本が枠を使って後続がずれている").toBeCloseTo(alone, 1);
  });

  it("落とした見本の仮の箱が後続と重ならない", () => {
    // 掃除しないと、格子から外した後続の見本と重なる (実測で 64,000 の重なり)
    const big = makeOversize();
    const cat = { big, "parts-big": big, ok: OK, "parts-ok": OK };
    const laid = layout(
      textDslToDiagram(
        `title: "t"\ntype: flow\nactors:\n  - Web: service\n  - bad: { kind: big }\n  - good: { kind: ok }\n\nflow:\n  - Web -> Web: "x"\n`,
        { partsCatalog: cat },
      ),
    );
    const rect = (n: { cx: number; cy: number; w: number; h: number }) => ({
      x0: n.cx - n.w / 2,
      x1: n.cx + n.w / 2,
      y0: n.cy - n.h / 2,
      y1: n.cy + n.h / 2,
    });
    const bad = laid.nodes.filter((n) => n.id === "bad" || n.id.startsWith("bad-")).map(rect);
    const good = laid.nodes.filter((n) => n.id.startsWith("good__")).map(rect);
    expect(good.length, "後続の見本が取り込まれていない").toBeGreaterThan(0);
    let overlap = 0;
    for (const a of bad) {
      for (const b of good) {
        const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
        const h = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
        if (w > 0 && h > 0) overlap += w * h;
      }
    }
    expect(overlap, `落とした見本の箱が後続と重なっている (${overlap})`).toBe(0);
  });

  it("同じ名前を 2 度書いても合計を超えない", () => {
    // 採否を名前で覚えると、先の 1 件が入れた名前で後の 1 件まで採用扱いになる
    const b = diagram("half", { topic: "half" }).lane("l", { width: 400 });
    for (let i = 0; i < Math.floor(MAX_INPUT_ELEMENTS * 0.6); i += 1) {
      b.node(`n${i}`, { lane: "l", stack: i, kind: "card", title: `n${i}`, w: 100, h: 40 });
    }
    const half = b.build();
    const d = textDslToDiagram(
      `title: "t"\ntype: flow\nactors:\n  - Web: service\n  - dup: { kind: half }\n  - dup: { kind: half }\n\nflow:\n  - Web -> Web: "x"\n`,
      { partsCatalog: { half, "parts-half": half } },
    );
    expect(countDiagramElements(d), "合計が上限を超えている").toBeLessThanOrEqual(
      MAX_INPUT_ELEMENTS,
    );
  });

  it("図が持てる並びは全部数える", () => {
    // 1 つでも数え漏らすと、そこに寄せた図が素通りする
    for (const key of ["inputs", "formulas", "scrollTriggers", "eventBindings", "readouts"]) {
      const d = {
        id: "p",
        topic: "p",
        lanes: [],
        nodes: [],
        edges: [],
        states: [],
        phases: [],
        [key]: Array.from({ length: MAX_INPUT_ELEMENTS + 1 }, (_, i) => ({ id: `x${i}` })),
      } as unknown as CdlDiagram;
      expect(countDiagramElements(d), `${key} を数えていない`).toBeGreaterThan(MAX_INPUT_ELEMENTS);
      expect(partIsMeasurable(d), `${key} だけで超えた図を通している`).toBe(false);
    }
  });

  it("合計で上限を超える分も落とす", () => {
    // 1 件ずつは上限以下でも、同じ見本を何度も参照すれば合計は超える
    // (実測 = 1,001 要素の見本を 3 名で参照して最終図が 3,005 要素になった)
    const b = diagram("half", { topic: "half" }).lane("l", { width: 400 });
    for (let i = 0; i < Math.floor(MAX_INPUT_ELEMENTS * 0.6); i += 1) {
      b.node(`n${i}`, { lane: "l", stack: i, kind: "card", title: `n${i}`, w: 100, h: 40 });
    }
    const half = b.build();
    const notices: CompileNotice[] = [];
    const d = textDslToDiagram(
      `title: "t"\ntype: flow\nactors:\n  - Web: service\n  - a: { kind: half }\n  - c: { kind: half }\n\nflow:\n  - Web -> Web: "x"\n`,
      { partsCatalog: { half, "parts-half": half }, onNotice: (n) => notices.push(n) },
    );
    expect(d.nodes.filter((n) => n.id.startsWith("a__")).length, "先に書いた分が落ちている").toBeGreaterThan(0);
    expect(d.nodes.filter((n) => n.id.startsWith("c__")).length, "合計で超えた分を落としていない").toBe(0);
    const n = notices.find((x) => x.kind === "part-not-drawn" && x.actor === "c");
    expect(n, "知らせが出ていない").toBeDefined();
    expect(n!.hint).toContain("図全体");
  });

  it("段の中身と読み取り部品も数える", () => {
    // 段を 1 件として数えるだけだと、段の中に大量の指定を持つ図が素通りする
    const withPhases = {
      id: "p",
      topic: "p",
      lanes: [{ id: "l", x: 0, width: 400 }],
      nodes: [{ id: "n", lane: "l", stack: 0, kind: "card", title: "n", w: 100, h: 40 }],
      edges: [],
      states: [],
      phases: [
        {
          id: "ph",
          duration: 1000,
          title: "t",
          body: "",
          activate: Array.from({ length: MAX_INPUT_ELEMENTS + 1 }, (_, i) => `n${i}`),
          tweens: [],
          sets: [],
        },
      ],
    } as unknown as CdlDiagram;
    expect(countDiagramElements(withPhases), "段の中身を数えていない").toBeGreaterThan(
      MAX_INPUT_ELEMENTS,
    );
    expect(partIsMeasurable(withPhases), "段の中身だけで超えた図を通している").toBe(false);
  });

  it("知らせに名前が入る", () => {
    const got = build(makeOversize());
    const n = got.notices.find((x) => x.kind === "part-not-drawn")!;
    expect(n.actor, "どの見本かが分からない").toBe("p");
    expect(n.line).toBe(0);
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
