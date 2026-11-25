/**
 * `dragon export` の命令が出す使い方の文と誤りの文を、選んだ言葉で出す (#3003)。
 *
 * 命令の文の言葉は、`--lang` を渡せばその言葉、無ければ英語 (#3338)。
 * 日本語の文は `--lang ja` を渡して、今の文のままかを確かめる。
 * dragon記法の語は英語だけなので、記法の file も JSON の原本と同じく file から命令の文の言葉を決めない (#3137)。
 * `--lang` が無い時に書き出しが図の題と `say` から決めるのは図の中の字の言葉だけで、命令の文は日本語の図でも英語で出す (#3516)。
 * Node が出す文 (知らない設定、値の無い設定、無い file、読めない file、読めない JSON) も命令の言葉で書き直す。
 * 書き出す道具が無い場は、`playwright-core` の解決を断る hook と、空の Chromium の置き場で作る。
 * 命令は 1 回の実行の準備の段で子の process に起こし (`cli-language.prepare.ts`、#3734)、件はその結果を確かめる。
 */
import { describe, expect, it } from "vitest";
import prepare, { BROKEN_NOTATIONS, CANNOT_CREATE, CANNOT_WRITE, LANG_EXTRAS, MISSING_VALUES, REFUSAL_CASES, UNKNOWN_OPTIONS } from "./cli-language.prepare";
import { prepared } from "./prepared";

/** 準備の段が起こした命令の結果 */
const ran = (): Awaited<ReturnType<typeof prepare>> => prepared(import.meta.url);

const KANA_KANJI = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;

/** 今の日本語の使い方の文 (#3001 の時点の `USAGE`)。色味の並びは色味の表の順で、#3341 で `arcade` が加わった */
const JA_USAGE = [
  "使い方: dragon export <図の file (.json か .dragon)> [設定]",
  "  --out <dir>        書き出す先 (既定は今の dir)",
  "  --width <px>       枠の幅。見せ方を選び、寄って見せる窓の幅になる",
  "  --palette <名前>   色味 (clear / paper / night / arcade / sea)",
  "  --line <名前>      線の描き方 (ruler / pen)。pen は手描きのペンの線、既定は ruler",
  "  --theme <明暗>     light か dark",
  "  --lang <言葉>      図の中の字の言葉 (ja か en)。既定は記法の file の言葉で、JSON は ja",
  "  --fps <数>         mp4 の 1 秒のコマの数 (既定 30)",
  "  --gif-fps <数>     GIF の 1 秒のコマの数 (既定 10)",
  "  --format <形>      書き出す形 (mp4,gif,html,png,svg) を , で区切る (既定 mp4,gif,html,png)",
  "  --step <段>        png に撮る段 (1 から数える。既定は最後の段)",
  "  --blocks <file>    足したブロックの定義の file を読み、その定義で図を描いて書き出す",
];
const EN_USAGE_HEAD = "Usage: dragon export <diagram file (.json or .dragon)> [options]";
const OPTIONS = ["--out", "--width", "--palette", "--line", "--theme", "--lang", "--fps", "--gif-fps", "--format", "--step", "--blocks"];

const INSTALL_ADD = "pnpm add -D playwright-core";
const INSTALL_CHROMIUM = "pnpm exec playwright-core install chromium";
const JA_INSTALL = `\`${INSTALL_ADD}\` で入れ、\`${INSTALL_CHROMIUM}\` で Chromium を入れる`;
const EN_INSTALL = `Install playwright-core with \`${INSTALL_ADD}\` and Chromium with \`${INSTALL_CHROMIUM}\``;

const lines = (text: string): string[] => text.replace(/\n$/u, "").split("\n");
const isLangLine = (line: string): boolean => /^\s+--lang\s/u.test(line);
/** 使い方の文の `--lang` の行の説明 */
const langDescription = (usage: string): string => /^\s+--lang\s+<[^>]+>\s+(.*)$/mu.exec(usage)?.[1] ?? "";

