/**
 * 記法で書いた表と UML の関係を見分ける端の名前を固定する (#2783 / #2805)。
 * CSS と実物の定義を突き合わせ、移り変わりの図まで細くする広がりを防ぐ。
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { JSDOM } from "jsdom";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { sourceYaml__presetClassDiagram } from "@/topics/catalog/presets.cdl";
import { sourceYaml__textDslStateMachine } from "@/topics/catalog/text-dsl.cdl";
import {
  UMLだけの端,
  UMLの関係の端,
  個数の端,
  移り変わりの端,
  端で見分けられないUMLの関係,
} from "../../../../packages/dragon/test/support/record-edges";

const CSS = readFileSync(
  fileURLToPath(new URL("../styles/cdl-theme.css", import.meta.url)),
  "utf8",
).replace(/\/\*[\s\S]*?\*\//gu, "");

const recordの規則 = [...CSS.matchAll(/([^{}]+)\{([^{}]*)\}/gu)]
  .map((一致) => ({ 選び方: 一致[1] ?? "", 宣言: 一致[2] ?? "" }))
  .filter(
    ({ 選び方 }) =>
      選び方.includes('data-cdl-type="record"') && 選び方.includes('data-cdl-role="edge-line"'),
  );

const 選び方の端 = (選び方: string): string[] =>
  [
    ...new Set([...選び方.matchAll(/data-cdl-edge-head="([^"]+)"/gu)].map((一致) => 一致[1] ?? "")),
  ].sort();

const 描いた文書 = (記法: string): Document => {
  const 図 = layout(textDslToDiagram(記法));
  const SVG = renderToStaticMarkup(createElement(CdlDiagramView, { diagram: 図 }));
  return new JSDOM(SVG).window.document;
};

describe("record の関係に当てる線の薄さ (#2783 / #2805)", () => {
  it("通常と光る線の規則が、個数の端と見分けられる UML の端を実物と同じ集合で囲う", () => {
    expect(recordの規則, "record の線を囲う規則が通常と光る線の 2 つでない").toHaveLength(2);

    const 期待する個数の端 = [...個数の端].sort();
    const 期待するUMLの端 = [...UMLだけの端].sort();
    const 期待する全端 = [...new Set([...個数の端, ...UMLだけの端])].sort();
    for (const { 選び方 } of recordの規則) {
      const CSSの端 = 選び方の端(選び方);
      expect(
        CSSの端.filter((端) => 個数の端.has(端)),
        `CSS が囲う個数の端 ${CSSの端.join(" / ")}`,
      ).toEqual(期待する個数の端);
      expect(
        CSSの端.filter((端) => UMLの関係の端.has(端)),
        `CSS が囲う UML の端 ${CSSの端.join(" / ")}`,
      ).toEqual(期待するUMLの端);
      expect(
        CSSの端.filter((端) => 移り変わりの端.has(端)),
        `移り変わりと見分けられない UML 関係も囲っている: ${端で見分けられないUMLの関係.join(" / ")}`,
      ).toEqual([]);
      expect(CSSの端, `CSS が囲う全端 ${CSSの端.join(" / ")}`).toEqual(期待する全端);
    }

    const 薄さの変数 = ({ 宣言 }: (typeof recordの規則)[number]): string => {
      const 一致 = 宣言.match(/stroke-opacity:\s*var\((--d-relation-edge-opacity(?:-active)?)\)/u);
      return 一致?.[1] ?? "";
    };
    const 通常 = recordの規則.filter(({ 選び方 }) => !選び方.includes('data-cdl-active="true"'));
    const 光る = recordの規則.filter(({ 選び方 }) => 選び方.includes('data-cdl-active="true"'));
    expect(通常, "通常の線へ当てる規則").toHaveLength(1);
    expect(光る, "光る線へ当てる規則").toHaveLength(1);
    expect(通常.map(薄さの変数), "通常の線へ当てる薄さ").toEqual(["--d-relation-edge-opacity"]);
    expect(光る.map(薄さの変数), "光る線へ当てる薄さ").toEqual([
      "--d-relation-edge-opacity-active",
    ]);
  });

  it("書き直したクラス図の線は細い線の選び方に当たる", () => {
    const 文書 = 描いた文書(sourceYaml__presetClassDiagram);
    const 線 = [...文書.querySelectorAll('[data-cdl-role="edge-line"]')];
    const 通常の選び方 = recordの規則.find(
      ({ 選び方 }) => !選び方.includes('data-cdl-active="true"'),
    )?.選び方;

    expect(線.length, "書き直したクラス図の線が描かれていない").toBeGreaterThan(0);
    expect(通常の選び方, "通常の線へ当てる選び方が無い").toBeDefined();
    expect(線.filter((要素) => 要素.matches(通常の選び方 ?? "")).length).toBe(線.length);
  });

  it("認証の状態遷移の線は細い線の選び方に当たらない", () => {
    const 文書 = 描いた文書(sourceYaml__textDslStateMachine);
    const 線 = [...文書.querySelectorAll('[data-cdl-role="edge-line"]')];
    const 通常の選び方 = recordの規則.find(
      ({ 選び方 }) => !選び方.includes('data-cdl-active="true"'),
    )?.選び方;

    expect(線.length, "認証の状態遷移の線が描かれていない").toBeGreaterThan(0);
    expect(通常の選び方, "通常の線へ当てる選び方が無い").toBeDefined();
    expect(線.filter((要素) => 要素.matches(通常の選び方 ?? ""))).toEqual([]);
  });
});
