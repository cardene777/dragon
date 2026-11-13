/**
 * 列の図の見た目 (#3625、#3624) の読む決まり。列の図の決まりはチップのブロックが持つので、その読み方 (`read.ts`) がここを引く。
 *
 * 図の種類の行の `[shape: <見た目>]` は読む処理 (`parser.ts`) が読んで読んでいる記法の状態に置き、最初の段を始める時か記法の終わりに `layers` か `stations` かを確かめる。
 * 層の見た目は箱を上から横の帯に重ね、札の居る層を `line` で、層の印を `note` で書く。帯を 9 つ以上重ねると帯の字が読めなくなるので、9 つ目の箱の行を断る。
 * 順番の無い置き場 (`[order: none]`) と箱の上限 (`[limit: <数>]`) と、封と開けると選ぶと札と役の行は層の見た目で描かないので、受け付けたまま描かずに捨てず、その行を断る。
 * 流れの線の見た目は箱を 1 本の線の上の駅にし、封と開けると選ぶと札の行を描かないので、同じようにその行を断る。役と置き場と上限は流れの線でも描く。
 * 階段の見た目 (#3640) は層の見た目の帯を階段にするので、層の見た目と同じ行を断る。層の箱の `[time: <長さ>]` は階段の見た目の層の時間で、
 * 全ての箱に書くかどの箱にも書かない。時間の掛からない層には 0 の長さを書ける。ほかの見た目の箱の `time` と、数と単位の組でない長さは断る。
 * 書いた長さは箱のブロックの読み方が箱に置く。書き戻しは図の種類の行を書く所 (`printer.ts`) が持つ
 */
import { fail, isOneOf, list, readDeclared } from "../../read-kit";
import { TIME_UNITS, timeOf } from "../ring/limits";
import type { SourceLine } from "../../tokenize";
import type { ParseState } from "../block";
import { LANE_ATTRS } from "./block";
import { LAYERS_MOST, LINEUP_SHAPES } from "./limits";

/** 箱を帯に重ねる見た目。層の見た目と階段の見た目 (#3640) */
type Banded = "layers" | "stairs";

export interface LayersMessages {
  /** 列の図の `shape` に書ける見た目のほかの値を書いた */
  lineupBadShape: (shapes: readonly string[]) => string;
  /** 層の見た目か階段の見た目の列の図に、上限を超える箱を書いた */
  layersTooMany: (most: number, shape: Banded) => string;
  /** 層の見た目か階段の見た目の列の図で、描かない行か属性を書いた */
  layersNoLine: (word: string, shape: Banded) => string;
  /** 流れの線の見た目の列の図で、描かない行を書いた (#3624) */
  stationsNoLine: (word: string) => string;
  /** 階段の見た目でない列の図の箱に `time` を書いた (#3640) */
  stairsTimeOnly: string;
  /** 層の時間 `value` が、0 以上の数と単位の組でない (#3640) */
  stairsBadTime: (value: string) => string;
  /** 階段の見た目で、ほかの箱に `time` を書いたのに箱 `id` に `time` が無い (#3640) */
  stairsTime: (id: string) => string;
}

/** 層の見た目で描かない行の頭の語 */
const UNDRAWN = ["seal", "open", "pick", "stamp", "role"];

/** 流れの線の見た目で描かない行の頭の語 (#3624)。役の行は流れの線でも描く */
const STATIONS_UNDRAWN = ["seal", "open", "pick", "stamp"];

/** 列の図の見た目の値を確かめる */
export function settleShape(state: ParseState, head: SourceLine): void {
  const shape = state.figure.lineup.shape;
  if (state.kind === "lineup" && shape && !isOneOf(LINEUP_SHAPES, shape.value)) throw fail(head, shape.at, state.m.lineupBadShape(LINEUP_SHAPES));
}

/**
 * 見た目を選んだ列の図の行の頭の語 `word` を確かめる。層の見た目と階段の見た目は上限を超える箱と、描かない行と属性を断り、流れの線は描かない行を断る。
 * 箱の `time` は、階段の見た目の時だけ受ける
 */
