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
import { describe, expect, it, vi } from "vitest";
import { api, type LineError, type Parsed } from "./diagram-support";
import { formatOf, runCliInProcess } from "./export-support";

// 書き出しの撮る所だけを差し替え、動画に撮る絵 (SVG) を残す。動画に足したブロックが描かれるかを Chromium を起こさずに確かめる
const shots = { still: [] as string[], film: [] as string[] };
vi.mock("../src/export/capture", async (importOriginal) => {
  const real = await importOriginal<typeof import("../src/export/capture")>();
  return {
    ...real,
    launch: () => Promise.resolve({ close: () => Promise.resolve() }),
    stage: (_browser: unknown, svg: string) => Promise.resolve({ svg }),
    still: (stage: { svg: string }) => {
      shots.still.push(stage.svg);
      return Promise.resolve(Buffer.from("png"));
    },
    film: (stage: { svg: string }) => {
      shots.film.push(stage.svg);
      return Promise.resolve({ frames: 1, gif: Buffer.from("gif") });
    },
  };
});

// 共有のブロック集は組み立てが本体に埋める (`tsup.config.ts`)。元の code を直に読む時は空の集を置く。金庫の図は共有のブロックを使わない
vi.stubGlobal("__DRAGON_SHARED_BLOCKS__", []);
// 描く部品と書き出す部品の元の code は、検査の外 (この file を読む段) で先に読む (#3410)
const [{ exportDiagram: exportSource }, { parseNotation: parseSource }] = await Promise.all([import("../src/export/index"), import("../src/parser"), import("../src/kinds/all")]);

const lines = (...rows: string[]): string => `${rows.join("\n")}\n`;
const scratch = (): string => mkdtempSync(join(tmpdir(), "dragon-export-blocks-"));
const firstLine = (text: string): string => text.trimStart().split("\n")[0] ?? "";

/** 足したブロックの定義の file。金庫の箱を琥珀の色で描く */
const VAULT = lines("// A vault that holds deposited tokens", "blocks 1", "block +vault", "  base box", "  color amber", "end");
/** 定義を頭に書かずに `+vault` を使う見本 */
const VAULT_EXAMPLE = lines("architecture Deposit into a vault", "", "box user as User", "+vault v as Vault", "", "step Deposit", "  user -> v: deposit");

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
    const out = scratch();
    // 描く処理は定義の無いブロックを使う図を断るので、PNG が書けたなら渡した定義が描く処理まで届いている。
    // Chromium で撮るのは 1 枚に留める。2 枚撮って比べると、混んだ機械で 1 件の上限 (10 秒) を超えた
    const ran = await runCliInProcess(["export", example, "--blocks", definitions, "--format", "png", "--out", out]);
    expect(ran.code, `--blocks で定義を渡しても書き出せない ${ran.stdout}${ran.stderr}`).toBe(0);
    const png = join(out, "vault-example.png");
    expect(ran.stdout.trim(), "書き出した PNG の path を出さない").toBe(png);
    expect(existsSync(png), "PNG を書かない").toBe(true);
    const written = readFileSync(png);
    expect(formatOf(written), "PNG として書かれていない").toBe("png");
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

  // 寄って見せる図の動画は、書き出しが窓の幅で描き直した絵を撮る。描き直しにも足したブロックの定義を渡さないと、足した線が点線でなく素の線で撮られる
  it("export-video-draws-added-blocks", async () => {
    const definitions = lines("blocks 1", "block +deposit", "  base edge", "  shape dashed", "  color amber", "end");
    const body = lines("", "box user as User", "box vault as Vault", "", "step Deposit", "  user +deposit vault: deposit");
    const head = "architecture Deposit into a vault [view: follow]";
    const read = readBlocks(definitions);
    expect(read.ok, "線のブロックの定義を読めない").toBe(true);
    if (!read.ok) return;
    const passed = parseSource(`${head}\n${body}`, { blocks: read.blocks as never });
    const inline = parseSource(`${head}\n${definitions}${body}`);
    expect(passed.ok && inline.ok, "寄って見せる金庫の図を読めない").toBe(true);
    if (!passed.ok || !inline.ok) return;
    const dashed = 'stroke-dasharray="8 6"';
    for (const [said, diagram, options] of [
      ["頭に書いた定義", inline.diagram, {}],
      ["--blocks で渡した定義", passed.diagram, { blocks: read.blocks as never }],
    ] as const) {
      shots.still.length = 0;
      shots.film.length = 0;
      const result = await exportSource(diagram, { outDir: scratch(), formats: ["png", "gif"], ...options });
      expect(result.view, `${said}の図が寄って見せる図にならない`).toBe("follow");
      expect(shots.still[0] ?? "", `${said}の図の止め絵で、足した線を点線で描かない`).toContain(dashed);
      expect(shots.film[0] ?? "", `${said}の図の動画で、足した線を点線で描かない`).toContain(dashed);
    }
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
