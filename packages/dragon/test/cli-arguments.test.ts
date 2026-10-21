/**
 * `dragon export` に図の file を 2 つ以上渡すと、何も書き出さずに断る (#3007)。
 *
 * `--out` を書き忘れた `dragon export x.json out` のような打ち間違いで、2 つ目以降を黙って捨てて
 * 思った所と違う所へ書き出さないため。断りの文は #3003 と同じく、`--lang` を渡せばその言葉、無ければ日本語で出す。
 */
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { runCli } from "./export-support";

const EXAMPLES = join(process.cwd(), "packages/dragon/examples");
const JSON_FILE = join(EXAMPLES, "oauth.json");

const lines = (text: string): string[] => text.replace(/\n$/u, "").split("\n");

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
