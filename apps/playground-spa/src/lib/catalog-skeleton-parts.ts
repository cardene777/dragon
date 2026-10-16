export type CatalogSkeletonAnchor = "fixed" | "top-left" | "center" | "right" | "top";

export type CatalogSkeletonPart = {
  label: string;
  selector: string;
  anchor: CatalogSkeletonAnchor;
  badgeTarget?: "longest";
};

export type CatalogSkeletonBadge = { number: number; left: number; top: number };

export type CatalogSkeletonBadgeBounds = { width: number; height: number };

/** 流れ図の骨組みを、特定の見本の箱や線の名前に依存せずに選ぶ。 */
export const FLOWCHART_SKELETON_PARTS = [
  { label: "地", selector: ":scope", anchor: "fixed" },
  {
    label: "列の見出し",
    selector:
      ':is([data-cdl-role="flowchart-lane-heading"], [data-cdl-role="lane-label"])',
    anchor: "top-left",
  },
  {
    label: "列の仕切り",
    selector: '[data-cdl-role="flowchart-lane-divider"]',
    anchor: "center",
  },
  {
    label: "箱",
    selector:
      '[data-cdl-node]:not([data-cdl-kind="decision"]):not([data-cdl-kind="mark-start"]):not([data-cdl-kind="mark-end"]) [data-cdl-role="node-body"]',
    anchor: "top-left",
  },
  {
    label: "箱の字",
    selector:
      '[data-cdl-node]:not([data-cdl-kind="decision"]):not([data-cdl-kind="mark-start"]):not([data-cdl-kind="mark-end"]) [data-cdl-role="node-label"]',
    anchor: "right",
  },
  {
    label: "主な流れの線",
    selector:
      '[data-cdl-edge][data-cdl-from][data-cdl-to] [data-cdl-role="edge-line"]:not([stroke-dasharray="10 8"])',
    anchor: "center",
    badgeTarget: "longest",
  },
  {
    label: "分かれ道",
    selector: '[data-cdl-kind="decision"] [data-cdl-role="node-body"]',
    anchor: "top-left",
  },
  {
    label: "「はい」の札",
    selector:
      '[data-cdl-edge-label-for][data-cdl-tone="success"] > [data-cdl-role="edge-label-bg"]',
    anchor: "top",
  },
  {
    label: "「いいえ」の札",
    selector:
      '[data-cdl-edge-label-for][data-cdl-tone="error"] > [data-cdl-role="edge-label-bg"]',
    anchor: "top",
  },
  {
    label: "戻る線",
    selector: '[data-cdl-edge] [data-cdl-role="edge-line"][stroke-dasharray="10 8"]',
    anchor: "right",
    badgeTarget: "longest",
  },
  {
    label: "始まりの丸",
    selector: '[data-cdl-kind="mark-start"] [data-cdl-role="node-body"]',
    anchor: "right",
  },
  { label: "凡例", selector: '[data-cdl-role="legend"]', anchor: "top-left" },
] as const satisfies readonly CatalogSkeletonPart[];

/** 階層図の骨組みを、特定の見本の札や枝の名前に依存せずに選ぶ。 */
export const TREE_SKELETON_PARTS = [
  { label: "地", selector: ":scope", anchor: "fixed" },
  { label: "札", selector: '[data-cdl-role="tree-node"]', anchor: "top-left" },
  { label: "札の題", selector: '[data-cdl-role="tree-node-title"]', anchor: "right" },
  { label: "札の副題", selector: '[data-cdl-role="tree-node-subtitle"]', anchor: "right" },
  {
    label: "枝",
    selector: '[data-cdl-role="tree-edge"]',
    anchor: "center",
    badgeTarget: "longest",
  },
  { label: "枝の矢じり", selector: '[data-cdl-role="tree-edge-head"]', anchor: "right" },
  { label: "図の題", selector: '[data-cdl-role="figure-title"]', anchor: "top-left" },
  {
    label: "図の種類の札",
    selector: '[data-cdl-role="figure-kind-label"]',
    anchor: "top-left",
  },
] as const satisfies readonly CatalogSkeletonPart[];