describe("命令の使い方の文と誤りの文の言葉 (#3003)", () => {
  it("cli-usage-in-english", () => {
    const { en, helpEn } = ran().usage;
    for (const [args, run] of [
      [["export", "--lang", "en"], en],
      [["help", "--lang", "en"], helpEn],
    ] as const) {
      expect(run.code, `${args.join(" ")} で終了 2 にならない`).toBe(2);
      expect(lines(run.stderr)[0], `${args.join(" ")} の使い方の頭`).toBe(EN_USAGE_HEAD);
      for (const option of OPTIONS) expect(run.stderr, `${args.join(" ")} の使い方に ${option} の行が無い`).toMatch(new RegExp(`^\\s+${option}\\s`, "mu"));
      expect(run.stderr, `${args.join(" ")} の英語の使い方に仮名か漢字がある`).not.toMatch(KANA_KANJI);
    }
  });

  it("cli-usage-default-english", () => {
    // 言葉を選ばない時は、--lang en を渡した時と同じ英語の使い方を出す (#3338)
    const { none, en, ja } = ran().usage;
    expect(none.code, "図の file なしで終了 2 にならない").toBe(2);
    expect(lines(none.stderr)[0], "言葉を選ばない時の使い方の頭").toBe(EN_USAGE_HEAD);
    expect(none.stderr, "言葉を選ばない時の使い方が --lang en の使い方と違う").toBe(en.stderr);
    // 日本語の使い方は、ja を渡せば --lang の行を除いて今の文のまま
    expect(ja.code, "--lang ja で図の file なしで終了 2 にならない").toBe(2);
    expect(lines(ja.stderr).filter((line) => !isLangLine(line))).toEqual(JA_USAGE.filter((line) => !isLangLine(line)));
  });

  it("cli-usage-lang-line-names-messages", () => {
    const { en, ja } = ran().usage;
    expect(langDescription(ja.stderr), "日本語の --lang の行").toMatch(/^図の中の字と命令の文の言葉 \(ja か en\)/u);
    expect(langDescription(en.stderr), "英語の --lang の行").toMatch(/^Language of the diagram text and command messages \(ja or en\)/u);
  });

  it("cli-unknown-option-follows-language", () => {
    // 言葉なしは既定の英語で出す (#3338)
    for (const [k, [extra, head]] of UNKNOWN_OPTIONS.entries()) {
      const run = ran().unknownOptions[k];
      expect(run?.code, `${extra.join(" ")} で終了 2 にならない`).toBe(2);
      const [first, second] = lines(run?.stderr ?? "");
      expect(first, `${extra.join(" ")} の 1 行目`).toBe(head);
      expect(second, `${extra.join(" ")} の後に使い方が続かない`).toMatch(head.startsWith("Unknown") ? /^Usage: dragon export /u : /^使い方: dragon export /u);
      expect(run?.left, `${extra.join(" ")} で何かを書き出した`).toEqual([]);
    }
  });

  it("cli-missing-value-follows-language", () => {
    // 言葉なしは既定の英語で出す (#3338)
    for (const [k, [extra, head, usage]] of MISSING_VALUES.entries()) {
      const run = ran().missingValues[k];
      expect(run?.code, `${extra.join(" ")} で終了 2 にならない`).toBe(2);
      const [first, second] = lines(run?.stderr ?? "");
      expect(first, `${extra.join(" ")} の 1 行目`).toBe(head);
      expect(second, `${extra.join(" ")} の後に使い方が続かない`).toMatch(usage);
    }
  });

  it("cli-missing-file-follows-language", () => {
    const { missingFile: path, missingFiles } = ran();
    // 言葉の渡し方は ja、無し、en の順 (`LANG_EXTRAS`)。言葉なしは既定の英語で出す (#3338)
    const messages = [`図の file が無い: ${path}`, `No such diagram file: ${path}`, `No such diagram file: ${path}`];
    expect(missingFiles, "言葉の渡し方の数だけ命令を起こしていない").toHaveLength(LANG_EXTRAS.length);
    for (const [k, message] of messages.entries()) {
      const run = missingFiles[k];
      expect(run?.code, "無い file で終了 1 にならない").toBe(1);
      expect(run?.stderr.trim()).toBe(message);
    }
  });

  it("cli-unreadable-file-follows-language", () => {
    const { unreadable: path, unreadables } = ran();
    // 言葉なしは既定の英語で出す (#3338)
    const heads = [`図の file を読めない: ${path} (`, `Cannot read the diagram file: ${path} (`, `Cannot read the diagram file: ${path} (`];
    for (const [k, head] of heads.entries()) {
      const run = unreadables[k];
      expect(run?.code, "dir で終了 1 にならない").toBe(1);
      const message = run?.stderr.trim() ?? "";
      expect(message.startsWith(head), `dir の文の頭が ${head} でない: ${message}`).toBe(true);
      expect(message.endsWith(")"), `dir の文が Node の文を括弧で閉じない: ${message}`).toBe(true);
    }
  });

  it("cli-bad-json-follows-language", () => {
    const { badJson: path, badJsons } = ran();
    let detail = "";
    try {
      JSON.parse("{bad");
    } catch (error) {
      detail = error instanceof Error ? error.message : String(error);
    }
    // 言葉なしは既定の英語で出す (#3338)
    const messages = [`JSON として読めない: ${path} (${detail})`, `Cannot read as JSON: ${path} (${detail})`, `Cannot read as JSON: ${path} (${detail})`];
    for (const [k, message] of messages.entries()) {
      const run = badJsons[k];
      expect(run?.code, "読めない JSON で終了 1 にならない").toBe(1);
      expect(run?.stderr.trim()).toBe(message);
    }
  });

  it("cli-missing-playwright-in-english", () => {
    for (const [i, args] of REFUSAL_CASES.entries()) {
      const run = ran().missingPlaywright[i];
      expect(run?.code, `${args.join(" ")} で終了 1 にならない`).toBe(1);
      const message = run?.stderr.trim() ?? "";
      expect(message, `${args.join(" ")} の断りの文の頭`).toMatch(/^Exporting needs playwright-core\. /u);
      expect(message, `${args.join(" ")} の断りの文に入れ方が無い`).toContain(INSTALL_ADD);
      expect(message, `${args.join(" ")} の断りの文に Chromium の入れ方が無い`).toContain(INSTALL_CHROMIUM);
      expect(message, `${args.join(" ")} の英語の断りの文に仮名か漢字がある`).not.toMatch(KANA_KANJI);
    }
  });

  it("cli-chromium-refusal-in-english", () => {
    for (const [i, args] of REFUSAL_CASES.entries()) {
      const run = ran().missingChromium[i];
      expect(run?.code, `${args.join(" ")} で終了 1 にならない`).toBe(1);
      const message = run?.stderr.trim() ?? "";
      expect(message, `${args.join(" ")} の断りの文の頭`).toMatch(/^Cannot launch Chromium\. /u);
      expect(message, `${args.join(" ")} の断りの文に入れ方が無い`).toContain(INSTALL_ADD);
      expect(message, `${args.join(" ")} の断りの文に Chromium の入れ方が無い`).toContain(INSTALL_CHROMIUM);
      expect(message, `${args.join(" ")} の英語の断りの文に仮名か漢字がある`).not.toMatch(KANA_KANJI);
    }
  });

  it("cli-export-refusal-default-english", () => {
    // 言葉を選ばない時は英語で断る (#3338)
    const { missing, chromium, missingJa, chromiumJa } = ran().refusals;
    expect(missing.code).toBe(1);
    expect(missing.stderr.trim()).toBe(`Exporting needs playwright-core. ${EN_INSTALL}`);
    expect(chromium.code).toBe(1);
    const message = chromium.stderr.trim();
    expect(message.startsWith(`Cannot launch Chromium. ${EN_INSTALL} (`), `言葉を選ばない時の Chromium の断りの文が英語でない: ${message}`).toBe(true);
    expect(message.endsWith(")"), `Chromium の断りの文が Playwright の文を括弧で閉じない: ${message}`).toBe(true);

    // 日本語の断りの文は、ja を渡せば今の文のまま
    expect(missingJa.code).toBe(1);
    expect(missingJa.stderr.trim()).toBe(`書き出しには playwright-core が要る。${JA_INSTALL}`);
    expect(chromiumJa.code).toBe(1);
    const messageJa = chromiumJa.stderr.trim();
    expect(messageJa.startsWith(`Chromium を起動できない。${JA_INSTALL} (`), `Chromium の断りの文が今と違う: ${messageJa}`).toBe(true);
    expect(messageJa.endsWith(")"), `Chromium の断りの文が Playwright の文を括弧で閉じない: ${messageJa}`).toBe(true);
  });

  it("cli-notation-errors-follow-lang", () => {
    // 英語の見本と日本語の見本のどちらを壊しても、行の誤りは `--lang` の言葉で、無ければ英語で出る (#3338)
    const { brokenPaths, notations } = ran();
    for (const [e, [, word]] of BROKEN_NOTATIONS.entries()) {
      const path = brokenPaths[e] ?? "";
      // 言葉の渡し方は ja、無し、en の順 (`LANG_EXTRAS`)
      const heads = [`${path}:3 ${word} は行の頭に書けない。`, `${path}:3 A line cannot start with ${word}.`, `${path}:3 A line cannot start with ${word}.`];
      for (const [k, extra] of LANG_EXTRAS.entries()) {
        const run = notations[e]?.[k];
        const head = heads[k] ?? "";
        expect(run?.code, `${path} ${extra.join(" ")} で終了 1 にならない`).toBe(1);
        expect(run?.stderr.startsWith(head), `${path} ${extra.join(" ")} の行の誤りが ${head} で始まらない: ${run?.stderr}`).toBe(true);
      }
    }
  });
});

