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

import { EDITOR_SAMPLES } from "@/data/editor-samples";
import { presetClassDiagram, sourceYaml__presetClassDiagram } from "@/topics/catalog/presets.cdl";
import { sourceYaml__textDslStateMachine } from "@/topics/catalog/text-dsl.cdl";
import {
  UMLだけの端の組,
  UMLの関係の端の組,
  個数の端,
  端で見分けられないUMLの関係,
  端の組,
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

const 選び方の端 = (選び方: string): readonly { 端: string; 塗り?: string }[] =>
  [
    ...選び方.matchAll(
      /\[data-cdl-edge-head="([^"]+)"\](?:\[data-cdl-edge-head-fill="([^"]+)"\])?/gu,
    ),
  ]
    .map((一致) => ({ 端: 一致[1] ?? "", ...(一致[2] === undefined ? {} : { 塗り: 一致[2] }) }))
    .filter(
      (値, 位置, 全体) =>
        全体.findIndex((候補) => 候補.端 === 値.端 && 候補.塗り === 値.塗り) === 位置,
    );

const 矢じりを書かない移り変わり = `title: "矢じりを書かない移り変わり"
type: record
reveal: all

actors:
  - 待機
  - 完了

flow:
  - 待機 -> 完了: "進む"
`;

const 描いた文書 = (記法: string, 全ての線を出す = false): Document => {
  const 図 = layout(textDslToDiagram(記法));
  const 描く図 = 全ての線を出す ? { ...図, edgeReveal: "all" as const } : 図;
  const SVG = renderToStaticMarkup(createElement(CdlDiagramView, { diagram: 描く図 }));
  return new JSDOM(SVG).window.document;
};

