/**
 * `dragon check` と `dragon --version` の命令 (#3455)。
 *
 * AI が書いた記法を、描かずに確かめて直す輪を回すための命令。
 * 誤りは `<file>:<行>:<列> error <文>` の 1 件 1 行で出し、AI が行を名指して直せる形にする。
 * Markdown の file は dragon の囲みだけを確かめ、誤りの行は囲みの中の行でなく元の file の行で示す。
 * 似た名前の知らせは図を描けるので `warning` の行で出し、終わり方は 0 のままにする。
 * 文の言葉は書き出しの命令と同じく、`--lang` を渡せばその言葉、無ければ英語 (#3338)。
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as dragon from "../src/core";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { api, type LineError, type Parsed } from "./diagram-support";
import { type Ran, runCli } from "./export-support";
import "../src/kind-use/architecture";
import "../src/kind-use/lineup";
import "../src/kind-use/sequence";

const KANA_KANJI = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;
const CLI = join(process.cwd(), "packages/dragon/dist/cli.js");
const PACKAGE = join(process.cwd(), "packages/dragon/package.json");

const lines = (...rows: string[]): string => `${rows.join("\n")}\n`;
const outputLines = (text: string): string[] => text.trimEnd().split("\n").filter((line) => line !== "");
const scratch = (): string => mkdtempSync(join(tmpdir(), "dragon-check-"));
const parse = (text: string, lang: "ja" | "en" = "en"): Parsed => api("parseNotation")(text, { lang });
const firstError = (parsed: Parsed): LineError | undefined => (parsed.ok ? undefined : parsed.errors[0]);
const firstNotice = (parsed: Parsed): LineError | undefined => (parsed.ok ? parsed.notices?.[0] : undefined);

/** 読める短い図 */
const GOOD = lines("sequence", "", "Browser -> App: GET /login", "App -> Browser: send to the sign-in page");
/** 3 行目の線の向きの印が読めない図 */
const BROKEN = lines("sequence", "", "Browser => App: GET /login");
/** 1 字違いの似た名前の箱を持つ図。描けるが知らせが出る */
const SIMILAR = lines("sequence", "", "Browser -> App: GET /login", "Apq -> Browser: back");

/** file を置いて path を返す */
function place(name: string, text: string): string {
  const path = join(scratch(), name);
  writeFileSync(path, text);
  return path;
}

/** 命令を引数の組ごとに 1 度ずつ順に打ち、引数の組で引ける結果を返す */
async function runEach(argsList: readonly (readonly string[])[]): Promise<Map<string, Ran>> {
  const runs = new Map<string, Ran>();
  for (const args of argsList) runs.set(JSON.stringify(args), await runCli([...args]));
  return runs;
}

/** 読み込む段で打った命令の結果のうち、引数の組 `args` の物。打っていない組は検査の書き誤りなので投げる */
function ranWith(runs: ReadonlyMap<string, Ran>, args: readonly string[]): Ran {
  const found = runs.get(JSON.stringify(args));
  if (found === undefined) throw new Error(`読み込む段で打っていない引数: ${args.join(" ")}`);
  return found;
}

// 子の Node で命令を起こす件は、混んだ機械で 1 件 10 秒の上限を超えた (#3815)。
// 件ごとの命令を file を読み込む段で 1 つずつ順に済ませ、件はその結果を読む

const VERSION_PRINTED = await atLoad("版の数を出す", () => runCli(["--version"]));

const ERROR_REPORTED = await atLoad("誤りのある図を 2 つの言葉で確かめ、読める図を確かめる", async () => {
  const file = place("broken.dragon", BROKEN);
  return {
    file,
    // 言葉なしは英語で出し、--lang ja で文を日本語にする
    en: await runCli(["check", file]),
    ja: await runCli(["check", file, "--lang", "ja"]),
    good: await runCli(["check", place("good.dragon", GOOD)]),
  };
});

