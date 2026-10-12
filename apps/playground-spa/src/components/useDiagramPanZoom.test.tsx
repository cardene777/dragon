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
 * jsdom は `ResizeObserver` を持たないので、通常は大きさの見張りが動かない = 測れた値は全て
 * 描画の中の測り直しから来る。 MutationObserver の検査だけは空の見張りを置いて観測経路を動かす。
 */
import { useCallback, useState, type CSSProperties } from "react";
import { act, cleanup, render, renderHook } from "@testing-library/react";
import { afterEach, describe, it, expect, vi } from "vitest";
import {
  useDiagramPanZoom,
  倍率の表示が同じ,
  忘れない最小,
  動き終わりの実効,
} from "./useDiagramPanZoom";
import { 収める } from "@/lib/diagram-zoom";

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
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
function 台を作る(
  器の幅 = 0,
  描かれた器の幅 = 器の幅,
): { 器: HTMLElement; 入れ物: HTMLElement; svg: SVGSVGElement } {
  const 器 = document.createElement("div");
  // jsdom は描かないので巻き取る要素の内側の幅を書き込む (下限は器の幅から出る)
  Object.defineProperty(器, "clientWidth", { configurable: true, value: 器の幅 });
  Object.defineProperty(器, "getBoundingClientRect", {
    configurable: true,
    value: () => ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: 描かれた器の幅,
      height: 0,
      right: 描かれた器の幅,
      bottom: 0,
      toJSON: () => ({}),
    }),
  });
  const 入れ物 = document.createElement("div");
  入れ物.setAttribute("data-cdl-diagram", "swim-demo");
  const svg = document.createElementNS(SVGの名前空間, "svg");
  入れ物.appendChild(svg);
  器.appendChild(入れ物);
  document.body.appendChild(器);
  return { 器, 入れ物, svg };
}

/** 図の中の文字を、指定した大きさの並びに置き換える */
function 文字を置く(svg: SVGSVGElement, 大きさ: readonly number[]): void {
  for (const t of [...svg.querySelectorAll("text")]) t.remove();
  for (const [i, 指定] of 大きさ.entries()) {
    const t = document.createElementNS(SVGの名前空間, "text");
    t.setAttribute("font-size", String(指定));
    t.textContent = `字${i}`;
    svg.appendChild(t);
  }
}

