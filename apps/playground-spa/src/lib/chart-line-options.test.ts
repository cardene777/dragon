/**
 * 折れ線の見せ方の切替 (#1624)。
 *
 * 押せる図の判定と、折れ線 node だけへ 3 つの指定を書き込む変換を見る。既定では同じ
 * object を返し、触っていない図を描き直さないこともここで固定する。
 */
import { describe, expect, it } from "vitest";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CATALOG_ITEMS } from "./catalog-items";
import {
  図の折れ線の見せ方を変える,
  折れ線を選べる,
  既定の折れ線の指定,
  type 折れ線の指定,
} from "./chart-line-options";

type 折れ線の欄 = {
  chartFillUnder?: boolean;
  chartValueRise?: boolean;
  chartTrace?: boolean;
};

const 見本 = (): { id: string; diagram: CdlDiagram }[] =>
  Object.values(CATALOG_ITEMS).flatMap((items) =>
    items.map(({ id, diagram }) => ({ id, diagram })),
  );

function 見本を取る(id: string): CdlDiagram {
  const item = 見本().find((x) => x.id === id);
  expect(item, `${id} の見本が見つからない`).toBeDefined();
  return item!.diagram;
}

function 折れ線のnode(diagram: CdlDiagram): (CdlDiagram["nodes"][number] & 折れ線の欄)[] {
  return diagram.nodes.filter(
    (node) => node.kind === "chart-line",
  );
}

function 合成の図(): CdlDiagram {
  const 折れ線 = 見本を取る("chart-line-demo").nodes.find((node) => node.kind === "chart-line");
  const 棒 = 見本を取る("経路別の流入").nodes.find((node) => node.kind === "chart-bar");
  expect(折れ線, "合成 fixture 用の折れ線 node が無い").toBeDefined();
  expect(棒, "合成 fixture 用の棒グラフ node が無い").toBeDefined();
  return { ...見本を取る("chart-line-demo"), nodes: [折れ線!, 棒!] };
}

describe("折れ線の見せ方を選べる図の判定 (#1624)", () => {
  it("折れ線を持つ 2 つの見本で選べる", () => {
    // Given
    const 対象 = [見本を取る("chart-line-demo"), 見本を取る("週ごとの応答時間")];

    // When / Then
    for (const diagram of 対象)
      expect(折れ線を選べる(diagram), "折れ線の見本で選べない").toBe(true);
  });

  it("折れ線でない見本では選べない", () => {
    // Given
    const 対象 = 見本().filter((x) => !x.diagram.nodes.some((node) => node.kind === "chart-line"));
    expect(対象.length, "折れ線でない見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);

    // When / Then
    for (const x of 対象)
      expect(折れ線を選べる(x.diagram), `${x.id} で選べる判定になっている`).toBe(false);
  });
});

describe("図の折れ線の見せ方を変える (#1624)", () => {
  it("既定では元の object をそのまま返す", () => {
    // Given
    const 元 = 見本を取る("chart-line-demo");

    // When
    const 後 = 図の折れ線の見せ方を変える(元, 既定の折れ線の指定);

    // Then
    expect(後, "既定なのに図を描き直す object を返している").toBe(元);
  });

  it.each([
    ["塗り", "chartFillUnder"],
    ["せり上げ", "chartValueRise"],
    ["なぞり", "chartTrace"],
  ] as const)("%s を入れると %s が true になる", (見せ方, 欄) => {
    // Given
    const 元 = 見本を取る("chart-line-demo");
    const 指定: 折れ線の指定 = { ...既定の折れ線の指定, [見せ方]: true };

    // When
    const 後 = 図の折れ線の見せ方を変える(元, 指定);

    // Then
    expect(折れ線のnode(後)[0]?.[欄], `${見せ方} を入れても ${欄} が true でない`).toBe(true);
  });

  it("既に塗りが入った図へ既定を当てると false を明記する", () => {
    // Given
    const 元 = 合成の図();
    const 折れ線 = 折れ線のnode(元)[0]!;
    const 塗り入り: CdlDiagram = {
      ...元,
      nodes: [{ ...折れ線, chartFillUnder: true }, ...元.nodes.slice(1)],
    };

    // When
    const 後 = 図の折れ線の見せ方を変える(塗り入り, 既定の折れ線の指定);

    // Then
    expect(折れ線のnode(後)[0]?.chartFillUnder, "押しボタンは切なのに塗りが残っている").toBe(false);
  });

  it("折れ線でない node の欄は触らない", () => {
    // Given
    const 元 = 合成の図();
    const 棒 = 元.nodes.find((node) => node.kind === "chart-bar")!;

    // When
    const 後 = 図の折れ線の見せ方を変える(元, { ...既定の折れ線の指定, 塗り: true });

    // Then
    expect(
      後.nodes.find((node) => node.kind === "chart-bar"),
      "棒グラフ node を作り直している",
    ).toBe(棒);
  });

  it("折れ線 node が 2 つなら両方へ指定が効く", () => {
    // Given
    const 元 = 見本を取る("chart-line-demo");
    const 折れ線 = 折れ線のnode(元)[0]!;
    const 二本の図: CdlDiagram = {
      ...元,
      nodes: [折れ線, { ...折れ線, id: `${折れ線.id}-second` }],
    };

    // When
    const 後 = 図の折れ線の見せ方を変える(二本の図, { ...既定の折れ線の指定, なぞり: true });

    // Then
    expect(
      折れ線のnode(後).every((node) => node.chartTrace === true),
      "2 本のうち片方にしか なぞり が効いていない",
    ).toBe(true);
  });

  it("折れ線を持たない図はどの指定でも元の object を返す", () => {
    // Given
    const 元 = 見本を取る("経路別の流入");
    const 指定: 折れ線の指定 = { 塗り: true, せり上げ: true, なぞり: true };

    // When
    const 後 = 図の折れ線の見せ方を変える(元, 指定);

    // Then
    expect(後, "折れ線の無い図を作り直している").toBe(元);
  });
});
