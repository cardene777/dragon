/**
 * `dragon export` の引数を確かめ、誤った引数では何も書き出さずに断る。
 *
 * 図の file を 2 つ以上渡すと断る (#3007)。`--out` を書き忘れた `dragon export x.json out` のような打ち間違いで、
 * 2 つ目以降を黙って捨てて思った所と違う所へ書き出さないため。
 * 設定に誤った値を渡すと断る (#3011)。`--format xyz` は何も書き出さないのに成功として終わり、
 * `--theme blue` などは既定の値で黙って書き出していたため。
 * 断りの文は #3003 と同じく、`--lang` を渡せばその言葉、無ければ英語で出す (#3338)。
 * 日本語の断りの文は `--lang ja` を渡して確かめる。
 */
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";
import { runCli } from "./export-support";
import { draw } from "./render-support";
import "../src/kind-use/sequence";

const EXAMPLES = join(process.cwd(), "packages/dragon/examples");
const JSON_FILE = join(EXAMPLES, "oauth.json");

const lines = (text: string): string[] => text.replace(/\n$/u, "").split("\n");

/** 書き出そうとした時の終わり方と、標準エラーの 1 行目と 2 行目と、書き出した物 */
interface Tried {
  code: number;
  first?: string;
  second?: string;
  written: string[];
}

/** 設定を足して HTML を書き出そうとし、終わり方と 1 行目と 2 行目と書き出した物を返す。`files` は図の file の後ろに並べる余分な引数 */
async function exportWith(options: readonly string[], files: readonly string[] = []): Promise<Tried> {
  const dir = mkdtempSync(join(tmpdir(), "dragon-cli-args-"));
  const ran = await runCli(["export", JSON_FILE, ...files, "--out", join(dir, "out"), "--format", "html", ...options]);
  const [first, second] = lines(ran.stderr);
  return { code: ran.code, first, second, written: readdirSync(dir) };
}

/** 設定の組ごとに 1 度ずつ順に書き出そうとし、設定の組で引ける結果を返す */
async function exportEach(optionsList: readonly (readonly string[])[], files: readonly string[] = []): Promise<Map<string, Tried>> {
  const tried = new Map<string, Tried>();
  for (const options of optionsList) tried.set(JSON.stringify(options), await exportWith(options, files));
  return tried;
}

/** 読み込む段で書き出そうとした結果のうち、設定の組 `options` の物。試していない組は検査の書き誤りなので投げる */
function triedWith(tried: ReadonlyMap<string, Tried>, options: readonly string[]): Tried {
  const found = tried.get(JSON.stringify(options));
  if (found === undefined) throw new Error(`読み込む段で試していない設定: ${options.join(" ")}`);
  return found;
}

// 子の Node で書き出しの命令を起こす件は、混んだ機械で 1 件 10 秒の上限を超えた (#3815)。
// 件ごとの命令を file を読み込む段で 1 つずつ順に済ませ、件はその結果を読む

const EXTRA_FILES = await atLoad("余分な図の file を渡して書き出す", () => exportEach([["--lang", "ja"], [], ["--lang", "en"]], ["b.json"]));

const EVERY_EXTRA_FILE = await atLoad("余分な引数を 2 つ渡して書き出す", () => exportWith(["--lang", "ja"], ["out", "more.json"]));

const BAD_FORMAT = await atLoad("誤った形式を渡して書き出す", () =>
  exportEach([
    ["--format", "xyz", "--lang", "ja"],
    ["--format", "html,xyz", "--lang", "ja"],
  ]),
);

const BAD_VALUES = await atLoad("誤った設定の値を渡して書き出す", () =>
  exportEach(
    [
      ["--theme", "blue"],
      ["--palette", "blue"],
      ["--width", "abc"],
      ["--width", "0"],
      ["--fps", "abc"],
      ["--gif-fps", "0"],
    ].map((options) => [...options, "--lang", "ja"]),
  ),
);

const UNKNOWN_LANG = await atLoad("知らない言葉を渡して書き出す", () => exportEach([["--lang", "fr"]]));

const BAD_VALUES_IN_ENGLISH = await atLoad("誤った設定の値を英語の言葉で渡して書き出す", () =>
  exportEach([
    ["--theme", "blue", "--lang", "en"],
    ["--width", "0", "--lang", "en"],
    ["--format", "xyz", "--lang", "en"],
  ]),
);

