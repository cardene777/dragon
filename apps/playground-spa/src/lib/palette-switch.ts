import type { CdlDiagram, CdlNode } from "@cardenelabs/cdl";
import { THEMES, type DslTheme, 意匠の字の測り方 } from "@cardenelabs/dragon";
import { 字を引く, type 二言語 } from "./bilingual";
import type { Locale } from "./i18n";

/**
 * 図の色味の切替 (#1569)。
 *
 * 15 種のどの図でも意匠を当てて見比べられるよう、図に意匠が書かれていない時も切替を出す (#2790)。
 *
 * 色は図に載せる名前を差し替え、画面側 (`cdl-theme.css`) が当てる。端末は字の測り方も
 * 等幅へ変わるため、配色と測り方を載せ替えた図を描き手へ渡す。`CdlDiagramView` は新しい
 * 図を受け取ると `layout()` をやり直し、箱・札・縦列の隙間を組み立て直す (#2818)。
 *
 * 速さ (`playback-speed.ts`) / 描き方 (`redraw-mode.ts`) と同じ形にしてある。
 */

/**
 * 図に載せる名前と、画面に出す札 (#2460)。
 *
 * **値の側を key にする**。 札の字をそのまま値にしていた間、英語で開いても札だけ日本語で
 * 出ていた = 字を訳すと型と状態の値が同時に変わるため、訳す側だけを動かせなかった。
 */
const 値と札 = {
  kinari: { ja: "生成りに茶", en: "Ecru and brown" },
  celadon: { ja: "青磁に墨", en: "Celadon and ink" },
  blueprint: { ja: "図面", en: "Blueprint" },
  letterpress: { ja: "活版", en: "Letterpress" },
  catalog: { ja: "図録", en: "Catalog" },
  terminal: { ja: "端末", en: "Terminal" },
  sketch: { ja: "手描き", en: "Sketch" },
  neon: { ja: "電飾", en: "Neon" },
  relief: { ja: "浮彫", en: "Relief" },
} as const satisfies Record<DslTheme, 二言語>;

/** 画面に出す意匠は記法が受ける正の名前から導く (#2790)。 */
export const 配色の選択肢: readonly DslTheme[] = THEMES;

/** 図の `palette` を外し、site の色で描く選択。 意匠の一覧には含めない。 */
export const 画面の色 = "site-colours" as const;

export type 配色 = DslTheme | typeof 画面の色;
/** `null` は選んでいない状態で、図に書かれた意匠をそのまま使う。 */
export type 配色の選択 = 配色 | null;

type 浮彫の凹み面の値 = Pick<NonNullable<CdlNode["figureInset"]>, "holdsContent"> & {
  chartLinePeriodY?: number;
  chartSlopeAxisGap?: number;
  chartStackedBarWidth?: number;
  quadrantPlotSize?: number;
};

type 凹み面の意図を持つ図 = CdlDiagram & {
  figureInsetByTheme?: Partial<Record<DslTheme, 浮彫の凹み面の値>>;
};

const 箱の配置欄 = ["rowLayout", "rowStripe", "h", "posH", "posY"] as const;
const 線の配置欄 = [
  "posX1",
  "posY1",
  "posX2",
  "posY2",
  "waypoints",
  "labelOffsetX",
  "labelOffsetY",
  "labelCollision",
] as const;
type 箱の配置 = Pick<CdlDiagram["nodes"][number], (typeof 箱の配置欄)[number]>;
type 線の配置 = Pick<CdlDiagram["edges"][number], (typeof 線の配置欄)[number]>;
type 意匠別配置の値 = {
  nodes?: Record<string, 箱の配置>;
  edges?: Record<string, 線の配置>;
};
type 意匠別配置を持つ図 = CdlDiagram & {
  layoutByTheme?: {
    base: 意匠別配置の値;
    themes: Partial<Record<DslTheme, 意匠別配置の値>>;
  };
};

function 配置を当てる<T extends object, K extends readonly (keyof T)[]>(
  value: T,
  fields: K,
  base: Pick<T, K[number]>,
  override: Pick<T, K[number]> | undefined,
): T {
  const target = { ...base, ...override };
  const 次 = { ...value };
  for (const field of fields) {
    if (target[field] === undefined) delete 次[field];
    else 次[field] = target[field];
  }
  return 次;
}

function 箱の配置を当てる(
  node: CdlDiagram["nodes"][number],
  base: 箱の配置,
  override: 箱の配置 | undefined,
): CdlDiagram["nodes"][number] {
  return 配置を当てる(node, 箱の配置欄, base, override);
}

