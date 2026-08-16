/**
 * 記法に書いた `values:` が、実際に絵として出ることの検査 (#1162)。
 *
 * 記法から画面までを通す。 `textDslToDiagram` → `CdlDiagramView` は編集画面と同じ経路で
 * (`CdlEditor.tsx` が同じ 2 つを呼ぶ)、`CdlDiagramView` は内部で `computeStateValues` を
 * 呼んでから箱の文字を解決する。
 *
 * **値の計算だけを見る検査とは別に置く**。 計算が合っていても、その値を描く経路が無ければ
 * 画面は変わらない (#1173 で 79 件がこの形だった)。 SVG の文字として出たことを見れば、
 * 描く経路の有無まで込みで確かめられる。
 *
 * 段の途中の値 (`progress` 0.5) は静止した描画では作れないため、
 * `packages/dragon/test/values-compile.test.ts` が `computeStateValues` を直接見る。
 */
import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";

/** 記法を画面に描いた SVG。 編集画面が呼ぶのと同じ 2 つを通す。 */
function 画面(src: string): string {
  return renderToStaticMarkup(<CdlDiagramView diagram={textDslToDiagram(src)} hideHeader />);
}

/** 箱の値の欄に `{waiting}` を置いた図。 `values` は `states` 2 つから決まる。 */
const 記法 = (body: string) => `title: "確認"
type: flow

actors:
  - 受付: "待ち行列" "{waiting}"
  - 処理

flow:
  - 受付 -> 処理: "渡す"

${body}`;

const 値の宣言 = `states:
  inflow: 10
  done: 4

values:
  waiting: "{inflow} - {done}"`;

describe("値が絵として出る (#1162)", () => {
  it("`animation:` を書かなくても、決まった値が箱に出る", () => {
    // 本 Issue の Goal 例がこの形。 段を書かない図では状態が図に載らず、画面には
    // `{waiting}` の生の形が出ていた (実測)
    const svg = 画面(記法(値の宣言));
    expect(svg).toContain(">6<");
    expect(svg).not.toContain("{waiting}");
  });

  it("段を書いた図でも同じ値が出る", () => {
    const svg = 画面(
      記法(`${値の宣言}

animation:
  - step: "流れる" 1.4s
    focus: [受付]`),
    );
    expect(svg).toContain(">6<");
    expect(svg).not.toContain("{waiting}");
  });

  it("参照した値が動くと、絵に出る値も動く", () => {
    // 段の始点と終点で違う値になる。 端点を 2 つ見れば、値が段に追随することが分かる
    const src = 記法(`states:
  inflow: 0
  done: 0

values:
  waiting: "{inflow} - {done}"

animation:
  - step: "増える" 1.4s
    focus: [受付]
    set:
      inflow: 40
  - step: "捌く" 1.4s
    focus: [処理]
    set:
      done: 15`);
    const 段1 = renderToStaticMarkup(
      <CdlDiagramView diagram={textDslToDiagram(src)} hideHeader focusPhaseId="増える" />,
    );
    const 段2 = renderToStaticMarkup(
      <CdlDiagramView diagram={textDslToDiagram(src)} hideHeader focusPhaseId="捌く" />,
    );
    expect(段1).toContain(">40<");
    expect(段2).toContain(">25<");
  });

  it("解けない値は生の形のまま残る (だから知らせが要る)", () => {
    // 参照先が無い値は engine が止める。 画面には `{waiting}` がそのまま出るため、
    // 書いた人に伝わらないと綴りを疑うことになる (知らせの検査は記法側にある)
    const svg = 画面(
      記法(`states:
  inflow: 10

values:
  waiting: "{missing} - 1"`),
    );
    expect(svg).toContain("{waiting}");
  });

  it("`values` を書かない図の絵は変わらない", () => {
    const 値なし = `title: "確認"
type: flow

actors:
  - 受付: "待ち行列"
  - 処理

flow:
  - 受付 -> 処理: "渡す"
`;
    const svg = renderToStaticMarkup(
      <CdlDiagramView diagram={textDslToDiagram(値なし)} hideHeader />,
    );
    expect(svg).toContain("待ち行列");
    expect(svg).not.toContain("{");
  });
});
