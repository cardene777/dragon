/**
 * 書き出しの命令が、足したブロックの定義の file を `--blocks` で受け取って図に渡す (#3606)。
 *
 * 足したブロックを PR に出す時、見本の図は定義を頭に書かず、定義の file を `dragon check --blocks` で渡して確かめる (#3508)。
 * 書き出しの命令は `--blocks` を持たず、見本を絵にして見る道が無かった。評価の頁も、AI が足したブロックの見本だけ絵にできなかった。
 * 書き出した頁は埋めた原本を読み直して描くので、渡した定義を原本の定義の欄 (`define`) に入れて運ぶ
 */
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as dragon from "@cardenelabs/dragon";
import { describe, expect, it } from "vitest";
import { api, type LineError, type Parsed } from "./diagram-support";
import { exporter, formatOf, runCliInProcess } from "./export-support";

const lines = (...rows: string[]): string => `${rows.join("\n")}\n`;
const scratch = (): string => mkdtempSync(join(tmpdir(), "dragon-export-blocks-"));
const firstLine = (text: string): string => text.trimStart().split("\n")[0] ?? "";

/** 足したブロックの定義の file。金庫の箱を琥珀の色で描く */
const VAULT = lines("// A vault that holds deposited tokens", "blocks 1", "block +vault", "  base box", "  color amber", "end");
/** 定義を頭に書かずに `+vault` を使う見本 */
const VAULT_EXAMPLE = lines("architecture Deposit into a vault", "", "box user as User", "+vault v as Vault", "", "step Deposit", "  user -> v: deposit");
/** 同じ図の頭に同じ定義を書いた物。`--blocks` で定義を渡した書き出しは、これと同じ絵になる */
const VAULT_INLINE = lines(
  "architecture Deposit into a vault",
  "blocks 1",
  "block +vault",
  "  base box",
  "  color amber",
  "end",
  "",
  "box user as User",
  "+vault v as Vault",
  "",
  "step Deposit",
  "  user -> v: deposit",
);

/** file を新しい dir に置いて path を返す */
function place(name: string, text: string): string {
  const path = join(scratch(), name);
  writeFileSync(path, text);
  return path;
}

type ReadBlocks = { ok: true; blocks: { format: 1; blocks: { name: string }[] } } | { ok: false; errors: LineError[] };

const readBlocks = (text: string): ReadBlocks => {
  const fn = (dragon as unknown as { readBlocks?: (input: unknown) => ReadBlocks }).readBlocks;
  expect(fn, "readBlocks が @cardenelabs/dragon から出ていない").toBeDefined();
  return (fn as (input: unknown) => ReadBlocks)(text);
};

/** 書き出した頁に埋めた図の原本 */
function pageSource(html: string): { define?: { blocks: { name: string }[] } } {
  const found = /<script type="application\/json" id="dragon-diagram">([\s\S]*?)<\/script>/u.exec(html);
  expect(found, "頁に図の原本が埋まっていない").not.toBeNull();
  return JSON.parse(found?.[1] ?? "{}") as { define?: { blocks: { name: string }[] } };
}

