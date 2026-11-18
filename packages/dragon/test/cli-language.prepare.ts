/**
 * `cli-language.test.ts` の命令を、1 回の実行の準備の段で子の process に起こして済ませる (#3734)。
 *
 * 命令の子の process は起こすだけで混んだ機械で 1 秒を超え、1 件で 2 回から 6 回起こす件が 1 件の上限 (10 秒) を超えた。
 * 起こし方 (子の Node の process、環境変数、node の引数) は件の中で起こしていた時と同じで、件は終わり方と出力と、書き出し先に残った物を確かめる。
 * 件ごとの引数と求める文は、件と準備で同じ物を使うためここに置く。
 */
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { EXAMPLES, type Ran, type RunPlace, runCli, scratch, withoutPlaywright } from "../../../test-support/prepare-tools";

export const JSON_FILE = join(EXAMPLES, "oauth.json");
export const ENGLISH_NOTATION = join(EXAMPLES, "oauth.en.dragon");
export const JAPANESE_NOTATION = join(EXAMPLES, "oauth.dragon");

/** 知らない設定と、1 行目に出す文。言葉なしは既定の英語で出す (#3338) */
export const UNKNOWN_OPTIONS = [
  [["--colour", "red", "--lang", "ja"], "知らない設定: --colour"],
  [["-x", "--lang", "ja"], "知らない設定: -x"],
  [["--colour", "red"], "Unknown option: --colour"],
  [["-x"], "Unknown option: -x"],
  [["--colour", "red", "--lang", "en"], "Unknown option: --colour"],
  [["-x", "--lang", "en"], "Unknown option: -x"],
] as const;

/** 値の無い設定と、1 行目に出す文と、続く使い方の頭。言葉なしは既定の英語で出す (#3338) */
export const MISSING_VALUES = [
  [["--out", "--lang", "ja"], "設定に値が無い: --out", /^使い方: dragon export /u],
  [["--out"], "Option needs a value: --out", /^Usage: dragon export /u],
  [["--out", "--lang", "en"], "Option needs a value: --out", /^Usage: dragon export /u],
] as const;

/** 言葉の渡し方。言葉なしは既定の英語で出す (#3338) */
export const LANG_EXTRAS = [["--lang", "ja"], [], ["--lang", "en"]] as const;

/** 撮る道具が無い場で、英語で断る命令の引数 */
export const REFUSAL_CASES = [
  [JSON_FILE, "--lang", "en"],
  [ENGLISH_NOTATION, "--lang", "en"],
] as const;

/** 壊した記法の見本と、3 行目に置いた語 */
export const BROKEN_NOTATIONS = [
  ["oauth.en.dragon", "colour"],
  ["oauth.dragon", "色"],
] as const;

/** 書き出し先の dir を作れない時の引数と、文の頭の言葉 */
export const CANNOT_CREATE = [
  [[JSON_FILE, "--lang", "ja"], "ja"],
  // 言葉なしは既定の英語で出す (#3338)
  [[JSON_FILE], "en"],
  [[JSON_FILE, "--lang", "en"], "en"],
  // 日本語の字の記法の file でも、`--lang` が無ければ既定の英語 (#3137、#3338)
  [[JAPANESE_NOTATION], "en"],
  [[ENGLISH_NOTATION, "--lang", "en"], "en"],
] as const;

/** 書き出す file を書けない時の引数と、書き出す file の名前と、文の頭 */
export const CANNOT_WRITE = [
  [[JSON_FILE, "--lang", "ja"], "oauth", "書き出せない: "],
  [[JSON_FILE], "oauth", "Cannot write: "],
  [[JSON_FILE, "--lang", "en"], "oauth", "Cannot write: "],
  [[ENGLISH_NOTATION, "--lang", "en"], "oauth.en", "Cannot write: "],
] as const;

/** Chromium が入っていない場。置き場を空の dir に向ける */
function withoutChromium(): RunPlace {
  const empty = join(scratch("dragon-cli-lang-"), "browsers");
  mkdirSync(empty);
  return { env: { PLAYWRIGHT_BROWSERS_PATH: empty } };
}

/** 記法の見本の 3 行目を読めない行に替えた file を置く */
function brokenNotation(dir: string, example: string, line: string): string {
  const text = readFileSync(join(EXAMPLES, example), "utf8").split("\n");
  text[2] = line;
  const path = join(dir, `broken-${example}`);
  writeFileSync(path, text.join("\n"));
  return path;
}

