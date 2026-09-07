/**
 * 円グラフの見せ方の切替 (#1645)。
 *
 * 押せる図の判定と、円グラフ node だけへ値を書き込む変換を見る。既定では同じ object を
 * 返し、触っていない図を描き直さないこともここで固定する。
 *
 * 選択肢が engine の型を覆っているかは **engine の型宣言から導いて** 突き合わせる。
 * 手で数を書くと、engine が 4 つ目を足した時に検査が黙って通る。
 */
import { createRequire } from "node:module";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CATALOG_ITEMS } from "./catalog-items";
import {
  図の円の見せ方を変える,
  円の見せ方を選べる,
  円の見せ方の選択肢,
  既定の円の見せ方,
} from "./chart-pie-options";

const 見本 = (): { id: string; diagram: CdlDiagram }[] =>
  Object.values(CATALOG_ITEMS).flatMap((items) =>
    items.map(({ id, diagram }) => ({ id, diagram })),
  );

/** 円グラフ node を持つ見本。 判定の母集団はここから導く (一覧を手で書かない) */
const 円を持つ見本 = () =>
  見本().filter(({ diagram }) => diagram.nodes.some((n) => n.kind === "chart-pie"));

function 見本を取る(id: string): CdlDiagram {
  const item = 見本().find((x) => x.id === id);
  expect(item, `${id} の見本が見つからない`).toBeDefined();
  return item!.diagram;
}

/** 円グラフと棒グラフを 1 枚に混ぜた図。 見本には同居する形が無いので作る */
function 合成の図(): CdlDiagram {
  const 円 = 見本を取る("chart-pie-demo").nodes.find((node) => node.kind === "chart-pie");
  const 棒 = 見本を取る("経路別の流入").nodes.find((node) => node.kind === "chart-bar");
  expect(円, "合成 fixture 用の円グラフ node が無い").toBeDefined();
  expect(棒, "合成 fixture 用の棒グラフ node が無い").toBeDefined();
  return { ...見本を取る("chart-pie-demo"), nodes: [円!, 棒!] };
}

function 円のnode(diagram: CdlDiagram) {
  return diagram.nodes.filter((node) => node.kind === "chart-pie");
}

