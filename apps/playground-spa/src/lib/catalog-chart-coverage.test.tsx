/**
 * 図表の種別が持つ形を、見本帳が全て見せているかを数える検査 (#1694 / #1698 / #1700)。
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
 * ## 軸も種別も engine から出す
 *
 * #1698 まで **軸そのものは手で並べていた**。 種別の一覧を導いても、軸が手書きなら
 * 導いた範囲は軸の数で頭打ちになる (`rules/quality.md § 導出可能記述は人手で書かない`)。
 *
 * 軸の候補は `chartData` の 1 件が持つ **任意の欄** から出す (#1700)。 書くか書かないかで
 * 形が変わりうるのはこの欄だけで、engine が欄を 1 つ足すと `satisfies` が `tsc` を落とす。
 *
 * **どの欄が軸として効くかは人が決めない**。 engine を実際に描いて、形が変わらない欄
 * (`tone` = 色しか変わらない) は 0 種別と判定され、どの見本も要求しない。
 *
 * 種別ごとの判定も同じで、両側を組み立てて描き、増えた役割名からその種別の名前そのもの
 * (図の主役の印) を除いてもまだ残るなら「その軸で形が変わる種別」 と判定する。
 *
 * ## 覆えない組は理由を書いて残す
 *
 * 片側が図として成立しない組がある (傾き図に前の時点を書かないと線を引く相手がいない)。
 * こういう組は `覆えない組` に理由付きで置く。 **表に無い組は落ち、表にあるのに engine が
 * 形の差を返さなくなった組も落ちる** = 直った後に理由だけが残らない。
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { CdlDiagramView, chart, layout } from "@cardenelabs/cdl";
import type { CdlDiagram, CdlNode, ChartType } from "@cardenelabs/cdl";
import { CATALOG_ITEMS, type CatalogItem } from "./catalog-items";

/** 図表の節が持つ欄 (`chart` で始まるもの)。 engine が足すと `satisfies` が落ちる */
type 図表の欄 = Extract<keyof CdlNode, `chart${string}`>;

/** 見本 1 件 (`chartData` の要素) */
type 見本の欄 = NonNullable<CdlNode["chartData"]>[number];

/**
 * 見本 1 件の **任意の欄**。 書くか書かないかで形が変わりうるのはここだけ。
 *
 * `label` / `value` は必須なので「書かない図」 を作れず、軸にならない。
 */
type 任意の見本の欄 = {
  [K in keyof 見本の欄]-?: undefined extends 見本の欄[K] ? K : never;
}[keyof 見本の欄];

/**
 * 軸を組む時に欄へ入れる値。 **`satisfies` で閉じる** = engine が任意の欄を足すと
 * ここが埋まっていない限り `tsc` が落ちる。
 *
 * 値そのものに意味は無く、「書いた図」 を作れれば足りる。 効く欄かどうかは engine を
 * 描いて判定するので、ここで人が選り分けない。
 */
const 欄の見本値 = {
  previous: 8,
  tone: "accent",
} satisfies Record<任意の見本の欄, unknown>;

/**
 * 図表の節の欄を、何が覆っているか。 **`satisfies` で閉じる**。
 *
 * `中身` は図に載せる値そのもので、見せ方では変えられない (件数と任意の欄が軸になる)。
 * それ以外は画面の `オプション` の切替が覆っており、押せば両方の形を見られるので
 * 見本を 2 つ持つ必要が無い。
 *
 * 値は **その切替を実装している file の path**。 名前だけ書いて実は触っていない形を
 * 残さないため、下の検査がその file が欄の名前を持つことを確かめる。
 */
const 節の欄の扱い = {
  chartData: "中身",
  chartFillUnder: "src/lib/chart-line-options.ts",
  chartValueRise: "src/lib/chart-line-options.ts",
  chartTrace: "src/lib/chart-line-options.ts",
  chartPieForm: "src/lib/chart-pie-options.ts",
  chartSlopeForm: "src/lib/chart-slope-options.ts",
} satisfies Record<図表の欄, string>;

