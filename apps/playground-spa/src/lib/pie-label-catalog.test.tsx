/**
 * カタログの円グラフで、名札が重ならないことの検査 (#1674)。
 *
 * 描画側 (`cdl#727`) が名札の縦をほどき、横を左右の列に揃えるようになった。
 * 版を上げただけでは効かないので、**実際に見本の図を描いて名札の位置を測る**。
 *
 * 小さい取り分が 2 個続くだけで崩れる形なので、見本に無くても記法から組んだ図で確かめる。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { CATALOG_ITEMS } from "./catalog-items";
import { 字幅 } from "./text-width-estimate";

type 箱 = { x0: number; x1: number; y0: number; y1: number; 文: string };

/** 名札 (引き出し線 1 + 起点の点 1 + 字 2 の群) の字が墨を置く矩形 */
function 名札の箱たち(svg: string): 箱[] {
  const 出た: 箱[] = [];
  for (const g of svg.matchAll(/<g><path d="M [^"]*"[^>]*><\/path><circle[^>]*><\/circle>(.*?)<\/g>/gs)) {
    for (const t of (g[1] ?? "").matchAll(
      /<text x="([-\d.]+)" y="([-\d.]+)"[^>]*text-anchor="([a-z]+)"[^>]*font-size="([\d.]+)"[^>]*>([^<]*)</g,
    )) {
      const x = Number(t[1]);
      const y = Number(t[2]);
      const 級 = Number(t[4]);
      const w = 字幅(t[5] ?? "", 級);
      const x0 = t[3] === "start" ? x : x - w;
      出た.push({ x0, x1: x0 + w, y0: y - 級 * 0.75, y1: y + 級 * 0.2, 文: t[5] ?? "" });
    }
  }
  return 出た;
}

/** 重なった面が小さい方の 3 割を超える組。 かすった程度は読めるので数えない */
function 重なる組(箱たち: 箱[]): string[] {
  const 出た: string[] = [];
  for (let i = 0; i < 箱たち.length; i++)
    for (let j = i + 1; j < 箱たち.length; j++) {
      const a = 箱たち[i]!;
      const b = 箱たち[j]!;
      const 幅 = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
      const 高 = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
      if (幅 <= 0 || 高 <= 0) continue;
      const 小 = Math.min((a.x1 - a.x0) * (a.y1 - a.y0), (b.x1 - b.x0) * (b.y1 - b.y0));
      if (幅 * 高 > 小 * 0.3) 出た.push(`"${a.文}" と "${b.文}"`);
    }
  return 出た;
}

const 描く = (d: CdlDiagram): string => renderToStaticMarkup(<CdlDiagramView diagram={layout(d)} />);

/**
 * 起点から描く指定を外した図。 描き切った状態の絵を見るため。
 *
 * **外さないと名札が 1 つも出ない** = 段の進み 0 では、まだ開いていない扇の名札を出さない。
 */
const 描き切った図 = (d: CdlDiagram): CdlDiagram => ({
  ...d,
  phases: d.phases?.map(({ draw: _draw, ...残り }) => 残り),
});

/** 小さい取り分が n 個続く円を記法から組む */
const 小片の記法 = (n: number): string =>
  [
    `title: "内訳"`,
    `type: pie`,
    ``,
    `actors:`,
    `  - 主力: { value: "300" }`,
    ...Array.from({ length: n }, (_, i) => `  - 小${i}: { value: "1" }`),
    ``,
  ].join("\n");

describe("カタログの円グラフは名札が重ならない (#1674)", () => {
  it("見本の円グラフで名札が 1 組も重ならない", () => {
    const 一覧 = Object.values(CATALOG_ITEMS)
      .flat()
      .filter(({ diagram }) => diagram.nodes.some((n) => n.kind === "chart-pie"));
    expect(一覧.length, "円グラフの見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
    let 測れた = 0;
    for (const { diagram } of 一覧) {
      const 箱たち = 名札の箱たち(描く(描き切った図(diagram)));
      測れた += 箱たち.length;
      expect(重なる組(箱たち)).toEqual([]);
    }
    expect(測れた, "名札を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it.each([2, 3, 4, 5])("記法から組んだ小片 %i 個の円でも重ならない", (n) => {
    const 箱たち = 名札の箱たち(描く(textDslToDiagram(小片の記法(n))));
    // 名札は 1 件 = 割合 + 名前 の 2 つ
    expect(箱たち.length, "名札を 1 つも測れていない (検査が空振りしている)").toBe((n + 1) * 2);
    expect(重なる組(箱たち)).toEqual([]);
  });

  it("重なりの探し方が、置いた重なりを見つける", () => {
    // 植え込み対照。 上の検査は 0 件を期待するので、探し方が何も見つけないだけでも通る
    const 置いた: 箱[] = [
      { x0: 0, x1: 40, y0: 0, y1: 20, 文: "あ" },
      { x0: 5, x1: 45, y0: 2, y1: 22, 文: "い" },
      { x0: 100, x1: 140, y0: 0, y1: 20, 文: "う" },
    ];
    expect(重なる組(置いた)).toEqual(['"あ" と "い"']);
  });
});