/** マインドマップの骨組みを、特定の見本の中心や枝の名前に依存せずに選ぶ。 */
export const MIND_SKELETON_PARTS = [
  { label: "地", selector: ":scope", anchor: "fixed" },
  { label: "中心", selector: '[data-cdl-role="mind-root"]', anchor: "top-left" },
  { label: "中心の題", selector: '[data-cdl-role="mind-root-title"]', anchor: "right" },
  {
    label: "枝",
    selector: '[data-cdl-role="mind-edge"]',
    anchor: "center",
    badgeTarget: "longest",
  },
  { label: "箱", selector: '[data-cdl-role="mind-box"]', anchor: "top-left" },
  { label: "箱の題", selector: '[data-cdl-role="mind-box-title"]', anchor: "right" },
  { label: "葉の題", selector: '[data-cdl-role="mind-leaf-title"]', anchor: "right" },
  {
    label: "葉の下線",
    selector: '[data-cdl-role="mind-leaf-underline"]',
    anchor: "center",
    badgeTarget: "longest",
  },
  { label: "図の題", selector: '[data-cdl-role="figure-title"]', anchor: "top-left" },
] as const satisfies readonly CatalogSkeletonPart[];

/** 呼び出し順の骨組みを、参加者や言づての固有名に依存せずに選ぶ。 */
export const SEQUENCE_SKELETON_PARTS = [
  { label: "地", selector: ":scope", anchor: "fixed" },
  { label: "動作中の帯", selector: '[data-cdl-role="sequence-band"]', anchor: "top-left" },
  { label: "参加者の箱", selector: '[data-cdl-role="sequence-actor-box"]', anchor: "top-left" },
  { label: "参加者名", selector: '[data-cdl-role="sequence-actor"]', anchor: "right" },
  {
    label: "生命線",
    selector: '[data-cdl-role="sequence-thread"]',
    anchor: "center",
    badgeTarget: "longest",
  },
  {
    label: "区切り線",
    selector: '[data-cdl-role="sequence-rule"]',
    anchor: "center",
    badgeTarget: "longest",
  },
  { label: "言づての札", selector: '[data-cdl-role="sequence-label"]', anchor: "right" },
  {
    label: "言づての線",
    selector: '[data-cdl-role="sequence-line"]',
    anchor: "center",
    badgeTarget: "longest",
  },
  { label: "言づての先", selector: '[data-cdl-role="sequence-head"]', anchor: "right" },
  { label: "凡例", selector: '[data-cdl-role="legend"]', anchor: "top-left" },
] as const satisfies readonly CatalogSkeletonPart[];

/** 構成図の骨組みを、区画や部品の固有名に依存せずに選ぶ。 */
export const INFRASTRUCTURE_SKELETON_PARTS = [
  { label: "地", selector: ":scope", anchor: "fixed" },
  { label: "区画", selector: '[data-cdl-role="lane-container"]', anchor: "top-left" },
  { label: "部品の箱", selector: '[data-cdl-role="node-body"]', anchor: "top-left" },
  { label: "部品の絵", selector: '[data-cdl-role="node-kind-icon"]', anchor: "top-left" },
  { label: "部品名", selector: '[data-cdl-role="node-label"]', anchor: "right" },
  {
    label: "脚の仕切り",
    selector: '[data-cdl-role="node-footer-divider"]',
    anchor: "center",
    badgeTarget: "longest",
  },
  { label: "部品の種類", selector: '[data-cdl-role="node-footer-label"]', anchor: "right" },
  {
    label: "つながりの線",
    selector: '[data-cdl-role="edge-line"]',
    anchor: "center",
    badgeTarget: "longest",
  },
  { label: "つながりの札", selector: '[data-cdl-role="edge-label-bg"]', anchor: "top" },
  { label: "凡例", selector: '[data-cdl-role="legend"]', anchor: "top-left" },
] as const satisfies readonly CatalogSkeletonPart[];

