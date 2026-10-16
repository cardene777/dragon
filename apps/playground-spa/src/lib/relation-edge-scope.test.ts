/**
 * 関係線の DOM 契約を確かめる。
 * 不透明度と対象範囲は tests/relation-edge-opacity.spec.ts が実画面で測る。
 */
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { presetDeliveryClasses, sourceYaml__presetDeliveryClasses } from "@/topics/catalog/presets.cdl";

import { 端の組 } from "../../../../packages/dragon/test/support/record-edges";

const 描いた文書 = (記法: string): Document => {
  const 図 = layout(textDslToDiagram(記法));
  const SVG = renderToStaticMarkup(createElement(CdlDiagramView, { diagram: 図 }));
  return new JSDOM(SVG).window.document;
};

describe("record の関係線の DOM 契約 (#2783 / #2805)", () => {
  it("継承・実装・集約・合成を含む書き直したクラス図を描く", () => {
    const 文書 = 描いた文書(sourceYaml__presetDeliveryClasses);
    const 線 = [...文書.querySelectorAll('[data-cdl-role="edge-line"]')];
    const 印の組 = new Set(
      [...文書.querySelectorAll('[data-cdl-role="edge-arrowhead"]')].map((要素) =>
        端の組(
          要素.getAttribute("data-cdl-edge-head") ?? "",
          要素.getAttribute("data-cdl-edge-head-fill") ?? "",
        ),
      ),
    );

    expect(線.length, "書き直したクラス図の線が描かれていない").toBeGreaterThan(0);
    expect([...印の組]).toEqual(
      expect.arrayContaining([
        端の組("triangle", "hollow"),
        端の組("diamond", "hollow"),
        端の組("diamond", "solid"),
      ]),
    );
  });

  it("型の凡例 4 項目の印・線種・色は図が描く関係と同じ", () => {
    const 対応 = [
      { 関係: "である", 凡例: "受け継ぐ", 印: "line-triangle-hollow" },
      { 関係: "集める", 凡例: "集める (外しても残る)", 印: "line-diamond-hollow" },
      { 関係: "持つ", 凡例: "持つ (一緒に消える)", 印: "line-diamond-solid" },
      { 関係: "使う", 凡例: "使う", 印: "dotted-line" },
    ] as const;
    const 凡例 = presetDeliveryClasses.legend ?? [];

    expect(凡例, "見本に無い項目または注記が凡例に残っている").toHaveLength(対応.length);
    for (const 項目 of 対応) {
      const 線 = presetDeliveryClasses.edges.find((候補) => 候補.label === 項目.関係);
      const 印 = 凡例.find((候補) => 候補.text === 項目.凡例);
      expect(線, `${項目.関係}の線が図に無い`).toBeDefined();
      expect(印, `${項目.凡例}が凡例に無い`).toMatchObject({ mark: 項目.印 });
      if (印?.mark === undefined) throw new Error(`${項目.凡例}が印を持たない注記になっている`);
      const 凡例の線種 = 印.mark === "dotted-line" || 印.lineStyle === "dotted"
        ? "dashed"
        : (印.lineStyle ?? "solid");
      expect({ tone: 印.tone, style: 凡例の線種 }, `${項目.関係}の凡例と図の線が違う`).toEqual({
        tone: 線?.tone,
        style: 線?.style,
      });
    }
  });

  it("出どころ側の菱は marker-start が指す data-cdl-edge-head と塗りに出る", () => {
    const 文書 = 描いた文書(sourceYaml__presetDeliveryClasses);
    for (const [関係, 塗り] of [["集める", "hollow"], ["持つ", "solid"]] as const) {
      const 線 = 文書.querySelector(`[data-cdl-edge-label="${関係}"] [data-cdl-role="edge-line"]`);
      const 印のID = 線?.getAttribute("marker-start")?.match(/^url\(#(.+)\)$/u)?.[1];
      const 印 = 印のID === undefined
        ? null
        : 文書.getElementById(印のID)?.querySelector('[data-cdl-role="edge-arrowhead"]');
      expect(線?.getAttribute("marker-end"), `${関係}の菱が行き先側に出ている`).toBeNull();
      expect(印?.getAttribute("data-cdl-edge-head"), `${関係}の出どころ側の端`).toBe("diamond");
      expect(印?.getAttribute("data-cdl-edge-head-fill"), `${関係}の出どころ側の塗り`).toBe(塗り);
    }
  });
});
