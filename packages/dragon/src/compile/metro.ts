import type { DslActor, DslDocument } from "../types";
import { 箱の題 } from "./node-title";
import { slugify } from "./slug";

/**
 * 路線図の形 (`shape: metro`, #2799) の配置規則。
 *
 * 担当 (`lane`) ごとに横の帯を 1 本作り、箱を駅として書いた順に左から並べる。
 * 担当を書かない箱は箱の名前を線路にする。省略したことは `compile.ts` の
 * `reportTrackFromName` が知らせる。
 */

/**
 * 帯 1 本の高さ。見本の担当の線路の中心 (240 / 460 / 680) の差 220 に合わせる。
 */
const TRACK_HEIGHT = 220;

/**
 * 最初の駅の中心。
 * 見本の名札の左端 46 を描く側 0.125.0 の inset 24 に合わせると、lane の左端は 22 になる。
 * 見本の始まりの中心 290 から lane の左端 22 を引いた 268 に合わせる。
 * 名札 (24..224) と案内線の始まり (248) より右へ置く。
 */
const FIRST_STATION_X = 268;

/** 同じ線路の図形どうしに空ける 40。見本の駅と線を詰めすぎない値。 */
const NODE_SHAPE_GAP = 40;

/** 見本で始まりの中心 290 から最初の駅 380 まで離した 90。 */
const START_MARK_CENTER_GAP = 90;

/** 見本で最後の駅の中心 1690 から終わり 1752 まで離した 62。 */
const END_MARK_CENTER_GAP = 62;

/**
 * 担当が替わる 2 駅の間に足す 140。見本の中心間 360 から線路間 220 を引いた値。
 * 傾き ±1 の斜線の前後に横線と円弧を置く余裕になる。
 */
const TRANSFER_MARGIN = 140;

/**
 * 同じ担当で隣り合う駅名どうしの最小の隙間と、名前の幅の見積りに使う字の大きさ。
 * 25 は描く側 0.125.0 が駅名に使う字の大きさ。
 * 描く側が字の大きさを変えたら、ここも合わせる。
 */
const TITLE_GAP = 14.5;
const STATION_TITLE_FONT_SIZE = 25;
/** 太字の駅名が字面の外へ張り出す分を 3 と見積もる。 */
const STATION_TITLE_BOLD_OVERHANG = 3;

/** 見本の分かれ道の枝を、半幅 58 + 直線 30 + 半径 22 の曲がり 2 つ + 余白 22 で作る。 */
const DECISION_HALF_WIDTH = 58;
const BRANCH_STUB = 30;
const BRANCH_CORNER_RADIUS = 22;
const BRANCH_END_MARGIN = 22;

/** 見本で分かれ道の中心 y=680 から真下の駅 y=910 まで離した 230。 */
const DECISION_DOWN_GAP = 230;

/**
 * 線路の右側に残す 26。
 * 見本の案内線は、終わりの中心 1752 より 2 先の x2=1754 で終わる。
 * 描く側 0.125.0 は `METRO_LANE_BADGE_INSET` の 24 を使い、案内線を lane の右端から 24 手前で止める。
 * 2 と 24 の和を使う。
 */
const TRACK_END_PADDING = 26;

type MetroNodeKind = "station" | "decision" | "mark-start" | "mark-end";

/** 描く側 0.125.0 の路線図の図形の半幅。 */
function nodeHalfWidth(kind: MetroNodeKind): number {
  if (kind === "decision") return DECISION_HALF_WIDTH;
  if (kind === "mark-start") return 17;
  if (kind === "mark-end") return 19;
  return 16;
}

/** 始まりと終わりの枠を、描く側が見せる丸の直径に合わせる。 */
export function metroMarkFrameSize(kind: DslActor["kind"]): number | undefined {
  if (kind !== "mark-start" && kind !== "mark-end") return undefined;
  return nodeHalfWidth(kind) * 2;
}

/** 路線図では3種の印だけをその形で描き、それ以外の箱は駅として描く。 */
function metroNodeKind(actor: DslActor): MetroNodeKind {
  if (actor.kind === "decision" || actor.kind === "mark-start" || actor.kind === "mark-end") {
    return actor.kind;
  }
  return "station";
}

export type MetroTrack = {
  id: string;
  label: string;
  subtitle?: string;
  posX: number;
  posY: number;
  posW: number;
  posH: number;
};

export type MetroStation = {
  actorName: string;
  trackId: string;
  posX: number;
  posY: number;
};

export type MetroPlacement = {
  width: number;
  tracks: MetroTrack[];
  stations: MetroStation[];
};

/** 担当を書かない箱を独立した線路にするため、その箱の名前を線路の鍵として返す。 */
function 線路の鍵(actor: DslActor): string {
  return actor.lane ?? actor.name;
}

/** 駅名が重ならない間隔を取るため、描く側と同じ字の大きさで名前の幅を概算する。 */
function estimateStationTitleWidth(title: string): number {
  if (title === "") return 0;
  return (
    [...title].reduce(
      (width, char) =>
        width +
        (/^[\x20-\x7e]$/u.test(char) ? STATION_TITLE_FONT_SIZE * 0.6 : STATION_TITLE_FONT_SIZE),
      0,
    ) + STATION_TITLE_BOLD_OVERHANG
  );
}

