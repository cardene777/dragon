/**
 * 傾き図の見せ方の切替 (#1659 / #1664)。
 *
 * 押せる図の判定と、傾き図 node だけへ値を書き込む変換を見る。既定では同じ object を
 * 返し、触っていない図を描き直さないこともここで固定する。
 *
 * 選択肢が engine の型を覆っているかは **engine の型宣言から導いて** 突き合わせる。
 * 手で数を書くと、engine が見せ方を足した時に検査が黙って通る。
 */
import { createRequire } from "node:module";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CATALOG_ITEMS } from "./catalog-items";
import {
  図の傾きの見せ方を変える,
  傾きの見せ方を選べる,
  傾きの見せ方の選択肢,
  既定の傾きの見せ方,
} from "./chart-slope-options";

const 見本 = (): { id: string; diagram: CdlDiagram }[] =>
  Object.values(CATALOG_ITEMS).flatMap((items) =>
    items.map(({ id, diagram }) => ({ id, diagram })),
  );

/** 傾き図 node を持つ見本。 判定の母集団はここから導く (一覧を手で書かない) */
const 傾きを持つ見本 = () =>
  見本().filter(({ diagram }) => diagram.nodes.some((n) => n.kind === "chart-slope"));

function 見本を取る(id: string): CdlDiagram {
  const item = 見本().find((x) => x.id === id);
  expect(item, `${id} の見本が見つからない`).toBeDefined();
  return item!.diagram;
}

