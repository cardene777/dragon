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
 * 帯 1 本の高さ。駅の中心を帯の真ん中 (上端 + 80) に置いた時、駅名 (丸の上) と
 * 呼び名 (丸の下) が隣の帯に掛からない高さにする。
 */
const TRACK_HEIGHT = 160;

/**
 * 最初の駅の中心。帯の左上に描く線路の名前と、最初の駅の名前が重ならない位置にする。
 * 図の右端も最後の駅から同じだけ空け、左右の余白を揃える。
 */
const FIRST_STATION_X = 160;

/** 隣り合う駅が名前や線を詰め込みすぎないための、中心どうしの最小間隔。 */
const MIN_STATION_GAP = 220;

/**
 * 担当が替わる 2 駅の間は、高さの差にこの値を足して空ける。
 *
 * 描く側の `routing: "metro"` は、横の余裕が高さの差に足りないとくの字に落ちる。
 * 両端の駅の半径 (12 ずつ) を引いても、傾き ±1 の斜線の前後に横線と円弧を置ける幅
 * (片側 48) が残る値にする。
 */
const TRANSFER_MARGIN = 120;

/**
 * 同じ担当で隣り合う駅名どうしの最小の隙間と、名前の幅の見積りに使う字の大きさ。
 * 13 は描く側が駅の外側に名前を描く字の大きさ (`cdl` の外側の名札の `fontSize: 13`)。
 * 描く側が字の大きさを変えたら、ここも合わせる。
 */
const TITLE_GAP = 24;
const STATION_TITLE_FONT_SIZE = 13;

export type MetroTrack = {
  id: string;
  label: string;
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
  return [...title].reduce(
    (width, char) =>
      width +
      (/^[\x20-\x7e]$/u.test(char) ? STATION_TITLE_FONT_SIZE * 0.6 : STATION_TITLE_FONT_SIZE),
    0,
  );
}

/**
 * 路線図の幅と、線路・駅の絶対座標を返す。
 *
 * 静止図と動く図はどちらも `compileGenericWithAnimate` からここを呼び、同じ配置を使う。
 */
export function placeMetro(doc: Pick<DslDocument, "actors" | "lanes">): MetroPlacement {
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

  const stations: MetroStation[] = [];
  for (const [index, actor] of doc.actors.entries()) {
    const track = 線路の鍵(actor);
    const trackIndex = trackOrder.indexOf(track);
    const posY = trackIndex * TRACK_HEIGHT + TRACK_HEIGHT / 2;
    let posX = FIRST_STATION_X;
    if (index > 0) {
      const previousActor = doc.actors[index - 1]!;
      const previous = stations[index - 1]!;
      const previousTrack = 線路の鍵(previousActor);
      const titleGap =
        previousTrack === track
          ? estimateStationTitleWidth(箱の題(previousActor)) / 2 +
            estimateStationTitleWidth(箱の題(actor)) / 2 +
            TITLE_GAP
          : 0;
      posX =
        previous.posX +
        Math.max(MIN_STATION_GAP, Math.abs(posY - previous.posY) + TRANSFER_MARGIN, titleGap);
    }
    stations.push({
      actorName: actor.name,
      trackId: trackIdByKey.get(track) ?? `track-${index}`,
      posX,
      posY,
    });
  }

  const width = (stations.at(-1)?.posX ?? 0) + FIRST_STATION_X;
  const tracks = trackOrder.map((track, index): MetroTrack => ({
    id: trackIdByKey.get(track) ?? `track-${index}`,
    label: doc.lanes?.[track]?.label ?? track,
    posX: 0,
    posY: index * TRACK_HEIGHT,
    posW: width,
    posH: TRACK_HEIGHT,
  }));

  return { width, tracks, stations };
}