/**
 * 路線図の幅と、線路・駅の絶対座標を返す。
 *
 * 静止図と動く図はどちらも `compileGenericWithAnimate` からここを呼び、同じ配置を使う。
 */
export function placeMetro(doc: Pick<DslDocument, "actors" | "flow" | "lanes">): MetroPlacement {
  const usedTracks: string[] = [];
  for (const actor of doc.actors) {
    const track = 線路の鍵(actor);
    if (!usedTracks.includes(track)) usedTracks.push(track);
  }

  const declared = doc.lanes ? Object.keys(doc.lanes) : [];
  const trackOrder = [
    ...declared.filter((track) => usedTracks.includes(track)),
    ...usedTracks.filter((track) => !declared.includes(track)),
  ];

  const usedIds = new Set<string>();
  const trackIdByKey = new Map<string, string>();
  for (const [index, track] of trackOrder.entries()) {
    const base = `track-${slugify(track) || index}`;
    let id = base;
    let suffix = 2;
    while (usedIds.has(id)) id = `${base}-${suffix++}`;
    usedIds.add(id);
    trackIdByKey.set(track, id);
  }

  const actorByName = new Map(doc.actors.map((actor) => [actor.name, actor]));
  const 下へ置く = new Map<string, { decision: string; order: number }>();
  for (const decision of doc.actors.filter((actor) => metroNodeKind(actor) === "decision")) {
    let order = 0;
    const branches = doc.flow.filter((step) => step.from === decision.name);
    for (const branch of branches.slice(1)) {
      const target = actorByName.get(branch.to);
      if (
        target === undefined ||
        線路の鍵(target) !== 線路の鍵(decision) ||
        metroNodeKind(target) !== "station" ||
        下へ置く.has(target.name)
      ) {
        continue;
      }
      order += 1;
      下へ置く.set(target.name, { decision: decision.name, order });
    }
  }

  const stations: MetroStation[] = [];
  const stationByActor = new Map<string, MetroStation>();
  let previousOnTrack: { actor: DslActor; station: MetroStation } | undefined;
  for (const [index, actor] of doc.actors.entries()) {
    const track = 線路の鍵(actor);
    const trackIndex = trackOrder.indexOf(track);
    const posY = trackIndex * TRACK_HEIGHT + TRACK_HEIGHT / 2;
    const below = 下へ置く.get(actor.name);
    const decisionStation = below === undefined ? undefined : stationByActor.get(below.decision);
    if (below !== undefined && decisionStation !== undefined) {
      const station = {
        actorName: actor.name,
        trackId: trackIdByKey.get(track) ?? `track-${index}`,
        posX: decisionStation.posX,
        posY: decisionStation.posY + DECISION_DOWN_GAP * below.order,
      };
      stations.push(station);
      stationByActor.set(actor.name, station);
      continue;
    }

    let posX = FIRST_STATION_X;
    if (previousOnTrack !== undefined) {
      const previousActor = previousOnTrack.actor;
      const previous = previousOnTrack.station;
      const previousKind = metroNodeKind(previousActor);
      const currentKind = metroNodeKind(actor);
      if (線路の鍵(previousActor) !== track) {
        const gap =
          previousKind === "decision"
            ? DECISION_HALF_WIDTH +
              BRANCH_STUB +
              BRANCH_CORNER_RADIUS * 2 +
              BRANCH_END_MARGIN +
              nodeHalfWidth(currentKind)
            : Math.abs(posY - previous.posY) + TRANSFER_MARGIN;
        posX = previous.posX + gap;
      } else {
        const shapeGap = previousKind === "mark-start" && currentKind === "station"
          ? START_MARK_CENTER_GAP
          : previousKind === "station" && currentKind === "mark-end"
            ? END_MARK_CENTER_GAP
            : nodeHalfWidth(previousKind) + nodeHalfWidth(currentKind) + NODE_SHAPE_GAP;
        const titleGap =
          previousKind === "station" && currentKind === "station"
            ? estimateStationTitleWidth(箱の題(previousActor)) / 2 +
              estimateStationTitleWidth(箱の題(actor)) / 2 +
              TITLE_GAP
            : 0;
        posX = previous.posX + Math.max(shapeGap, titleGap);
      }
    }
    const station = {
      actorName: actor.name,
      trackId: trackIdByKey.get(track) ?? `track-${index}`,
      posX,
      posY,
    };
    stations.push(station);
    stationByActor.set(actor.name, station);
    previousOnTrack = { actor, station };
  }

  const last = previousOnTrack;
  const titleEndPadding =
    last !== undefined && metroNodeKind(last.actor) === "station"
      ? estimateStationTitleWidth(箱の題(last.actor)) / 2 + 8
      : 0;
  const width = (last?.station.posX ?? 0) + Math.max(TRACK_END_PADDING, titleEndPadding);
  const tracks = trackOrder.map((track, index): MetroTrack => ({
    id: trackIdByKey.get(track) ?? `track-${index}`,
    label: doc.lanes?.[track]?.label ?? track,
    ...(doc.lanes?.[track]?.subtitle !== undefined
      ? { subtitle: doc.lanes[track].subtitle }
      : {}),
    posX: 0,
    posY: index * TRACK_HEIGHT,
    posW: width,
    posH: TRACK_HEIGHT,
  }));

  return { width, tracks, stations };
}