/** 見本の中で最初の傾き図。 id を手で書かず、実物から引く */
function 傾きの図(): CdlDiagram {
  const 一覧 = 傾きを持つ見本();
  expect(一覧.length, "傾き図の見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
  return 一覧[0]!.diagram;
}

/** 傾き図と棒グラフを 1 枚に混ぜた図。 見本には同居する形が無いので作る */
function 合成の図(): CdlDiagram {
  const 元 = 傾きの図();
  const 傾き = 元.nodes.find((node) => node.kind === "chart-slope");
  const 棒 = 見本を取る("経路別の流入").nodes.find((node) => node.kind === "chart-bar");
  expect(傾き, "合成 fixture 用の傾き図 node が無い").toBeDefined();
  expect(棒, "合成 fixture 用の棒グラフ node が無い").toBeDefined();
  return { ...元, nodes: [傾き!, 棒!] };
}

function 傾きのnode(diagram: CdlDiagram) {
  return diagram.nodes.filter((node) => node.kind === "chart-slope");
}

describe("見せ方を選べる図の判定 (#1659)", () => {
  it("傾き図を持つ見本でだけ選べる", () => {
    // Given
    const 全部 = 見本();
    const 傾きあり = new Set(傾きを持つ見本().map((x) => x.id));
    expect(全部.length, "見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(傾きあり.size, "傾き図の見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);

    // When / Then = 判定した集合と、実物から導いた集合が一致する
    const 選べた = new Set(
      全部.filter(({ diagram }) => 傾きの見せ方を選べる(diagram)).map((x) => x.id),
    );
    expect([...選べた].sort(), "判定の母集団が傾き図の見本とずれている").toEqual(
      [...傾きあり].sort(),
    );
  });

  it("傾き図を持たない見本では選べない", () => {
    // Given
    const 対象 = 見本().filter(
      ({ diagram }) => !diagram.nodes.some((n) => n.kind === "chart-slope"),
    );
    expect(対象.length, "傾き図以外の見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);

    // When / Then
    for (const { id, diagram } of 対象)
      expect(傾きの見せ方を選べる(diagram), `${id} で選べてしまう`).toBe(false);
  });
});

describe("選んだ見せ方が node の欄に届く (#1659)", () => {
  it("どの見せ方も傾き図 node に書かれる", () => {
    // Given
    const 元 = 傾きの図();
    const 期待 = { 今の値: "values", 増減: "delta", 順位: "rank" } as const;

    // When / Then
    for (const 見せ方 of 傾きの見せ方の選択肢) {
      const 出た = 図の傾きの見せ方を変える(元, 見せ方);
      // 欄を書かない図を engine は今の値で描く。 今の値では欄が空のまま = 効く値で見る
      const 欄 = 傾きのnode(出た).map((n) => n.chartSlopeForm ?? "values");
      expect(欄.length, `${見せ方} で傾き図 node が無い`).toBeGreaterThan(0);
      for (const v of 欄) expect(v, `${見せ方} が届いていない`).toBe(期待[見せ方]);
    }
  });

  it("傾き図以外の node は触らない", () => {
    // Given = 傾き図と棒グラフを 1 枚に混ぜた合成の図。 見本の傾き図は単独で置かれており、
    // そのままでは「他の node を触らない」 ことを確かめる相手が居ない
    const 元 = 合成の図();
    const 他 = 元.nodes.filter((n) => n.kind !== "chart-slope");
    expect(他.length, "傾き図以外の node が無い (検査が空振りしている)").toBeGreaterThan(0);

    // When
    const 出た = 図の傾きの見せ方を変える(元, "増減");

    // Then = 傾き図以外は同じ object のまま
    for (const n of 他) expect(出た.nodes, `${n.id} が作り直されている`).toContain(n);
  });

  it("同じ図に傾き図が 2 つあれば両方に書く", () => {
    // Given
    const 元 = 傾きの図();
    const 傾き = 元.nodes.find((n) => n.kind === "chart-slope");
    expect(傾き, "合成 fixture 用の傾き図 node が無い").toBeDefined();
    const 二つ: CdlDiagram = { ...元, nodes: [傾き!, { ...傾き!, id: `${傾き!.id}-2` }] };

    // When
    const 出た = 図の傾きの見せ方を変える(二つ, "増減");

    // Then
    expect(傾きのnode(出た).map((n) => n.chartSlopeForm)).toEqual(["delta", "delta"]);
  });
});

describe("触っていない図を描き直さない (#1659)", () => {
  it("既定では同じ object が返る", () => {
    // Given = 記法に欄を書いていない見本 (engine は今の値で描く)
    const 元 = 傾きの図();
    expect(
      傾きのnode(元).every((n) => n.chartSlopeForm === undefined),
      "見本が既に欄を持っている (前提が崩れている)",
    ).toBe(true);

    // When / Then
    expect(図の傾きの見せ方を変える(元, 既定の傾きの見せ方), "既定で作り直している").toBe(元);
  });

  it("同じ見せ方を 2 度渡しても作り直さない", () => {
    // Given
    const 増減 = 図の傾きの見せ方を変える(傾きの図(), "増減");

    // When / Then
    expect(図の傾きの見せ方を変える(増減, "増減"), "同じ値で作り直している").toBe(増減);
  });

  it("傾き図を持たない図はそのまま返る", () => {
    // Given
    const 元 = 見本().find(({ diagram }) => !diagram.nodes.some((n) => n.kind === "chart-slope"));
    expect(元, "傾き図以外の見本が無い (検査が空振りしている)").toBeDefined();

    // When / Then
    expect(図の傾きの見せ方を変える(元!.diagram, "増減"), "対象外の図を作り直している").toBe(
      元!.diagram,
    );
  });
});

describe("選択肢が engine の型を覆う (#1659)", () => {
  /** engine の型宣言から `ChartSlopeForm` の値を読む。 手で数を書かないため */
  function engineの見せ方(): string[] {
    const require_ = createRequire(import.meta.url);
    const dist = dirname(require_.resolve("@cardenelabs/cdl"));
    const 宣言 = readdirSync(dist).filter((f) => f.endsWith(".d.ts"));
    expect(宣言.length, "engine の型宣言が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const f of 宣言) {
      const m = /type ChartSlopeForm = ([^;]+);/.exec(readFileSync(join(dist, f), "utf8"));
      if (m?.[1] !== undefined) return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]!);
    }
    throw new Error("engine の型宣言に ChartSlopeForm が無い (検査が空振りしている)");
  }

  it("engine の値をすべて選べる", () => {
    // Given
    const engine側 = engineの見せ方();
    expect(engine側.length, "engine の値が 1 つも読めない").toBeGreaterThan(0);

    // When = 選択肢を 1 つずつ当てて、書かれた値を集める
    const 元 = 傾きの図();
    const 書けた = new Set(
      傾きの見せ方の選択肢.map(
        (v) => 傾きのnode(図の傾きの見せ方を変える(元, v))[0]?.chartSlopeForm ?? "values",
      ),
    );

    // Then
    expect([...書けた].sort(), "engine の見せ方と選択肢がずれている").toEqual([...engine側].sort());
  });
});