/** 行を持つ図の骨組みを、関係図と型の図で共有できる役から選ぶ。 */
export const RECORD_SKELETON_PARTS = [
  { label: "地", selector: ":scope", anchor: "fixed" },
  { label: "箱", selector: 'rect[data-cdl-role="node-body"]', anchor: "top-left" },
  { label: "箱の題", selector: '[data-cdl-role="node-label"]', anchor: "right" },
  { label: "行", selector: '[data-cdl-role="node-row"]', anchor: "right" },
  {
    label: "行の仕切り",
    selector: ':is([data-cdl-role="node-row-divider"], [data-cdl-role="node-row-rule"], [data-cdl-role="node-row-group-divider"])',
    anchor: "center",
    badgeTarget: "longest",
  },
  { label: "小見出し", selector: '[data-cdl-role="node-eyebrow"]', anchor: "right" },
  { label: "脚の題", selector: '[data-cdl-role="node-footer-label"]', anchor: "right" },
  {
    label: "関係の線",
    selector: '[data-cdl-role="edge-line"]',
    anchor: "center",
    badgeTarget: "longest",
  },
  { label: "関係の札", selector: '[data-cdl-role="edge-label-bg"]', anchor: "top" },
  { label: "端の字", selector: '[data-cdl-role="edge-end-label"]', anchor: "right" },
  { label: "凡例", selector: '[data-cdl-role="legend"]', anchor: "top-left" },
] as const satisfies readonly CatalogSkeletonPart[];

