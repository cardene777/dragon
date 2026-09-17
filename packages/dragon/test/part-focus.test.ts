/**
 * 段の `focus` に書いた部品の名前で、部品の要素と部品の中の線を光らせる (#2150)。
 *
 * 組み立ては部品の名前を仮の箱として置き、段の `focus` を仮の箱の id に解決する。 部品を取り込む時に
 * 仮の箱を消し、段の光らせる相手からも仮の箱の id を外していた (存在しない id を残さないため、#873)。
 * 部品の要素に置き換えていなかったので、部品の名前を書いた段は何も光らせなかった
 * (実測 = 部品を繋いで動かす頁の 5 見本で、部品の名前を書いた 13 段が 1 つも部品を光らせない)。
 *
 * ## 何を見るか
 *
 * | 形 | 見ること |
 * |---|---|
 * | 部品の名前を書いた段 | 部品の要素と中の線が光らせる相手に入る |
 * | 部品の名前を書かない段 | 部品の要素が入らない |
 * | 図種 (`swimlane` / `flow` / `sequence`) | 仮の箱の id の形が違っても同じく光る |
 * | 部品の段を外さない部品 | 部品の段と宿主の段が合わさっても、宿主の段で書いた部品が光る |
 * | 同じ部品を 2 度書く / 部品の段も同じ要素を光らせる | 同じ id を 2 度入れない |
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram, type CompileNotice } from "../src/index";
import { 部品の一覧を作る } from "../../../apps/playground-spa/src/lib/parts-catalog";
import * as カタログの部品 from "../../../apps/playground-spa/src/topics/catalog/parts.cdl";
import * as 繋いで動かす見本 from "../../../apps/playground-spa/src/topics/catalog/parts-motion.cdl";

/** 入口 1 つを出口 2 つへ分ける部品。 要素 3 つと中の線 2 本を持つ (カタログの振り分け器と同じ形) */
const 分岐: CdlDiagram = {
  id: "parts-split2",
  topic: "split2",
  lanes: [
    { id: "sl1", x: 0, width: 200, label: "入口" },
    { id: "sl2", x: 220, width: 200, label: "出口" },
  ],
  nodes: [
    { id: "inP", lane: "sl1", stack: 0, kind: "card", title: "入口", w: 180, h: 180 },
    { id: "outA", lane: "sl2", stack: 0, kind: "card", title: "出口 A", w: 180, h: 180 },
    { id: "outB", lane: "sl2", stack: 1, kind: "card", title: "出口 B", w: 180, h: 180 },
  ] as CdlDiagram["nodes"],
  edges: [
    { id: "a", from: "inP", to: "outA", label: "A へ", tone: "success" },
    { id: "b", from: "inP", to: "outB", label: "B へ", tone: "warning" },
  ] as CdlDiagram["edges"],
  states: [{ id: "lv", initial: 0 }],
  phases: [
    { id: "own", title: "自分の段", body: "", duration: 1000, activate: ["inP"], tweens: [], sets: [] },
  ] as CdlDiagram["phases"],
};

const 部品の一覧: Record<string, CdlDiagram> = { split2: 分岐 };

/** 分岐の要素と中の線を、図に入った id で並べる */
const 印の全て = ["印__inP", "印__outA", "印__outB", "印__a", "印__b"];

function 組み立てる(src: string): CdlDiagram {
  return textDslToDiagram(src, { partsCatalog: 部品の一覧 });
}

const 本文 = (型: string, 部品の欄 = ", phase: false") => `title: "t"
type: ${型}

actors:
  - 受付: { kind: card }
  - 印: { kind: split2${部品の欄} }

flow:
  - 受付 -> 印: "届く" { toPartNode: inP }

animation:
  - step: "1. 分ける" 1s
    focus: [印]
  - step: "2. 受ける" 1s
    focus: [受付]
`;

