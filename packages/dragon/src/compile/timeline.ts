import type { DslDocument } from "../types";
import { slugify } from "./slug";

/** 時間軸の札は一覧でも題を1行に収めやすい幅に固定する。 */
export const TIMELINE_CARD_WIDTH = 240;

/** 描く側の `runAxes` が求める `MIN_NODE_W = 80` を番号の箱にも満たす。 */
export const TIMELINE_NUMBER_WIDTH = 80;

/** 描く側の `runAxes` が求める `MIN_NODE_H = 40` を番号の箱にも満たす。 */
export const TIMELINE_NUMBER_HEIGHT = 40;

/**
 * 軸から札の内側までの距離。番号の箱の半幅 40 + 描く側の近接の下限 70 に
 * 10 の余裕を足し、番号と札の間を常に空ける。
 */
export const TIMELINE_AXIS_TO_CARD = 120;

/** 戻り線の無い図は、既定の card の高さ 150 に合わせて詰める。 */
export const TIMELINE_COMPACT_GAP = 150;

/**
 * 戻り線のある図の段間隔。card の高さの見積り 150 + back-detour が上がる
 * 100 + 20 の余裕で、戻り線の上辺を同じ側の 2 段前の札の下に収める。
 * 詰めると 1 段前へ戻る線が隣の札と同じ高さを通るため、外側へ回れる線でも保つ。
 */
export const TIMELINE_BACK_GAP = 270;

/** 最後の札の下半分まで図に含めるため、描く側の既定の card 高さを見積もる。 */
const CARD_HEIGHT_ESTIMATE = 150;

/** 軸の左右に置く札の外側を図端から離す。 */
const TIMELINE_SIDE_MARGIN = 60;

const AXIS_X = TIMELINE_SIDE_MARGIN + TIMELINE_CARD_WIDTH + TIMELINE_AXIS_TO_CARD;

/** 最初の札の上半分を収め、図の上端に余白を残す中心 y。 */
const FIRST_STEP_Y = 100;

const TIMELINE_WIDTH = AXIS_X * 2;

export type TimelineEdgeKind = "advance" | "back" | "branch";

export type TimelineStep = {
  cardId: string;
  numberId?: string;
  cardX: number;
  y: number;
};

export type TimelinePlacement = {
  axisX: number;
  axisHeight: number;
  width: number;
  stepsHeight: number;
  steps: TimelineStep[];
};

/** 書いた段の番号差だけで、進行線・戻り線・分かれ道を分ける。 */
export function classifyTimelineEdge(fromIndex: number, toIndex: number): TimelineEdgeKind {
  if (toIndex === fromIndex + 1) return "advance";
  if (toIndex < fromIndex) return "back";
  return "branch";
}

/** 時間軸の絶対座標と、札に重ならない番号 id を返す。軸上の段には番号 id を作らない。 */
export function placeTimeline(
  doc: Pick<DslDocument, "actors" | "flow">,
  軸に置く段: ReadonlySet<string> = new Set(),
): TimelinePlacement {
  const actorIndexByName = new Map(doc.actors.map((actor, index) => [actor.name, index]));
  const hasBack = doc.flow.some((edge) => {
    const from = actorIndexByName.get(edge.from);
    const to = actorIndexByName.get(edge.to);
    return from !== undefined && to !== undefined && classifyTimelineEdge(from, to) === "back";
  });
  const gap = hasBack ? TIMELINE_BACK_GAP : TIMELINE_COMPACT_GAP;
  const cardIds = doc.actors.map((actor, index) => slugify(actor.name) || `n${index}`);
  const usedIds = new Set(cardIds);
  let 次の番号 = 1;
  const steps = doc.actors.map((actor, index): TimelineStep => {
    const 番号 = 軸に置く段.has(actor.name) ? undefined : 次の番号++;
    const base = 番号 === undefined ? undefined : `timeline-number-${番号}`;
    let numberId = base;
    let suffix = 2;
    while (numberId !== undefined && usedIds.has(numberId)) numberId = `${base}-${suffix++}`;
    if (numberId !== undefined) usedIds.add(numberId);
    return {
      cardId: cardIds[index]!,
      numberId,
      cardX:
        (番号 ?? index + 1) % 2 === 1
          ? AXIS_X - TIMELINE_AXIS_TO_CARD - TIMELINE_CARD_WIDTH / 2
          : AXIS_X + TIMELINE_AXIS_TO_CARD + TIMELINE_CARD_WIDTH / 2,
      y: FIRST_STEP_Y + index * gap,
    };
  });
  const lastY = steps.at(-1)?.y ?? FIRST_STEP_Y;
  return {
    axisX: AXIS_X,
    axisHeight: lastY,
    width: TIMELINE_WIDTH,
    stepsHeight: lastY + CARD_HEIGHT_ESTIMATE / 2,
    steps,
  };
}