describe("record の関係に当てる線の薄さ (#2783 / #2805)", () => {
  it("通常と光る線の規則が、個数の端と見分けられる UML の端と塗りの組を囲う", () => {
    expect(recordの規則, "record の線を囲う規則が通常と光る線の 2 つでない").toHaveLength(2);

    const 期待する個数の端 = [...個数の端].sort();
    const 期待するUMLの端の組 = [...UMLだけの端の組].sort();
    const UMLの端の名前 = new Set([...UMLの関係の端の組].map((組) => 組.slice(0, 組.indexOf(":"))));
    for (const { 選び方 } of recordの規則) {
      const CSSの端 = 選び方の端(選び方);
      const CSSのUMLの条件 = CSSの端.filter(({ 端 }) => UMLの端の名前.has(端));
      const CSSが囲うUMLの端の組 = [
        ...new Set(
          CSSのUMLの条件.flatMap(({ 端, 塗り }) =>
            塗り === undefined
              ? [...UMLの関係の端の組].filter((組) => 組.startsWith(`${端}:`))
              : [端の組(端, 塗り)],
          ),
        ),
      ].sort();
      expect(
        CSSの端.map(({ 端 }) => 端)
          .filter((端) => 個数の端.has(端))
          .sort(),
        `CSS が囲う個数の端 ${CSSの端.map(({ 端 }) => 端).join(" / ")}`,
      ).toEqual(期待する個数の端);
      expect(
        CSSが囲うUMLの端の組,
        `CSS が囲う UML の端と塗り ${CSSが囲うUMLの端の組.join(" / ")}`,
      ).toEqual(期待するUMLの端の組);
      expect(
        CSSのUMLの条件.map(({ 端, 塗り }) => `${端}:${塗り ?? "*"}`).sort(),
        `移り変わりと見分けられない UML 関係も囲っている: ${端で見分けられないUMLの関係.join(" / ")}`,
      ).toEqual(["diamond:*", "triangle:hollow"]);
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

  it("継承・実装・集約・合成を含む書き直したクラス図の線は細い線の選び方に当たる", () => {
    const 文書 = 描いた文書(sourceYaml__presetClassDiagram);
    const 線 = [...文書.querySelectorAll('[data-cdl-role="edge-line"]')];
    const 印の組 = new Set(
      [...文書.querySelectorAll('[data-cdl-role="edge-arrowhead"]')].map((要素) =>
        端の組(
          要素.getAttribute("data-cdl-edge-head") ?? "",
          要素.getAttribute("data-cdl-edge-head-fill") ?? "",
        ),
      ),
    );
    const 通常の選び方 = recordの規則.find(
      ({ 選び方 }) => !選び方.includes('data-cdl-active="true"'),
    )?.選び方;

    expect(線.length, "書き直したクラス図の線が描かれていない").toBeGreaterThan(0);
    expect([...印の組]).toEqual(
      expect.arrayContaining([
        端の組("triangle", "hollow"),
        端の組("diamond", "hollow"),
        端の組("diamond", "solid"),
      ]),
    );
    expect(通常の選び方, "通常の線へ当てる選び方が無い").toBeDefined();
    expect(線.filter((要素) => 要素.matches(通常の選び方 ?? "")).length).toBe(線.length);
  });

  it("型の凡例 4 項目の印・線種・色は図が描く関係と同じ", () => {
    const 対応 = [
      { 関係: "継承", 凡例: "継承", 印: "line-triangle-hollow" },
      { 関係: "集約", 凡例: "集約 (外しても残る)", 印: "line-diamond-hollow" },
      {
        関係: "コンポジション",
        凡例: "コンポジション (一緒に消える)",
        印: "line-diamond-solid",
      },
      { 関係: "依存", 凡例: "依存", 印: "dotted-line" },
    ] as const;
    const 凡例 = presetClassDiagram.legend ?? [];

    expect(凡例, "見本に無い項目または注記が凡例に残っている").toHaveLength(対応.length);
    for (const 項目 of 対応) {
      const 線 = presetClassDiagram.edges.find((候補) => 候補.label === 項目.関係);
      const 印 = 凡例.find((候補) => 候補.text === 項目.凡例);

      expect(線, `${項目.関係}の線が図に無い`).toBeDefined();
      expect(印, `${項目.凡例}が凡例に無い`).toMatchObject({ mark: 項目.印 });
      if (!印 || 印.mark === undefined)
        throw new Error(`${項目.凡例}が印を持たない注記になっている`);
      const 凡例の線種 = 印.mark === "dotted-line" ? "dashed" : (印.lineStyle ?? "solid");
      expect({ tone: 印.tone, style: 凡例の線種 }, `${項目.関係}の凡例と図の線が違う`).toEqual({
        tone: 線?.tone,
        style: 線?.style,
      });
    }
  });

  it("出どころ側の菱は marker-start が指す data-cdl-edge-head と塗りに出る", () => {
    const 文書 = 描いた文書(sourceYaml__presetClassDiagram);

    for (const [関係, 塗り] of [
      ["集約", "hollow"],
      ["コンポジション", "solid"],
    ] as const) {
      const 線 = 文書.querySelector(`[data-cdl-edge-label="${関係}"] [data-cdl-role="edge-line"]`);
      const 印のID = 線?.getAttribute("marker-start")?.match(/^url\(#(.+)\)$/u)?.[1];
      const 印 =
        印のID === undefined
          ? null
          : 文書.getElementById(印のID)?.querySelector('[data-cdl-role="edge-arrowhead"]');

      expect(線?.getAttribute("marker-end"), `${関係}の菱が行き先側に出ている`).toBeNull();
      expect(印?.getAttribute("data-cdl-edge-head"), `${関係}の出どころ側の端`).toBe("diamond");
      expect(印?.getAttribute("data-cdl-edge-head-fill"), `${関係}の出どころ側の塗り`).toBe(塗り);
    }
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

  it("矢じりを書かない移り変わりの塗った三角は細い線の選び方に当たらない", () => {
    const 文書 = 描いた文書(矢じりを書かない移り変わり, true);
    const 線 = [...文書.querySelectorAll('[data-cdl-role="edge-line"]')];
    const 既定の矢じり = 文書.querySelector(
      '[data-cdl-role="edge-arrowhead"][data-cdl-edge-head="triangle"][data-cdl-edge-head-fill="solid"]',
    );
    const 通常の選び方 = recordの規則.find(
      ({ 選び方 }) => !選び方.includes('data-cdl-active="true"'),
    )?.選び方;

    expect(線.length, "矢じりを書かない移り変わりの線が描かれていない").toBeGreaterThan(0);
    expect(既定の矢じり, "端を書かない線が塗った三角でない").not.toBeNull();
    expect(通常の選び方, "通常の線へ当てる選び方が無い").toBeDefined();
    expect(線.filter((要素) => 要素.matches(通常の選び方 ?? ""))).toEqual([]);
  });

  it("編集画面の認証状態遷移の線は細い線の選び方に当たらない", () => {
    const 記法 = EDITOR_SAMPLES.find((見本) => 見本.slug === "state-machine")?.code;
    expect(記法, "編集画面の認証状態遷移の見本が無い").toBeDefined();

    const 文書 = 描いた文書(記法 ?? "", true);
    const 線 = [...文書.querySelectorAll('[data-cdl-role="edge-line"]')];
    const 通常の選び方 = recordの規則.find(
      ({ 選び方 }) => !選び方.includes('data-cdl-active="true"'),
    )?.選び方;

    expect(線.length, "編集画面の認証状態遷移の線が描かれていない").toBeGreaterThan(0);
    expect(通常の選び方, "通常の線へ当てる選び方が無い").toBeDefined();
    expect(線.filter((要素) => 要素.matches(通常の選び方 ?? ""))).toEqual([]);
  });
});
