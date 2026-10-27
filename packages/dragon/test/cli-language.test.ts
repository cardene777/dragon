/**
 * `dragon export` の命令が出す使い方の文と誤りの文を、選んだ言葉で出す (#3003)。
 *
 * 言葉は図の中の字と同じく決める。`--lang` を渡せばその言葉、無ければ日本語。
 * dragon記法の語は英語だけなので、記法の file も JSON の原本と同じく file から言葉を決めない (#3137)。
 * Node が出す文 (知らない設定、値の無い設定、無い file、読めない file、読めない JSON) も命令の言葉で書き直す。
 * 書き出す道具が無い場は、`playwright-core` の解決を断る hook と、空の Chromium の置き場で作る。
 */
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { type RunPlace, runCli, withoutPlaywright } from "./export-support";

/** 道具が無い時の断りを待つ時間。Chromium を探す時間を含む */
const SLOW = 60_000;

const KANA_KANJI = /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u;
const EXAMPLES = join(process.cwd(), "packages/dragon/examples");
const JSON_FILE = join(EXAMPLES, "oauth.json");
const ENGLISH_NOTATION = join(EXAMPLES, "oauth.en.dragon");

/** 今の日本語の使い方の文 (#3001 の時点の `USAGE`) */
const JA_USAGE = [
  "使い方: dragon export <図の file (.json か .dragon)> [設定]",
  "  --out <dir>        書き出す先 (既定は今の dir)",
  "  --width <px>       枠の幅。見せ方を選び、寄って見せる窓の幅になる",
  "  --palette <名前>   色味 (clear / paper / night)",
  "  --theme <明暗>     light か dark",
  "  --lang <言葉>      図の中の字の言葉 (ja か en)。既定は記法の file の言葉で、JSON は ja",
  "  --fps <数>         mp4 の 1 秒のコマの数 (既定 30)",
  "  --gif-fps <数>     GIF の 1 秒のコマの数 (既定 10)",
  "  --format <形>      書き出す形を , で区切る (既定 mp4,gif,html,png)",
];
const EN_USAGE_HEAD = "Usage: dragon export <diagram file (.json or .dragon)> [options]";
const OPTIONS = ["--out", "--width", "--palette", "--theme", "--lang", "--fps", "--gif-fps", "--format"];

const INSTALL_ADD = "pnpm add -D playwright-core";
const INSTALL_CHROMIUM = "pnpm exec playwright-core install chromium";
const JA_INSTALL = `\`${INSTALL_ADD}\` で入れ、\`${INSTALL_CHROMIUM}\` で Chromium を入れる`;

const scratch = (): string => mkdtempSync(join(tmpdir(), "dragon-cli-lang-"));
const lines = (text: string): string[] => text.replace(/\n$/u, "").split("\n");
const isLangLine = (line: string): boolean => /^\s+--lang\s/u.test(line);
/** 使い方の文の `--lang` の行の説明 */
const langDescription = (usage: string): string => /^\s+--lang\s+<[^>]+>\s+(.*)$/mu.exec(usage)?.[1] ?? "";

/** Chromium が入っていない場。置き場を空の dir に向ける */
const withoutChromium = (): RunPlace => {
  const empty = join(scratch(), "browsers");
  mkdirSync(empty);
  return { env: { PLAYWRIGHT_BROWSERS_PATH: empty } };
};

/** 記法の見本の 3 行目を読めない行に替えた file を置く */
function brokenNotation(dir: string, example: string, line: string): string {
  const text = readFileSync(join(EXAMPLES, example), "utf8").split("\n");
  text[2] = line;
  const path = join(dir, `broken-${example}`);
  writeFileSync(path, text.join("\n"));
  return path;
}

