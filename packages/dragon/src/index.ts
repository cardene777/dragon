/**
 * dragon の入口。全ての図の種類の部品を持ち、待たずに描ける。
 *
 * 図の原本は JSON で、人は行の頭の英語の語で行の種類を決める dragon記法で書く。記法と JSON は行き来でき、
 * JSON は JSON Schema 1 本で検査する。原本から図を描き、頁に置いて段ごとに動かす。
 * 頁に字を読み込むのは別の入口 `@cardenelabs/dragon/fonts`、原本の file を移すのは Node でだけ動く入口 `@cardenelabs/dragon/node`、
 * 図の種類の部品を後から読むのは別の入口 `@cardenelabs/dragon/light`。
 * この入口は頁を束ねる道具が読むため、Node の組み込みの module を読む部品を置かない (#3206)。
 */
import "./kinds/all";
// 手描きの線 (#3643) に描き替える処理。全部を持つ入口は待たずに描けるよう、読み込みの時に置く
import "./render/pen-all";
// 絵柄集の絵柄 (`tabler:<名前>`) の表 (#3493)。全部を持つ入口は待たずに描けるよう、読み込みの時に登録する
import "./blocks/icon/sets-all";

export * from "./api";
// 足すブロックの定義を読む関数は全部を持つ入口だけが出す。軽い入口は定義の行を持つ図を読む前に `loadFor` が後から読む (#3399)
export { readBlocks } from "./user-blocks-read";
// 配管の図の置き場所の決まりの表と、違反を数える処理 (#3418)。配管の図の部品と同じく、全部を持つ入口だけが出す
export { type PipeBreakage, PIPE_RULES, type PipeRule, type PipeViolation, pipeViolations } from "./pipe-rules";
