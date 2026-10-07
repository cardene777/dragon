import type { DslDocument } from "../types";
import { slugify } from "./slug";

/** 見本の札と同じ横長の比率にする。 */
export const TIMELINE_CARD_WIDTH = 420;
export const TIMELINE_CARD_HEIGHT = 56;

/** 分かれ道の脇に置く札は、見本どおり通常の札より少し短くする。 */
export const TIMELINE_SIDE_CARD_WIDTH = 380;

/** 描く側の `timeline-number` が半径 24・縁 4 の丸を描く大きさ。 */
export const TIMELINE_NUMBER_SIZE = 52;

/** 題を読める範囲で見本の 124 x 92 の菱形へ揃える。 */
export const TIMELINE_DECISION_WIDTH = 124;
export const TIMELINE_DECISION_HEIGHT = 92;

/** 軸の lane は、軸上で最も広い菱形をはみ出させない幅にする。 */
export const TIMELINE_AXIS_WIDTH = TIMELINE_DECISION_WIDTH;

/**
 * 描く側は終わりの印を短辺いっぱいに描き、輪の太さの半分だけ半径を縮める。
 * `80 x 42` なら node-visibility の下限 80 x 40 を保ち、外輪の半径が 19 になる。
 */
export const TIMELINE_END_WIDTH = 80;
export const TIMELINE_END_HEIGHT = 42;

/**
 * 軸から通常の札の内側までの距離。
 * 見本の 68 (丸の半径 24 + 空き 44) では描く側の近接の下限 70 を割るため、
 * 丸の外径を含む半幅 26 + 空き 70 の 96 にする。
 */
export const TIMELINE_AXIS_TO_CARD = 96;

/** 分かれ道の脇の札は、見本どおり軸から内側まで少なくとも 220 離す。 */
export const TIMELINE_AXIS_TO_SIDE_CARD = 220;

/**
 * 見本は 125 だが、描く側の `back-detour` は 156 以下で戻り線を
 * 一つ前の札の外側へ逃がし、線の札とも重なる。全ての検査を通す最小値 157 を使う。
 */
export const TIMELINE_STEP_GAP = 157;

/** 菱形の半高 46 と番号の半高 26 の間に下限 70 を保つ。 */
export const TIMELINE_DECISION_GAP = 145;

/** 見本の 105 では番号と終わりの印の間が下限 70 を割るため 120 にする。 */
export const TIMELINE_END_GAP = 120;

/** 軸の左右の札と、戻る線の折れ曲がりを図の中へ収める余白。 */
const TIMELINE_SIDE_MARGIN = 160;

const AXIS_X = TIMELINE_SIDE_MARGIN + TIMELINE_CARD_WIDTH + TIMELINE_AXIS_TO_CARD;

/** 最初の札と番号の上側を図の中へ収める中心 y。 */
const FIRST_STEP_Y = 60;

const TIMELINE_WIDTH = AXIS_X * 2;

export type TimelineEdgeKind = "advance" | "back" | "branch";

export type TimelineStep = {
  cardId: string;
  numberId?: string;
  cardX: number;
  cardWidth: number;
  stage: number;
  y: number;
};

export type TimelinePlacement = {
  axisX: number;
  axisHeight: number;
  width: number;
  stepsHeight: number;
  steps: TimelineStep[];
};

/** 見た目の段の差で、進行線・戻り線・分かれ道を分ける。 */
export function classifyTimelineEdge(fromStage: number, toStage: number): TimelineEdgeKind {
  if (toStage === fromStage + 1) return "advance";
  if (toStage < fromStage) return "back";
  return "branch";
}

/**
 * 分かれ道だけから入る普通の段のうち、分かれ道の直後に書かれていない段を脇の札にする。
 * 省く印は呼び出し前に除かれるため、配列の直前が「書いた順で次」の判定になる。
 */
function timelineSideCards(doc: Pick<DslDocument, "actors" | "flow">): Map<string, string> {
  const actorsByName = new Map(doc.actors.map((actor) => [actor.name, actor]));
  const sideCards = new Map<string, string>();
  doc.actors.forEach((actor, index) => {
    if (actor.kind === "decision" || actor.kind === "mark-end") return;
    const incoming = doc.flow.filter((edge) => edge.to === actor.name);
    if (incoming.length === 0) return;
    if (!incoming.every((edge) => actorsByName.get(edge.from)?.kind === "decision")) return;
    if (doc.actors[index - 1]?.kind === "decision") return;
    const firstIncoming = incoming[0];
    if (firstIncoming === undefined) return;
    sideCards.set(actor.name, firstIncoming.from);
  });
  return sideCards;
}

function gapBefore(kind: string | undefined): number {
  if (kind === "decision") return TIMELINE_DECISION_GAP;
  if (kind === "mark-end") return TIMELINE_END_GAP;
  return TIMELINE_STEP_GAP;
}

