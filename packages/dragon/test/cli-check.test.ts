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
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type LineError, type Parsed } from "./diagram-support";
import { runCli } from "./export-support";

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

describe("dragon --version (#3455)", () => {
  it("cli-prints-version", async () => {
    const version = (JSON.parse(readFileSync(PACKAGE, "utf8")) as { version: string }).version;
    const ran = await runCli(["--version"]);
    expect(ran.code, ran.stderr).toBe(0);
    expect(ran.stdout.trim(), "版の数を出さない").toBe(version);
  });
});

describe("dragon check (#3455)", () => {
  it("check-reports-error-at-line-and-column", async () => {
    const expected = { en: firstError(parse(BROKEN, "en")), ja: firstError(parse(BROKEN, "ja")) };
    expect(expected.en, "読む処理が誤りを返さない").toBeDefined();
    const file = place("broken.dragon", BROKEN);
    // 言葉なしは英語で出す
    const en = await runCli(["check", file]);
    expect(en.code, `誤りのある図で終わり方 1 にならない ${en.stderr}`).toBe(1);
    expect(outputLines(en.stdout), "誤りの行の形").toEqual([`${file}:${expected.en?.line}:${expected.en?.column} error ${expected.en?.message}`]);
    expect(en.stdout, "言葉なしの誤りの文に仮名か漢字がある").not.toMatch(KANA_KANJI);
    // --lang ja で文を日本語にする
    const ja = await runCli(["check", file, "--lang", "ja"]);
    expect(ja.code, `--lang ja で終わり方 1 にならない ${ja.stderr}`).toBe(1);
    expect(outputLines(ja.stdout), "日本語の誤りの行の形").toEqual([`${file}:${expected.ja?.line}:${expected.ja?.column} error ${expected.ja?.message}`]);
    // 読める図は何も出さずに終わり方 0
    const good = await runCli(["check", place("good.dragon", GOOD)]);
    expect(good.code, good.stderr).toBe(0);
    expect(good.stdout.trim(), "読める図で何かを出した").toBe("");
  });

  it("check-reads-markdown-fences-at-file-lines", async () => {
    const broken = firstError(parse(BROKEN));
    expect(broken, "読む処理が誤りを返さない").toBeDefined();
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
    // 2 つ目の dragon の囲みの中身は 14 行目から始まる
    const opening = markdown.split("\n").lastIndexOf("```dragon") + 1;
    const ran = await runCli(["check", file]);
    expect(ran.code, `誤りのある囲みで終わり方 1 にならない ${ran.stderr}`).toBe(1);
    expect(outputLines(ran.stdout), "誤りを元の file の行で示さない").toEqual([
      `${file}:${opening + (broken?.line ?? 0)}:${broken?.column} error ${broken?.message}`,
    ]);
    // dragon でない囲みは確かめない。読める囲みだけの file は終わり方 0
    const clean = await runCli(["check", place("clean.md", lines("```dragon", GOOD.trimEnd(), "```", "", "```js", "Browser => App", "```"))]);
    expect(clean.code, `dragon でない囲みを確かめた ${clean.stdout}`).toBe(0);
  });

  it("check-warns-similar-names-and-passes", async () => {
    const notice = firstNotice(parse(SIMILAR));
    expect(notice, "読む処理が似た名前を知らせない").toBeDefined();
    const file = place("similar.dragon", SIMILAR);
    const ran = await runCli(["check", file]);
    expect(ran.code, `知らせだけの図で終わり方 0 にならない ${ran.stdout}`).toBe(0);
    expect(outputLines(ran.stdout), "知らせの行の形").toEqual([`${file}:${notice?.line}:${notice?.column} warning ${notice?.message}`]);
  });

  it("check-prints-json", async () => {
    const broken = firstError(parse(BROKEN));
    const notice = firstNotice(parse(SIMILAR));
    const brokenFile = place("broken.dragon", BROKEN);
    const similarFile = place("similar.dragon", SIMILAR);
    const ran = await runCli(["check", brokenFile, similarFile, "--json"]);
    expect(ran.code, ran.stderr).toBe(1);
    expect(JSON.parse(ran.stdout), "JSON の形").toEqual([
      { file: brokenFile, line: broken?.line, column: broken?.column, severity: "error", message: broken?.message },
      { file: similarFile, line: notice?.line, column: notice?.column, severity: "warning", message: notice?.message },
    ]);
    // 誤りも知らせも無い時は空の配列
    const good = await runCli(["check", place("good.dragon", GOOD), "--json"]);
    expect(good.code, good.stderr).toBe(0);
    expect(JSON.parse(good.stdout)).toEqual([]);
  });

  it("check-reads-stdin", () => {
    const broken = firstError(parse(BROKEN));
    const ran = spawnSync(process.execPath, [CLI, "check", "-"], { input: BROKEN, encoding: "utf8" });
    expect(ran.status, ran.stderr).toBe(1);
    expect(outputLines(ran.stdout), "標準入力の誤りの行").toEqual([`-:${broken?.line}:${broken?.column} error ${broken?.message}`]);
    const good = spawnSync(process.execPath, [CLI, "check", "-"], { input: GOOD, encoding: "utf8" });
    expect(good.status, good.stderr).toBe(0);
  });

  it("check-usage-errors-exit-2", async () => {
    // file を渡さない時は check の使い方を、無い file と読めない拡張子の file はその path を名指して断る
    const missing = join(scratch(), "none.dragon");
    const text = place("notes.txt", GOOD);
    for (const [args, reason] of [
      [["check"], /^Usage: dragon check /mu],
      [["check", missing], missing],
      [["check", text], text],
    ] as const) {
      const ran = await runCli([...args]);
      expect(ran.code, `${args.join(" ")} で終わり方 2 にならない ${ran.stdout}`).toBe(2);
      expect(ran.stdout.trim(), `${args.join(" ")} で確かめた結果を出した`).toBe("");
      if (typeof reason === "string") expect(ran.stderr, `${args.join(" ")} で断った file を名指さない`).toContain(reason);
      else expect(ran.stderr, `${args.join(" ")} で check の使い方を出さない`).toMatch(reason);
    }
  });
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

  it("check-names-edge-shape-for-missing-arrow-target", async () => {
    const last = "B -> : answer";
    const file = place("missing-target.dragon", lines("sequence", "A -> B: ask", last));
    const ran = await runCli(["check", file]);
    expect(ran.code, `先の無い線の行で終わり方 1 にならない ${ran.stderr}`).toBe(1);
    expect(ran.stdout, "行の頭の語を断る文を返した").not.toContain(HEAD_REFUSAL);
    // 矢印の後ろで名札が入る位置は `:` の桁
    expect(outputLines(ran.stdout), "線の行の正しい形の文を矢印の後ろで返さない").toEqual([`${file}:3:${columnOf(last, ":")} error ${EDGE_SHAPE.en}`]);
  });

  it("check-missing-arrow-target-in-both-languages", async () => {
    const last = "  a -> : send";
    const file = place("missing-target-architecture.dragon", lines("architecture Hand over", "", "box a as A", "box b as B", "", "step Send", last));
    for (const lang of ["en", "ja"] as const) {
      const ran = await runCli(["check", file, "--lang", lang]);
      expect(ran.code, `${lang} で終わり方 1 にならない ${ran.stderr}`).toBe(1);
      expect(outputLines(ran.stdout), `${lang} で線の行の正しい形の文を返さない`).toEqual([`${file}:7:${columnOf(last, ":")} error ${EDGE_SHAPE[lang]}`]);
    }
  });

  it("check-missing-target-at-line-end-and-shared-edge", async () => {
    // 行の終わりで切れた矢印と、共有の線のブロック (+relay) の先を書き忘れた行
    const cut = "B ->";
    const shared = "  a +relay : send";
    const { text, offsets } = fenced(lines("sequence", "A -> B: ask", cut), lines("architecture Bridge", "box a as A", "+bridge b as B", "step Send", shared));
    const file = place("missing-target.md", text);
    const ran = await runCli(["check", file]);
    expect(ran.code, `先の無い線の行で終わり方 1 にならない ${ran.stderr}`).toBe(1);
    expect(ran.stdout, "行の頭の語を断る文を返した").not.toContain(HEAD_REFUSAL);
    expect(outputLines(ran.stdout), "先の無い 2 つの行に線の行の正しい形の文を返さない").toEqual([
      // 切れた矢印は行の終わりの次の桁、共有の線のブロックは名前の後ろの `:` の桁
      `${file}:${(offsets[0] ?? 0) + 3}:${cut.length + 1} error ${EDGE_SHAPE.en}`,
      `${file}:${(offsets[1] ?? 0) + 5}:${columnOf(shared, ":")} error ${EDGE_SHAPE.en}`,
    ]);
  });

  it("check-keeps-unknown-head-and-complete-edge-messages", async () => {
    // 矢印を持たない行の頭の語の誤りと、先を書いた線の行の誤りの文は変えない
    const unknown = "foo bar";
    const complete = "B -> A answer";
    const { text, offsets } = fenced(lines("sequence", "A -> B: ask", unknown), lines("sequence", "A -> B: ask", complete));
    const file = place("kept.md", text);
    const ran = await runCli(["check", file]);
    expect(ran.code, ran.stderr).toBe(1);
    const [head, edge] = outputLines(ran.stdout);
    expect(head?.startsWith(`${file}:${(offsets[0] ?? 0) + 3}:1 error A line ${HEAD_REFUSAL} foo. `), `矢印を持たない行で行の頭の語を断る文を返さない ${head}`).toBe(true);
    expect(edge, "先を書いた線の行の誤りの文と桁が変わった").toBe(`${file}:${(offsets[1] ?? 0) + 3}:8 error ${EDGE_SHAPE.en}`);
  });
});