const FENCES_CHECKED = await atLoad("Markdown の dragon の囲みを確かめる", async () => {
  const markdown = lines(
    "# Notes",
    "",
    "```dragon",
    GOOD.trimEnd(),
    "```",
    "",
    "Some text.",
    "",
    "```js",
    "const notation = 'Browser => App';",
    "```",
    "",
    "```dragon",
    BROKEN.trimEnd(),
    "```",
  );
  const file = place("notes.md", markdown);
  const ran = await runCli(["check", file]);
  // dragon でない囲みと、読める囲みだけの file
  const clean = await runCli(["check", place("clean.md", lines("```dragon", GOOD.trimEnd(), "```", "", "```js", "Browser => App", "```"))]);
  return { markdown, file, ran, clean };
});

const SIMILAR_CHECKED = await atLoad("似た名前の箱を持つ図を確かめる", async () => {
  const file = place("similar.dragon", SIMILAR);
  return { file, ran: await runCli(["check", file]) };
});

const JSON_PRINTED = await atLoad("誤りと知らせを JSON で出す", async () => {
  const brokenFile = place("broken.dragon", BROKEN);
  const similarFile = place("similar.dragon", SIMILAR);
  return {
    brokenFile,
    similarFile,
    ran: await runCli(["check", brokenFile, similarFile, "--json"]),
    // 誤りも知らせも無い図
    good: await runCli(["check", place("good.dragon", GOOD), "--json"]),
  };
});

const STDIN_READ = await atLoad("標準入力の記法を確かめる", () => ({
  ran: spawnSync(process.execPath, [CLI, "check", "-"], { input: BROKEN, encoding: "utf8" }),
  good: spawnSync(process.execPath, [CLI, "check", "-"], { input: GOOD, encoding: "utf8" }),
}));

const USAGE_REFUSED = await atLoad("file を渡さない check と、無い file と読めない拡張子の file の check を打つ", async () => {
  const missing = join(scratch(), "none.dragon");
  const text = place("notes.txt", GOOD);
  return { missing, text, runs: await runEach([["check"], ["check", missing], ["check", text]]) };
});

describe("dragon --version (#3455)", () => {
  it("cli-prints-version", () => {
    const version = (JSON.parse(readFileSync(PACKAGE, "utf8")) as { version: string }).version;
    const ran = VERSION_PRINTED.get();
    expect(ran.code, ran.stderr).toBe(0);
    expect(ran.stdout.trim(), "版の数を出さない").toBe(version);
  });
});