/** 時間軸の絶対座標と、札に重ならない番号 id を返す。 */
export function placeTimeline(
  doc: Pick<DslDocument, "actors" | "flow">,
  軸に置く段: ReadonlySet<string> = new Set(),
): TimelinePlacement {
  const sideCardSource = timelineSideCards(doc);
  const cardIds = doc.actors.map((actor, index) => slugify(actor.name) || `n${index}`);
  const usedIds = new Set(cardIds);
  const stageByName = new Map<string, number>();
  const yByName = new Map<string, number>();
  let stage = -1;
  let y = FIRST_STEP_Y;
  let previousKind: string | undefined;

  for (const actor of doc.actors) {
    const source = sideCardSource.get(actor.name);
    if (source !== undefined) {
      const sourceStage = stageByName.get(source);
      const sourceY = yByName.get(source);
      if (sourceStage === undefined || sourceY === undefined) {
        throw new Error(`時間軸の脇の札 "${actor.name}" の分かれ道 "${source}" がありません`);
      }
      stageByName.set(actor.name, sourceStage);
      yByName.set(actor.name, sourceY);
      continue;
    }
    stage += 1;
    if (stage > 0) {
      y += previousKind === "decision" ? TIMELINE_DECISION_GAP : gapBefore(actor.kind);
    }
    stageByName.set(actor.name, stage);
    yByName.set(actor.name, y);
    previousKind = actor.kind;
  }

  const cardSideByName = new Map<string, "left" | "right">();
  doc.actors
    .map((actor, index) => ({ actor, index, y: yByName.get(actor.name) ?? FIRST_STEP_Y }))
    .filter(({ actor }) => !軸に置く段.has(actor.name))
    .sort((a, b) => a.y - b.y || a.index - b.index)
    .forEach(({ actor }, index) => cardSideByName.set(actor.name, index % 2 === 0 ? "left" : "right"));

  const cardLayoutByName = new Map<string, { centerX: number; width: number }>();
  for (const actor of doc.actors) {
    const sideCard = sideCardSource.has(actor.name);
    const width = sideCard ? TIMELINE_SIDE_CARD_WIDTH : TIMELINE_CARD_WIDTH;
    const axisToCard = sideCard ? TIMELINE_AXIS_TO_SIDE_CARD : TIMELINE_AXIS_TO_CARD;
    const side = cardSideByName.get(actor.name) ?? "left";
    cardLayoutByName.set(actor.name, {
      centerX: side === "left"
        ? AXIS_X - axisToCard - width / 2
        : AXIS_X + axisToCard + width / 2,
      width,
    });
  }

  for (const actor of doc.actors) {
    if (!sideCardSource.has(actor.name)) continue;
    const source = cardLayoutByName.get(actor.name);
    const sourceStage = stageByName.get(actor.name);
    if (source === undefined || sourceStage === undefined) continue;
    for (const edge of doc.flow.filter((item) => item.from === actor.name)) {
      const target = cardLayoutByName.get(edge.to);
      const targetStage = stageByName.get(edge.to);
      if (target === undefined || targetStage === undefined || targetStage >= sourceStage) continue;
      const targetLeft = target.centerX - target.width / 2;
      const targetRight = target.centerX + target.width / 2;
      if (source.centerX < targetLeft || source.centerX > targetRight) continue;
      /*
       * cardene777/cdl#1026: `back-detour` は札の上辺の中点どうしを結び、
       * 両端の札を障害物に数えない。戻り先の右端から近接の下限 70 まで
       * 中心を外へ出すことで、縦の区間が戻り先の札を貫かない。
       * 描く側で札の横から出て横へ入れる形を選べれば、見本の 220 に戻せる。
       */
      source.centerX = targetRight + 70;
    }
  }

  let 次の番号 = 1;
  const steps = doc.actors.map((actor, index): TimelineStep => {
    const sideCard = sideCardSource.has(actor.name);
    const 番号 = 軸に置く段.has(actor.name) || sideCard ? undefined : 次の番号++;
    const base = 番号 === undefined ? undefined : `timeline-number-${番号}`;
    let numberId = base;
    let suffix = 2;
    while (numberId !== undefined && usedIds.has(numberId)) numberId = `${base}-${suffix++}`;
    if (numberId !== undefined) usedIds.add(numberId);
    const cardLayout = cardLayoutByName.get(actor.name);
    if (cardLayout === undefined) throw new Error(`時間軸の札 "${actor.name}" の配置がありません`);
    return {
      cardId: cardIds[index]!,
      numberId,
      cardX: cardLayout.centerX,
      cardWidth: cardLayout.width,
      stage: stageByName.get(actor.name) ?? index,
      y: yByName.get(actor.name) ?? FIRST_STEP_Y,
    };
  });
  const lastY = Math.max(FIRST_STEP_Y, ...steps.map((step) => step.y));
  const rightEdge = Math.max(...steps.map((step) => step.cardX + step.cardWidth / 2));
  return {
    axisX: AXIS_X,
    axisHeight: lastY + TIMELINE_END_HEIGHT / 2,
    width: Math.max(TIMELINE_WIDTH, rightEdge + TIMELINE_SIDE_MARGIN),
    stepsHeight: lastY + TIMELINE_CARD_HEIGHT / 2 + TIMELINE_SIDE_MARGIN,
    steps,
  };
}