/** 図表 9 種の骨組みを、各図に在る役だけが表へ出る一覧として選ぶ。 */
export const CHART_SKELETON_PARTS = [
  { label: "地", selector: ":scope", anchor: "fixed" },
  { label: "図の枠", selector: '[data-cdl-role="node-body"]', anchor: "top-left" },
  { label: "図の題", selector: '[data-cdl-role="figure-title"]', anchor: "top-left" },
  { label: "見出しの罫", selector: '[data-cdl-role="figure-head-divider"]', anchor: "center", badgeTarget: "longest" },
  { label: "図の脚", selector: '[data-cdl-role="figure-footer-label"]', anchor: "right" },
  { label: "脚の説明", selector: '[data-cdl-role="figure-footer-note"]', anchor: "right" },
  { label: "棒", selector: '[data-cdl-role="chart-bar"]', anchor: "top-left" },
  { label: "棒の名前", selector: '[data-cdl-role="chart-bar-label"]', anchor: "right" },
  { label: "棒の値", selector: '[data-cdl-role="chart-bar-value"]', anchor: "right" },
  { label: "棒の目盛り", selector: '[data-cdl-role="chart-bar-tick"]', anchor: "right" },
  { label: "弧の地", selector: '[data-cdl-role="chart-radial-track"]', anchor: "center", badgeTarget: "longest" },
  { label: "値の弧", selector: '[data-cdl-role="chart-radial-arc"]', anchor: "center", badgeTarget: "longest" },
  { label: "弧の値", selector: '[data-cdl-role="chart-legend-value"]', anchor: "right" },
  { label: "弧の割合", selector: '[data-cdl-role="chart-legend-share"]', anchor: "right" },
  { label: "大きな数の組", selector: '[data-cdl-role="chart-stat-item"]', anchor: "top-left" },
  { label: "大きな数の名前", selector: '[data-cdl-role="chart-stat-label"]', anchor: "right" },
  { label: "大きな数", selector: '[data-cdl-role="chart-stat-value"]', anchor: "right" },
  { label: "内訳の時点", selector: '[data-cdl-role="chart-stacked-bar-period"]', anchor: "right" },
  { label: "内訳の帯", selector: '[data-cdl-role="chart-stacked-bar-slice"]', anchor: "top-left" },
  { label: "内訳の斜線", selector: '[data-cdl-role="chart-stacked-bar-slice-hatch"]', anchor: "top-left" },
  { label: "内訳の割合", selector: '[data-cdl-role="chart-stacked-bar-rate"]', anchor: "right" },
  { label: "内訳の凡例", selector: '[data-cdl-role="chart-stacked-bar-legend"]', anchor: "top-left" },
  { label: "折れ線", selector: '[data-cdl-role="chart-line"]', anchor: "center", badgeTarget: "longest" },
  { label: "折れ線の時点", selector: '[data-cdl-role="chart-line-label"]', anchor: "right" },
  { label: "折れ線の値", selector: '[data-cdl-role="chart-line-value"]', anchor: "right" },
  { label: "折れ線の目盛り", selector: '[data-cdl-role="chart-line-tick"]', anchor: "right" },
  { label: "傾きの線", selector: '[data-cdl-role="chart-slope-line"]', anchor: "center", badgeTarget: "longest" },
  { label: "傾きの時点", selector: '[data-cdl-role="chart-slope-period"]', anchor: "right" },
  { label: "傾きの名前", selector: '[data-cdl-role="chart-slope-label"]', anchor: "right" },
  { label: "半円の残り", selector: '[data-cdl-role="chart-gauge-fixed-scale"]', anchor: "center", badgeTarget: "longest" },
  { label: "半円の値", selector: '[data-cdl-role="chart-gauge-arc"]', anchor: "center", badgeTarget: "longest" },
  { label: "半円の目標", selector: '[data-cdl-role="chart-gauge-target"]', anchor: "top" },
  { label: "半円の数", selector: '[data-cdl-role="chart-gauge-value"]', anchor: "right" },
  { label: "半円の差", selector: '[data-cdl-role="chart-gauge-delta"]', anchor: "right" },
  { label: "半円の端の値", selector: '[data-cdl-role="chart-gauge-scale-endpoint"]', anchor: "right" },
  { label: "100 個の印の凡例", selector: '[data-cdl-role="chart-waffle-item-mark"]', anchor: "top-left" },
  { label: "100 個の印の名前", selector: '[data-cdl-role="chart-waffle-item-label"]', anchor: "right" },
  { label: "100 個の印の割合", selector: '[data-cdl-role="chart-waffle-item-share"]', anchor: "right" },
  { label: "円の区画", selector: '[data-cdl-role="chart-pie-slice"]', anchor: "center" },
  { label: "円の一覧の印", selector: '[data-cdl-role="chart-pie-table-mark"]', anchor: "top-left" },
  { label: "円の一覧の名前", selector: '[data-cdl-role="chart-pie-table-label"]', anchor: "right" },
  { label: "円の一覧の値", selector: '[data-cdl-role="chart-pie-table-value"]', anchor: "right" },
] as const satisfies readonly CatalogSkeletonPart[];

/** 四象限の骨組みを、面・軸・点とその字から選ぶ。 */
export const QUADRANT_SKELETON_PARTS = [
  { label: "地", selector: ":scope", anchor: "fixed" },
  { label: "図の枠", selector: '[data-cdl-role="node-body"]', anchor: "top-left" },
  { label: "図の題", selector: '[data-cdl-role="figure-title"]', anchor: "top-left" },
  { label: "四象限の地", selector: '[data-cdl-role="quadrant-canvas"]', anchor: "top-left" },
  { label: "区画の面", selector: '[data-cdl-role="quadrant-bg"]', anchor: "top-left" },
  { label: "区画の名前", selector: '[data-cdl-role="quadrant-label"]', anchor: "right" },
  { label: "軸の名前", selector: '[data-cdl-role="quadrant-axis-name"]', anchor: "right" },
  { label: "打ち手の点", selector: '[data-cdl-role="quadrant-point"]', anchor: "top-left" },
  { label: "打ち手の名前", selector: '[data-cdl-role="quadrant-point-label"]', anchor: "right" },
] as const satisfies readonly CatalogSkeletonPart[];