describe("dragon check (#3455)", () => {
  it("check-reports-error-at-line-and-column", () => {
    const expected = { en: firstError(parse(BROKEN, "en")), ja: firstError(parse(BROKEN, "ja")) };
    expect(expected.en, "読む処理が誤りを返さない").toBeDefined();
    const { file, en, ja, good } = ERROR_REPORTED.get();
    // 言葉なしは英語で出す
    expect(en.code, `誤りのある図で終わり方 1 にならない ${en.stderr}`).toBe(1);
    expect(outputLines(en.stdout), "誤りの行の形").toEqual([`${file}:${expected.en?.line}:${expected.en?.column} error ${expected.en?.message}`]);
    expect(en.stdout, "言葉なしの誤りの文に仮名か漢字がある").not.toMatch(KANA_KANJI);
    // --lang ja で文を日本語にする
    expect(ja.code, `--lang ja で終わり方 1 にならない ${ja.stderr}`).toBe(1);
    expect(outputLines(ja.stdout), "日本語の誤りの行の形").toEqual([`${file}:${expected.ja?.line}:${expected.ja?.column} error ${expected.ja?.message}`]);
    // 読める図は何も出さずに終わり方 0
    expect(good.code, good.stderr).toBe(0);
    expect(good.stdout.trim(), "読める図で何かを出した").toBe("");
  });

  it("check-reads-markdown-fences-at-file-lines", () => {
    const broken = firstError(parse(BROKEN));
    expect(broken, "読む処理が誤りを返さない").toBeDefined();
    const { markdown, file, ran, clean } = FENCES_CHECKED.get();
    // 2 つ目の dragon の囲みの中身は 14 行目から始まる
    const opening = markdown.split("\n").lastIndexOf("```dragon") + 1;
    expect(ran.code, `誤りのある囲みで終わり方 1 にならない ${ran.stderr}`).toBe(1);
    expect(outputLines(ran.stdout), "誤りを元の file の行で示さない").toEqual([
      `${file}:${opening + (broken?.line ?? 0)}:${broken?.column} error ${broken?.message}`,
    ]);
    // dragon でない囲みは確かめない。読める囲みだけの file は終わり方 0
    expect(clean.code, `dragon でない囲みを確かめた ${clean.stdout}`).toBe(0);
  });

  it("check-warns-similar-names-and-passes", () => {
    const notice = firstNotice(parse(SIMILAR));
    expect(notice, "読む処理が似た名前を知らせない").toBeDefined();
    const { file, ran } = SIMILAR_CHECKED.get();
    expect(ran.code, `知らせだけの図で終わり方 0 にならない ${ran.stdout}`).toBe(0);
    expect(outputLines(ran.stdout), "知らせの行の形").toEqual([`${file}:${notice?.line}:${notice?.column} warning ${notice?.message}`]);
  });

  it("check-prints-json", () => {
    const broken = firstError(parse(BROKEN));
    const notice = firstNotice(parse(SIMILAR));
    const { brokenFile, similarFile, ran, good } = JSON_PRINTED.get();
    expect(ran.code, ran.stderr).toBe(1);
    expect(JSON.parse(ran.stdout), "JSON の形").toEqual([
      { file: brokenFile, line: broken?.line, column: broken?.column, severity: "error", message: broken?.message },
      { file: similarFile, line: notice?.line, column: notice?.column, severity: "warning", message: notice?.message },
    ]);
    // 誤りも知らせも無い時は空の配列
    expect(good.code, good.stderr).toBe(0);
    expect(JSON.parse(good.stdout)).toEqual([]);
  });

  it("check-reads-stdin", () => {
    const broken = firstError(parse(BROKEN));
    const { ran, good } = STDIN_READ.get();
    expect(ran.status, ran.stderr).toBe(1);
    expect(outputLines(ran.stdout), "標準入力の誤りの行").toEqual([`-:${broken?.line}:${broken?.column} error ${broken?.message}`]);
    expect(good.status, good.stderr).toBe(0);
  });

  it("check-usage-errors-exit-2", () => {
    // file を渡さない時は check の使い方を、無い file と読めない拡張子の file はその path を名指して断る
    const { missing, text, runs } = USAGE_REFUSED.get();
    for (const [args, reason] of [
      [["check"], /^Usage: dragon check /mu],
      [["check", missing], missing],
      [["check", text], text],
    ] as const) {
      const ran = ranWith(runs, args);
      expect(ran.code, `${args.join(" ")} で終わり方 2 にならない ${ran.stdout}`).toBe(2);
      expect(ran.stdout.trim(), `${args.join(" ")} で確かめた結果を出した`).toBe("");
      if (typeof reason === "string") expect(ran.stderr, `${args.join(" ")} で断った file を名指さない`).toContain(reason);
      else expect(ran.stderr, `${args.join(" ")} で check の使い方を出さない`).toMatch(reason);
    }
  });
});

/** dragon の囲みを並べた Markdown と、各囲みの中身が始まる file の行の 1 つ前 */
function fenced(...diagrams: string[]): { text: string; offsets: number[] } {
  const rows: string[] = [];
  const offsets: number[] = [];
  for (const diagram of diagrams) {
    rows.push("```dragon");
    offsets.push(rows.length);
    rows.push(...diagram.trimEnd().split("\n"), "```", "");
  }
  return { text: lines(...rows), offsets };
}

// 矢印の先を書き忘れた線の行 (#3468) の件が読む、命令の結果と、確かめた行

const EDGE_SHAPE_NAMED = await atLoad("矢印の先の無い線の行を持つ図を確かめる", async () => {
  const last = "B -> : answer";
  const file = place("missing-target.dragon", lines("sequence", "A -> B: ask", last));
  return { last, file, ran: await runCli(["check", file]) };
});

const BOTH_LANGUAGES = await atLoad("矢印の先の無い線の行を持つ構成図を 2 つの言葉で確かめる", async () => {
  const last = "  a -> : send";
  const file = place("missing-target-architecture.dragon", lines("architecture Hand over", "", "box a as A", "box b as B", "", "step Send", last));
  return { last, file, runs: { en: await runCli(["check", file, "--lang", "en"]), ja: await runCli(["check", file, "--lang", "ja"]) } };
});

