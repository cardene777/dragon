// @vitest-environment jsdom

/**
 * 図の倍率を測る部品の、図が替わった時の測り直しの検査 (#2044)。
 *
 * engine は図が替わっても同じ svg の中身を書き換える。 大きさの変化を見張るだけだと測り直しが
 * 次のフレームになり、その間は新しい図の欄に前の図の百分率が出る (負荷が高いと 500ms 以上残った)。
 * 実ブラウザでの見え方は `tests/preset-panzoom.spec.ts` が見る。 こちらは **描画の中で測り直すこと**
 * を固定する。
 *
 * | 見るもの | なぜ |
 * |---|---|
 * | 図の鍵が替わった描画で、新しい図の倍率になる | 次のフレームを待つと、前の図の倍率を起点に刻みを選ぶ (200% の図で「上げる」 が 75% へ縮む) |
 * | 移った先に図がまだ無ければ、測れていない値になる | 前の図の倍率を別の図の欄に残さない |
 *
 * jsdom は `ResizeObserver` を持たないので、大きさの見張りはここでは動かない = 測れた値は全て
 * 描画の中の測り直しから来ている。
 */
import { afterEach, describe, it, expect } from "vitest";
import { cleanup, renderHook } from "@testing-library/react";
import { useDiagramPanZoom } from "./useDiagramPanZoom";
import { 収める } from "@/lib/diagram-zoom";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

const SVGの名前空間 = "http://www.w3.org/2000/svg";

/** jsdom は描かないので、engine が描いた後の svg の箱と viewBox を書き込む */
function 描いたことにする(
  svg: SVGSVGElement,
  viewBox: { 幅: number; 高さ: number },
  箱: { 幅: number; 高さ: number },
): void {
  svg.setAttribute("viewBox", `0 0 ${viewBox.幅} ${viewBox.高さ}`);
  Object.defineProperty(svg, "viewBox", {
    configurable: true,
    value: { baseVal: { x: 0, y: 0, width: viewBox.幅, height: viewBox.高さ } },
  });
  Object.defineProperty(svg, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: 箱.幅,
      height: 箱.高さ,
      right: 箱.幅,
      bottom: 箱.高さ,
      toJSON: () => ({}),
    }),
  });
}

/** 台 (器) と、engine が図を描く入れ物と svg を作る */
function 台を作る(): { 器: HTMLElement; 入れ物: HTMLElement; svg: SVGSVGElement } {
  const 器 = document.createElement("div");
  const 入れ物 = document.createElement("div");
  入れ物.setAttribute("data-cdl-diagram", "swim-demo");
  const svg = document.createElementNS(SVGの名前空間, "svg");
  入れ物.appendChild(svg);
  器.appendChild(入れ物);
  document.body.appendChild(器);
  return { 器, 入れ物, svg };
}

function 測る部品を置く(器: HTMLElement, 図の鍵: object) {
  return renderHook(
    ({ 鍵 }: { 鍵: object }) =>
      useDiagramPanZoom({
        器,
        倍率: 収める,
        倍率を置く: () => {},
        viewBox幅: 1000,
        修飾キー無しで拡大: false,
        頁も送る: true,
        図の鍵: 鍵,
      }),
    { initialProps: { 鍵: 図の鍵 } },
  );
}

describe("useDiagramPanZoom の図が替わった時の測り直し (#2044)", () => {
  it("図の鍵が替わった描画で、同じ svg に描き直された新しい図の倍率になる", () => {
    const { 器, 入れ物, svg } = 台を作る();
    描いたことにする(svg, { 幅: 1917, 高さ: 700 }, { 幅: 1150, 高さ: 420 });
    const { result, rerender } = 測る部品を置く(器, { 名: "swimlane" });
    expect(result.current.収めた倍率, "最初の図を描画の中で測れていない").toBeCloseTo(1150 / 1917, 4);

    // engine と同じく svg は差し替えず、中身と大きさだけを次の図にする
    入れ物.setAttribute("data-cdl-diagram", "flow-demo");
    描いたことにする(svg, { 幅: 576, 高さ: 920 }, { 幅: 1150, 高さ: 1837 });
    rerender({ 鍵: { 名: "flow" } });
    expect(result.current.収めた倍率, "前の図の倍率が残っている").toBeCloseTo(1150 / 576, 4);
  });

  it("移った先に図がまだ無ければ、前の図の倍率を残さず測れていない値になる", () => {
    const { 器, 入れ物, svg } = 台を作る();
    描いたことにする(svg, { 幅: 1917, 高さ: 700 }, { 幅: 1150, 高さ: 420 });
    const { result, rerender } = 測る部品を置く(器, { 名: "swimlane" });
    expect(result.current.収めた倍率, "最初の図を描画の中で測れていない").toBeCloseTo(1150 / 1917, 4);

    入れ物.remove();
    rerender({ 鍵: { 名: "flow" } });
    expect(result.current.収めた倍率, "図が無いのに前の図の倍率が残っている").toBeUndefined();
  });
});
