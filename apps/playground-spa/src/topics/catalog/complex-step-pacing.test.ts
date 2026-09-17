import { describe, expect, it } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
// 複雑な版は見本の中のパターン「複雑」 として書く (#1960)
import * as カタログの定義 from "./presets.cdl";

const 一段の最大増分 = 4;
const 複雑見本の最大段数 = 10;

type 見本 = Pick<CdlDiagram, "id" | "phases" | "edges">;

/**
 * `activate` は累積値なので、前段との差だけを見ると一度に読む量を測れる。
 */
const 段ごとの増分 = (段: readonly Pick<CdlDiagram["phases"][number], "activate">[]): string[][] =>
  段.map((現在の段, 段番号) => {
    const 前段までに光った要素 = new Set(段[段番号 - 1]?.activate ?? []);
    return 現在の段.activate.filter((要素) => !前段までに光った要素.has(要素));
  });

/**
 * 複雑な版と、その元の見本を **export から集める** (#2139)。
 *
 * 以前はクラス図と ER 図の 4 件を名前で並べていた。 他の図に複雑な版を足しても
 * 並べ忘れれば何も落ちず、足した版だけが段の進み方の検査を受けない。
 * 複雑な版の名前は `pattern__<元の見本>__複雑` と決まっているので、そこから導く。
 */
const 定義 = カタログの定義 as unknown as Record<string, unknown>;
const 複雑な版の名前 = Object.keys(定義)
  .filter((名前) => /^pattern__[^_]+__複雑$/.test(名前))
  .sort();
const 元の見本の名前 = 複雑な版の名前.map((名前) => 名前.slice("pattern__".length, -"__複雑".length));

const 図を引く = (名前: string): 見本 => {
  const 図 = 定義[名前];
  if (typeof 図 !== "object" || 図 === null) throw new Error(`${名前} が図の export ではない`);
  return 図 as 見本;
};

const 複雑見本たち: readonly 見本[] = 複雑な版の名前.map(図を引く);
const 見本たち: readonly 見本[] = [...元の見本の名前.map(図を引く), ...複雑見本たち];

describe("複雑なカタログの段の進み方 (#1599)", () => {
  it("複雑な版と元の見本のどの段も増分が 4 件以下である", () => {
    for (const 見本 of 見本たち) {
      for (const [段番号, 増分] of 段ごとの増分(見本.phases).entries()) {
        expect(増分.length, `${見本.id} の ${段番号 + 1} 段目の増分が ${増分.length} 件`).toBeLessThanOrEqual(
          一段の最大増分,
        );
      }
    }
  });

  it("線を持つ複雑な版の 2 段目には線が 1 本以上ある", () => {
    // 順序図は言づてを線ではなく 1 つの箱の中の行として描き、段は値 (`seq_step`) を進めるだけなので
    // 線を 1 本も持たない (#2161)。 線を持つ版だけを見る = 線が無い図に線を要求すると必ず落ちる
    const 線を持つ版 = 複雑見本たち.filter((見本) => 見本.edges.length > 0);
    expect(線を持つ版.length, "線を持つ複雑な版が 1 件も無い (検査が空振りしている)").toBeGreaterThanOrEqual(4);
    for (const 見本 of 線を持つ版) {
      const 線 = new Set(見本.edges.map((edge) => edge.id));
      const 二段目の線 = (段ごとの増分(見本.phases)[1] ?? []).filter((要素) => 線.has(要素));
      expect(二段目の線.length, `${見本.id} の 2 段目の線が ${二段目の線.length} 本`).toBeGreaterThanOrEqual(1);
    }
  });

  it("複雑な版の段数は 10 以下である", () => {
    for (const 見本 of 複雑見本たち) {
      expect(見本.phases.length, `${見本.id} の段数が ${見本.phases.length} 段`).toBeLessThanOrEqual(複雑見本の最大段数);
    }
  });

  it("走査した複雑な版に、関係と構成と流れと順序の版が入っている", () => {
    // 集め方を誤って 0 件になっても、上の 3 本は空の配列を回して通ってしまう
    expect(
      new Set(複雑見本たち.map((見本) => 見本.id)),
      "走査できた複雑な版の識別子が実物と一致せず、検査が空振りしている",
    ).toEqual(
      new Set([
        "class-complex-demo",
        "er-complex-demo",
        "infra-complex-demo",
        "flowchart-complex-demo",
        "seq-complex-demo",
        "fsm-complex-demo",
        "network-complex-demo",
        "topo-complex-demo",
      ]),
    );
    // 元の見本も名前から引く。 名前の切り出しを誤ると複雑な版だけが残る
    expect(
      new Set(元の見本の名前.map((名前) => 図を引く(名前).id)),
      "複雑な版の名前から元の見本を引けていない",
    ).toEqual(
      new Set([
        "class-demo",
        "er-demo",
        "infra-demo",
        "flowchart-demo",
        "seq-demo",
        "fsm-demo",
        "network-demo",
        "topo-demo",
      ]),
    );
  });

  it("段ごとの増分を累積した activate から数えられる", () => {
    const 手組みの段 = [
      { activate: ["a"] },
      { activate: ["a", "b", "c"] },
      { activate: ["a", "b", "c", "d", "e", "f", "g"] },
    ];

    for (const [段番号, 期待する増分] of [1, 2, 4].entries()) {
      const 実際の増分 = 段ごとの増分(手組みの段)[段番号]?.length;
      expect(実際の増分, `手組み見本の ${段番号 + 1} 段目の増分が ${実際の増分} 件`).toBe(期待する増分);
    }
  });
});
