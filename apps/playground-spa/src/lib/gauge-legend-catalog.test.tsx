/**
 * 見本帳の半円ゲージで、下段の内訳が隣とくっつかないことの検査 (#1676)。
 *
 * 描画側 (`cdl#731`) が区画の幅を中身から決め、入り切らない件を次の段へ送るようになった。
 * 版を上げただけでは効かないので、**実際に見本の図を描いて内訳の字の位置を測る**。
 *
 * 見本の半円ゲージは内訳 3 件で崩れないため、件数を増やした図は記法から組む。
 *
 * ## 字幅の見積りは描画側と同じ階級で出す
 *
 * 見積りが実物より狭いと、重なっていても「重なり 0 件」 になる = 0 件を期待する検査では
 * 甘い見積りがそのまま偽の合格になる。 係数は書体の実測値 (`canvas` の `measureText`) で、
 * 割付の判断ではないため描画側と同じ値を使う。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, layout } from "@cardenelabs/cdl";
import type { CdlDiagram } from "@cardenelabs/cdl";
import { textDslToDiagram } from "@cardenelabs/dragon";
import { CATALOG_ITEMS } from "./catalog-items";
import { 字幅 } from "./text-width-estimate";

type 箱 = { x0: number; x1: number; y0: number; y1: number; 文: string };
type 内訳 = { 段y: number; 印x: number; 箱たち: 箱[]; 文たち: string[] };

/** 下段の内訳 (色の印 1 + 名前 + 数値 の群) を 1 件ずつ読む */
function 内訳たち(svg: string): 内訳[] {
  const 出た: 内訳[] = [];
  for (const g of svg.matchAll(/<g data-cdl-role="chart-gauge-item">(.*?)<\/g>/gs)) {
    const 中 = g[1] ?? "";
    const 印 = /<rect x="([-\d.]+)" y="([-\d.]+)"/.exec(中);
    if (!印) continue;
    const 箱たち: 箱[] = [];
    const 文たち: string[] = [];
    for (const t of 中.matchAll(/<text x="([-\d.]+)" y="([-\d.]+)"[^>]*font-size="([\d.]+)"[^>]*>([^<]*)</g)) {
      const x = Number(t[1]);
      const y = Number(t[2]);
      const 級 = Number(t[3]);
      const 文 = t[4] ?? "";
      箱たち.push({ x0: x, x1: x + 字幅(文, 級), y0: y - 級 * 0.75, y1: y + 級 * 0.2, 文 });
      文たち.push(文);
    }
    出た.push({ 段y: Number(印[2]), 印x: Number(印[1]), 箱たち, 文たち });
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

/** 内訳が n 件の半円ゲージを記法から組む */
const 記法 = (n: number): string =>
  [
    `title: "内訳"`,
    `type: gauge`,
    ``,
    `actors:`,
    ...Array.from({ length: n }, (_, i) => `  - 件名${i}: { value: "${10 + i}" }`),
    ``,
  ].join("\n");

const 段数 = (一覧: 内訳[]): number => new Set(一覧.map((n) => Math.round(n.段y))).size;

describe("見本帳の半円ゲージは内訳がくっつかない (#1676)", () => {
  it("見本の半円ゲージで内訳の字が 1 組も重ならない", () => {
    const 一覧 = Object.values(CATALOG_ITEMS)
      .flat()
      .filter(({ diagram }) => diagram.nodes.some((n) => n.kind === "chart-gauge"));
    expect(一覧.length, "半円ゲージの見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
    let 測れた = 0;
    for (const { diagram } of 一覧) {
      const 箱たち = 内訳たち(描く(diagram)).flatMap((n) => n.箱たち);
      測れた += 箱たち.length;
      expect(重なる組(箱たち)).toEqual([]);
    }
    expect(測れた, "内訳の字を 1 つも測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it.each([4, 8, 12, 20])("記法から組んだ件数 %i の半円ゲージでも重ならない", (n) => {
    const 一覧 = 内訳たち(描く(textDslToDiagram(記法(n))));
    expect(一覧.length, "内訳を 1 つも読めていない (検査が空振りしている)").toBe(n);
    expect(重なる組(一覧.flatMap((x) => x.箱たち))).toEqual([]);
  });

  it("件数 12 では内訳が 2 段以上に折り返る", () => {
    // 1 段に詰め込むのが元の不具合。 重なりが 0 件でも 1 段のままなら直っていない
    expect(段数(内訳たち(描く(textDslToDiagram(記法(12)))))).toBeGreaterThan(1);
  });

  it("見本の内訳 3 件は 1 段のまま", () => {
    // 陰性対照。 折り返しが常に働くと、崩れていない見本まで段が増えて弧が低くなる
    const 一覧 = Object.values(CATALOG_ITEMS)
      .flat()
      .filter(({ diagram }) => diagram.nodes.some((n) => n.kind === "chart-gauge"));
    let 測れた = 0;
    for (const { diagram } of 一覧) {
      const 内訳 = 内訳たち(描く(diagram));
      if (内訳.length === 0) continue;
      測れた += 1;
      expect(段数(内訳), `${内訳.length} 件の見本が折り返っている`).toBe(1);
    }
    expect(測れた, "内訳を持つ見本が 1 件も無い (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("見本の内訳は末尾を切られていない", () => {
    // 区画が中身より狭いと `…` が付く。 見本の件数では切らずに収まるのが期待
    const 一覧 = Object.values(CATALOG_ITEMS)
      .flat()
      .filter(({ diagram }) => diagram.nodes.some((n) => n.kind === "chart-gauge"));
    const 切れた = 一覧.flatMap(({ diagram }) =>
      内訳たち(描く(diagram)).flatMap((n) => n.文たち.filter((t) => t.endsWith("…"))),
    );
    expect(切れた).toEqual([]);
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