function 測る部品を置く(器: HTMLElement, 図の鍵: object, 足す: { 読める下限を課す?: boolean } = {}) {
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
        ...足す,
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

  it("最小の字 14 の図から幅に合わせた倍率 0.62 の図へ替えた最初の描画で、欄の倍率と svg に当てる倍率が同じになる", () => {
    const { 器, 入れ物, svg } = 台を作る(620);
    描いたことにする(svg, { 幅: 620, 高さ: 400 }, { 幅: 620, 高さ: 400 });
    文字を置く(svg, [14]);

    const 描画: Array<{
      鍵: object;
      収めた倍率: number | undefined;
      読める下限の倍率: number | undefined;
    }> = [];
    const 最初の鍵 = { 名: "文字 14" };
    const 次の鍵 = { 名: "幅 0.62" };
    const { rerender } = renderHook(
      ({ 鍵, 幅 }: { 鍵: object; 幅: number }) => {
        const 値 = useDiagramPanZoom({
          器,
          倍率: 収める,
          倍率を置く: () => {},
          viewBox幅: 幅,
          修飾キー無しで拡大: false,
          頁も送る: true,
          図の鍵: 鍵,
          読める下限を課す: true,
        });
        描画.push({ 鍵, 収めた倍率: 値.収めた倍率, 読める下限の倍率: 値.読める下限の倍率 });
        return 値;
      },
      { initialProps: { 鍵: 最初の鍵, 幅: 620 } },
    );

    // engine は同じ svg の中身を書き換える。次の図は器 620px / viewBox 1000 = 0.62 で描かれる。
    入れ物.setAttribute("data-cdl-diagram", "wide-demo");
    描いたことにする(svg, { 幅: 1000, 高さ: 400 }, { 幅: 620, 高さ: 248 });
    文字を置く(svg, [24]);
    描画.length = 0;
    rerender({ 鍵: 次の鍵, 幅: 1000 });

    const 最初の描画 = 描画[0];
    expect(最初の描画?.鍵).toBe(次の鍵);
    expect(最初の描画?.読める下限の倍率, "前の図の 14 から 10/14 を出している").toBeUndefined();
    expect(最初の描画?.収めた倍率, "欄が svg の幅合わせ 0.62 と揃っていない").toBeCloseTo(0.62, 4);
  });

  it("切替直後の倍率は整数の clientWidth でなく実際に描かれた小数の幅から出す", () => {
    // 1000px の viewBox に対して 624.9px は 62%、整数の clientWidth 625px は 63% になる。
    const { 器, 入れ物, svg } = 台を作る(625, 624.9);
    描いたことにする(svg, { 幅: 500, 高さ: 400 }, { 幅: 624.9, 高さ: 499.92 });
    const 最初の鍵 = { 名: "最初" };
    const 次の鍵 = { 名: "次" };
    const { rerender, result } = 測る部品を置く(器, 最初の鍵);

    入れ物.setAttribute("data-cdl-diagram", "next-demo");
    描いたことにする(svg, { 幅: 1000, 高さ: 400 }, { 幅: 624.9, 高さ: 249.96 });
    rerender({ 鍵: 次の鍵 });

    expect(Math.round((result.current.収めた倍率 ?? 0) * 100)).toBe(62);
  });

  it("小数の幅が後から変わり、百分率の丸め境界をまたいだ時は同じ倍率とみなさない", () => {
    expect(倍率の表示が同じ(0.625, 0.6249), "63% と 62% の差を捨てている").toBe(false);
    expect(倍率の表示が同じ(0.6249, 0.62489), "同じ 62% の小数の揺れで描き直す").toBe(true);
  });

  it("読める下限との差が配置の丸めだけなら、欄は描かれた倍率の百分率を返す", () => {
    const viewBox = { 幅: 1870, 高さ: 1151.88232421875 };
    const 幅の比 = 0.625;
    const 高さの比 = 0.624996;
    const { 器, svg } = 台を作る(viewBox.幅 * 幅の比);
    描いたことにする(
      svg,
      viewBox,
      { 幅: viewBox.幅 * 幅の比, 高さ: viewBox.高さ * 高さの比 },
    );
    // 下限を幅の比より僅かに上げ、下限を課す分岐を通す。差は Chromium の配置単位 1/64px 未満。
    文字を置く(svg, [10 / (幅の比 + 1e-9)]);
    const 図の鍵 = { 名: "delivery-sequence" };

    const { result } = renderHook(() =>
      useDiagramPanZoom({
        器,
        倍率: 収める,
        倍率を置く: () => {},
        viewBox幅: viewBox.幅,
        修飾キー無しで拡大: false,
        頁も送る: true,
        図の鍵,
        読める下限を課す: true,
      }),
    );

    expect(result.current.読める下限の倍率, "読める下限を課す分岐を通っていない").toBeCloseTo(幅の比, 8);
    expect(Math.round((result.current.収めた倍率 ?? 0) * 100), "欄が描かれた倍率 62% でない").toBe(62);
  });

  it("読める下限から作った幅を当てた commit で、ResizeObserver を待たず欄を描かれた倍率へ揃える", () => {
    const viewBox = { 幅: 1870, 高さ: 1151.88232421875 };
    const 幅の比 = 0.625;
    const 高さの比 = 0.624996;
    const 図の鍵 = { 名: "delivery-sequence" };

    function AppliedWidthScreen(): React.JSX.Element {
      const [器, set器] = useState<HTMLDivElement | null>(null);
      const 器を置く = useCallback((node: HTMLDivElement | null) => {
        if (node) {
          Object.defineProperty(node, "clientWidth", {
            configurable: true,
            value: viewBox.幅 * 幅の比,
          });
          Object.defineProperty(node, "getBoundingClientRect", {
            configurable: true,
            value: () => ({
              x: 0,
              y: 0,
              left: 0,
              top: 0,
              width: viewBox.幅 * 幅の比,
              height: 0,
              right: viewBox.幅 * 幅の比,
              bottom: 0,
              toJSON: () => ({}),
            }),
          });
        }
        set器(node);
      }, []);
      const svgを置く = useCallback((node: SVGSVGElement | null) => {
        if (!node) return;
        Object.defineProperty(node, "viewBox", {
          configurable: true,
          value: { baseVal: { x: 0, y: 0, width: viewBox.幅, height: viewBox.高さ } },
        });
        Object.defineProperty(node, "getBoundingClientRect", {
          configurable: true,
          value: () => {
            const 幅が当たった = node.closest<HTMLElement>("[data-testid='stage']")?.style.getPropertyValue(
              "--cdl-zoom-width",
            );
            const 高さ = viewBox.高さ * (幅が当たった ? 高さの比 : 幅の比);
            return {
              x: 0,
              y: 0,
              left: 0,
              top: 0,
              width: viewBox.幅 * 幅の比,
              height: 高さ,
              right: viewBox.幅 * 幅の比,
              bottom: 高さ,
              toJSON: () => ({}),
            };
          },
        });
      }, []);
      const 操作 = useDiagramPanZoom({
        器,
        倍率: 収める,
        倍率を置く: () => {},
        viewBox幅: viewBox.幅,
        修飾キー無しで拡大: false,
        頁も送る: true,
        図の鍵,
        読める下限を課す: true,
      });
      const 指定した幅 = 操作.図に当てる幅;

      return (
        <>
          <output data-testid="倍率">{Math.round((操作.収めた倍率 ?? 0) * 100)}%</output>
          <div
            ref={器を置く}
            data-testid="stage"
            style={
              指定した幅 === undefined
                ? undefined
                : ({ "--cdl-zoom-width": `${指定した幅}px` } as CSSProperties)
            }
          >
            <div data-cdl-diagram="delivery-sequence-demo">
              <svg ref={svgを置く} viewBox={`0 0 ${viewBox.幅} ${viewBox.高さ}`}>
                <text fontSize={10 / (幅の比 + 1e-9)}>字</text>
              </svg>
            </div>
          </div>
        </>
      );
    }

    const { getByTestId } = render(<AppliedWidthScreen />);

    expect(getByTestId("倍率").textContent, "幅を当てた直後の欄が描かれた倍率 62% でない").toBe("62%");
  });

  it("svg が替わった MutationObserver の時点で、rAF を待たず欄を描かれた倍率へ揃える", async () => {
    class 大きさの見張り {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    }
    vi.stubGlobal("ResizeObserver", 大きさの見張り);
    vi.stubGlobal("requestAnimationFrame", () => 1);
    vi.stubGlobal("cancelAnimationFrame", () => {});

    const viewBox = { 幅: 1870, 高さ: 1151.88232421875 };
    const 幅の比 = 0.625;
    const 高さの比 = 0.624996;
    const { 器, 入れ物, svg } = 台を作る(viewBox.幅 * 幅の比);
    描いたことにする(svg, viewBox, {
      幅: viewBox.幅 * 幅の比,
      高さ: viewBox.高さ * 幅の比,
    });
    文字を置く(svg, [10 / (幅の比 + 1e-9)]);
    const 図の鍵 = { 名: "delivery-sequence" };
    const { result } = renderHook(() =>
      useDiagramPanZoom({
        器,
        倍率: 収める,
        倍率を置く: () => {},
        viewBox幅: viewBox.幅,
        修飾キー無しで拡大: false,
        頁も送る: true,
        図の鍵,
        読める下限を課す: true,
      }),
    );
    expect(Math.round((result.current.収めた倍率 ?? 0) * 100)).toBe(63);

    const 次のsvg = document.createElementNS(SVGの名前空間, "svg");
    描いたことにする(次のsvg, viewBox, {
      幅: viewBox.幅 * 幅の比,
      高さ: viewBox.高さ * 高さの比,
    });
    文字を置く(次のsvg, [10 / (幅の比 + 1e-9)]);
    const mutationが届く = new Promise<void>((resolve) => {
      const observer = new MutationObserver(() => {
        observer.disconnect();
        resolve();
      });
      observer.observe(入れ物, { childList: true });
    });
    await act(async () => {
      入れ物.replaceChildren(次のsvg);
      // MutationObserver の microtask だけを通し、予約された rAF は進めない。
      await mutationが届く;
    });

    expect(
      Math.round((result.current.収めた倍率 ?? 0) * 100),
      "svg が DOM に入った直後の欄が描かれた倍率 62% でない",
    ).toBe(62);
  });
});