const LINE_END_AND_SHARED = await atLoad("行の終わりで切れた矢印と、共有の線のブロックの先を書き忘れた行を確かめる", async () => {
  const cut = "B ->";
  const shared = "  a +relay : send";
  const { text, offsets } = fenced(lines("sequence", "A -> B: ask", cut), lines("architecture Bridge", "box a as A", "+bridge b as B", "step Send", shared));
  const file = place("missing-target.md", text);
  return { cut, shared, offsets, file, ran: await runCli(["check", file]) };
});

const KEPT_MESSAGES = await atLoad("矢印を持たない行と、先を書いた線の行を確かめる", async () => {
  const unknown = "foo bar";
  const complete = "B -> A answer";
  const { text, offsets } = fenced(lines("sequence", "A -> B: ask", unknown), lines("sequence", "A -> B: ask", complete));
  const file = place("kept.md", text);
  return { offsets, file, ran: await runCli(["check", file]) };
});

const LINEUP_CHECKED = await atLoad("列の図の先の無い線の行と、先を書いた線の行を確かめる", () => {
  const diagram = (edge: string): string => lines("lineup Two lanes", "", "box a as A", "box b as B", "", "step Move", edge);
  const { text } = fenced(diagram("  a -> : send"), diagram("  a -> b: send"));
  return runCli(["check", place("lineup.md", text)]);
});

/**
 * 矢印の先を書き忘れた線の行 (#3468)。
 *
 * 先の無い行は線の行の形に合わないため、行の頭の語を断る文 (`cannot start with`) へ落ちていた。
 * 先頭の名札は正しい書き方なので、その文では直す場所が分からない。
 * 線の行の正しい形の文を、矢印の後ろで名札が入る位置に返す。
 */
describe("矢印の先を書き忘れた線の行 (#3468)", () => {
  const EDGE_SHAPE = { en: "Write a line as <id> -> <id>: <label> [<attributes>]", ja: "線は <名札> -> <名札>: <線の名前> [<属性>] の形で書く" };
  const HEAD_REFUSAL = "cannot start with";

  /** 行の中で `marker` が始まる桁 (1 から数える) */
  const columnOf = (line: string, marker: string): number => line.indexOf(marker) + 1;

  it("check-names-edge-shape-for-missing-arrow-target", () => {
    const { last, file, ran } = EDGE_SHAPE_NAMED.get();
    expect(ran.code, `先の無い線の行で終わり方 1 にならない ${ran.stderr}`).toBe(1);
    expect(ran.stdout, "行の頭の語を断る文を返した").not.toContain(HEAD_REFUSAL);
    // 矢印の後ろで名札が入る位置は `:` の桁
    expect(outputLines(ran.stdout), "線の行の正しい形の文を矢印の後ろで返さない").toEqual([`${file}:3:${columnOf(last, ":")} error ${EDGE_SHAPE.en}`]);
  });

  it("check-missing-arrow-target-in-both-languages", () => {
    const { last, file, runs } = BOTH_LANGUAGES.get();
    for (const lang of ["en", "ja"] as const) {
      const ran = runs[lang];
      expect(ran.code, `${lang} で終わり方 1 にならない ${ran.stderr}`).toBe(1);
      expect(outputLines(ran.stdout), `${lang} で線の行の正しい形の文を返さない`).toEqual([`${file}:7:${columnOf(last, ":")} error ${EDGE_SHAPE[lang]}`]);
    }
  });

  it("check-missing-target-at-line-end-and-shared-edge", () => {
    // 行の終わりで切れた矢印と、共有の線のブロック (+relay) の先を書き忘れた行
    const { cut, shared, offsets, file, ran } = LINE_END_AND_SHARED.get();
    expect(ran.code, `先の無い線の行で終わり方 1 にならない ${ran.stderr}`).toBe(1);
    expect(ran.stdout, "行の頭の語を断る文を返した").not.toContain(HEAD_REFUSAL);
    expect(outputLines(ran.stdout), "先の無い 2 つの行に線の行の正しい形の文を返さない").toEqual([
      // 切れた矢印は行の終わりの次の桁、共有の線のブロックは名前の後ろの `:` の桁
      `${file}:${(offsets[0] ?? 0) + 3}:${cut.length + 1} error ${EDGE_SHAPE.en}`,
      `${file}:${(offsets[1] ?? 0) + 5}:${columnOf(shared, ":")} error ${EDGE_SHAPE.en}`,
    ]);
  });

  it("check-keeps-unknown-head-and-complete-edge-messages", () => {
    // 矢印を持たない行の頭の語の誤りと、先を書いた線の行の誤りの文は変えない
    const { offsets, file, ran } = KEPT_MESSAGES.get();
    expect(ran.code, ran.stderr).toBe(1);
    const [head, edge] = outputLines(ran.stdout);
    expect(head?.startsWith(`${file}:${(offsets[0] ?? 0) + 3}:1 error A line ${HEAD_REFUSAL} foo. `), `矢印を持たない行で行の頭の語を断る文を返さない ${head}`).toBe(true);
    expect(edge, "先を書いた線の行の誤りの文と桁が変わった").toBe(`${file}:${(offsets[1] ?? 0) + 3}:8 error ${EDGE_SHAPE.en}`);
  });

  it("check-lineup-missing-target-says-no-edge-lines", () => {
    // 列の図は線の行を持たないので、先の無い線の行にも線の行の形でなく、先を書いた線の行と同じ文を返す
    const ran = LINEUP_CHECKED.get();
    expect(ran.code, ran.stderr).toBe(1);
    const messages = outputLines(ran.stdout).map((line) => line.replace(/^.*?:\d+:\d+ error /u, ""));
    expect(messages, "先の無い線の行と先を書いた線の行で文が違う").toHaveLength(2);
    expect(messages[0], "先の無い線の行に列の図の文を返さない").toBe(messages[1]);
    expect(messages[0], "列の図の先の無い線の行に線の行の形を返した").not.toBe(EDGE_SHAPE.en);
  });
});