export function checkShapeHead(source: SourceLine, word: string, state: ParseState): void {
  // 見た目の値は最初の段を始める時に確かめるので、ここでは書ける見た目と書いた時だけを数える
  if (state.kind !== "lineup") return;
  const { m } = state;
  const shape = state.figure.lineup.shape?.value;
  if (shape === "stations" && STATIONS_UNDRAWN.includes(word)) throw fail(source, 0, m.stationsNoLine(word));
  const banded = shape === "layers" || shape === "stairs" ? shape : undefined;
  if (banded && UNDRAWN.includes(word)) throw fail(source, 0, m.layersNoLine(word, banded));
  if (word !== "box") return;
  const declared = readDeclared(source, "box", LANE_ATTRS, m);
  const time = declared.attrs.get("time");
  if (time && shape !== "stairs") throw fail(source, time.at, m.stairsTimeOnly);
  if (time && !timeOf(time.value, true)) throw fail(source, time.at, m.stairsBadTime(time.value));
  if (!banded) return;
  if (state.figure.boxes.length >= LAYERS_MOST) throw fail(source, 0, m.layersTooMany(LAYERS_MOST, banded));
  // 層に書けない属性が 2 つ在る時は、行の前に書いた方を断る
  const [undrawn] = ["order", "limit"]
    .flatMap((name) => {
      const attr = declared.attrs.get(name);
      return attr ? [{ name, at: attr.at }] : [];
    })
    .sort((a, b) => a.at - b.at);
  if (undrawn) throw fail(source, undrawn.at, m.layersNoLine(undrawn.name, banded));
  // 階段の見た目は、全ての箱に時間を書くかどの箱にも書かない。時間の無い箱を、その箱の行かその後で時間を書いた行で止める
  const before = state.figure.boxes;
  const bare = time ? before.find((b) => b.time === undefined)?.id : before.some((b) => b.time !== undefined) ? declared.id : undefined;
  if (bare !== undefined) throw fail(source, 0, m.stairsTime(bare));
}

/** 見た目の名前 */
const LOOKS: Record<"ja" | "en", Record<Banded, string>> = {
  ja: { layers: "層の見た目", stairs: "階段の見た目" },
  en: { layers: "A layers lineup", stairs: "A stairs lineup" },
};

const UNITS = Object.keys(TIME_UNITS).join(" / ");

export const LAYERS_MESSAGES: { ja: LayersMessages; en: LayersMessages } = {
  ja: {
    lineupBadShape: (shapes) => `lineup (列の図) の shape には ${list(shapes)} を書く`,
    layersTooMany: (most, shape) => `${LOOKS.ja[shape]} (shape: ${shape}) の層は ${most} つまでにする`,
    layersNoLine: (word, shape) => `${LOOKS.ja[shape]} (shape: ${shape}) では ${word} を書けない。札の居る層は line の行で、層の印は note の行で書く`,
    stationsNoLine: (word) => `流れの線の見た目 (shape: stations) では ${word} を書けない。${word} は shape を書かないボードの列の図なら書ける`,
    stairsTimeOnly: "time は階段の見た目 (shape: stairs) の列の図の box にだけ書ける",
    stairsBadTime: (value) => `${value} は層の時間 (time) に書けない。時間は 0 以上の数と単位 (${UNITS}) の組で書く (40s など)`,
    stairsTime: (id) => `${id} に time を書く。階段の見た目 (shape: stairs) では、time を全ての box に書くか、どの box にも書かない`,
  },
  en: {
    lineupBadShape: (shapes) => `Write ${list(shapes)} for shape in a lineup diagram`,
    layersTooMany: (most, shape) => `${LOOKS.en[shape]} (shape: ${shape}) takes at most ${most} layers`,
    layersNoLine: (word, shape) => `${LOOKS.en[shape]} (shape: ${shape}) takes no ${word}. Write the layer of a card with line and the mark of a layer with note`,
    stationsNoLine: (word) => `A stations lineup (shape: stations) takes no ${word}. Write ${word} in a board lineup, which has no shape`,
    stairsTimeOnly: "time can be written only on box lines of a lineup with the stairs look (shape: stairs)",
    stairsBadTime: (value) => `${value} cannot be the time of a layer (time). Write a number of 0 or more and a unit (${UNITS}), such as 40s`,
    stairsTime: (id) => `Write time on ${id}. With the stairs look (shape: stairs), write time on every box or on none`,
  },
};
