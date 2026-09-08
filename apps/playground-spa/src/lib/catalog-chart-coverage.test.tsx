/**
 * 図表の種別が持つ形を、見本帳が全て見せているかを数える検査 (#1694 / #1698)。
 *
 * ## なぜ要るか
 *
 * `chart-stat` は件が 1 つだと割合の字と弧を描かず、2 つ以上だと描く (`cdl#759`)。
 * 見本帳には 1 件の見本しか無く、**割合が意味を持つ形がどこにも出ていなかった**。
 * 人が数えている限り、次に同じことが起きても気付けない。
 *
 * 実際に次が起きた。 `previous` (前の時点の値) を書くと円グラフは輪が 2 つになり
 * (`cdl#679`)、内訳の帯は帯が 2 本になる (`cdl#551`)。 どちらも見本は片側だけだった。
 * 件数の軸しか数えていなかったので、この ずれ も人が見つけた (#1698)。
 *
 * ## 種別の一覧も、軸ごとの判定も engine に聞く
 *
 * 「この軸で形が変わる種別」 を手で並べると、新しい種別が増えた時に一覧の更新を忘れて
 * 無検査で通る (`rules/quality.md § 導出可能記述は人手で書かない`)。
 *
 * 代わりに **engine を実際に描く**。 同じ種別を軸の両側で組み立てて描き、増えた役割名から
 * その種別の名前そのもの (図の主役の印) を除いてもまだ残るなら「その軸で形が変わる種別」
 * と判定する。 判定材料が実装そのものなので、engine 側で形が増えれば検査が自動で追随する。
 *
 * ## 覆えない組は理由を書いて残す
 *
 * 片側が図として成立しない組がある (傾き図に前の時点を書かないと線を引く相手がいない)。
 * こういう組は `覆えない組` に理由付きで置く。 **表に無い組は落ち、表にあるのに engine が
 * 形の差を返さなくなった組も落ちる** = 直った後に理由だけが残らない。
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

/** 種別名から記法の型名を出す (`chart-stacked-bar` → `stacked-bar`) */
const 型名 = (kind: string): ChartType => kind.replace(/^chart-/, "") as ChartType;

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

/** その種別の見本が持つ節 (図表の中身を持つ node) */
const 見本の節 = (kind: string): Array<{ chartData?: Array<{ previous?: unknown }> }> =>
  全部の図()
    .flatMap((d) => d.nodes.filter((n) => n.kind === kind))
    .filter((n) => (n.chartData ?? []).length > 0);

/**
 * 形が 2 通りに分かれる軸。
 *
 * `組む` が軸の両側の図を作り、`見本の側` が実物の見本をどちらの側に数えるかを決める。
 * 2 つは同じことを別の入口から見ている = engine 側 (組んで描く) と見本帳側 (書いてある
 * 中身を読む) で、片方だけ直すとずれる。
 */
const 軸たち = [
  {
    名: "件数",
    側: ["件 1", "件 2 以上"] as const,
    組む: (kind: string, 側: 0 | 1): CdlDiagram => 組む(kind, 側 === 0 ? 1 : 3, false),
    見本の側: (n: { chartData?: unknown[] }): 0 | 1 => ((n.chartData ?? []).length === 1 ? 0 : 1),
  },
  {
    名: "前の時点",
    側: ["書かない", "書く"] as const,
    組む: (kind: string, 側: 0 | 1): CdlDiagram => 組む(kind, 3, 側 === 1),
    見本の側: (n: { chartData?: Array<{ previous?: unknown }> }): 0 | 1 =>
      (n.chartData ?? []).some((d) => d.previous !== undefined) ? 1 : 0,
  },
] as const;

/** その種別を件数ぶんの datum で組み立てる */
function 組む(kind: string, 件数: number, previous: boolean): CdlDiagram {
  const type = 型名(kind);
  let b = chart({ id: `probe-${type}`, topic: "確認", type });
  for (let i = 0; i < 件数; i += 1)
    b = b.datum({
      id: `d${i}`,
      label: `d${i}`,
      value: (i + 1) * 10,
      ...(previous ? { previous: (i + 1) * 8 } : {}),
    });
  return b.build();
}

/**
 * 片側が図として成立しない組。 **鍵は `<種別>/<軸>`、値はなぜ覆えないか**。
 *
 * ここに置いた組は両側の見本を求めない。 代わりに「engine が形の差を返さなくなったら
 * 落ちる」 側の検査が付く = 直った後に理由だけが残らない
 * (`rules/quality.md § 判定できなかったことを値に潰さない` の系)。
 */
