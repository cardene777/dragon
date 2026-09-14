/**
 * 記法の検査が書き手に出す文に、開いていない英単語とカタカナ語が残っていないことの検証 (#1940)。
 *
 * 記法の検査 (`lintDiagram`) の指摘の文と修正案は、記法の検査の道具 (`pnpm lint:notation`) が
 * そのまま書き手に出す。 直す前は `chart node "c0" が datum 0 件` や `参照先 id を修正 or dependsOn を除去`
 * のように、実装の言葉と英単語が混ざっていた。 画面の字と同じ判定 (`残る英単語` / `残るカタカナ語`) を当てる。
 *
 * 書き手が打ち込む識別子 (`dependsOn`) と書き手の値 (`id` や図の説明) は `` ` `` で囲む約束なので、
 * 囲んだ範囲は判定から外す。 自動修正できる指摘の修正案は書き手の値そのもの (直した後の説明) なので、
 * 文としては見ない。 値が自動修正の出力と一致することは記法の package の検査 (`notation-lint.test.ts`) が見る。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { lintDiagram } from "@cardenelabs/dragon";
import { 文に残る語 } from "./screen-words";

type 指摘 = ReturnType<typeof lintDiagram>["issues"][number];

const 記法の検査 = readFileSync(
  fileURLToPath(new URL("../../../../packages/dragon/src/notation-lint.ts", import.meta.url)),
  "utf8",
);

/** 書き手が読む文。 自動修正できる指摘の修正案は値なので外す */
function 読む文(i: 指摘): string {
  return i.autoFixable ? i.message : `${i.message}\n${i.suggestion ?? ""}`;
}

const 図 = (topic: string, nodes: Record<string, unknown>[] = []): CdlDiagram =>
  ({ id: "d", topic, nodes, edges: [] }) as unknown as CdlDiagram;

/**
 * 全規則を踏む図。 図の説明は実装の言葉 4 種を 1 つずつ踏み、自動修正できる形とできない形の両方を入れる
 * (できない形だけが直し方の文を修正案に持つ)。
 */
const 全規則を踏む図: CdlDiagram[] = [
  図("flow preset (詳細)"),
  図("ログイン (render 未実装)"),
  図("SVG polyline を使う"),
  図("polygon で描く図"),
  図("図の説明", [
    { id: "c0", kind: "chart-line", chartData: [] },
    { id: "c1", kind: "chart-pie", chartData: [{ id: "a", label: "A", value: 1 }] },
    { id: "g", kind: "gantt-timeline", ganttData: [{ id: "t1", dependsOn: "無い作業" }] },
    {
      id: "m",
      kind: "mind-map",
      mindData: { rootId: "root", branches: [{ id: "b1", parent: "無い枝" }] },
    },
    { id: "tr", kind: "tree-hierarchy", treeData: [{ id: "c1", parent: "無い項目" }] },
    { id: "q0", kind: "quadrant-matrix", quadrantData: { items: [] } },
    {
      id: "q1",
      kind: "quadrant-matrix",
      quadrantData: {
        items: [0, 1, 2, 3].map((i) => ({ id: `i${i}`, title: `T${i}`, quadrant: "topLeft" })),
      },
    },
    {
      id: "f",
      kind: "funnel-stages",
      funnelData: [
        { id: "s1", count: 100 },
        { id: "s2", count: 200 },
      ],
    },
  ]),
];

const 指摘たち = 全規則を踏む図.flatMap((d) => lintDiagram(d).issues);

describe("記法の検査が書き手に出す文 (#1940)", () => {
  it("全規則の指摘を集めている (規則の一覧は実物から読む)", () => {
    const 規則 = [...new Set([...記法の検査.matchAll(/\brule: "([a-z-]+)"/g)].map((m) => m[1]!))];
    expect(規則.length, "規則を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect([...new Set(指摘たち.map((i) => i.rule))].sort()).toEqual(規則.sort());
  });

  it("図の説明の実装の言葉を全種類踏んでいる (種類の数は実物から読む)", () => {
    const 種類 = (記法の検査.match(/\bhint: "/g) ?? []).length;
    expect(種類, "実装の言葉の種類を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    const 区切り = "入っている。";
    const 理由 = new Set(
      指摘たち
        .filter((i) => i.rule === "topic-redundant-implementation-detail")
        .map((i) => i.message.slice(i.message.indexOf(区切り) + 区切り.length).trim()),
    );
    expect(理由.size).toBe(種類);
  });

  it("自動修正できる指摘とできない指摘の両方を集めている", () => {
    expect(
      指摘たち.some((i) => i.autoFixable),
      "自動修正できる指摘が無い",
    ).toBe(true);
    expect(
      指摘たち.some((i) => !i.autoFixable && i.rule === "topic-redundant-implementation-detail"),
    ).toBe(true);
  });

  it("`` ` `` の外に、残す語の一覧の外の英単語が無い", () => {
    const 残る = 指摘たち.flatMap((i) => 文に残る語(読む文(i)).英.map((w) => `${i.rule}: ${w}`));
    expect(残る).toEqual([]);
  });

  it("`` ` `` の外に、残す語の一覧の外のカタカナ語が無い", () => {
    const 残る = 指摘たち.flatMap((i) => 文に残る語(読む文(i)).カナ.map((w) => `${i.rule}: ${w}`));
    expect(残る).toEqual([]);
  });

  it("植え込み対照: 直す前の文の英単語とカタカナ語を見つけ、囲んだ識別子は咎めない", () => {
    // 書き手の値 (`c0`) も囲んでいなかったので値ごと拾う
    expect(文に残る語('chart node "c0" が datum 0 件、 chart は非表示になる').英).toEqual([
      "chart",
      "node",
      "c0",
      "datum",
    ]);
    expect(文に残る語("item が 1 象限に集中、 マトリクスの意味が薄い").カナ).toEqual([
      "マトリクス",
    ]);
    expect(文に残る語("図表 `c0` に値 (`datum`) が 1 件も無く、 図表が描かれない")).toEqual({
      英: [],
      カナ: [],
    });
  });
});
