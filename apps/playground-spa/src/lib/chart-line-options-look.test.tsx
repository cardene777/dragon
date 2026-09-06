/**
 * 折れ線の見せ方が engine の描画へ届く検査 (#1624)。
 *
 * node の欄だけでなく、実際に描いた SVG の role を見る。既定の絵を欄を書かない元の絵と
 * 完全一致させることで、画面の初期状態と engine の既定がずれないことも固定する。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import { CATALOG_ITEMS } from "./catalog-items";
import {
  図の折れ線の見せ方を変える,
  既定の折れ線の指定,
  type 折れ線の指定,
} from "./chart-line-options";

function chartsの一覧() {
  const items = CATALOG_ITEMS.charts;
  if (items === undefined) throw new Error("charts の一覧が無い");
  return items;
}

const チャート一覧 = chartsの一覧();

function 折れ線の図() {
  const item = チャート一覧.find((x) => x.diagram.topic === "週ごとの応答時間");
  expect(item, "週ごとの応答時間 の見本が見つからない").toBeDefined();
  return item!.diagram;
}

const 描く = (diagram: ReturnType<typeof 折れ線の図>): string =>
  renderToStaticMarkup(<CdlDiagramView diagram={layout(diagram)} />);

const roleの数 = (svg: string, role: string): number =>
  (svg.match(new RegExp(`data-cdl-role="${role}"`, "g")) ?? []).length;

describe("折れ線の見せ方を描いた絵で見る (#1624)", () => {
  it("既定の絵は 3 欄を書かない元の絵と 1 文字も違わない", () => {
    // Given
    const 元 = 折れ線の図();

    // When
    const 既定の絵 = 描く(図の折れ線の見せ方を変える(元, 既定の折れ線の指定));

    // Then
    expect(既定の絵, "初期値の絵が engine の欄なし既定とずれている").toBe(描く(元));
  });

  it.each([
    ["塗り", "chart-line-fill-under"],
    ["せり上げ", "chart-line-value-rise"],
  ] as const)("%s は入れると %s が出て、切ると消える", (見せ方, role) => {
    // Given
    const 元 = 折れ線の図();
    const 入れる: 折れ線の指定 = { ...既定の折れ線の指定, [見せ方]: true };

    // When
    const 入れた絵 = 描く(図の折れ線の見せ方を変える(元, 入れる));
    const 切った絵 = 描く(図の折れ線の見せ方を変える(元, 既定の折れ線の指定));

    // Then
    expect(roleの数(入れた絵, role), `${見せ方} を入れても ${role} が出ない`).toBeGreaterThan(0);
    expect(roleの数(切った絵, role), `${見せ方} を切っても ${role} が残っている`).toBe(0);
  });

  // なぞりの粒は段の進みが 0.55 以上 1 未満の間だけ出るため、進み 0 の静止画には出ない。
  // 同じ窓は点と値にも掛かり、なぞりを入れた静止画では値が引き切るまで隠れる。
  // ここではその値の有無を見て、なぞりの入り切りを両方向で固定する。
  // 動いている途中の粒そのものは cdl 側の検査が確認している。
  it("なぞりは引き切るまで値を出さない", () => {
    // Given
    const 元 = 折れ線の図();
    const 入れる: 折れ線の指定 = { ...既定の折れ線の指定, なぞり: true };

    // When
    const 切った絵 = 描く(図の折れ線の見せ方を変える(元, 既定の折れ線の指定));
    const 入れた絵 = 描く(図の折れ線の見せ方を変える(元, 入れる));

    // Then
    expect(
      roleの数(切った絵, "chart-line-value"),
      "なぞりを切っても値が出ない",
    ).toBeGreaterThanOrEqual(1);
    expect(roleの数(入れた絵, "chart-line-value"), "なぞりを入れても値が残っている").toBe(0);
  });
});