describe("段の focus に書いた部品の名前で、部品を光らせる (#2150)", () => {
  it("部品の名前を書いた段で、部品の要素と中の線が光る", () => {
    const 図 = 組み立てる(本文("swimlane"));
    // 部品の要素が図に入っている (入っていなければ下の期待は前提から崩れている)
    expect(図.nodes.map((n) => n.id)).toEqual(expect.arrayContaining(["印__inP", "印__outA", "印__outB"]));
    expect(図.phases[0]!.activate).toEqual(expect.arrayContaining(印の全て));
  });

  it("部品の名前を書かない段には、部品の要素が入らない", () => {
    const 図 = 組み立てる(本文("swimlane"));
    expect(図.phases[1]!.activate.filter((id) => id.startsWith("印__"))).toEqual([]);
    expect(図.phases[1]!.activate).toContain("受付");
  });

  it.each(["swimlane", "flow", "sequence"])("%s でも部品の名前を書いた段で部品が光る", (型) => {
    const 図 = 組み立てる(本文(型));
    expect(図.phases.length, "段が組み立っていない").toBeGreaterThanOrEqual(2);
    expect(図.phases[0]!.activate).toEqual(expect.arrayContaining(印の全て));
  });

  it("部品の名前を slug の形で書いても光る (箱の名前と同じ受け付け)", () => {
    // 図種ごとの解決は、名前が見つからない時に slug の形でも探す。 部品だけが光らないと
    // 同じ書き方が箱と部品で別の意味になる
    const 図 = 組み立てる(
      本文("swimlane").replaceAll("印", "Split Box").replace("focus: [Split Box]", "focus: [split-box]"),
    );
    expect(図.phases[0]!.activate).toEqual(expect.arrayContaining(["Split Box__inP", "Split Box__a"]));
  });

  it("部品の段を外さない部品でも、宿主の段で書いた部品が光る", () => {
    // 部品の段 (入口を光らせる) は宿主の 1 段目に合わさる。 宿主の段で書いた部品の全ての要素も入る
    const 図 = 組み立てる(本文("swimlane", ""));
    expect(図.phases[0]!.activate).toEqual(expect.arrayContaining(印の全て));
  });

  describe("部品を繋いで動かす頁の見本 (#2125)", () => {
    /**
     * 見本の本文から、段ごとに `focus` に書いた名前を読む。 段の区切りは `- step:` の行
     * (見本は全て 1 行 1 段の書き方で、`focus` を 1 行の `[...]` で書く)
     */
    const 段ごとのfocus = (yaml: string): string[][] =>
      yaml
        .split(/\n\s*- step:/)
        .slice(1)
        .map((段) => {
          const m = 段.match(/\n\s*focus:\s*\[(.*)\]/);
          return m ? m[1]!.split(",").map((s) => s.trim().replace(/^"|"$/g, "")) : [];
        });

    const 見本 = Object.entries(繋いで動かす見本)
      .filter(([k, v]) => k.startsWith("sourceYaml__") && typeof v === "string")
      .map(([k, v]) => ({
        key: k.slice("sourceYaml__".length),
        yaml: v as string,
        図: (繋いで動かす見本 as Record<string, unknown>)[k.slice("sourceYaml__".length)] as CdlDiagram,
      }));

    it("見本を読めている", () => {
      // 空振り防止。 0 件なら下の it.each が 1 件も走らない
      expect(見本.length).toBeGreaterThan(0);
      expect(見本.flatMap((x) => 段ごとのfocus(x.yaml)).flat().length).toBeGreaterThan(0);
    });

    it.each(見本)("$key は、段の focus に書いた部品をその段で光らせる", ({ yaml, 図 }) => {
      // 直す前の実測 = 部品の名前を書いた 13 段で、宿主の段が光らせた部品は 0 件
      const 部品の名前 = new Set(
        図.nodes.filter((n) => n.id.includes("__")).map((n) => n.id.slice(0, n.id.indexOf("__"))),
      );
      const 光らない: string[] = [];
      for (const [i, 書いた] of 段ごとのfocus(yaml).entries()) {
        const 段 = 図.phases[i]!;
        for (const 名前 of 書いた.filter((x) => 部品の名前.has(x))) {
          if (!段.activate.some((id) => id.startsWith(`${名前}__`))) 光らない.push(`${段.title}: ${名前}`);
        }
      }
      expect(光らない).toEqual([]);
    });
  });

  it("同じ id を 2 度入れない", () => {
    // 部品の段も入口を光らせ、宿主の段にも部品の名前を 2 度書く
    const 図 = 組み立てる(本文("swimlane", "").replace("focus: [印]", "focus: [印, 印]"));
    const 光らせる相手 = 図.phases[0]!.activate;
    expect(光らせる相手.length).toBe(new Set(光らせる相手).size);
  });
});

/**
 * 段の `focus` に `{部品の名前}__{要素}` / `{部品の名前}__{中の線}` を書いて、その 1 つだけを光らせる (#2151)。
 *
 * 部品の名前で光らせると要素と中の線が全て光る (#2150)。 振り分け器の入口だけ、出口 A だけを見せたい段で
 * 光る所が広すぎた。 書き方は宿主の段で部品の中の値を動かす書き方 (`印__lv`) と揃える。
 *
 * | 形 | 見ること |
 * |---|---|
 * | 要素 / 中の線を名指し | その 1 つだけが光り、知らせが出ない |
 * | 部品に無い名前 | 知らせが 1 件出て、部品の要素と線の名前を案内する。 何も光らない |
 * | 部品でない登場人物の名前に `__` を続けた名前 | 今と同じく見つからない知らせが出る |
 * | 部品の名前が別の部品の名前で始まる | 一番長く一致する部品の要素を光らせる |
 */