describe("図の file の数 (#3007)", () => {
  it("cli-rejects-extra-files", () => {
    const tried = EXTRA_FILES.get();
    // 言葉なしは既定の英語で断る (#3338)。日本語の文は ja を渡して確かめる
    for (const [extra, head, usage] of [
      [["--lang", "ja"], "図の file は 1 つだけ渡す。余分な引数: b.json", /^使い方: dragon export /u],
      [[], "Pass only one diagram file. Extra arguments: b.json", /^Usage: dragon export /u],
      [["--lang", "en"], "Pass only one diagram file. Extra arguments: b.json", /^Usage: dragon export /u],
    ] as const) {
      const ran = triedWith(tried, extra);
      expect(ran.code, `${extra.join(" ") || "言葉なし"} で終了 2 にならない`).toBe(2);
      expect(ran.first, `${extra.join(" ") || "言葉なし"} の 1 行目`).toBe(head);
      expect(ran.second, `${extra.join(" ") || "言葉なし"} の後に使い方が続かない`).toMatch(usage);
      expect(ran.written, `${extra.join(" ") || "言葉なし"} で何かを書き出した`).toEqual([]);
    }
  });

  it("cli-lists-every-extra-file", () => {
    const ran = EVERY_EXTRA_FILE.get();
    expect(ran.code).toBe(2);
    expect(ran.first).toBe("図の file は 1 つだけ渡す。余分な引数: out more.json");
    expect(ran.written).toEqual([]);
  });
});

describe("設定の値 (#3011)", () => {
  /** 断った時は終了 2 で、1 行目に設定と値と許す値を出し、使い方が続き、何も書き出さない。結果は読み込む段で書き出そうとした物から設定の組で引く */
  function expectRejected(tried: ReadonlyMap<string, Tried>, options: string[], first: string, usage: RegExp): void {
    const ran = triedWith(tried, options);
    expect(ran.code, `${options.join(" ")} で終了 2 にならない`).toBe(2);
    expect(ran.first, `${options.join(" ")} の 1 行目`).toBe(first);
    expect(ran.second, `${options.join(" ")} の後に使い方が続かない`).toMatch(usage);
    expect(ran.written, `${options.join(" ")} で何かを書き出した`).toEqual([]);
  }
  const JA_USAGE = /^使い方: dragon export /u;
  const EN_USAGE = /^Usage: dragon export /u;

  it("cli-rejects-bad-format", () => {
    const tried = BAD_FORMAT.get();
    expectRejected(tried, ["--format", "xyz", "--lang", "ja"], "使えない値: --format xyz (mp4 / gif / html / png / svg を , で区切る)", JA_USAGE);
    expectRejected(tried, ["--format", "html,xyz", "--lang", "ja"], "使えない値: --format html,xyz (mp4 / gif / html / png / svg を , で区切る)", JA_USAGE);
  });

  it("cli-rejects-bad-values", () => {
    const palettes = Object.keys(draw("PALETTES")).join(" / ");
    const tried = BAD_VALUES.get();
    for (const [options, first] of [
      [["--theme", "blue"], "使えない値: --theme blue (light か dark)"],
      [["--palette", "blue"], `使えない値: --palette blue (${palettes})`],
      [["--width", "abc"], "使えない値: --width abc (0 より大きい数)"],
      [["--width", "0"], "使えない値: --width 0 (0 より大きい数)"],
      [["--fps", "abc"], "使えない値: --fps abc (0 より大きい数)"],
      [["--gif-fps", "0"], "使えない値: --gif-fps 0 (0 より大きい数)"],
    ] as const) {
      expectRejected(tried, [...options, "--lang", "ja"], first, JA_USAGE);
    }
  });

  it("cli-rejects-unknown-lang-names-value", () => {
    // 知らない言葉では言葉が決まらないので、既定の英語で断る (#3338)
    expectRejected(UNKNOWN_LANG.get(), ["--lang", "fr"], "Invalid value: --lang fr (ja or en)", EN_USAGE);
  });

  it("cli-bad-value-in-english", () => {
    const tried = BAD_VALUES_IN_ENGLISH.get();
    expectRejected(tried, ["--theme", "blue", "--lang", "en"], "Invalid value: --theme blue (light or dark)", EN_USAGE);
    expectRejected(tried, ["--width", "0", "--lang", "en"], "Invalid value: --width 0 (a number above 0)", EN_USAGE);
    expectRejected(tried, ["--format", "xyz", "--lang", "en"], "Invalid value: --format xyz (mp4 / gif / html / png / svg separated by ,)", EN_USAGE);
  });
});
