/**
 * `short-notation.test.ts` から移した命令と書き出しの確かめ (#3763)。
 * build した `dist` を読み、選ぶ命令が `dist` を書く検査を全ての入口へ結ぶので、種類の検査のfileから外し、`kind-cli.test.ts` が読む
 */
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { api, type LineError, type NotationLang, type Parsed } from "./diagram-support";
import { runCli } from "./export-support";
import "../src/kind-use/architecture";
import "../src/kind-use/git";
import "../src/kind-use/pipe";
import "../src/kind-use/sequence";
import "../src/kind-use/state";
import "../src/kind-use/tree";

const parse = (text: string, lang: NotationLang = "ja"): Parsed => api("parseNotation")(text, { lang });

/** 行を改行で繋ぎ、file の終わりの改行を足す */
const lines = (...rows: string[]): string => `${rows.join("\n")}\n`;

const noticesOf = (parsed: Parsed): LineError[] => (parsed.ok ? (parsed.notices ?? []) : []);

/** 1 字違いの「アプリ」と「アプル」を持つ図。「アプル」は 4 行目の頭に初めて出る */
const SIMILAR = lines("sequence", "", "ブラウザ -> アプリ: GET /login", "アプル -> ブラウザ: 戻す");

describe("宣言と段を省いた短い記法 (#3438)", () => {

  it("short-cli-prints-similar-names", async () => {
    // 書き出しの命令は、似た名前の知らせを `<file>:<行> <文>` の形で標準エラーに出し、書き出したうえで終わり方 0 で終わる
    const notice = noticesOf(parse(SIMILAR, "ja"))[0];
    expect(notice, "読む処理が似た名前を知らせない").toBeDefined();
    const out = mkdtempSync(join(tmpdir(), "dragon-short-cli-"));
    const file = join(out, "similar.dragon");
    writeFileSync(file, SIMILAR);
    const ran = await runCli(["export", file, "--format", "html", "--out", out, "--lang", "ja"]);
    expect(ran.code, ran.stderr).toBe(0);
    expect(ran.stdout.trim(), "書き出した file の path を標準出力に出さない").toBe(join(out, "similar.html"));
    expect(ran.stderr.trimEnd().split("\n"), "標準エラーに似た名前の知らせが 1 件 1 行で出ない").toEqual([`${file}:${notice?.line} ${notice?.message}`]);
  });
});
