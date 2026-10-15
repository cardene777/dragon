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

/** 番号は通常の最初の部品へ置き、線だけは短い起点を避けて最長の線へ置く。 */
export function catalogSkeletonPartBadgeTarget(
  svg: SVGSVGElement,
  part: CatalogSkeletonPart,
): SVGElement | null {
  if (part.badgeTarget !== "longest") return catalogSkeletonPartTarget(svg, part);

  const targets = Array.from(svg.querySelectorAll<SVGElement>(part.selector));
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

/** 小さい番号から置き、重なる丸だけを台の内側にある最初の候補へずらす。 */
export function avoidCatalogSkeletonBadgeOverlaps(
  badges: readonly CatalogSkeletonBadge[],
  bounds: CatalogSkeletonBadgeBounds,
): CatalogSkeletonBadge[] {
  const placed: CatalogSkeletonBadge[] = [];
  for (const badge of [...badges].sort((a, b) => a.number - b.number)) {
    if (!badgesOverlap(badge, placed)) {
      placed.push({ ...badge });
      continue;
    }

    let moved: CatalogSkeletonBadge | undefined;
    for (const radius of [26, 52]) {
      for (const [dx, dy] of BADGE_OFFSETS) {
        const candidate = {
          ...badge,
          left: badge.left + dx * radius,
          top: badge.top + dy * radius,
        };
        if (badgeFits(candidate, bounds) && !badgesOverlap(candidate, placed)) {
          moved = candidate;
          break;
        }
      }
      if (moved) break;
    }
    placed.push(moved ?? { ...badge });
  }
  return placed;
}