/** 旅の地図の骨組みを、感情の段・線・接点から選ぶ。 */
export const JOURNEY_SKELETON_PARTS = [
  { label: "地", selector: ":scope", anchor: "fixed" },
  { label: "図の枠", selector: '[data-cdl-role="node-body"]', anchor: "top-left" },
  { label: "図の題", selector: '[data-cdl-role="figure-title"]', anchor: "top-left" },
  { label: "気持ちの段線", selector: '[data-cdl-role="journey-level-rule"]', anchor: "center", badgeTarget: "longest" },
  { label: "気持ちの段名", selector: '[data-cdl-role="journey-level-name"]', anchor: "right" },
  { label: "気持ちの線", selector: '[data-cdl-role="journey-line"]', anchor: "center", badgeTarget: "longest" },
  { label: "旅の接点", selector: '[data-cdl-role="journey-step"]', anchor: "top-left" },
  { label: "改善の余地", selector: '[data-cdl-role="journey-opportunity"]', anchor: "top-left" },
] as const satisfies readonly CatalogSkeletonPart[];

/** 漏斗の骨組みを、台形と比例の横棒のどちらでも選べる役から選ぶ。 */
export const FUNNEL_SKELETON_PARTS = [
  { label: "地", selector: ":scope", anchor: "fixed" },
  { label: "図の枠", selector: '[data-cdl-role="node-body"]', anchor: "top-left" },
  { label: "図の題", selector: '[data-cdl-role="figure-title"]', anchor: "top-left" },
  { label: "図の脚", selector: '[data-cdl-role="figure-footer-label"]', anchor: "right" },
  { label: "脚の説明", selector: '[data-cdl-role="figure-footer-note"]', anchor: "right" },
  { label: "漏斗の段", selector: ':is([data-cdl-role="funnel-stage"], [data-cdl-role="funnel-proportional-bar"])', anchor: "top-left" },
  { label: "段の割合", selector: '[data-cdl-role="funnel-conversion-rate"]', anchor: "right" },
  { label: "段の斜線", selector: '[data-cdl-role="funnel-stage-hatch"]', anchor: "top-left" },
  { label: "段の説明", selector: '[data-cdl-role="funnel-stage-subtitle"]', anchor: "right" },
] as const satisfies readonly CatalogSkeletonPart[];

/** 工程の骨組みを、時の目盛り・帯・前後の矢印・節目から選ぶ。 */
export const GANTT_SKELETON_PARTS = [
  { label: "地", selector: ":scope", anchor: "fixed" },
  { label: "図の枠", selector: '[data-cdl-role="node-body"]', anchor: "top-left" },
  { label: "図の題", selector: '[data-cdl-role="figure-title"]', anchor: "top-left" },
  { label: "時の目盛り", selector: '[data-cdl-role="gantt-tick"]', anchor: "right" },
  { label: "工程の帯", selector: '[data-cdl-role="gantt-bar"]', anchor: "top-left" },
  { label: "帯の斜線", selector: '[data-cdl-role="gantt-bar-hatch"]', anchor: "top-left" },
  { label: "前後の矢印", selector: '[data-cdl-role="gantt-arrow"]', anchor: "center" },
  { label: "節目", selector: '[data-cdl-role="gantt-milestone"]', anchor: "top-left" },
  { label: "節目の名前", selector: '[data-cdl-role="gantt-milestone-label"]', anchor: "right" },
  { label: "今日の線", selector: '[data-cdl-role="gantt-today"]', anchor: "center", badgeTarget: "longest" },
  { label: "今日の名前", selector: '[data-cdl-role="gantt-today-label"]', anchor: "right" },
] as const satisfies readonly CatalogSkeletonPart[];

