/**
 * カタログの棒グラフの見た目の検査 (#1686)。
 *
 * 描画側 (`cdl#747`) が縦軸の目盛りを人の読む数へ切り上げ、棒の太さを隙間との比で決める
 * ようになった。 **版を上げただけでは効かない** ので、実際に見本の図を描いて
 * 目盛りの字と棒の位置を測る。
 *
 * 上げる前のカタログを測ると、普通の棒グラフから外れた値が 4 つ出ていた。
 *
 * | 見たもの | 上げる前 | 上げた後 |
 * |---|---|---|
 * | 縦軸の目盛り | 0 / 170 / 340 / 510 / 680 | 0 / 200 / 400 / 600 / 800 |
 * | 棒幅 対 隙間 | 126.5px 対 10px = 12.7 : 1 | 88.6px 対 40.3px = 2.2 : 1 |
 * | 棒の色 | 1 種類 | いちばん大きい棒だけ濃い |
 * | 角丸 | 2 (幅 126.5px に対して) | 棒幅の 6% |
 *
 * **陰性対照はここに無い** (#1704)。 「棒グラフを持たない見本に棒が出ない」 は
 * `catalog-kind-role-isolation.test.tsx` が種別 9 種すべてについて見る。 ここと
 * `catalog-axis-text` が同じ全図を別々に描いており、全件走査で時間切れになっていた。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { CATALOG_ITEMS } from "./catalog-items";

const 描く = (d: CdlDiagram): string => renderToStaticMarkup(<CdlDiagramView diagram={layout(d)} />);

type 棒 = { x: number; w: number; 濃さ: number };

/** 棒の `x` / `width` / `fill-opacity` を読む。 属性の並び順に依らない形で拾う */
function 棒たち(svg: string): 棒[] {
  const 出た: 棒[] = [];
  for (const m of svg.matchAll(/<rect[^>]*data-cdl-role="chart-bar"[^>]*>/g)) {
    const 札 = m[0];
    const 取る = (名: string): number => {
      const r = new RegExp(`${名}="([-\\d.]+)"`).exec(札);
      return r ? Number(r[1]) : Number.NaN;
    };
    出た.push({ x: 取る("x"), w: 取る("width"), 濃さ: 取る("fill-opacity") });
  }
  return 出た.sort((a, b) => a.x - b.x);
}

/** 縦軸の目盛りの字 */
const 目盛りたち = (svg: string): string[] =>
  [...svg.matchAll(/<text[^>]*data-cdl-role="chart-bar-tick"[^>]*>([^<]*)</g)].map(
    (m) => m[1] ?? "",
  );

/** カタログの棒グラフの図。 記法を変えずに見た目が直るのが期待 */
const 棒グラフの見本 = (): CdlDiagram[] =>
  Object.values(CATALOG_ITEMS)
    .flat()
    .filter(({ diagram }) => diagram.nodes.some((n) => n.kind === "chart-bar"))
    .map(({ diagram }) => diagram);

describe("カタログの棒グラフが人の読む形になる (#1686)", () => {
  it("棒グラフの見本を 1 件以上走査できている", () => {
    // 空振り検知。 見本を拾えないと、下の検査は 0 件を回して必ず通る
    expect(棒グラフの見本().length, "棒グラフの見本が 1 件も無い").toBeGreaterThan(0);
  });

  it("縦軸の目盛りが人の読む数になる", () => {
    // 上げる前は 0 / 170 / 340 / 510 / 680 だった (最大値を 4 等分した数)
    const 一覧 = 棒グラフの見本();
    let 測れた = 0;
    for (const d of 一覧) {
      const 目盛り = 目盛りたち(描く(d));
      測れた += 目盛り.length;
      // 人の読む数 = 刻みが 1 / 2 / 2.5 / 5 に 10 の累乗を掛けた数になっている
      const 刻み = Number(目盛り[1]);
      expect(刻み, `目盛りの刻みを読めない: ${目盛り.join(" / ")}`).toBeGreaterThan(0);
      const 桁 = 10 ** Math.floor(Math.log10(刻み));
      expect([1, 2, 2.5, 5], `刻みが ${刻み} (目盛り: ${目盛り.join(" / ")})`).toContain(
        Number((刻み / 桁).toFixed(6)),
      );
    }
    expect(測れた, "目盛りを 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("棒幅 ÷ 隙間 が 4 以下になる", () => {
    // 上げる前は 12.7 : 1 で、4 本が 1 枚の塀のように見えていた
    const 一覧 = 棒グラフの見本();
    let 測れた = 0;
    for (const d of 一覧) {
      const 棒 = 棒たち(描く(d));
      if (棒.length < 2) continue;
      測れた += 棒.length;
      const 隙間 = 棒[1]!.x - (棒[0]!.x + 棒[0]!.w);
      expect(隙間, "隙間が無い").toBeGreaterThan(0);
      expect(棒[0]!.w / 隙間, `棒幅 ${棒[0]!.w} / 隙間 ${隙間}`).toBeLessThanOrEqual(4);
    }
    expect(測れた, "棒を 1 本も測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("いちばん大きい棒だけ濃く出る", () => {
    const 一覧 = 棒グラフの見本();
    let 測れた = 0;
    for (const d of 一覧) {
      const 棒 = 棒たち(描く(d));
      if (棒.length < 2) continue;
      const 濃さたち = 棒.map((b) => b.濃さ);
      expect(濃さたち.every((v) => Number.isFinite(v)), "濃さを読めない").toBe(true);
      測れた += 棒.length;
      const 最大 = Math.max(...濃さたち);
      // 濃い棒が 1 本だけで、他が全部それより薄い
      expect(濃さたち.filter((v) => v === 最大).length, `濃い棒が ${濃さたち.join(" / ")}`).toBe(1);
    }
    expect(測れた, "棒を 1 本も測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });
});