// 定義の file と --blocks (#3508) の件と、その件が読む命令が使う定義と見本

const SHARED = join(process.cwd(), "packages/dragon/blocks");
/** 共有のブロック集に無い箱のブロックの定義。頭に何のブロックかの注釈を置く */
const VAULT = lines("// A vault that holds deposited tokens", "blocks 1", "block +vault", "  base box", "  color amber", "end");
/** 定義を書かずに +vault を使う見本 */
const VAULT_EXAMPLE = lines("architecture Deposit into a vault", "", "box user as User", "+vault v as Vault", "", "step Deposit", "  user -> v: deposit");
/** 4 行目に dragon が知らない base を書いた定義 */
const BAD_BASE = lines("// A block with a base dragon does not know", "blocks 1", "block +vault", "  base car", "end");

const DEFINITIONS_PASSED = await atLoad("読める定義の file と、共有のブロック集の定義の file を確かめる", async () => {
  const file = place("vault.dragon", VAULT);
  const ran = await runCli(["check", file]);
  // 共有のブロック集の定義の file を全て
  const shared = readdirSync(SHARED)
    .filter((name) => name.endsWith(".dragon"))
    .map((name) => join(SHARED, name));
  return { ran, shared, all: await runCli(["check", ...shared]) };
});

const DEFINITION_ERROR = await atLoad("知らない base を書いた定義の file を 2 つの言葉で確かめる", async () => {
  const file = place("bad.dragon", BAD_BASE);
  return { file, runs: { en: await runCli(["check", file, "--lang", "en"]), ja: await runCli(["check", file, "--lang", "ja"]) } };
});

const BLOCKS_OPTION_USED = await atLoad("--blocks で定義を渡して見本を確かめる", async () => {
  const definitions = place("vault.dragon", VAULT);
  const example = place("vault-example.dragon", VAULT_EXAMPLE);
  return {
    example,
    // 定義を渡さない時と、--blocks で定義を渡す時と、崩れも確かめる時 (--layout)
    without: await runCli(["check", example]),
    ran: await runCli(["check", "--blocks", definitions, example]),
    layout: await runCli(["check", "--layout", "--blocks", definitions, example]),
  };
});

const BLOCKS_OPTION_REFUSED = await atLoad("誤った --blocks の check と、check の使い方を打つ", async () => {
  const example = place("vault-example.dragon", VAULT_EXAMPLE);
  const diagram = place("good.dragon", GOOD);
  const missing = join(scratch(), "none.dragon");
  return {
    example,
    diagram,
    missing,
    // 定義の file でない file、無い file、値の無い --blocks
    runs: await runEach([
      ["check", "--blocks", diagram, example],
      ["check", "--blocks", missing, example],
      ["check", example, "--blocks"],
    ]),
    // 英語と日本語の使い方の文
    en: await runCli(["check"]),
    ja: await runCli(["check", "--lang", "ja"]),
  };
});

