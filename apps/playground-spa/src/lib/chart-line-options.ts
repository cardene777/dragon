import type { CdlDiagram } from "@cardenelabs/cdl";

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

/** 表に出す名前と、図に書く欄の対応 */
const 表と欄 = {
  塗り: "chartFillUnder",
  せり上げ: "chartValueRise",
  なぞり: "chartTrace",
} as const;

export const 折れ線の見せ方の選択肢 = ["塗り", "せり上げ", "なぞり"] as const;
export type 折れ線の見せ方 = (typeof 折れ線の見せ方の選択肢)[number];
export type 折れ線の指定 = Record<折れ線の見せ方, boolean>;

/** 既定。 engine が書かない図をどう描くかに揃える (3 つとも切) */
export const 既定の折れ線の指定: 折れ線の指定 = {
  塗り: false,
  せり上げ: false,
  なぞり: false,
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
        塗り: n.chartFillUnder ?? false,
        せり上げ: n.chartValueRise ?? false,
        なぞり: n.chartTrace ?? false,
      };
      return 折れ線の見せ方の選択肢.every((v) => 現在[v] === 指定[v]);
    });
  if (全て同じ) return diagram;

  return {
    ...diagram,
    nodes: diagram.nodes.map((n) =>
      n.kind === "chart-line"
        ? {
            ...n,
            [表と欄.塗り]: 指定.塗り,
            [表と欄.せり上げ]: 指定.せり上げ,
            [表と欄.なぞり]: 指定.なぞり,
          }
        : n,
    ),
  };
}