describe("見せ方を選べる図の判定 (#1645)", () => {
  it("円グラフを持つ見本でだけ選べる", () => {
    // Given
    const 全部 = 見本();
    const 円あり = new Set(円を持つ見本().map((x) => x.id));
    expect(全部.length, "見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
    expect(円あり.size, "円グラフの見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);

    // When / Then = 判定した集合と、実物から導いた集合が一致する
    const 選べた = new Set(
      全部.filter(({ diagram }) => 円の見せ方を選べる(diagram)).map((x) => x.id),
    );
    expect([...選べた].sort(), "判定の母集団が円グラフの見本とずれている").toEqual(
      [...円あり].sort(),
    );
  });

  it("円グラフを持たない見本では選べない", () => {
    // Given
    const 対象 = 見本().filter(({ diagram }) => !diagram.nodes.some((n) => n.kind === "chart-pie"));
    expect(対象.length, "円グラフ以外の見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);

    // When / Then
    for (const { id, diagram } of 対象)
      expect(円の見せ方を選べる(diagram), `${id} で選べてしまう`).toBe(false);
  });
});

describe("選んだ見せ方が node の欄に届く (#1645)", () => {
  it("3 つとも円グラフ node に書かれる", () => {
    // Given
    const 元 = 見本を取る("chart-pie-demo");
    const 期待 = { 輪: "ring", 積層の弧: "arcs", 銘板: "table" } as const;

    // When / Then
    for (const 見せ方 of 円の見せ方の選択肢) {
      const 出た = 図の円の見せ方を変える(元, 見せ方);
      // 欄を書かない図を engine は輪として描く。 輪では欄が空のまま = 効く値で見る
      const 欄 = 円のnode(出た).map((n) => n.chartPieForm ?? "ring");
      expect(欄.length, `${見せ方} で円グラフ node が無い`).toBeGreaterThan(0);
      for (const v of 欄) expect(v, `${見せ方} が届いていない`).toBe(期待[見せ方]);
    }
  });

  it("円グラフ以外の node は触らない", () => {
    // Given = 円グラフと棒グラフを 1 枚に混ぜた合成の図。 見本の円グラフは単独で置かれており、
    // そのままでは「他の node を触らない」 ことを確かめる相手が居ない
    const 元 = 合成の図();
    const 他 = 元.nodes.filter((n) => n.kind !== "chart-pie");
    expect(他.length, "円グラフ以外の node が無い (検査が空振りしている)").toBeGreaterThan(0);

    // When
    const 出た = 図の円の見せ方を変える(元, "銘板");

    // Then = 円グラフ以外は同じ object のまま
    for (const n of 他) expect(出た.nodes, `${n.id} が作り直されている`).toContain(n);
  });

  it("同じ図に円グラフが 2 つあれば両方に書く", () => {
    // Given
    const 元 = 見本を取る("chart-pie-demo");
    const 円 = 元.nodes.find((n) => n.kind === "chart-pie");
    expect(円, "合成 fixture 用の円グラフ node が無い").toBeDefined();
    const 二つ: CdlDiagram = { ...元, nodes: [円!, { ...円!, id: `${円!.id}-2` }] };

    // When
    const 出た = 図の円の見せ方を変える(二つ, "積層の弧");

    // Then
    expect(円のnode(出た).map((n) => n.chartPieForm)).toEqual(["arcs", "arcs"]);
  });
});

describe("触っていない図を描き直さない (#1645)", () => {
  it("既定では同じ object が返る", () => {
    // Given = 記法に欄を書いていない見本 (engine は輪として描く)
    const 元 = 見本を取る("chart-pie-demo");
    expect(
      円のnode(元).every((n) => n.chartPieForm === undefined),
      "見本が既に欄を持っている (前提が崩れている)",
    ).toBe(true);

    // When / Then
    expect(図の円の見せ方を変える(元, 既定の円の見せ方), "既定で作り直している").toBe(元);
  });

  it("同じ見せ方を 2 度渡しても作り直さない", () => {
    // Given
    const 弧 = 図の円の見せ方を変える(見本を取る("chart-pie-demo"), "積層の弧");

    // When / Then
    expect(図の円の見せ方を変える(弧, "積層の弧"), "同じ値で作り直している").toBe(弧);
  });

  it("円グラフを持たない図はそのまま返る", () => {
    // Given
    const 元 = 見本().find(({ diagram }) => !diagram.nodes.some((n) => n.kind === "chart-pie"));
    expect(元, "円グラフ以外の見本が無い (検査が空振りしている)").toBeDefined();

    // When / Then
    expect(図の円の見せ方を変える(元!.diagram, "銘板"), "対象外の図を作り直している").toBe(
      元!.diagram,
    );
  });
});

describe("選択肢が engine の型を覆う (#1645)", () => {
  /** engine の型宣言から `ChartPieForm` の値を読む。 手で数を書かないため */
  function engineの見せ方(): string[] {
    const require_ = createRequire(import.meta.url);
    const dist = dirname(require_.resolve("@cardenelabs/cdl"));
    const 宣言 = readdirSync(dist).filter((f) => f.endsWith(".d.ts"));
    expect(宣言.length, "engine の型宣言が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const f of 宣言) {
      const m = /type ChartPieForm = ([^;]+);/.exec(readFileSync(join(dist, f), "utf8"));
      if (m?.[1] !== undefined) return [...m[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]!);
    }
    throw new Error("engine の型宣言に ChartPieForm が無い (検査が空振りしている)");
  }

  it("engine の値をすべて選べる", () => {
    // Given
    const engine側 = engineの見せ方();
    expect(engine側.length, "engine の値が 1 つも読めない").toBeGreaterThan(0);

    // When = 選択肢を 1 つずつ当てて、書かれた値を集める
    const 元 = 見本を取る("chart-pie-demo");
    const 書けた = new Set(
      円の見せ方の選択肢.map(
        (v) => 円のnode(図の円の見せ方を変える(元, v))[0]?.chartPieForm ?? "ring",
      ),
    );

    // Then
    expect([...書けた].sort(), "engine の見せ方と選択肢がずれている").toEqual([...engine側].sort());
  });
});