const 覆えない組: Record<string, string> = {
  "chart-slope/前の時点":
    "前の時点を書かないと線を引く相手がいない (`chart-slope-line` が 1 本も出ない) = 形が 2 通りあるのではなく図として成立していない。 点が 1 つの折れ線と同じ",
};

/**
 * その軸で形が変わる種別か。 engine を実際に描いて判定する。
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
function 軸で変わるか(kind: string, 軸: (typeof 軸たち)[number]): boolean | "unknown" {
  try {
    const 甲 = 役割名(軸.組む(kind, 0));
    const 乙 = 役割名(軸.組む(kind, 1));
    if (甲.size === 0 || 乙.size === 0) return "unknown";
    const 差 = [...乙].filter((r) => !甲.has(r) && r !== kind);
    return 差.length > 0;
  } catch {
    return "unknown";
  }
}

describe("図表の種別が持つ形を見本帳が見せているか (#1694 / #1698)", () => {
  const 種別 = 見本の種別();

  it("見本帳の図表の種別を 1 つ以上走査できている", () => {
    // 空振り検知。 0 件だと下の検査は何も見ずに通る
    expect(種別.length, "図表の種別が 1 つも無い").toBeGreaterThan(0);
  });

  it("軸を 1 つ以上持っている", () => {
    // 空振り検知。 軸が 0 本だと下の 2 件は何も回さずに通る
    expect(軸たち.length, "軸が 1 本も無い").toBeGreaterThan(0);
  });

  it("どの軸でも形が変わる種別を 1 つ以上見分けられている", () => {
    // 判定そのものの空振り検知。 全部 unknown だと下の検査が素通りする
    const 内訳: Record<string, { 変わる: number; 変わらない: number; unknown: number }> = {};
    for (const 軸 of 軸たち) {
      const n = { 変わる: 0, 変わらない: 0, unknown: 0 };
      for (const k of 種別) {
        const r = 軸で変わるか(k, 軸);
        if (r === "unknown") n.unknown += 1;
        else if (r) n.変わる += 1;
        else n.変わらない += 1;
      }
      内訳[軸.名] = n;
    }
    // 内訳を出す = 数だけ見ると「多いな」 で終わり、判定できていない種別が埋もれる
    console.log(`[軸ごとの内訳] ${JSON.stringify(内訳)} / 走査 ${種別.length}`);
    const 合計 = Object.values(内訳).reduce((a, n) => a + n.変わる, 0);
    expect(合計, "どの軸でも形が変わる種別を 1 つも見分けられていない").toBeGreaterThan(0);
  });

  it("形が変わる種別は、見本が軸の両側を持つ", () => {
    let 測れた = 0;
    for (const 軸 of 軸たち) {
      for (const k of 種別) {
        if (軸で変わるか(k, 軸) !== true) continue;
        if (覆えない組[`${k}/${軸.名}`] !== undefined) continue;
        測れた += 1;
        const 節 = 見本の節(k);
        expect(節.length, `${k} の見本を 1 つも拾えない`).toBeGreaterThan(0);
        const 側 = 節.map((n) => 軸.見本の側(n));
        for (const i of [0, 1] as const) {
          expect(
            側.includes(i),
            `${k} に「${軸.名} = ${軸.側[i]}」 の見本が無い (拾えた側 ${側.join("/")})`,
          ).toBe(true);
        }
      }
    }
    expect(測れた, "1 件も測れていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("覆えない組は、今も engine が形の差を返す組だけ", () => {
    // 直った後に理由だけが残ると、次に同じ ずれ が出ても「書いてあるから」 で見逃す
    const 死んだ理由: string[] = [];
    for (const 鍵 of Object.keys(覆えない組)) {
      const [k, 軸名] = 鍵.split("/");
      const 軸 = 軸たち.find((a) => a.名 === 軸名);
      if (!軸) {
        死んだ理由.push(`${鍵} (その軸はもう無い)`);
        continue;
      }
      if (軸で変わるか(k!, 軸) !== true) 死んだ理由.push(`${鍵} (engine が形の差を返さない)`);
    }
    expect(死んだ理由, `覆えない組に死んだ理由が残っている: ${死んだ理由.join(", ")}`).toEqual([]);
  });
});