export function catalogSkeletonPartsFor(
  type: string | null,
): readonly CatalogSkeletonPart[] | null {
  if (type === "flowchart") return FLOWCHART_SKELETON_PARTS;
  if (type === "tree") return TREE_SKELETON_PARTS;
  if (type === "mind") return MIND_SKELETON_PARTS;
  if (type === "sequence") return SEQUENCE_SKELETON_PARTS;
  if (type === "infrastructure") return INFRASTRUCTURE_SKELETON_PARTS;
  if (type === "record") return RECORD_SKELETON_PARTS;
  if (type === "chart") return CHART_SKELETON_PARTS;
  if (type === "quadrant") return QUADRANT_SKELETON_PARTS;
  if (type === "journey") return JOURNEY_SKELETON_PARTS;
  if (type === "funnel") return FUNNEL_SKELETON_PARTS;
  if (type === "gantt") return GANTT_SKELETON_PARTS;
  return null;
}

/** CSS の性質を、表が決めるものの名前へ直す。 */
export const CATALOG_SKELETON_KIND = {
  fill: "面の色",
  stroke: "線と枠の色",
  "stroke-width": "線と枠の太さ",
  "stroke-dasharray": "点線の形",
  "stroke-linecap": "線の端の形",
  "stroke-opacity": "線の濃さ",
  "fill-opacity": "面の濃さ",
  opacity: "濃さ",
  rx: "角の丸み",
  ry: "角の丸み",
  r: "丸の大きさ",
  filter: "影や光",
  "font-family": "字体",
  "font-size": "字の大きさ",
  "font-weight": "字の太さ",
  "letter-spacing": "字の間隔",
  "background-color": "地の色",
  "background-image": "地の模様",
  "background-size": "模様の間隔",
  "paint-order": "縁取りの重ね順",
} as const;

export type CatalogSkeletonProperty = keyof typeof CATALOG_SKELETON_KIND;

export function catalogSkeletonPartTarget(
  svg: SVGSVGElement,
  part: CatalogSkeletonPart,
): SVGElement | null {
  if (part.selector === ":scope") return svg;
  const target = svg.querySelector(part.selector);
  return target instanceof SVGElement ? target : null;
}

type SVGGeometry = SVGElement & {
  getTotalLength?: () => number;
  getPointAtLength?: (distance: number) => DOMPoint;
};

function completedGeometry(element: SVGElement): SVGGeometry {
  const completedPath = element.closest<SVGElement>("[data-cdl-path-d]")?.getAttribute(
    "data-cdl-path-d",
  );
  if (completedPath === null || completedPath === undefined) return element;

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", completedPath);
  return path;
}

function completedLength(element: SVGElement): number {
  const geometry = completedGeometry(element);
  return geometry.getTotalLength?.call(geometry) ?? 0;
}

function hasVisibleBounds(element: SVGElement): boolean {
  const box = element.getBoundingClientRect();
  return box.width > 0 || box.height > 0;
}

/** 番号は大きさのある最初の部品へ置き、線だけはその中で最長の線へ置く。 */
export function catalogSkeletonPartBadgeTarget(
  svg: SVGSVGElement,
  part: CatalogSkeletonPart,
): SVGElement | null {
  const targets = (
    part.selector === ":scope"
      ? [svg]
      : Array.from(svg.querySelectorAll<SVGElement>(part.selector))
  ).filter(hasVisibleBounds);
  if (part.badgeTarget !== "longest") return targets[0] ?? null;

  let longest = targets[0] ?? null;
  let longestLength = longest ? completedLength(longest) : 0;
  for (const target of targets.slice(1)) {
    const length = completedLength(target);
    if (length > longestLength) {
      longest = target;
      longestLength = length;
    }
  }
  return longest;
}

