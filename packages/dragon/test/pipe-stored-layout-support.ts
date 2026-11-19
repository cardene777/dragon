/**
 * 収めた並べ方の検査 (#3748) が共に使う、配管の原本の一覧と比べる形。
 *
 * 配管の原本は repo が追跡する `.dragon` と `.json` のうち、種類の行が `pipe` の物。
 * 比べる形は原本ごとに、`layout` の行を書いたままの形と、行を書かない形と、行を 6 つの形 (`PIPE_LAYOUTS`) に替えた形の 8 通り。
 * それぞれ最初に見える形と、畳んだ箱を 1 つだけ開いた形を描く。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PIPE_LAYOUTS } from "../src/schema";

/** repo の根。検査は repo の根で回す */
export const REPO = process.cwd();

/** 配管の原本の、repo の根から見た path。repo が追跡する file だけを読む */
export const PIPE_SOURCES: readonly string[] = execFileSync("git", ["ls-files", "-z", "--", "*.dragon", "*.json"], { cwd: REPO, encoding: "utf8" })
  .split("\0")
  .filter(Boolean)
  .filter((file) => /^pipe( |$)|"kind": *"pipe"/mu.test(readFileSync(join(REPO, file), "utf8")))
  .sort();

/** `layout` の行の扱い。`as-written` は書いたまま、`none` は行を外し、ほかは行をその形に替える */
export const ROWS = ["as-written", "none", ...PIPE_LAYOUTS] as const;
export type Row = (typeof ROWS)[number];

/** 原本と `layout` の行の組の名前 */
export const caseId = (file: string, row: Row): string => `${file}|${row}`;

export const CASES: readonly { id: string; file: string; row: Row }[] = PIPE_SOURCES.flatMap((file) => ROWS.map((row) => ({ id: caseId(file, row), file, row })));

/** 原本の file が描く字の言葉 */
export const langOfFile = (file: string): "ja" | "en" => (/\.en\.(json|dragon)$/u.test(file) ? "en" : "ja");

/** 2 つの畳んだ箱を持つ配管の図の記法。箱が N 個の図で N+1 通りを収め、2 つを開いた組を収めないことを確かめる */
export const TWO_FOLDS = `pipe 2つの畳み

box alice as Alice
box agg as Aggregator
box pool as Pool
box weth as WETH

hold pool: 10 WETH
hold alice: 0 WETH

step 1回目を任せる
  say AliceがAggregatorに1回目を任せる。
  alice -> agg: 1回目 [fold]

step Poolを呼ぶ
  say AggregatorがPoolを呼ぶ。
  agg -> pool: 交換

step WETHを送る
  say PoolがWETHに1を送らせる。
  pool -> weth: 送る
  move weth: 1 pool -> alice
  return weth: true
  return pool: 1 WETH

step 戻る
  say Aggregatorが戻る。
  return agg: 1 WETH

step 2回目を任せる
  say AliceがAggregatorに2回目を任せる。
  alice -> agg: 2回目 [fold]

step もう一度Poolを呼ぶ
  say Aggregatorがもう一度Poolを呼ぶ。
  agg -> pool: 交換

step もう一度送る
  say Poolがもう一度WETHに1を送らせる。
  pool -> weth: 送る
  move weth: 1 pool -> alice
  return weth: true
  return pool: 1 WETH

step また戻る
  say Aggregatorがまた戻る。
  return agg: 1 WETH
`;

/** 畳んだ箱を 1 つ持つ小さな配管の図 (ブロック集の見本) */
export const ONE_FOLD = readFileSync(join(REPO, "packages/dragon/src/blocks/fold/gallery/fold.pipe.dragon"), "utf8");
