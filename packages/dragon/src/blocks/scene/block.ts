/**
 * 場面のブロック (#3878)。
 *
 * 1 つの図に場面を持たせる時は、箱と全ての場面に共通の段を図で 1 回だけ書き、その後ろに `scene <名前>` と `end` の間に、
 * 分かれる所から先のその場面だけの段を書く。場面が止まる段の中に `stop <理由>` を書くと、場面はその段で止まって理由の文を出す。
 * 場面は `SCENE_MOST` まで書ける。見せ方は最初の行の `[scenes: stack]` か `[scenes: pick]` で選び、書かなければ並べる見せ方 (`stack`) で描く。
 * 同じ箱を全ての場面で同じ位置に描く並べ方を持つ手順の図と列の図だけが場面を持てるので、ほかの図の種類を付け方の `except` に書く。
 *
 * 場面の段を場面ごとに分けて積むのは段を積む読む処理 (`parser.ts` の `openScene` と `closeScene`) が、`end` で場面を閉じるのは区画のブロックの読み方が行う。
 * 場面を書き戻すのは書き戻す処理 (`printer.ts`) で、場面ごとの図を描くのはこのブロックの描き方 (`draw.ts`) で、場面を書ける種類の描く部品の組だけが読む。
 */
import type { SceneShow } from "../../schema";
import type { Block } from "../block";

/** 場面の見せ方。最初の行の `scenes` に書ける値 */
export const SCENE_SHOWS = Object.keys({ stack: true, pick: true } satisfies Record<SceneShow, true>) as SceneShow[];

/**
 * 場面を書ける図の種類。手順の図は全ての場面の段を合わせた 1 つの並べ方から、列の図は場面ごとに後ろへほかの場面の段を足した並べ方から、箱の位置を取る。
 * 付け方の `except` はこの 2 つの外の図の種類で、語の誤りの文と 1 行目の `scenes` を書ける図の種類はこの並びから引く
 */
export const SCENE_KINDS = ["flow", "lineup"] as const;

/** 1 つの図に書ける場面の数。並べる見せ方で図が縦に長くなりすぎないよう抑える */
export const SCENE_MOST = 3;

export const block: Block = {
  name: "scene",
  rank: 161,
  attach: {
    how: "attach-to-figure",
    except: ["sequence", "architecture", "state", "git", "time", "tree", "try", "pipe", "chart", "cycle", "mind", "er", "matrix", "venn", "sankey", "cards"],
  },
  words: { heads: ["scene", "stop"], attrs: { diagram: ["scenes"] } },
};