describe("dragon export --blocks (#3606)", () => {
  it("export-uses-blocks-option-definitions", async () => {
    const definitions = place("vault.dragon", VAULT);
    const example = place("vault-example.dragon", VAULT_EXAMPLE);
    const inline = api("parseNotation")(VAULT_INLINE);
    expect(inline.ok, "頭に定義を書いた図を読めない").toBe(true);
    if (!inline.ok) return;
    const out = scratch();
    const exportDiagram = await exporter();
    // 命令は 1 件 1 回だけ起こし (#3424)、頭に定義を書いた図の書き出しと並べて走らせる
    const [ran, given] = await Promise.all([
      runCliInProcess(["export", example, "--blocks", definitions, "--format", "png", "--out", out]),
      exportDiagram(inline.diagram, { outDir: scratch(), name: "vault-inline", formats: ["png"] }),
    ]);
    expect(ran.code, `--blocks で定義を渡しても書き出せない ${ran.stdout}${ran.stderr}`).toBe(0);
    const png = join(out, "vault-example.png");
    expect(ran.stdout.trim(), "書き出した PNG の path を出さない").toBe(png);
    expect(existsSync(png), "PNG を書かない").toBe(true);
    const written = readFileSync(png);
    expect(formatOf(written), "PNG として書かれていない").toBe("png");
    expect(written.equals(readFileSync(given.files.png as string)), "--blocks で渡した定義の絵が、頭に定義を書いた図の絵とバイト単位で違う").toBe(true);
  });

  it("export-page-carries-blocks-definitions", async () => {
    const definitions = place("vault.dragon", VAULT);
    const example = place("vault-example.dragon", VAULT_EXAMPLE);
    const read = readBlocks(VAULT);
    expect(read.ok, "定義の file を読めない").toBe(true);
    if (!read.ok) return;
    const out = scratch();
    const ran = await runCliInProcess(["export", example, "--blocks", definitions, "--format", "html", "--out", out]);
    expect(ran.code, `--blocks で定義を渡しても頁を書き出せない ${ran.stdout}${ran.stderr}`).toBe(0);
    const source = pageSource(readFileSync(join(out, "vault-example.html"), "utf8"));
    // 頁は埋めた原本を読み直して描くので、原本の定義の欄が渡した定義を持たないと頁で +vault を描けない
    expect(source.define?.blocks ?? [], "頁に埋めた原本が渡した定義を持たない").toContainEqual(read.blocks.blocks[0]);
  });

  it("export-blocks-option-usage-errors", async () => {
    const example = place("vault-example.dragon", VAULT_EXAMPLE);
    const diagram = place("plain.dragon", lines("sequence", "", "Browser -> App: GET /login"));
    const missing = join(scratch(), "none.dragon");
    // 定義の file でない file、無い file、値の無い --blocks は、どれも書き出さずに確かめる命令と同じ文で断る
    for (const lang of ["en", "ja"] as const) {
      for (const blocks of [[diagram], [missing], []]) {
        const out = join(scratch(), "out");
        const ran = await runCliInProcess(["export", example, "--format", "html", "--out", out, "--lang", lang, "--blocks", ...blocks]);
        const checked = await runCliInProcess(["check", example, "--lang", lang, "--blocks", ...blocks]);
        const said = `--blocks ${blocks.join(" ")} (${lang})`;
        expect(checked.code, `確かめる命令が ${said} を終わり方 2 で断らない ${checked.stderr}`).toBe(2);
        expect(ran.code, `${said} で終わり方 2 にならない ${ran.stdout}${ran.stderr}`).toBe(2);
        expect(ran.stdout.trim(), `${said} で書き出した`).toBe("");
        expect(existsSync(out), `${said} で書き出し先を作った`).toBe(false);
        expect(firstLine(ran.stderr), `${said} の断りの文が確かめる命令と違う`).toBe(firstLine(checked.stderr));
      }
    }
  });

  it("export-usage-names-blocks-option", async () => {
    const en = await runCliInProcess(["export", "--help"]);
    expect(en.code).toBe(2);
    expect(en.stderr, "英語の使い方を出さない").toMatch(/^Usage: dragon export /mu);
    expect(en.stderr, "英語の使い方が --blocks <file> を挙げない").toMatch(/^\s+--blocks <file> /mu);
    const ja = await runCliInProcess(["export", "--help", "--lang", "ja"]);
    expect(ja.code).toBe(2);
    expect(ja.stderr, "日本語の使い方を出さない").toMatch(/^使い方: dragon export /mu);
    expect(ja.stderr, "日本語の使い方が --blocks <file> を挙げない").toMatch(/^\s+--blocks <file> /mu);
  });

  it("export-without-blocks-reports-undefined-block", async () => {
    const example = place("vault-example.dragon", VAULT_EXAMPLE);
    const parsed: Parsed = api("parseNotation")(VAULT_EXAMPLE);
    const undefinedBlock = parsed.ok ? undefined : parsed.errors[0];
    expect(undefinedBlock?.message, "読む処理が定義の無いブロックを断らない").toContain("+vault");
    const out = join(scratch(), "out");
    const ran = await runCliInProcess(["export", example, "--format", "html", "--out", out]);
    expect(ran.code, `定義を渡さずに終わり方 1 にならない ${ran.stdout}${ran.stderr}`).toBe(1);
    expect(ran.stderr.trim(), "定義の無いブロックの誤りの行").toBe(`${example}:${undefinedBlock?.line} ${undefinedBlock?.message}`);
    expect(existsSync(out), "定義の無いブロックを使う図で書き出し先を作った").toBe(false);
  });
});