/**
 * 足したブロックの定義の file と、渡した定義で図を確かめる設定 `--blocks` (#3508)。
 *
 * 共有のブロック集へ PR を出す前に、組み立て直していない `dragon` で定義と見本を確かめるための形。
 * `blocks 1` で始まる file は図ではなく定義として読み、誤りは定義を読む処理 (`readBlocks`) が返す行と列で出す。
 * `--blocks <file>` は定義の file を読み、確かめる図に定義として渡す。
 */
describe("定義の file と --blocks (#3508)", () => {
  type ReadBlocks = { ok: true; blocks: unknown } | { ok: false; errors: LineError[] };
  const readBlocks = (text: string, lang: "ja" | "en" = "en"): ReadBlocks => {
    const fn = (dragon as unknown as { readBlocks?: (input: unknown, options?: { lang?: "ja" | "en" }) => ReadBlocks }).readBlocks;
    expect(fn, "readBlocks が @cardenelabs/dragon から出ていない").toBeDefined();
    return fn ? fn(text, { lang }) : { ok: false, errors: [] };
  };

  it("check-passes-definitions-file", () => {
    const { ran, shared, all } = DEFINITIONS_PASSED.get();
    expect(ran.code, `読める定義の file で終わり方 0 にならない ${ran.stdout}${ran.stderr}`).toBe(0);
    expect(ran.stdout.trim(), "読める定義の file で何かを出した").toBe("");
    // 共有のブロック集の定義の file も、全てこの形で通る
    expect(shared.length, "共有のブロック集に定義の file が無い").toBeGreaterThan(0);
    expect(all.code, `共有のブロック集の定義の file が通らない\n${all.stdout}${all.stderr}`).toBe(0);
    expect(all.stdout.trim(), "共有のブロック集の定義の file で何かを出した").toBe("");
  });

  it("check-reports-definition-error-at-line", () => {
    const { file, runs } = DEFINITION_ERROR.get();
    for (const lang of ["en", "ja"] as const) {
      const read = readBlocks(BAD_BASE, lang);
      const expected = read.ok ? undefined : read.errors[0];
      expect(expected?.line, "定義を読む処理が知らない base の行を指さない").toBe(4);
      const ran = runs[lang];
      expect(ran.code, `誤りのある定義の file で終わり方 1 にならない (${lang}) ${ran.stderr}`).toBe(1);
      expect(outputLines(ran.stdout), `定義の誤りの行の形 (${lang})`).toEqual([`${file}:${expected?.line}:${expected?.column} error ${expected?.message}`]);
    }
  });

  it("check-uses-blocks-option-definitions", () => {
    // 定義を渡さない時は、今どおり定義の無いブロックを断る
    const undefinedBlock = firstError(parse(VAULT_EXAMPLE));
    expect(undefinedBlock?.message, "読む処理が定義の無いブロックを断らない").toContain("+vault");
    const { example, without, ran, layout } = BLOCKS_OPTION_USED.get();
    expect(without.code, `定義を渡さずに終わり方 1 にならない ${without.stderr}`).toBe(1);
    expect(outputLines(without.stdout), "定義の無いブロックの誤りの行").toEqual([`${example}:${undefinedBlock?.line}:${undefinedBlock?.column} error ${undefinedBlock?.message}`]);
    // --blocks で定義を渡すと通る
    expect(ran.code, `--blocks で定義を渡しても通らない ${ran.stdout}${ran.stderr}`).toBe(0);
    expect(ran.stdout.trim(), "--blocks で定義を渡した図で何かを出した").toBe("");
    // 崩れも確かめる時 (--layout) も、渡した定義で図を描く
    expect(layout.code, `--layout と --blocks で通らない ${layout.stdout}${layout.stderr}`).toBe(0);
    expect(layout.stdout, "--layout で描く処理に渡した定義が届かない").not.toMatch(/\+vault is not defined/u);
  });

  it("check-blocks-option-usage-errors", () => {
    const { example, diagram, missing, runs, en, ja } = BLOCKS_OPTION_REFUSED.get();
    // 定義の file でない file、無い file、値の無い --blocks は、どれも確かめずに名指して断る
    for (const [args, named] of [
      [["check", "--blocks", diagram, example], diagram],
      [["check", "--blocks", missing, example], missing],
      [["check", example, "--blocks"], "--blocks"],
    ] as const) {
      const ran = ranWith(runs, args);
      expect(ran.code, `${args.join(" ")} で終わり方 2 にならない ${ran.stdout}`).toBe(2);
      expect(ran.stdout.trim(), `${args.join(" ")} で確かめた結果を出した`).toBe("");
      expect(ran.stderr, `${args.join(" ")} で何が違うかを名指さない`).toContain(named);
    }
    // 使い方の文は英語と日本語の両方で --blocks を挙げる
    expect(en.code).toBe(2);
    expect(en.stderr, "英語の使い方が --blocks を挙げない").toMatch(/^\s+--blocks /mu);
    expect(ja.code).toBe(2);
    expect(ja.stderr, "日本語の使い方を出さない").toMatch(/^使い方: dragon check /mu);
    expect(ja.stderr, "日本語の使い方が --blocks を挙げない").toMatch(/^\s+--blocks /mu);
  });
});