/** 描いた結果に出てくる役割名の集合 */
function 役割名(d: CdlDiagram): Set<string> {
  const svg = renderToStaticMarkup(<CdlDiagramView diagram={layout(d)} />);
  return new Set([...svg.matchAll(/data-cdl-role="([^"]+)"/g)].map((m) => m[1]!));
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

/** その種別の見本が持つ節 (図表の中身を持つ node) */
const 見本の節 = (kind: string): Array<{ chartData?: Array<Record<string, unknown>> }> =>
  全部の図()
    .flatMap((d) => d.nodes.filter((n) => n.kind === kind))
    .filter((n) => (n.chartData ?? []).length > 0);

/** その種別を件数ぶんの datum で組み立てる。 `欄` を渡すとその欄を書いた図になる */
function 組む(kind: string, 件数: number, 欄: 任意の見本の欄 | null): CdlDiagram {
  // 種別名から `chart-` を落とすと記法の型名になる (`chart-stacked-bar` → `stacked-bar`)
  const type = kind.replace(/^chart-/, "") as ChartType;
  let b = chart({ id: `probe-${type}`, topic: "確認", type });
  for (let i = 0; i < 件数; i += 1)
    b = b.datum({
      id: `d${i}`,
      label: `d${i}`,
      value: (i + 1) * 10,
      ...(欄 === null ? {} : { [欄]: 欄の見本値[欄] }),
    });
  return b.build();
}

/** 形が 2 通りに分かれる軸 */
interface 軸 {
  名: string;
  /** 甲 (書かない / 少ない) と 乙 (書く / 多い) の呼び名 */
  側: readonly [string, string];
  組む: (kind: string, 側: 0 | 1) => CdlDiagram;
  /** 実物の見本をどちらの側に数えるか */
  見本の側: (n: { chartData?: Array<Record<string, unknown>> }) => 0 | 1;
}

/**
 * 軸の一覧。
 *
 * 件数だけ手で持つ = これは欄ではなく **`chartData` が配列であること** から来る構造の軸で、
 * 欄の型からは出ない。 残りは任意の欄から機械的に組む。
 */
const 軸たち: 軸[] = [
  {
    名: "件数",
    側: ["件 1", "件 2 以上"],
    組む: (kind, 側) => 組む(kind, 側 === 0 ? 1 : 3, null),
    見本の側: (n) => ((n.chartData ?? []).length === 1 ? 0 : 1),
  },
  ...(Object.keys(欄の見本値) as 任意の見本の欄[]).map(
    (欄): 軸 => ({
      名: 欄,
      側: ["書かない", "書く"],
      組む: (kind, 側) => 組む(kind, 3, 側 === 0 ? null : 欄),
      見本の側: (n) => ((n.chartData ?? []).some((d) => d[欄] !== undefined) ? 1 : 0),
    }),
  ),
];

/**
 * 片側が図として成立しない組。 **鍵は `<種別>/<軸>`、値はなぜ覆えないか**。
 *
 * ここに置いた組は両側の見本を求めない。 代わりに「engine が形の差を返さなくなったら
 * 落ちる」 側の検査が付く = 直った後に理由だけが残らない
 * (`rules/quality.md § 判定できなかったことを値に潰さない` の系)。
 */
const 覆えない組: Record<string, string> = {
  "chart-slope/previous":
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
function 軸で変わるか(kind: string, 軸: 軸): boolean | "unknown" {
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

describe("図表の種別が持つ形を見本帳が見せているか (#1694 / #1698 / #1700)", () => {
  const 種別 = 見本の種別();

  it("見本帳の図表の種別を 1 つ以上走査できている", () => {
    // 空振り検知。 0 件だと下の検査は何も見ずに通る
    expect(種別.length, "図表の種別が 1 つも無い").toBeGreaterThan(0);
  });

  it("軸を型から 1 本以上導けている", () => {
    // 空振り検知。 欄の型が読めないと軸が件数だけになり、下の検査が痩せたことに気付けない
    const 欄から = 軸たち.filter((a) => a.名 !== "件数");
    console.log(`[軸] ${軸たち.map((a) => a.名).join(" / ")}`);
    expect(欄から.length, "見本の任意の欄から軸を 1 本も導けていない").toBeGreaterThan(0);
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

describe("図表の節の欄が、中身か見せ方の切替に割り当たっている (#1700)", () => {
  const 欄たち = Object.entries(節の欄の扱い) as Array<[図表の欄, string]>;

  it("節の欄を 1 つ以上走査できている", () => {
    // 空振り検知。 型から欄が取れないと 0 件になり、下の検査が何も見ずに通る
    console.log(`[節の欄] ${欄たち.map(([k]) => k).join(" / ")}`);
    expect(欄たち.length, "節の欄が 1 つも無い").toBeGreaterThan(0);
  });

  it("見せ方に割り当てた欄は、その file が実際にその欄を触っている", () => {
    // 名前だけ書いて実は触っていない、を残さない。 切替が別の欄へ移ったらここで落ちる
    let 測れた = 0;
    for (const [欄, 扱い] of 欄たち) {
      if (扱い === "中身") continue;
      測れた += 1;
      // `import.meta.url` は jsdom 環境で file 形式にならないので、作業 dir から辿る
      const 中身 = readFileSync(resolve(process.cwd(), "apps/playground-spa", 扱い), "utf8");
      expect(中身.includes(欄), `${扱い} が ${欄} を触っていない`).toBe(true);
    }
    expect(測れた, "見せ方に割り当てた欄が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("中身に割り当てた欄は、軸として数えている", () => {
    // `chartData` を「中身」 と書いておきながら軸が 1 本も無いなら、この欄は誰も見ていない
    const 中身の欄 = 欄たち.filter(([, 扱い]) => 扱い === "中身").map(([k]) => k);
    expect(中身の欄, "中身に割り当てた欄が無い").toEqual(["chartData"]);
    expect(軸たち.length, "chartData を見る軸が 1 本も無い").toBeGreaterThan(0);
  });
});