describe("書き出し先に書けない時の文の言葉 (#3009)", () => {
  /** 書けない時の文の頭と、括弧で閉じた Node の文を確かめる */
  function expectCannotWrite(message: string, head: string, code: string): void {
    expect(message.startsWith(`${head}${code}`), `書けない時の文が ${head}${code} で始まらない: ${message}`).toBe(true);
    expect(message.endsWith(")"), `書けない時の文が Node の文を括弧で閉じない: ${message}`).toBe(true);
  }

  it("cli-cannot-create-out-dir-follows-language", () => {
    const { notAdir: out, cannotCreate } = ran();
    for (const [k, [args, lang]] of CANNOT_CREATE.entries()) {
      const run = cannotCreate[k];
      expect(run?.code, `${args.join(" ")} で終了 1 にならない`).toBe(1);
      expectCannotWrite(run?.stderr.trim() ?? "", lang === "ja" ? `書き出せない: ${out} (` : `Cannot write: ${out} (`, "EEXIST");
    }
  });

  it("cli-cannot-write-file-follows-language", () => {
    // 言葉なしは既定の英語で出す (#3338)
    const { blocked, cannotWrite } = ran();
    for (const [k, [args, , head]] of CANNOT_WRITE.entries()) {
      const run = cannotWrite[k];
      expect(run?.code, `${args.join(" ")} で終了 1 にならない`).toBe(1);
      expectCannotWrite(run?.stderr.trim() ?? "", `${head}${blocked[k]} (`, "EISDIR");
    }
  });
});