/** 命令を起こし、終わった後に `dir` の中に在る物も残す */
async function runIn(dir: string, args: string[]): Promise<Ran & { left: string[] }> {
  const ran = await runCli(args);
  return { ...ran, left: readdirSync(dir) };
}

export default async function prepare() {
  const missingDir = scratch("dragon-cli-lang-");
  const missingFile = join(missingDir, "none.json");
  const unreadable = join(scratch("dragon-cli-lang-"), "diagrams");
  mkdirSync(unreadable);
  const badJson = join(scratch("dragon-cli-lang-"), "bad.json");
  writeFileSync(badJson, "{bad");
  const notationDir = scratch("dragon-cli-lang-");
  const brokenPaths = BROKEN_NOTATIONS.map(([example, word]) => brokenNotation(notationDir, example, `${word} blue`));
  const notAdir = join(scratch("dragon-cli-lang-"), "not-a-dir");
  writeFileSync(notAdir, "");
  const writeDir = scratch("dragon-cli-lang-");
  const blocked = CANNOT_WRITE.map(([, name]) => {
    // 書き出す file と同じ名前の dir を置いて、file を書けなくする
    const path = join(writeDir, `${name}.html`);
    mkdirSync(path, { recursive: true });
    return path;
  });

  const [usage, unknownOptions, missingValues, missingFiles, unreadables, badJsons, missingPlaywright, missingChromium, refusals, notations, cannotCreate, cannotWrite] = await Promise.all([
    Promise.all([
      runCli(["export"]),
      runCli(["export", "--lang", "en"]),
      runCli(["export", "--lang", "ja"]),
      runCli(["help", "--lang", "en"]),
    ]).then(([none, en, ja, helpEn]) => ({ none, en, ja, helpEn })),
    Promise.all(
      UNKNOWN_OPTIONS.map(([extra]) => {
        const dir = scratch("dragon-cli-lang-");
        return runIn(dir, ["export", JSON_FILE, "--out", join(dir, "out"), "--format", "html", ...extra]);
      }),
    ),
    Promise.all(MISSING_VALUES.map(([extra]) => runCli(["export", JSON_FILE, "--format", "html", ...extra]))),
    Promise.all(LANG_EXTRAS.map((extra) => runCli(["export", missingFile, "--format", "html", ...extra]))),
    Promise.all(LANG_EXTRAS.map((extra) => runCli(["export", unreadable, "--format", "html", ...extra]))),
    Promise.all(LANG_EXTRAS.map((extra) => runCli(["export", badJson, "--format", "html", ...extra]))),
    Promise.all(REFUSAL_CASES.map((args) => runCli(["export", ...args, "--out", scratch("dragon-cli-lang-"), "--format", "png"], withoutPlaywright()))),
    Promise.all(REFUSAL_CASES.map((args) => runCli(["export", ...args, "--out", scratch("dragon-cli-lang-"), "--format", "png"], withoutChromium()))),
    // 言葉を選ばない時は英語で断る (#3338)。日本語の断りの文は、ja を渡せば今の文のまま
    Promise.all([
      runCli(["export", JSON_FILE, "--out", scratch("dragon-cli-lang-"), "--format", "png"], withoutPlaywright()),
      runCli(["export", JSON_FILE, "--out", scratch("dragon-cli-lang-"), "--format", "png"], withoutChromium()),
      runCli(["export", JSON_FILE, "--out", scratch("dragon-cli-lang-"), "--format", "png", "--lang", "ja"], withoutPlaywright()),
      runCli(["export", JSON_FILE, "--out", scratch("dragon-cli-lang-"), "--format", "png", "--lang", "ja"], withoutChromium()),
    ]).then(([missing, chromium, missingJa, chromiumJa]) => ({ missing, chromium, missingJa, chromiumJa })),
    Promise.all(brokenPaths.map((path) => Promise.all(LANG_EXTRAS.map((extra) => runCli(["export", path, "--out", join(notationDir, "out"), "--format", "html", ...extra]))))),
    Promise.all(CANNOT_CREATE.map(([args]) => runCli(["export", ...args, "--out", notAdir, "--format", "html"]))),
    Promise.all(CANNOT_WRITE.map(([args]) => runCli(["export", ...args, "--out", writeDir, "--format", "html"]))),
  ]);
  return {
    usage,
    unknownOptions,
    missingValues,
    missingFile,
    missingFiles,
    unreadable,
    unreadables,
    badJson,
    badJsons,
    missingPlaywright,
    missingChromium,
    refusals,
    brokenPaths,
    notations,
    notAdir,
    cannotCreate,
    blocked,
    cannotWrite,
  };
}