/**
 * 脇道の線を持つ状態の図 (#3943)。題と `say` を `title` と `says` で入れ替える。
 * 箱の下に `note` を書くと、英語の始まりの札 (`Start`) で描いた時だけ、脇道の線 CREATED → unsupported が段 1 の札を横切る
 */
const stateFigure = (title: string, says: readonly string[]): string =>
  lines(
    `state ${title}`,
    "",
    "box created as CREATED [note: 受付が依頼を受け取った所で、全ての依頼がここから始まる, color: slate, icon: doc]",
    "box normalized as NORMALIZED [note: 中身を読み解き、どの品を誰にいくつ送るかが分かった所, color: blue, icon: code]",
    "box evaluated as EVALUATED [note: 審査が判定を返した所で、通った時だけ先へ進む, color: blue, icon: check]",
    "box simulated as SIMULATED [note: 倉庫で試しに詰め、結果を記録した所, color: blue, icon: exe]",
    "box authorized as AUTHORIZED [note: 在庫を押さえ、控えを出した所で、送ってよいと言えるのはここからである, color: green, icon: sign]",
    "box unsupported as UNSUPPORTED [note: 中身を安全に読み解けず、審査に渡さずに止めた所, color: rose, icon: x]",
    "",
    "created -> unsupported: 読めない依頼",
    "",
    "step 受け取る",
    `  say ${says[0]}`,
    "  start -> created: 依頼",
    "",
    "step 読み解く",
    `  say ${says[1]}`,
    "  created -> normalized: 読み解けた",
    "",
    "step 判定する",
    `  say ${says[2]}`,
    "  normalized -> evaluated: 判定",
    "",
    "step 試す",
    `  say ${says[3]}`,
    "  evaluated -> simulated: 通った",
    "",
    "step 予約する",
    `  say ${says[4]}`,
    "  simulated -> authorized: 押さえた",
    "  authorized -> finish",
  );
/** 題と `say` が日本語の状態の図 */
const STATE_JA = stateFigure("依頼が移る状態", [
  "依頼を受け取り、状態はCREATEDから始まる。",
  "中身を読めたので、NORMALIZEDへ移る。",
  "審査が通り、EVALUATEDへ移る。",
  "倉庫で試しに詰め、SIMULATEDへ移る。",
  "在庫を押さえて控えを出したので、AUTHORIZEDへ移る。",
]);
/** 同じ図の題と `say` を英語にした物。図の言語は題と `say` で決まるので、記法の file では英語の図になる */
const STATE_EN = stateFigure("Request states", [
  "The request arrives and starts at CREATED.",
  "Its contents read well, so it moves to NORMALIZED.",
  "The review passes, so it moves to EVALUATED.",
  "A trial packing runs, so it moves to SIMULATED.",
  "Stock is held and a slip is issued, so it moves to AUTHORIZED.",
]);
const escapeHtml = (text: string): string => text.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;");