function 箱の配置が同じか(
  node: CdlDiagram["nodes"][number],
  base: 箱の配置,
  override: 箱の配置 | undefined,
): boolean {
  const target = 箱の配置を当てる(node, base, override);
  return 箱の配置欄.every((field) => node[field] === target[field]);
}

function 線の配置を当てる(
  edge: CdlDiagram["edges"][number],
  base: 線の配置,
  override: 線の配置 | undefined,
): CdlDiagram["edges"][number] {
  const 次 = 配置を当てる(edge, 線の配置欄, base, override);
  if (override?.labelOffsetX !== undefined || override?.labelOffsetY !== undefined) {
    次.labelCollision = "author";
  }
  return 次;
}

function 線の配置が同じか(
  edge: CdlDiagram["edges"][number],
  base: 線の配置,
  override: 線の配置 | undefined,
): boolean {
  const target = 線の配置を当てる(edge, base, override);
  return 線の配置欄.every((field) => edge[field] === target[field]);
}

function 浮彫の凹み面の値を当てる(
  node: CdlDiagram["nodes"][number],
  元の値: 浮彫の凹み面の値,
  収める: boolean,
): CdlDiagram["nodes"][number] {
  if (node.figureInset === undefined) return node;

  const figureInset = { ...node.figureInset };
  if (収める) figureInset.holdsContent = true;
  else delete figureInset.holdsContent;
  const leftInset = figureInset.left ?? 18;
  const rightInset = figureInset.right ?? 18;
  const topInset = figureInset.top ?? 4;
  const bottomInset = figureInset.bottom ?? 8;
  const horizontalInset = leftInset + rightInset;
  const verticalInset = topInset + bottomInset;

  const 次: CdlDiagram["nodes"][number] = { ...node, figureInset };
  if (元の値.chartLinePeriodY !== undefined) {
    次.chartLineSize = {
      ...node.chartLineSize,
      periodY: 収める
        ? Math.max(0, 元の値.chartLinePeriodY - verticalInset)
        : 元の値.chartLinePeriodY,
    };
  }
  if (元の値.chartSlopeAxisGap !== undefined) {
    次.chartSlopeSize = {
      ...node.chartSlopeSize,
      axisGap: 収める
        ? Math.max(0, 元の値.chartSlopeAxisGap - horizontalInset)
        : 元の値.chartSlopeAxisGap,
    };
  }
  if (元の値.chartStackedBarWidth !== undefined) {
    次.chartStackedLayout = {
      ...node.chartStackedLayout,
      barWidth: 収める
        ? Math.max(1, 元の値.chartStackedBarWidth - horizontalInset)
        : 元の値.chartStackedBarWidth,
    };
  }
  if (元の値.quadrantPlotSize !== undefined) {
    let plotSize = 元の値.quadrantPlotSize;
    if (収める && node.w !== undefined && node.h !== undefined) {
      const contentHeight = node.h - (node.figureCard === undefined ? 0 : 61 + 36);
      const 元の上限 = Math.min(node.w - 120, contentHeight - 60);
      const 凹み面の上限 = Math.min(
        node.w - horizontalInset - 120,
        contentHeight - verticalInset - 60,
      );
      // 見本の min(P幅−120, P高さ−60) が凹み面で失う分だけ、調整済みの元値から引く。
      plotSize = Math.max(1, 元の値.quadrantPlotSize - (元の上限 - 凹み面の上限));
    }
    次.quadrantSize = {
      ...node.quadrantSize,
      plotSize,
    };
  }
  return 次;
}

const 凹み面の比較値 = (node: CdlNode): string => JSON.stringify({
  holdsContent: node.figureInset?.holdsContent,
  chartLinePeriodY: node.chartLineSize?.periodY,
  chartSlopeAxisGap: node.chartSlopeSize?.axisGap,
  chartStackedBarWidth: node.chartStackedLayout?.barWidth,
  quadrantPlotSize: node.quadrantSize?.plotSize,
});

/** 画面に出す札を引く */
export function 配色の札(配色: DslTheme, locale: Locale): string {
  return 字を引く(値と札[配色], locale);
}

/** 意匠を図から外す選択の札。 */
export function 画面の色の札(locale: Locale): string {
  return locale === "ja" ? "画面の色" : "Site colours";
}

/**
 * 押されている札。 未選択なら図に書かれた意匠、それも無ければ画面の色を返す。
 */
export function 押される配色(diagram: CdlDiagram, 選択: 配色の選択): 配色 {
  if (選択 !== null) return 選択;
  return (THEMES as readonly string[]).includes(diagram.palette ?? "")
    ? (diagram.palette as DslTheme)
    : 画面の色;
}

