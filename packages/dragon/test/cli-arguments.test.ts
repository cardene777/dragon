/**
 * `dragon export` の引数を確かめ、誤った引数では何も書き出さずに断る。
 *
 * 図の file を 2 つ以上渡すと断る (#3007)。`--out` を書き忘れた `dragon export x.json out` のような打ち間違いで、
 * 2 つ目以降を黙って捨てて思った所と違う所へ書き出さないため。
 * 設定に誤った値を渡すと断る (#3011)。`--format xyz` は何も書き出さないのに成功として終わり、
 * `--theme blue` などは既定の値で黙って書き出していたため。
 * 断りの文は #3003 と同じく、`--lang` を渡せばその言葉、無ければ日本語で出す。
 */
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./export-support";
import { draw } from "./render-support";

const EXAMPLES = join(process.cwd(), "packages/dragon/examples");
const JSON_FILE = join(EXAMPLES, "oauth.json");

const lines = (text: string): string[] => text.replace(/\n$/u, "").split("\n");

/** 設定を足して HTML を書き出そうとし、終わり方と 1 行目と 2 行目と書き出した物を返す */
async function exportWith(options: string[]): Promise<{ code: number; first?: string; second?: string; written: string[] }> {
  const dir = mkdtempSync(join(tmpdir(), "dragon-cli-args-"));
  const ran = await runCli(["export", JSON_FILE, "--out", join(dir, "out"), "--format", "html", ...options]);
  const [first, second] = lines(ran.stderr);
  return { code: ran.code, first, second, written: readdirSync(dir) };
}

describe("図の file の数 (#3007)", () => {
  it("cli-rejects-extra-files", async () => {
    for (const [extra, head, usage] of [
      [[], "図の file は 1 つだけ渡す。余分な引数: b.json", /^使い方: dragon export /u],
      [["--lang", "en"], "Pass only one diagram file. Extra arguments: b.json", /^Usage: dragon export /u],
    ] as const) {
      const dir = mkdtempSync(join(tmpdir(), "dragon-cli-args-"));
      const ran = await runCli(["export", JSON_FILE, "b.json", "--out", join(dir, "out"), "--format", "html", ...extra]);
      expect(ran.code, `${extra.join(" ") || "言葉なし"} で終了 2 にならない`).toBe(2);
      const [first, second] = lines(ran.stderr);
      expect(first, `${extra.join(" ") || "言葉なし"} の 1 行目`).toBe(head);
      expect(second, `${extra.join(" ") || "言葉なし"} の後に使い方が続かない`).toMatch(usage);
      expect(readdirSync(dir), `${extra.join(" ") || "言葉なし"} で何かを書き出した`).toEqual([]);
    }
  });

  it("cli-lists-every-extra-file", async () => {
    const dir = mkdtempSync(join(tmpdir(), "dragon-cli-args-"));
    const ran = await runCli(["export", JSON_FILE, "out", "more.json", "--out", join(dir, "out"), "--format", "html"]);
    expect(ran.code).toBe(2);
    expect(lines(ran.stderr)[0]).toBe("図の file は 1 つだけ渡す。余分な引数: out more.json");
    expect(readdirSync(dir)).toEqual([]);
  });
});

describe("設定の値 (#3011)", () => {
  /** 断った時は終了 2 で、1 行目に設定と値と許す値を出し、使い方が続き、何も書き出さない */
  async function expectRejected(options: string[], first: string, usage: RegExp): Promise<void> {
    const ran = await exportWith(options);
    expect(ran.code, `${options.join(" ")} で終了 2 にならない`).toBe(2);
    expect(ran.first, `${options.join(" ")} の 1 行目`).toBe(first);
    expect(ran.second, `${options.join(" ")} の後に使い方が続かない`).toMatch(usage);
    expect(ran.written, `${options.join(" ")} で何かを書き出した`).toEqual([]);
  }
  const JA_USAGE = /^使い方: dragon export /u;
  const EN_USAGE = /^Usage: dragon export /u;

  it("cli-rejects-bad-format", async () => {
    await expectRejected(["--format", "xyz"], "使えない値: --format xyz (mp4 / gif / html / png を , で区切る)", JA_USAGE);
    await expectRejected(["--format", "html,xyz"], "使えない値: --format html,xyz (mp4 / gif / html / png を , で区切る)", JA_USAGE);
  });

  it("cli-rejects-bad-values", async () => {
    const palettes = Object.keys(draw("PALETTES")).join(" / ");
    for (const [options, first] of [
      [["--theme", "blue"], "使えない値: --theme blue (light か dark)"],
      [["--palette", "blue"], `使えない値: --palette blue (${palettes})`],
      [["--width", "abc"], "使えない値: --width abc (0 より大きい数)"],
      [["--width", "0"], "使えない値: --width 0 (0 より大きい数)"],
      [["--fps", "abc"], "使えない値: --fps abc (0 より大きい数)"],
      [["--gif-fps", "0"], "使えない値: --gif-fps 0 (0 より大きい数)"],
    ] as const) {
      await expectRejected([...options], first, JA_USAGE);
    }
  });

  it("cli-rejects-unknown-lang-names-value", async () => {
    await expectRejected(["--lang", "fr"], "使えない値: --lang fr (ja か en)", JA_USAGE);
  });

  it("cli-bad-value-in-english", async () => {
    await expectRejected(["--theme", "blue", "--lang", "en"], "Invalid value: --theme blue (light or dark)", EN_USAGE);
    await expectRejected(["--width", "0", "--lang", "en"], "Invalid value: --width 0 (a number above 0)", EN_USAGE);
    await expectRejected(["--format", "xyz", "--lang", "en"], "Invalid value: --format xyz (mp4 / gif / html / png separated by ,)", EN_USAGE);
  });
});
