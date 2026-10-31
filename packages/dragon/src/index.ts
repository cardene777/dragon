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

export * from "./api";