describe("命令の使い方の文と誤りの文の言葉 (#3003)", () => {
  it("cli-usage-in-english", async () => {
    for (const args of [
      ["export", "--lang", "en"],
      ["help", "--lang", "en"],
    ]) {
      const ran = await runCli(args);
      expect(ran.code, `${args.join(" ")} で終了 2 にならない`).toBe(2);
      expect(lines(ran.stderr)[0], `${args.join(" ")} の使い方の頭`).toBe(EN_USAGE_HEAD);
      for (const option of OPTIONS) expect(ran.stderr, `${args.join(" ")} の使い方に ${option} の行が無い`).toMatch(new RegExp(`^\\s+${option}\\s`, "mu"));
      expect(ran.stderr, `${args.join(" ")} の英語の使い方に仮名か漢字がある`).not.toMatch(KANA_KANJI);
    }
  });

  it("cli-usage-default-japanese-unchanged", async () => {
    const ran = await runCli(["export"]);
    expect(ran.code, "図の file なしで終了 2 にならない").toBe(2);
    expect(lines(ran.stderr).filter((line) => !isLangLine(line))).toEqual(JA_USAGE.filter((line) => !isLangLine(line)));
  });

  it("cli-usage-lang-line-names-messages", async () => {
    const ja = await runCli(["export"]);
    expect(langDescription(ja.stderr), "日本語の --lang の行").toMatch(/^図の中の字と命令の文の言葉 \(ja か en\)/u);
    const en = await runCli(["export", "--lang", "en"]);
    expect(langDescription(en.stderr), "英語の --lang の行").toMatch(/^Language of the diagram text and command messages \(ja or en\)/u);
  });

  it("cli-unknown-option-follows-language", async () => {
    for (const [extra, head] of [
      [["--colour", "red"], "知らない設定: --colour"],
      [["-x"], "知らない設定: -x"],
      [["--colour", "red", "--lang", "en"], "Unknown option: --colour"],
      [["-x", "--lang", "en"], "Unknown option: -x"],
    ] as const) {
      const dir = scratch();
      const ran = await runCli(["export", JSON_FILE, "--out", join(dir, "out"), "--format", "html", ...extra]);
      expect(ran.code, `${extra.join(" ")} で終了 2 にならない`).toBe(2);
      const [first, second] = lines(ran.stderr);
      expect(first, `${extra.join(" ")} の 1 行目`).toBe(head);
      expect(second, `${extra.join(" ")} の後に使い方が続かない`).toMatch(head.startsWith("Unknown") ? /^Usage: dragon export /u : /^使い方: dragon export /u);
      expect(readdirSync(dir), `${extra.join(" ")} で何かを書き出した`).toEqual([]);
    }
  });

  it("cli-missing-value-follows-language", async () => {
    for (const [extra, head, usage] of [
      [["--out"], "設定に値が無い: --out", /^使い方: dragon export /u],
      [["--out", "--lang", "en"], "Option needs a value: --out", /^Usage: dragon export /u],
    ] as const) {
      const ran = await runCli(["export", JSON_FILE, "--format", "html", ...extra]);
      expect(ran.code, `${extra.join(" ")} で終了 2 にならない`).toBe(2);
      const [first, second] = lines(ran.stderr);
      expect(first, `${extra.join(" ")} の 1 行目`).toBe(head);
      expect(second, `${extra.join(" ")} の後に使い方が続かない`).toMatch(usage);
    }
  });

  it("cli-missing-file-follows-language", async () => {
    const path = join(scratch(), "none.json");
    for (const [extra, message] of [
      [[], `図の file が無い: ${path}`],
      [["--lang", "en"], `No such diagram file: ${path}`],
    ] as const) {
      const ran = await runCli(["export", path, "--format", "html", ...extra]);
      expect(ran.code, "無い file で終了 1 にならない").toBe(1);
      expect(ran.stderr.trim()).toBe(message);
    }
  });

  it("cli-unreadable-file-follows-language", async () => {
    const path = join(scratch(), "diagrams");
    mkdirSync(path);
    for (const [extra, head] of [
      [[], `図の file を読めない: ${path} (`],
      [["--lang", "en"], `Cannot read the diagram file: ${path} (`],
    ] as const) {
      const ran = await runCli(["export", path, "--format", "html", ...extra]);
      expect(ran.code, "dir で終了 1 にならない").toBe(1);
      const message = ran.stderr.trim();
      expect(message.startsWith(head), `dir の文の頭が ${head} でない: ${message}`).toBe(true);
      expect(message.endsWith(")"), `dir の文が Node の文を括弧で閉じない: ${message}`).toBe(true);
    }
  });

  it("cli-bad-json-follows-language", async () => {
    const text = "{bad";
    const path = join(scratch(), "bad.json");
    writeFileSync(path, text);
    let detail = "";
    try {
      JSON.parse(text);
    } catch (error) {
      detail = error instanceof Error ? error.message : String(error);
    }
    for (const [extra, message] of [
      [[], `JSON として読めない: ${path} (${detail})`],
      [["--lang", "en"], `Cannot read as JSON: ${path} (${detail})`],
    ] as const) {
      const ran = await runCli(["export", path, "--format", "html", ...extra]);
      expect(ran.code, "読めない JSON で終了 1 にならない").toBe(1);
      expect(ran.stderr.trim()).toBe(message);
    }
  });

  it(
    "cli-missing-playwright-in-english",
    async () => {
      for (const args of [
        [JSON_FILE, "--lang", "en"],
        [ENGLISH_NOTATION, "--lang", "en"],
      ]) {
        const ran = await runCli(["export", ...args, "--out", scratch(), "--format", "png"], withoutPlaywright());
        expect(ran.code, `${args.join(" ")} で終了 1 にならない`).toBe(1);
        const message = ran.stderr.trim();
        expect(message, `${args.join(" ")} の断りの文の頭`).toMatch(/^Exporting needs playwright-core\. /u);
        expect(message, `${args.join(" ")} の断りの文に入れ方が無い`).toContain(INSTALL_ADD);
        expect(message, `${args.join(" ")} の断りの文に Chromium の入れ方が無い`).toContain(INSTALL_CHROMIUM);
        expect(message, `${args.join(" ")} の英語の断りの文に仮名か漢字がある`).not.toMatch(KANA_KANJI);
      }
    },
    SLOW,
  );

  it(
    "cli-chromium-refusal-in-english",
    async () => {
      for (const args of [
        [JSON_FILE, "--lang", "en"],
        [ENGLISH_NOTATION, "--lang", "en"],
      ]) {
        const ran = await runCli(["export", ...args, "--out", scratch(), "--format", "png"], withoutChromium());
        expect(ran.code, `${args.join(" ")} で終了 1 にならない`).toBe(1);
        const message = ran.stderr.trim();
        expect(message, `${args.join(" ")} の断りの文の頭`).toMatch(/^Cannot launch Chromium\. /u);
        expect(message, `${args.join(" ")} の断りの文に入れ方が無い`).toContain(INSTALL_ADD);
        expect(message, `${args.join(" ")} の断りの文に Chromium の入れ方が無い`).toContain(INSTALL_CHROMIUM);
        expect(message, `${args.join(" ")} の英語の断りの文に仮名か漢字がある`).not.toMatch(KANA_KANJI);
      }
    },
    SLOW,
  );

  it(
    "cli-export-refusal-default-japanese-unchanged",
    async () => {
      const missing = await runCli(["export", JSON_FILE, "--out", scratch(), "--format", "png"], withoutPlaywright());
      expect(missing.code).toBe(1);
      expect(missing.stderr.trim()).toBe(`書き出しには playwright-core が要る。${JA_INSTALL}`);
      const chromium = await runCli(["export", JSON_FILE, "--out", scratch(), "--format", "png"], withoutChromium());
      expect(chromium.code).toBe(1);
      const message = chromium.stderr.trim();
      expect(message.startsWith(`Chromium を起動できない。${JA_INSTALL} (`), `Chromium の断りの文が今と違う: ${message}`).toBe(true);
      expect(message.endsWith(")"), `Chromium の断りの文が Playwright の文を括弧で閉じない: ${message}`).toBe(true);
    },
    SLOW,
  );

  it("cli-notation-errors-follow-lang", async () => {
    // 英語の見本と日本語の見本のどちらを壊しても、行の誤りは `--lang` の言葉で、無ければ日本語で出る
    const dir = scratch();
    for (const [example, word] of [
      ["oauth.en.dragon", "colour"],
      ["oauth.dragon", "色"],
    ] as const) {
      const path = brokenNotation(dir, example, `${word} blue`);
      for (const [extra, head] of [
        [[], `${path}:3 ${word} は行の頭に書けない。`],
        [["--lang", "ja"], `${path}:3 ${word} は行の頭に書けない。`],
        [["--lang", "en"], `${path}:3 A line cannot start with ${word}.`],
      ] as const) {
        const ran = await runCli(["export", path, "--out", join(dir, "out"), "--format", "html", ...extra]);
        expect(ran.code, `${path} ${extra.join(" ")} で終了 1 にならない`).toBe(1);
        expect(ran.stderr.startsWith(head), `${path} ${extra.join(" ")} の行の誤りが ${head} で始まらない: ${ran.stderr}`).toBe(true);
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

  it("cli-cannot-create-out-dir-follows-language", async () => {
    const out = join(scratch(), "not-a-dir");
    writeFileSync(out, "");
    for (const [args, head] of [
      [[JSON_FILE], `書き出せない: ${out} (`],
      [[JSON_FILE, "--lang", "en"], `Cannot write: ${out} (`],
      // 英語の記法の file でも、`--lang` が無ければ日本語 (#3137)
      [[ENGLISH_NOTATION], `書き出せない: ${out} (`],
      [[ENGLISH_NOTATION, "--lang", "en"], `Cannot write: ${out} (`],
    ] as const) {
      const ran = await runCli(["export", ...args, "--out", out, "--format", "html"]);
      expect(ran.code, `${args.join(" ")} で終了 1 にならない`).toBe(1);
      expectCannotWrite(ran.stderr.trim(), head, "EEXIST");
    }
  });

  it("cli-cannot-write-file-follows-language", async () => {
    const out = scratch();
    for (const [args, name, head] of [
      [[JSON_FILE], "oauth", "書き出せない: "],
      [[JSON_FILE, "--lang", "en"], "oauth", "Cannot write: "],
      [[ENGLISH_NOTATION, "--lang", "en"], "oauth.en", "Cannot write: "],
    ] as const) {
      // 書き出す file と同じ名前の dir を置いて、file を書けなくする
      const blocked = join(out, `${name}.html`);
      mkdirSync(blocked, { recursive: true });
      const ran = await runCli(["export", ...args, "--out", out, "--format", "html"]);
      expect(ran.code, `${args.join(" ")} で終了 1 にならない`).toBe(1);
      expectCannotWrite(ran.stderr.trim(), `${head}${blocked} (`, "EISDIR");
    }
  });
});
