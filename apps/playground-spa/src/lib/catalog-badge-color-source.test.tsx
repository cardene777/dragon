// @vitest-environment jsdom
/**
 * 読み出しの札の色の出どころ (`colorSource`) がカタログで効き、3 つの引き方を見比べられること (#1974)。
 *
 * 描画側 0.63.0 までは札を描く部品が `colorSource` を読まず、書いても札の色が変わらなかった
 * (cdl#861 で直し 0.64.0 で出した)。 dragon の記法は描画側の型から欄の表を作るので書ける欄として
 * 受け付けており、書いた人には効かないことが見えなかった。
 *
 * ## 何を見るか
 *
 * | 問い | 相手 |
 * |---|---|
 * | 3 つの引き方 (付けない / 札の字 / 別の状態) を切り替えられるか | `readoutVariety` の変種 |
 * | 状態を変えた時に、札の字と色がそれぞれ何に付いて変わるか | 変種ごとの 3 つの書き方 (組み立て関数 / `YAML` / `JSON`) |
 *
 * 色は描いた札の背景で見る。 読み出しに `colorSource` が写っているかだけを見ると、描く部品が読まなくても通る。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { jsonToDiagram, textDslToDiagram } from "@cardenelabs/dragon";
import { CATALOG_ITEMS, 選んだ見本 } from "./catalog-items";

const item = CATALOG_ITEMS.interactive!.find((i) => i.title === "readoutVariety")!;

/** jsdom は色番号を `rgb(...)` に直して返す */
const rgb = (hex: string): string => {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
};
const 状態の色 = { 稼働: rgb("#1f7a45"), 停止: rgb("#7a6a5c"), 異常: rgb("#c0392b") };

/** 状態の入力欄の初めの値を置き換えた図 (札が読むのは入力欄の値) */
function 状態を置く(d: CdlDiagram, 値: string): CdlDiagram {
  return {
    ...d,
    inputs: (d.inputs ?? []).map((i) => (i.id === "state" ? { ...i, defaultValue: 値 } : i)),
  } as CdlDiagram;
}

/** 札の字と背景色を読む */
function 描いた札(d: CdlDiagram): { 字: string; 背景: string | null }[] {
  const 器 = document.createElement("div");
  器.innerHTML = renderToStaticMarkup(
    <CdlDiagramView diagram={d} hideHeader hideMiniPhaseIndicator />,
  );
  return [...器.querySelectorAll('[data-cdl-readout="tempBadge"] .cdl-ip-readout-badge-pill')].map(
    (p) => ({ 字: p.textContent ?? "", 背景: (p as HTMLElement).style.background || null }),
  );
}

/** 変種の 3 つの書き方 */
function 書き方(名: string): { 名: string; 図: CdlDiagram }[] {
  const p = item.patterns!.find((x) => x.名 === 名)!;
  expect(p.sourceYaml, `${名} に YAML が無い`).toBeDefined();
  expect(p.sourceJson, `${名} に JSON が無い`).toBeDefined();
  return [
    { 名: "組み立て関数", 図: 選んだ見本(item, 名)!.diagram },
    { 名: "YAML", 図: textDslToDiagram(p.sourceYaml!) },
    { 名: "JSON", 図: jsonToDiagram(JSON.parse(p.sourceJson!)) },
  ];
}

describe("`readoutVariety` の札の色の引き方 (#1974)", () => {
  it("札に色を付けない元の見本と、札の字 / 別の状態で色を引く変種を切り替えられる", () => {
    expect(item.patterns?.map((p) => p.名)).toEqual([
      "札に色を付けない",
      "札の字で色を引く",
      "別の状態で色を引く",
    ]);
  });

  it("色を付けない見本は、状態を変えても札に色を付けない", () => {
    for (const { 名, 図 } of 書き方("札に色を付けない")) {
      for (const 値 of ["稼働", "異常"]) {
        expect(描いた札(状態を置く(図, 値)), `${名} の ${値}`).toEqual([{ 字: "42", 背景: null }]);
      }
    }
  });

  it("札の字で引く変種は、字も色も状態に付いて変わる", () => {
    for (const { 名, 図 } of 書き方("札の字で色を引く")) {
      for (const 値 of ["稼働", "停止", "異常"] as const) {
        expect(描いた札(状態を置く(図, 値)), `${名} の ${値}`).toEqual([
          { 字: 値, 背景: 状態の色[値] },
        ]);
      }
    }
  });

  it("別の状態で引く変種は、字は温度のまま、色だけが状態に付いて変わる", () => {
    for (const { 名, 図 } of 書き方("別の状態で色を引く")) {
      for (const 値 of ["稼働", "停止", "異常"] as const) {
        expect(描いた札(状態を置く(図, 値)), `${名} の ${値}`).toEqual([
          { 字: "42", 背景: 状態の色[値] },
        ]);
      }
    }
  });

  it("別の状態で引く変種の 3 つの書き方は、札に色の出どころを持つ", () => {
    for (const { 名, 図 } of 書き方("別の状態で色を引く")) {
      const 札 = (図.readouts ?? []).find((r) => r.id === "tempBadge");
      expect(札, `${名} に札が無い`).toMatchObject({
        kind: "badge",
        source: "temp",
        colorSource: "state",
      });
    }
  });
});
