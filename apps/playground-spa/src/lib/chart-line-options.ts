import type { CdlDiagram } from "@cardenelabs/cdl";
import { 字を引く, type 二言語 } from "./bilingual";
import type { Locale } from "./i18n";

/**
 * カタログから、折れ線の塗り / 値のせり上げ / 経路のなぞりを切り替えられるようにする (#1624)。
 *
 * **既定は 3 つとも切**。 engine は欄を書かない図を偽として描く。 `cdl` の検査
 * 「`chartValueRise` を書いた図でだけ値の字が下から現れる」 もこの動きを固定しており、
 * 欄を書かない図と `false` を書いた図の絵は 1 byte も違わない (実測)。
 *
 * **既定では元の object をそのまま返す**。 新しい object を返すと図が最初から描き直される
 * (`palette-switch.ts` と同じ理由)。
 */

/**
 * 図に書く欄と、画面に出す札 (#2460)。
 *
 * **欄の側を key にする**。 札の字をそのまま値にしていた間、英語で開いても札だけ日本語で
 * 出ていた = 字を訳すと型と状態の値が同時に変わるため、訳す側だけを動かせなかった。
 */
const 欄と札 = {
  chartFillUnder: { ja: "塗り", en: "Fill" },
  chartValueRise: { ja: "せり上げ", en: "Rise" },
  chartTrace: { ja: "なぞり", en: "Trace" },
} as const satisfies Record<string, 二言語>;

/** 画面に出す順は、欄を並べた順に従う (塗り → せり上げ → なぞり) */
export const 折れ線の見せ方の選択肢 = Object.keys(欄と札) as 折れ線の見せ方[];
export type 折れ線の見せ方 = keyof typeof 欄と札;

/** 画面に出す札を引く */
export function 折れ線の見せ方の札(見せ方: 折れ線の見せ方, locale: Locale): string {
  return 字を引く(欄と札[見せ方], locale);
}
export type 折れ線の指定 = Record<折れ線の見せ方, boolean>;

/** 既定。 engine が書かない図をどう描くかに揃える (3 つとも切) */
export const 既定の折れ線の指定: 折れ線の指定 = {
  chartFillUnder: false,
  chartValueRise: false,
  chartTrace: false,
};

/** その図に、見せ方を切り替えられる折れ線があるか */
export function 折れ線を選べる(diagram: CdlDiagram): boolean {
  return diagram.nodes.some((n) => n.kind === "chart-line");
}

/** 折れ線 node の 3 つの見せ方を、画面で選んだ指定に揃える */
export function 図の折れ線の見せ方を変える(diagram: CdlDiagram, 指定: 折れ線の指定): CdlDiagram {
  if (!折れ線を選べる(diagram)) return diagram;

  const 全て同じ = diagram.nodes
    .filter((n) => n.kind === "chart-line")
    .every((n) => {
      const 現在: 折れ線の指定 = {
        chartFillUnder: n.chartFillUnder ?? false,
        chartValueRise: n.chartValueRise ?? false,
        chartTrace: n.chartTrace ?? false,
      };
      return 折れ線の見せ方の選択肢.every((v) => 現在[v] === 指定[v]);
    });
  if (全て同じ) return diagram;

  return {
    ...diagram,
    nodes: diagram.nodes.map((n) =>
      n.kind === "chart-line"
        ? { ...n, ...指定 }
        : n,
    ),
  };
}
