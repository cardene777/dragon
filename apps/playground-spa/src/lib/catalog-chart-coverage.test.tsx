/**
 * 図表の種別が持つ形を、見本帳が全て見せているかを数える検査 (#1694)。
 *
 * ## なぜ要るか
 *
 * `chart-stat` は件が 1 つだと割合の字と弧を描かず、2 つ以上だと描く (`cdl#759`)。
 * 見本帳には 1 件の見本しか無く、**割合が意味を持つ形がどこにも出ていなかった**。
 * 人が数えている限り、次に同じことが起きても気付けない。
 *
 * ## 種別の一覧を手で書かない
 *
 * 「件数で見た目が変わる種別」 を手で並べると、新しい種別が増えた時に一覧の更新を忘れて
 * 無検査で通る (`rules/quality.md § 導出可能記述は人手で書かない`)。
 *
 * 代わりに **engine に聞く**。 同じ種別を件 1 と件 3 で組み立てて描き、増えた役割名から
 * その種別の名前そのもの (図の主役の印) を除いてもまだ残るなら「件数で見た目が変わる種別」
 * と判定する。 判定材料が実装そのものなので、engine 側で形が増えれば検査が自動で追随する。
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, chart, layout } from "@cardenelabs/cdl";
import type { CdlDiagram, ChartType } from "@cardenelabs/cdl";
import { CATALOG_ITEMS, type CatalogItem } from "./catalog-items";

/** 描いた結果に出てくる役割名の集合 */
function 役割名(d: CdlDiagram): Set<string> {
  const svg = renderToStaticMarkup(<CdlDiagramView diagram={layout(d)} />);
  return new Set([...svg.matchAll(/data-cdl-role="([^"]+)"/g)].map((m) => m[1]!));
}

/** その種別を件数ぶんの datum で組み立てる */
function 組む(kind: string, 件数: number): CdlDiagram {
  // 種別名から `chart-` を落とすと記法の型名になる (`chart-stacked-bar` → `stacked-bar`)
  const type = kind.replace(/^chart-/, "") as ChartType;
  let b = chart({ id: `probe-${type}`, topic: "確認", type });
  for (let i = 0; i < 件数; i += 1) b = b.datum({ id: `d${i}`, label: `d${i}`, value: i + 1 });
  return b.build();
}

/**
 * 見本 1 つが持つ図 (#1696)。
 *
 * **変種も数える**。 中身が違う見本は一覧の行を持たず `パターン` の切替に入るので
 * (`catalog-items.ts` の `patterns`)、元の図だけ見ると母集団から落ちる。 落ちると
 * 「件 2 以上の見本が無い」 で落ち、直す先を見誤る。
 *
 * 変種の並びは先頭が元の図なので、変種を持つ見本では並びだけを見れば重複しない。
 */
const 図たち = (item: CatalogItem): CdlDiagram[] =>
  item.patterns && item.patterns.length > 0 ? item.patterns.map((p) => p.diagram) : [item.diagram];

/** 見本帳に出ている図 (変種を含む) */
const 全部の図 = (): CdlDiagram[] => Object.values(CATALOG_ITEMS).flat().flatMap(図たち);

/** 見本帳に出ている図表の種別 */
const 見本の種別 = (): string[] => [
  ...new Set(
    全部の図()
      .flatMap((d) => d.nodes.map((n) => n.kind))
      .filter((k) => k.startsWith("chart-")),
  ),
];

/** その種別の見本が持つ件数の一覧 */
const 見本の件数 = (kind: string): number[] =>
  全部の図()
    .flatMap((d) => d.nodes.filter((n) => n.kind === kind))
    .map((n) => (n.chartData ?? []).length)
    .filter((n) => n > 0);

/**
 * 件数で見た目が変わる種別。 engine を実際に描いて判定する。
 *
 * **その種別の名前そのものの役割が増えただけの場合は数えない**。 折れ線は点が 1 つだと
 * `chart-line` (線そのもの) が出ないが、これは形が 2 通りあるのではなく **図として
 * 成立していない** = 線は 2 点以上ないと引けない。 見せるべき形ではないので、
 * 件 1 の見本を要求しない。
 *
 * 大きな数字はこれに当たらない。 増えるのは割合まわりの 4 つで、主役 (名前と数値) は
 * 件 1 でも出る。 どちらも図として成立しており、2 通りの形になる。
 *
 * 組み立てに失敗する種別 (この形の datum を受けない等) は判定できないので、
 * **`unknown` として別に数える**。 「変わらない」 に潰すと、判定していないことが
 * 「該当なし」 と同じに見える (`rules/quality.md § 判定できなかったことを値に潰さない`)。
 */
function 件数で変わるか(kind: string): boolean | "unknown" {
  try {
    const 少 = 役割名(組む(kind, 1));
    const 多 = 役割名(組む(kind, 3));
    if (少.size === 0 || 多.size === 0) return "unknown";
    const 差 = [...多].filter((r) => !少.has(r) && r !== kind);
    return 差.length > 0;
  } catch {
    return "unknown";
  }
}

describe("図表の種別が持つ形を見本帳が見せているか (#1694)", () => {
  const 種別 = 見本の種別();

  it("見本帳の図表の種別を 1 つ以上走査できている", () => {
    // 空振り検知。 0 件だと下の 2 件は何も見ずに通る
    expect(種別.length, "図表の種別が 1 つも無い").toBeGreaterThan(0);
  });

  it("件数で見た目が変わる種別を 1 つ以上見分けられている", () => {
    // 判定そのものの空振り検知。 全部 unknown だと下の検査が素通りする
    const 内訳 = { 変わる: 0, 変わらない: 0, unknown: 0 };
    for (const k of 種別) {
      const r = 件数で変わるか(k);
      if (r === "unknown") 内訳.unknown += 1;
      else if (r) 内訳.変わる += 1;
      else 内訳.変わらない += 1;
    }
    // 内訳を出す = 数だけ見ると「多いな」 で終わり、判定できていない種別が埋もれる
    console.log(`[種別の内訳] ${JSON.stringify(内訳)} / 走査 ${種別.length}`);
    expect(内訳.変わる, "件数で変わる種別を 1 つも見分けられていない").toBeGreaterThan(0);
  });

  it("件数で見た目が変わる種別は、見本が件 1 と件 2 以上の両方を持つ", () => {
    let 測れた = 0;
    for (const k of 種別) {
      if (件数で変わるか(k) !== true) continue;
      測れた += 1;
      const 件数たち = 見本の件数(k);
      expect(件数たち.length, `${k} の見本を 1 つも拾えない`).toBeGreaterThan(0);
      expect(件数たち.some((n) => n === 1), `${k} に件 1 の見本が無い (件数 ${件数たち.join("/")})`).toBe(true);
      expect(件数たち.some((n) => n >= 2), `${k} に件 2 以上の見本が無い (件数 ${件数たち.join("/")})`).toBe(
        true,
      );
    }
    expect(測れた, "1 件も測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });
});