/** 描き終えた線の 4 分点から札に遠い方を選び、図の座標から画面の座標へ写す。 */
export function catalogSkeletonLineBadgePoint(
  target: SVGElement,
): { x: number; y: number } | null {
  const geometry = completedGeometry(target);
  const length = geometry.getTotalLength?.call(geometry);
  if (length === undefined || !Number.isFinite(length)) return null;
  const quarterPoint = geometry.getPointAtLength?.call(geometry, length / 4);
  const threeQuarterPoint = geometry.getPointAtLength?.call(geometry, (length * 3) / 4);
  const matrix = (target as SVGGraphicsElement).getScreenCTM?.();
  if (!quarterPoint || !threeQuarterPoint || !matrix) return null;

  let point = quarterPoint;
  const edge = target.closest<SVGElement>("[data-cdl-edge]");
  const labelXValue = edge?.getAttribute("data-cdl-label-x");
  const labelYValue = edge?.getAttribute("data-cdl-label-y");
  const labelX = labelXValue?.trim() ? Number(labelXValue) : Number.NaN;
  const labelY = labelYValue?.trim() ? Number(labelYValue) : Number.NaN;
  if (Number.isFinite(labelX) && Number.isFinite(labelY)) {
    const quarterDistance = Math.hypot(quarterPoint.x - labelX, quarterPoint.y - labelY);
    const threeQuarterDistance = Math.hypot(
      threeQuarterPoint.x - labelX,
      threeQuarterPoint.y - labelY,
    );
    if (threeQuarterDistance > quarterDistance) point = threeQuarterPoint;
  }

  return {
    x: matrix.a * point.x + matrix.c * point.y + matrix.e,
    y: matrix.b * point.x + matrix.d * point.y + matrix.f,
  };
}

const BADGE_SIZE = 24;
const MIN_BADGE_DISTANCE = 24;
const BADGE_OFFSETS = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
  [Math.SQRT1_2, Math.SQRT1_2],
  [-Math.SQRT1_2, Math.SQRT1_2],
  [-Math.SQRT1_2, -Math.SQRT1_2],
  [Math.SQRT1_2, -Math.SQRT1_2],
] as const;

function badgesOverlap(
  badge: CatalogSkeletonBadge,
  placed: readonly CatalogSkeletonBadge[],
): boolean {
  return placed.some(
    (other) => Math.hypot(badge.left - other.left, badge.top - other.top) < MIN_BADGE_DISTANCE,
  );
}

function badgeFits(badge: CatalogSkeletonBadge, bounds: CatalogSkeletonBadgeBounds): boolean {
  return (
    badge.left >= 0 &&
    badge.top >= 0 &&
    badge.left + BADGE_SIZE <= bounds.width &&
    badge.top + BADGE_SIZE <= bounds.height
  );
}

function containBadge(
  badge: CatalogSkeletonBadge,
  bounds: CatalogSkeletonBadgeBounds,
): CatalogSkeletonBadge {
  return {
    ...badge,
    left: Math.min(Math.max(badge.left, 0), Math.max(bounds.width - BADGE_SIZE, 0)),
    top: Math.min(Math.max(badge.top, 0), Math.max(bounds.height - BADGE_SIZE, 0)),
  };
}

/** 小さい番号から置き、重なる丸だけを台の内側にある最初の候補へずらす。 */
export function avoidCatalogSkeletonBadgeOverlaps(
  badges: readonly CatalogSkeletonBadge[],
  bounds: CatalogSkeletonBadgeBounds,
): CatalogSkeletonBadge[] {
  const placed: CatalogSkeletonBadge[] = [];
  for (const badge of [...badges].sort((a, b) => a.number - b.number)) {
    const contained = containBadge(badge, bounds);
    if (!badgesOverlap(contained, placed)) {
      placed.push(contained);
      continue;
    }

    let moved: CatalogSkeletonBadge | undefined;
    for (const radius of [26, 52]) {
      for (const [dx, dy] of BADGE_OFFSETS) {
        const candidate = {
          ...contained,
          left: contained.left + dx * radius,
          top: contained.top + dy * radius,
        };
        if (badgeFits(candidate, bounds) && !badgesOverlap(candidate, placed)) {
          moved = candidate;
          break;
        }
      }
      if (moved) break;
    }
    placed.push(moved ?? contained);
  }
  return placed;
}
