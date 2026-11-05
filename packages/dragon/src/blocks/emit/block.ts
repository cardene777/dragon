/**
 * イベントのブロック (#3389)。
 *
 * 配管の図の部品 (`only: pipe`)。段の中の `emit <出す者>: <名前>(<引数>, <引数>)` の行で、出した Contract にイベントの色の印を出し、
 * 図の上の端のイベントの列に `<出した者の名前>.<イベントの名前>` の札を積む。引数は出した段だけ札に出す。
 * イベントも槽と同じく一番外の呼び出しが戻るまで暫定で、取り消された呼び出しの内側で出したイベントは取り消しの印で消える。
 */
import type { Block } from "../block";

/** 段の中の、`box` がイベント `name` を出す出来事。引数が無ければ `args` を持たない */
export interface PipeEmit {
  type: "emit";
  box: string;
  name: string;
  args?: string[];
}

export const block: Block = {
  name: "emit",
  rank: 126,
  attach: { how: "attach-to-figure", only: "pipe" },
  words: { heads: ["emit"] },
};
