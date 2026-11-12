/**
 * 列の図の見た目 (#3625、#3624) の読む決まり。列の図の決まりはチップのブロックが持つので、その読み方 (`read.ts`) がここを引く。
 *
 * 図の種類の行の `[shape: <見た目>]` は読む処理 (`parser.ts`) が読んで読んでいる記法の状態に置き、最初の段を始める時か記法の終わりに `layers` か `stations` かを確かめる。
 * 層の見た目は箱を上から横の帯に重ね、札の居る層を `line` で、層の印を `note` で書く。帯を 9 つ以上重ねると帯の字が読めなくなるので、9 つ目の箱の行を断る。
 * 順番の無い置き場 (`[order: none]`) と箱の上限 (`[limit: <数>]`) と、封と開けると選ぶと札と役の行は層の見た目で描かないので、受け付けたまま描かずに捨てず、その行を断る。
 * 流れの線の見た目は箱を 1 本の線の上の駅にし、封と開けると選ぶと札の行を描かないので、同じようにその行を断る。役と置き場と上限は流れの線でも描く。
 * 書き戻しは図の種類の行を書く所 (`printer.ts`) が持つ
 */
import { fail, isOneOf, list, readDeclared } from "../../read-kit";
import type { SourceLine } from "../../tokenize";
import type { ParseState } from "../block";
import { LANE_ATTRS, LAYERS_MOST, LINEUP_SHAPES } from "./block";

export interface LayersMessages {
  /** 列の図の `shape` に `layers` のほかの値を書いた */
  lineupBadShape: (shapes: readonly string[]) => string;
  /** 層の見た目の列の図に、上限を超える箱を書いた */
  layersTooMany: (most: number) => string;
  /** 層の見た目の列の図で、描かない行か属性を書いた */
  layersNoLine: (word: string) => string;
  /** 流れの線の見た目の列の図で、描かない行を書いた (#3624) */
  stationsNoLine: (word: string) => string;
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
 * 見た目を選んだ列の図の行の頭の語 `word` を確かめる。層の見た目は上限を超える箱と、描かない行と属性を断り、流れの線は描かない行を断る
 */
export function checkShapeHead(source: SourceLine, word: string, state: ParseState): void {
  // 見た目の値は最初の段を始める時に確かめるので、ここでは `layers` か `stations` と書いた時だけを数える
  if (state.kind !== "lineup") return;
  const shape = state.figure.lineup.shape?.value;
  if (shape === "stations" && STATIONS_UNDRAWN.includes(word)) throw fail(source, 0, state.m.stationsNoLine(word));
  if (shape !== "layers") return;
  if (UNDRAWN.includes(word)) throw fail(source, 0, state.m.layersNoLine(word));
  if (word !== "box") return;
  if (state.figure.boxes.length >= LAYERS_MOST) throw fail(source, 0, state.m.layersTooMany(LAYERS_MOST));
  // 層に書けない属性が 2 つ在る時は、行の前に書いた方を断る
  const declared = readDeclared(source, "box", LANE_ATTRS, state.m).attrs;
  const [undrawn] = ["order", "limit"]
    .flatMap((name) => {
      const attr = declared.get(name);
      return attr ? [{ name, at: attr.at }] : [];
    })
    .sort((a, b) => a.at - b.at);
  if (undrawn) throw fail(source, undrawn.at, state.m.layersNoLine(undrawn.name));
}

export const LAYERS_MESSAGES: { ja: LayersMessages; en: LayersMessages } = {
  ja: {
    lineupBadShape: (shapes) => `lineup (列の図) の shape には ${list(shapes)} を書く`,
    layersTooMany: (most) => `層の見た目 (shape: layers) の層は ${most} つまでにする`,
    layersNoLine: (word) => `層の見た目 (shape: layers) では ${word} を書けない。札の居る層は line の行で、層の印は note の行で書く`,
    stationsNoLine: (word) => `流れの線の見た目 (shape: stations) では ${word} を書けない。${word} は shape を書かないボードの列の図なら書ける`,
  },
  en: {
    lineupBadShape: (shapes) => `Write ${list(shapes)} for shape in a lineup diagram`,
    layersTooMany: (most) => `A layers lineup (shape: layers) takes at most ${most} layers`,
    layersNoLine: (word) => `A layers lineup (shape: layers) takes no ${word}. Write the layer of a card with line and the mark of a layer with note`,
    stationsNoLine: (word) => `A stations lineup (shape: stations) takes no ${word}. Write ${word} in a board lineup, which has no shape`,
  },
};