describe("段の focus で部品の中の要素や線を名指しして光らせる (#2151)", () => {
  const 名指しの本文 = (型: string, 名指し: string, 足す部品 = "") => `title: "t"
type: ${型}

actors:
  - 受付: { kind: card }
  - 印: { kind: split2, phase: false }
${足す部品}
flow:
  - 受付 -> 印: "届く" { toPartNode: inP }

animation:
  - step: "1. 入口" 1s
    focus: [${名指し}]
  - step: "2. 受ける" 1s
    focus: [受付]
`;

  function 知らせごと組み立てる(src: string): { 図: CdlDiagram; 見つからない: CompileNotice[] } {
    const 知らせ: CompileNotice[] = [];
    const 図 = textDslToDiagram(src, { partsCatalog: 部品の一覧, onNotice: (n) => 知らせ.push(n) });
    return { 図, 見つからない: 知らせ.filter((n) => n.kind === "focus-target-missing") };
  }

  const 部品の中で光る = (図: CdlDiagram, 段: number, 名前 = "印") =>
    図.phases[段]!.activate.filter((id) => id.startsWith(`${名前}__`));

  it("要素を名指しした段では、その要素だけが光り、知らせが出ない", () => {
    const { 図, 見つからない } = 知らせごと組み立てる(名指しの本文("swimlane", "印__inP"));
    expect(部品の中で光る(図, 0)).toEqual(["印__inP"]);
    expect(見つからない).toEqual([]);
  });

  it("部品の中の線を名指しした段では、その線だけが光る", () => {
    const { 図, 見つからない } = 知らせごと組み立てる(名指しの本文("swimlane", "印__a"));
    // 線が図に入っている (入っていなければ下の期待は前提から崩れている)
    expect(図.edges.map((e) => e.id)).toContain("印__a");
    expect(部品の中で光る(図, 0)).toEqual(["印__a"]);
    expect(見つからない).toEqual([]);
  });

  it.each(["swimlane", "flow", "sequence"])("%s でも名指しした要素が光る", (型) => {
    const { 図, 見つからない } = 知らせごと組み立てる(名指しの本文(型, "印__outA"));
    expect(図.phases.length, "段が組み立っていない").toBeGreaterThanOrEqual(2);
    expect(部品の中で光る(図, 0)).toEqual(["印__outA"]);
    expect(部品の中で光る(図, 1)).toEqual([]);
    expect(見つからない).toEqual([]);
  });

  it("部品に無い名前を書くと、知らせが 1 件出て部品の要素と線の名前を案内し、何も光らない", () => {
    const { 図, 見つからない } = 知らせごと組み立てる(名指しの本文("swimlane", "印__nope"));
    expect(見つからない).toHaveLength(1);
    const 知らせ = 見つからない[0]!;
    expect(知らせ.actor).toBe("印__nope");
    // 段を書いた行を指す (`- step:` は本文の 12 行目)
    expect(知らせ.line).toBe(12);
    expect(知らせ.hint).toContain("inP, outA, outB");
    expect(知らせ.hint).toContain("中の線 = a, b");
    expect(部品の中で光る(図, 0)).toEqual([]);
  });

  it("部品でない登場人物の名前に __ を続けた名前は、今と同じく見つからない知らせが出る", () => {
    const { 見つからない } = 知らせごと組み立てる(名指しの本文("swimlane", "受付__x"));
    expect(見つからない.map((n) => n.actor)).toEqual(["受付__x"]);
  });

  it("部品の名前が別の部品の名前で始まっても、一番長く一致する部品の要素を光らせる", () => {
    // `印` と `印__2` の 2 部品。 `印__2__inP` を短い `印` に当てると、要素 `2__inP` を探して見つからない
    const { 図, 見つからない } = 知らせごと組み立てる(
      名指しの本文("swimlane", "印__2__inP", "  - 印__2: { kind: split2, phase: false }"),
    );
    expect(部品の中で光る(図, 0, "印__2")).toEqual(["印__2__inP"]);
    expect(見つからない).toEqual([]);
  });

  it("README の例をカタログの振り分け器で組み立てると、段ごとに書いた所だけが光り、知らせが出ない", () => {
    // 書き方を写して使う例。 写した本文が光らなければ README が誤りを配る
    const md = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "README.md"), "utf8");
    const 見出し = md.indexOf("### 段の `focus:` で部品の全体か中の 1 つを光らせる");
    expect(見出し, "README に書き方の節が無い").toBeGreaterThanOrEqual(0);
    const 例 = /```yaml\n([\s\S]*?)```/.exec(md.slice(見出し))?.[1];
    if (例 === undefined) throw new Error("README の節から yaml の例を読めない");
    const 知らせ: CompileNotice[] = [];
    const 図 = textDslToDiagram(例, {
      partsCatalog: 部品の一覧を作る(Object.values(カタログの部品)),
      onNotice: (n) => 知らせ.push(n),
    });
    expect(知らせ.map((n) => `${n.kind}: ${n.message}`)).toEqual([]);
    expect(図.phases.length, "段が組み立っていない").toBe(3);
    expect(部品の中で光る(図, 0, "split")).toEqual(["split__inP"]);
    expect(部品の中で光る(図, 1, "split").sort()).toEqual(["split__outA", "split__sr-a"]);
    expect(部品の中で光る(図, 2, "split").sort()).toEqual(
      ["split__inP", "split__outA", "split__outB", "split__sr-a", "split__sr-b"].sort(),
    );
  });
});