describe("忘れない最小 — 開いた後に増えた文字 (#2280)", () => {
  it("**小さい方へしか動かない**", () => {
    // 漏斗図は指定 14 の 4 件で始まり、後から指定 11 を含む 11 件になる
    expect(忘れない最小(14, 11)).toBe(11);
    expect(忘れない最小(11, 14), "大きい方へ戻ると下限が緩んで往復する").toBe(11);
  });

  it("同じ値を何度渡しても答えが変わらない", () => {
    const 一度目 = 忘れない最小(undefined, 11);
    expect(忘れない最小(一度目, 11)).toBe(一度目);
    expect(忘れない最小(忘れない最小(一度目, 14), 11)).toBe(一度目);
  });

  it("測れていない時は覚えている値を残す", () => {
    // 文字が一瞬消えたことを理由に図の大きさを動かさない
    expect(忘れない最小(11, undefined)).toBe(11);
    expect(忘れない最小(undefined, undefined)).toBeUndefined();
  });

  it("覚えていなければ測れた値をそのまま採る", () => {
    expect(忘れない最小(undefined, 14)).toBe(14);
  });
});

describe("動き終わりの実効 — 動きと静止を時間で分ける (#2287)", () => {
  it("**大きい方へしか動かない**", () => {
    // 描き出しの動きは実効を上へ動かす (実測 = ガントチャートの帯の中の名前が 0.4651 → 0.968 → 1)。
    // 最大を採れば動き終わりの値になる
    expect(動き終わりの実効(5.1, 10.6)).toBe(10.6);
    expect(動き終わりの実効(10.6, 5.1), "小さい方へ戻ると動きの途中を母数にする").toBe(10.6);
  });

  it("動かない縮小では窓の長さによらず同じ値になる", () => {
    // `ethereum` の `ハッシュ` は 10 回測っても実効 7.55 のまま
    const 標本 = [7.55, 7.55, 7.55, 7.55, 7.55, 7.55];
    expect(標本.reduce<number | undefined>(動き終わりの実効, undefined)).toBe(7.55);
    expect(標本.slice(0, 2).reduce<number | undefined>(動き終わりの実効, undefined)).toBe(7.55);
  });

  it("上りの動きでは最後の値に一致する", () => {
    const 標本 = [11 * 0.4651, 11 * 0.968, 11, 11];
    expect(標本.reduce<number | undefined>(動き終わりの実効, undefined)).toBe(11);
  });

  it("測れていない標本で窓を埋めない", () => {
    // 図がまだ描かれていない間は変換が取れない。 その回を数えると動き終わりを取り逃がす
    expect(動き終わりの実効(undefined, undefined)).toBeUndefined();
    expect(動き終わりの実効(7.55, undefined)).toBe(7.55);
    expect(動き終わりの実効(undefined, 7.55)).toBe(7.55);
  });

  it("2 回続けて同じでも、そこで止めれば動きの途中を拾いうる", () => {
    // 「2 回続けて同じなら静止」 とする案を退けた理由。 途中の平らな所を 2 回拾うと
    // 静止した姿より小さい母数で下限が決まり、図が要る以上に拡がる
    const 途中で平ら = [5.1, 5.1, 8.0, 11];
    expect(途中で平ら.slice(0, 2).reduce<number | undefined>(動き終わりの実効, undefined)).toBe(5.1);
    expect(途中で平ら.reduce<number | undefined>(動き終わりの実効, undefined)).toBe(11);
  });
});

