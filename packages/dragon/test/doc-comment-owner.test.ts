/**
 * 説明の塊 (`/** ... *\/`) の後ろに、それが説明する宣言が来ることの検証 (#2067)。
 *
 * 宣言を別 file へ移すと、説明だけが元の file に残ることがある。 残った説明は空行を挟んで
 * 次の説明や閉じ括弧の前に取り残され、どの宣言の説明でもなくなる。 `compile.ts` を図種ごとの
 * file に分けた時 (#2030) に、宣言を持たない説明が 6 つ続けて並んでいた。
 *
 * 空行を挟まずに次の説明が続く形は `doc-comment-stacked.test.ts` (#2066) が見る。 こちらは
 * 空行と行の注記 (`//`) を飛ばした最初の行が、宣言ではない形を見る。
 *
 * - 別の塊 (`/*` か `/**`) が来る
 * - 閉じ括弧 (`}` / `)` / `]`) が来る
 * - file が終わる
 *
 * **file の冒頭の説明は数えない**。 前にあるのが取り込み文と注記だけなら、file 全体の説明として
 * 置いたもの。 節の説明は `/**` ではなく `/*` で書く = TypeScript は `/**` を直後の宣言の説明として
 * 読むので、節の説明を `/**` で書くと最初の宣言の説明として表示される。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const REPO = join(import.meta.dirname, "..", "..", "..");

const 説明の始まり = /^\s*\/\*\*/u;
const 塊の終わり = /\*\//u;
const 注記の行 = /^\s*(\/\/|\/\*|\*)/u;
const 飛ばす行 = /^\s*(\/\/.*)?$/u;
const 宣言でない行 = /^\s*(\/\*|[}\])])/u;

/** 取り込み文と再輸出の行。 括弧の中で改行する形は、`from "..."` の行までを 1 つとして数える */
function 取り込みの行(行たち: readonly string[]): Set<number> {
  const 行 = new Set<number>();
  for (let i = 0; i < 行たち.length; i++) {
    const 始まり = 行たち[i] ?? "";
    if (!/^import\b/u.test(始まり) && !/^export\s+(\*|\{|type\s+\{)/u.test(始まり)) continue;
    let 終わり = i;
    while (
      終わり < 行たち.length &&
      !/\bfrom\s+["'][^"']*["'];?\s*$/u.test(行たち[終わり] ?? "") &&
      !/^import\s+["'][^"']*["'];?\s*$/u.test(行たち[終わり] ?? "")
    ) {
      終わり++;
    }
    // `export { a, b };` のように取り込み先を持たない形は、宣言として扱う
    if (終わり >= 行たち.length) continue;
    for (let k = i; k <= 終わり; k++) 行.add(k);
    i = 終わり;
  }
  return 行;
}

/**
 * 1 file の本文を読み、説明の塊の数と、持ち主の宣言が来ない塊の始まりの行番号を返す。
 */
function 持ち主のない説明(本文: string): { 塊: number; 箇所: number[] } {
  const 行たち = 本文.split("\n");
  const 取り込み = 取り込みの行(行たち);
  let 塊 = 0;
  let 宣言を見た = false;
  const 箇所: number[] = [];
  for (let i = 0; i < 行たち.length; i++) {
    const 行 = 行たち[i] ?? "";
    if (!説明の始まり.test(行)) {
      if (行.trim() !== "" && !注記の行.test(行) && !取り込み.has(i)) 宣言を見た = true;
      continue;
    }
    塊++;
    // 同じ行で閉じる塊 (`/** 1 行 *\/`) は、始まりの 3 文字より後ろで閉じを探す
    let 終わり = i;
    if (!塊の終わり.test(行.slice(行.indexOf("/**") + 3))) {
      終わり = i + 1;
      while (終わり < 行たち.length && !塊の終わり.test(行たち[終わり] ?? "")) 終わり++;
    }
    let 次 = 終わり + 1;
    while (次 < 行たち.length && 飛ばす行.test(行たち[次] ?? "")) 次++;
    const 次の行 = 行たち[次];
    const 持ち主が無い = 次の行 === undefined || 宣言でない行.test(次の行);
    if (持ち主が無い && 宣言を見た) 箇所.push(i + 1);
    i = 終わり;
  }
  return { 塊, 箇所 };
}

describe("説明の塊の後ろに持ち主の宣言が来る (#2067)", () => {
  it("追跡中の *.ts / *.tsx に、持ち主の宣言が来ない説明の塊が無い", () => {
    const 対象 = execFileSync("git", ["-C", REPO, "ls-files", "*.ts", "*.tsx"], { encoding: "utf8" })
      .split("\n")
      .filter((p) => p !== "");
    expect(対象.length, "file を 1 つも拾えていない (検査が空振りしている)").toBeGreaterThan(0);

    let 数えた塊 = 0;
    const 見つけた: string[] = [];
    for (const rel of 対象) {
      const { 塊, 箇所 } = 持ち主のない説明(readFileSync(join(REPO, rel), "utf8"));
      数えた塊 += 塊;
      for (const 行 of 箇所) 見つけた.push(`${rel}:${行}`);
    }
    expect(数えた塊, "説明の塊を 1 つも数えていない (判定が空振りしている)").toBeGreaterThan(0);
    expect(
      見つけた,
      "説明の塊の後ろに持ち主の宣言が無い (宣言の直前へ移す。 持ち主が消えていれば消す。 節の説明は /* で書く)",
    ).toEqual([]);
  });

  it("空行や行の注記の後に宣言が来ない説明の塊を拾う", () => {
    // 植え込み対照。 本番の走査は 0 件を期待するので、判定が何にも一致しない形に壊れていても
    // 通ってしまう。 同じ判定に持ち主の無い形を渡して、拾えることを確かめる
    const 形 = {
      空行の後に別の説明: ["const a = 1;", "/** 持ち主の無い説明 */", "", "/** b の説明 */", "const b = 2;"],
      行の注記の後に閉じ括弧: ["function f() {", "  const a = 1;", "  /** 残った説明 */", "  // 注記", "}"],
      本文の終わり: ["const a = 1;", "/**", " * 最後に残った説明", " */", ""],
    };
    const 期待 = { 空行の後に別の説明: [2], 行の注記の後に閉じ括弧: [3], 本文の終わり: [2] };
    for (const [名前, 行たち] of Object.entries(形)) {
      expect(持ち主のない説明(行たち.join("\n")).箇所, 名前).toEqual(期待[名前 as keyof typeof 期待]);
    }
  });

  it("宣言の直前の説明、file の冒頭の説明、/* で書いた節の説明は拾わない", () => {
    // 陰性対照。 上の対照が、説明の塊を全て拾うだけの判定で通っていないことを確かめる
    const 形 = {
      宣言の直前: ["const a = 1;", "/** b の説明 */", "const b = 2;"],
      行の注記を挟んで宣言: ["const a = 1;", "/** b の説明 */", "// eslint-disable-next-line", "const b = 2;"],
      取り込み文の後の冒頭: ['import { x } from "y";', "/** file 全体の説明 */", "", "/** a の説明 */", "const a = 1;"],
      複数行の取り込み文の後の冒頭: ["import {", "  x,", '} from "y";', "/**", " * file 全体の説明", " */", "", "/** a */", "const a = 1;"],
      節の説明を普通の塊で書く: ["const a = 1;", "/*", " * 節の説明", " */", "", "/** b の説明 */", "const b = 2;"],
    };
    for (const [名前, 行たち] of Object.entries(形)) {
      expect(持ち主のない説明(行たち.join("\n")).箇所, 名前).toEqual([]);
    }
  });
});