/** 確かめる file。日本語と英語の記法の file と、英語の図を置いた日本語の Markdown の頁と HTML の頁 */
const FIGURE_FILES = await atLoad("図の言語の違う状態の図を置く", () => ({
  notationJa: place("state-ja.dragon", STATE_JA),
  notationEn: place("state-en.dragon", STATE_EN),
  markdown: place("page-ja.md", lines("# 依頼の状態", "", "依頼が移る状態を図で示す。", "", "```dragon", STATE_EN.trimEnd(), "```")),
  html: place("page-ja.html", lines("<!doctype html>", '<html lang="ja">', "<body>", '<pre class="dragon">', escapeHtml(STATE_EN).trimEnd(), "</pre>", "</body>", "</html>")),
}));

/** `--lang` を付けない時と `--lang ja` を付けた時の `--json` の崩れを比べる file と、文で読む命令の引数の組 */
const figureArgs = (files: Record<"notationJa" | "notationEn" | "markdown" | "html", string>): string[][] => [
  ...[files.notationJa, files.markdown, files.html].flatMap((file) => [
    ["check", file, "--layout", "--json"],
    ["check", file, "--layout", "--json", "--lang", "ja"],
  ]),
  ["check", files.notationEn, "--layout"],
  ["check", files.notationJa, "--layout", "--lang", "en"],
];

const FIGURE_LANG_CHECKED = await atLoad("図の言語の違う状態の図を、--lang を付けずと ja と en で形まで確かめる", () => runEach(figureArgs(FIGURE_FILES.get())));

/** `--json` の出力の崩れの一覧 (`layout` の欄) */
const breaksOf = (ran: Ran): unknown[] => (JSON.parse(ran.stdout) as { layout?: unknown }[]).flatMap((found) => (found.layout === undefined ? [] : [found.layout]));

/** `file` を `--lang` を付けずと `--lang ja` で確かめた `--json` の崩れ */
function breaksByLang(name: "notationJa" | "markdown" | "html"): { none: unknown[]; ja: unknown[] } {
  const file = FIGURE_FILES.get()[name];
  const runs = FIGURE_LANG_CHECKED.get();
  return {
    none: breaksOf(ranWith(runs, ["check", file, "--layout", "--json"])),
    ja: breaksOf(ranWith(runs, ["check", file, "--layout", "--json", "--lang", "ja"])),
  };
}

describe("dragon check --layout が描く図の言語 (#3943)", () => {
  it("check-layout-draws-notation-in-its-text-lang", () => {
    const { none, ja } = breaksByLang("notationJa");
    expect(ja, "--lang ja で崩れがある (見本の図が崩れの無い形でない)").toEqual([]);
    expect(none, "--lang を付けない時に、日本語の図を日本語の字で描いて測らない").toEqual(ja);
  });

  it("check-layout-draws-markdown-in-page-lang", () => {
    const { none, ja } = breaksByLang("markdown");
    expect(none, "--lang を付けない時に、本文が日本語の頁の図を頁の言語で描いて測らない").toEqual(ja);
  });

  it("check-layout-draws-html-in-page-lang", () => {
    const { none, ja } = breaksByLang("html");
    expect(none, "--lang を付けない時に、<html lang=\"ja\"> の頁の図を頁の言語で描いて測らない").toEqual(ja);
  });

  it("check-layout-keeps-english-figures-and-text", () => {
    const text = ranWith(FIGURE_LANG_CHECKED.get(), ["check", FIGURE_FILES.get().notationEn, "--layout"]);
    expect(text.code, `英語の図の確かめが通らない ${text.stderr}`).toBe(0);
    expect(outputLines(text.stdout), "英語の図を英語の始まりの札で測り、英語の文で返さない").toEqual([expect.stringMatching(/:\d+:1 warning Step 1: The line CREATED → unsupported crosses "Start"$/u)]);
  });

  it("check-layout-draws-in-given-lang", () => {
    const en = ranWith(FIGURE_LANG_CHECKED.get(), ["check", FIGURE_FILES.get().notationJa, "--layout", "--lang", "en"]);
    expect(en.code, `--lang en の確かめが通らない ${en.stderr}`).toBe(0);
    expect(outputLines(en.stdout), "--lang en を付けた時に、日本語の図も英語の字で描いて測らない").toEqual([expect.stringMatching(/:\d+:1 warning Step 1: The line CREATED → unsupported crosses "Start"$/u)]);
  });
});