describe("useDiagramPanZoom の図が替わった時に覚えた最小を捨てる (#2280)", () => {
  it("**前の図の小ささを次の図の下限に持ち越さない**", () => {
    const { 器, 入れ物, svg } = 台を作る(600);
    // 文字の小さい図。 収める倍率 (1150/1917 = 0.6) では 11 × 0.6 = 6.6px で下限を割る
    描いたことにする(svg, { 幅: 1917, 高さ: 700 }, { 幅: 1150, 高さ: 420 });
    文字を置く(svg, [11]);
    const { result, rerender } = 測る部品を置く(器, { 名: "swimlane" }, { 読める下限を課す: true });
    expect(result.current.読める下限の倍率, "小さい文字の図で下限が効いていない").toBeCloseTo(
      10 / 11,
      4,
    );

    // 文字の大きい図へ移る。 収める倍率で 24 × 0.6 = 14.4px あるので下限は要らない
    入れ物.setAttribute("data-cdl-diagram", "flow-demo");
    描いたことにする(svg, { 幅: 1917, 高さ: 700 }, { 幅: 1150, 高さ: 420 });
    文字を置く(svg, [24]);
    rerender({ 鍵: { 名: "flow" } });
    expect(
      result.current.読める下限の倍率,
      "前の図の 11 を覚えたままで、文字の大きい図が実寸に張り付いている",
    ).toBeUndefined();
  });
});

describe("図の欄が在るかを 3 通りで返す (#2682)", () => {
  it("欄に svg が在れば「ある」", () => {
    const { 器, svg } = 台を作る();
    描いたことにする(svg, { 幅: 1917, 高さ: 700 }, { 幅: 1150, 高さ: 420 });
    const { result } = 測る部品を置く(器, { 名: "swimlane" });
    expect(result.current.図の欄).toBe("ある");
  });

  it("欄に svg が無ければ「無い」", () => {
    // engine は描くものが 1 つも無い図に欄を出さない (cdl#924)
    const { 器, 入れ物 } = 台を作る();
    入れ物.remove();
    const { result } = 測る部品を置く(器, { 名: "readout" });
    expect(result.current.図の欄).toBe("無い");
  });

  it("まだ測っていなければ「無い」 に倒さない", () => {
    // 図の幅を出せない間は測りに行かない。 ここを「無い」 と読むと、描かれる図の操作が一瞬消える
    const { 器, svg } = 台を作る();
    描いたことにする(svg, { 幅: 1917, 高さ: 700 }, { 幅: 1150, 高さ: 420 });
    const { result } = renderHook(() =>
      useDiagramPanZoom({
        器,
        倍率: 収める,
        倍率を置く: () => {},
        viewBox幅: undefined,
        修飾キー無しで拡大: false,
        頁も送る: true,
        図の鍵: { 名: "swimlane" },
      }),
    );
    expect(result.current.図の欄).toBe("まだ測っていない");
  });
});
