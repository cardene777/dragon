/**
 * 取り込みの輪を探す (#2031)。
 *
 * `src/compile/` の下の file が、親である `src/compile.ts` を取り込み返していないかを見る。
 * 取り込み返すと、読む順で解決が変わって実行時に `undefined` が読まれる。
 *
 * 探し方をここ 1 箇所に置くのは、本番 (実 dir) と植え込み対照 (輪のある形を作った一時 dir) が
 * **同じ探し方を通る** ようにするため。 2 度書くと片方だけ直って、対照が本番を守らなくなる。
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

/** 取り込み文 1 つ。 */
export interface 取り込み {
  /** 走査した file の絶対 path */
  readonly file: string;
  /** 1 始まりの行番号 */
  readonly line: number;
  /** `from` の後ろに書かれた文字列そのもの */
  readonly 行き先: string;
  /** 行き先を file の場所から解決した絶対 path (拡張子は落とす)。 相対でなければ原文のまま */
  readonly 解決先: string;
}

/**
 * `from` を持つ取り込み文。
 *
 * 括弧の中で改行する形 (`import {\n  a,\n} from "x";`) を拾うため、行ごとではなく本文全体に
 * 当てる。 `[^;]*?` が改行を跨ぐので途中の改行は問題にならず、取り込み文の中に `;` が
 * 現れないことで次の文へはみ出さない。
 */
const 取り込み文 = /^[ \t]*(?:import|export)\b[^;]*?\bfrom[ \t\r\n]*(["'])([^"']+)\1/gm;

/** 読み込むだけの取り込み文 (`import "./x";`)。 */
const 読み込むだけ = /^[ \t]*import[ \t\r\n]*(["'])([^"']+)\1/gm;

/**
 * 注釈を空白に置き換える。 改行は残すので行番号がずれない。
 *
 * 注釈を消すのは、この repo の説明文が `from "../compile"` のような綴りを含みうるため。
 * 消さないと説明を書いただけで検査が落ちる。
 */
function 注釈を消す(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, (m) => " ".repeat(m.length));
}

/** 拡張子を落とす。 `./a.ts` と `./a` を同じものとして比べるため */
function 拡張子を落とす(p: string): string {
  return p.replace(/\.(ts|tsx|js|jsx|mjs|cjs)$/, "");
}

/** dir の直下の `.ts` を名前順に並べて返す。 下の階層へは降りない */
export function 走査対象(root: string): string[] {
  return readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(".ts"))
    .map((e) => join(root, e.name))
    .sort();
}

/** file 1 つから取り込み文を拾う */
export function 取り込みを読む(file: string): 取り込み[] {
  const src = 注釈を消す(readFileSync(file, "utf8"));
  const 結果: 取り込み[] = [];
  const 足す = (行き先: string, index: number): void => {
    const line = src.slice(0, index).split("\n").length;
    const 解決先 = 行き先.startsWith(".")
      ? 拡張子を落とす(resolve(dirname(file), 行き先))
      : 行き先;
    結果.push({ file, line, 行き先, 解決先 });
  };
  // どちらの形も 2 つ目の括弧が行き先。 一致したなら必ず取れる
  for (const m of src.matchAll(取り込み文)) 足す(m[2]!, m.index);
  for (const m of src.matchAll(読み込むだけ)) 足す(m[2]!, m.index);
  return 結果.sort((a, b) => a.line - b.line);
}

/** 走査の内訳。 0 件を「該当なし」 と「測っていない」 に分けるため件数を返す */
export interface 走査結果 {
  /** 走査した file の数 */
  readonly 走査数: number;
  /** 読み取った取り込み文の数 */
  readonly 取り込み数: number;
  /** 親を取り込み返している取り込み文 */
  readonly 輪: readonly 取り込み[];
}

/**
 * `root` の下の file が `親` を取り込み返していないかを見る。
 *
 * `親` は拡張子なしの絶対 path で渡す (`.../src/compile`)。
 */
export function 輪を探す(root: string, 親: string): 走査結果 {
  const files = 走査対象(root);
  const 全取り込み = files.flatMap((f) => 取り込みを読む(f));
  const 親の場所 = 拡張子を落とす(親);
  return {
    走査数: files.length,
    取り込み数: 全取り込み.length,
    輪: 全取り込み.filter((t) => t.解決先 === 親の場所),
  };
}