/**
 * 図の配色と字の測り方を差し替える (#2818)。
 *
 * **未選択では元の object をそのまま返す**。 新しい object を返すと `CdlDiagramView` が
 * 別の図を渡されたとみなして描き直し、切替を触っていない図が最初へ戻る
 * (`playback-speed.ts` と同じ理由)。
 *
 * 端末では `textMetrics` を等幅へ替えて配置を測り直す。端末から外す時は key ごと消し、
 * 描き手の既定である比例の測り方へ戻す。凹み面へ中身を収める意図も図全体から読み、
 * 浮彫へ替えた時だけ節へ載せ、浮彫から外す時は key ごと消す。
 */
export function 図の配色を変える(diagram: CdlDiagram, 選択: 配色の選択): CdlDiagram {
  if (選択 === null) return diagram;

  const 次の配色 = 選択 === 画面の色 ? undefined : 選択;
  const 次の測り方 = 選択 === 画面の色 ? undefined : 意匠の字の測り方(選択);
  const 配色が同じ = 次の配色 === undefined
    ? !Object.hasOwn(diagram, "palette")
    : diagram.palette === 次の配色;
  const 測り方が同じ = 次の測り方 === undefined
    ? !Object.hasOwn(diagram, "textMetrics")
    : diagram.textMetrics === 次の測り方;
  type 段の見出し = NonNullable<NonNullable<CdlDiagram["lanes"]>[number]["stage"]>["header"];
  type 見出しを持つ図 = CdlDiagram & {
    stageHeaders?: Partial<Record<DslTheme, 段の見出し>>;
  };
  const 見出しの表 = (diagram as 見出しを持つ図).stageHeaders;
  const 次の見出し = 次の配色 === undefined ? undefined : 見出しの表?.[次の配色];
  const 凹み面の表 = (diagram as 凹み面の意図を持つ図).figureInsetByTheme;
  const 元の凹み面の値 = 凹み面の表?.relief;
  const 次は凹み面に収める = 次の配色 === "relief" && 元の凹み面の値?.holdsContent === true;
  const 次の節 = 元の凹み面の値 === undefined
    ? diagram.nodes
    : diagram.nodes.map((node) => 浮彫の凹み面の値を当てる(node, 元の凹み面の値, 次は凹み面に収める));
  const 見出しが同じ = diagram.lanes.every((lane) =>
    lane.stage === undefined || lane.stage.header === 次の見出し,
  );
  const 凹み面が同じ = diagram.nodes.every((node, index) =>
    凹み面の比較値(node) === 凹み面の比較値(次の節[index] ?? node));
  const 配置の表 = (diagram as 意匠別配置を持つ図).layoutByTheme;
  const 次の配置 = 次の配色 === undefined ? undefined : 配置の表?.themes[次の配色];
  const 箱の配置が同じ = 配置の表 === undefined || diagram.nodes.every((node) => {
    const base = 配置の表.base.nodes?.[node.id];
    return base === undefined || 箱の配置が同じか(node, base, 次の配置?.nodes?.[node.id]);
  });
  const 線の配置が同じ = 配置の表 === undefined || diagram.edges.every((edge) => {
    const base = 配置の表.base.edges?.[edge.id];
    return base === undefined || 線の配置が同じか(edge, base, 次の配置?.edges?.[edge.id]);
  });
  if (
    配色が同じ &&
    測り方が同じ &&
    見出しが同じ &&
    凹み面が同じ &&
    箱の配置が同じ &&
    線の配置が同じ
  ) return diagram;

  const 次 = { ...diagram };
  if (次の配色 === undefined) delete 次.palette;
  else 次.palette = 次の配色;
  if (次の測り方 === undefined) delete 次.textMetrics;
  else 次.textMetrics = 次の測り方;
  if (見出しの表 !== undefined) {
    次.lanes = diagram.lanes.map((lane) => {
      if (lane.stage === undefined) return lane;
      const stage = { ...lane.stage };
      if (次の見出し === undefined) delete stage.header;
      else stage.header = 次の見出し;
      return { ...lane, stage };
    });
  }
  if (凹み面の表 !== undefined) {
    次.nodes = 次の節;
  }
  if (配置の表 !== undefined) {
    次.nodes = 次.nodes.map((node) => {
      const base = 配置の表.base.nodes?.[node.id];
      return base === undefined
        ? node
        : 箱の配置を当てる(node, base, 次の配置?.nodes?.[node.id]);
    });
    次.edges = diagram.edges.map((edge) => {
      const base = 配置の表.base.edges?.[edge.id];
      return base === undefined
        ? edge
        : 線の配置を当てる(edge, base, 次の配置?.edges?.[edge.id]);
    });
  }
  return 次;
}
