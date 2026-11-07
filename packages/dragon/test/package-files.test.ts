/**
 * npm に出す package の file に、見本帳の分が入らないこと (#3350)。
 *
 * 見本帳の分 (名前と説明、部品の図、棚の名前、使い方の頁の段落) はブロックの置き場の `gallery/` に置き、見本帳だけが読む。
 * package の `files` から `gallery/` を外し、入口からも読まないので、npm に出す file に見本帳の字は入らない。
 * `npm pack --dry-run` が出す file の一覧と、その file の中身の両方を見る。一覧だけを見ると、見本帳の字を別の file へ写した形を捕まえられない。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, inject, it } from "vitest";

const PACKAGE = join(__dirname, "..");
const BLOCKS = join(PACKAGE, "src/blocks");

/**
 * `npm pack --dry-run` が npm に出すと答えた file の path (package の dir から見た相対 path)。
 * npm は準備の段 (`test-support/pack-setup.ts`) が 1 度だけ起こし、ここでは渡された一覧を読む (#3410)
 */
const packedFiles = (): string[] => ((inject as (key: string) => unknown)("dragonPackFiles") as string[] | undefined) ?? [];

/**
 * 見本帳の説明と、使い方の頁の段落の字。ブロックの置き場の `gallery/` の `text.ts` と `docs.ts` が出す字をそのまま引く。
 * 部品の名前 (箱、merge commit のような語) は記法の誤りの文や README にも出る語なので、字の一致では数えない。名前は `gallery/` ごと外したことで確かめる
 */
async function catalogPhrases(): Promise<string[]> {
  const folders = readdirSync(BLOCKS, { withFileTypes: true }).filter((entry) => entry.isDirectory() && existsSync(join(BLOCKS, entry.name, "gallery")));
  const phrases = await Promise.all(
    folders.map(async (entry) => {
      const gallery = join(BLOCKS, entry.name, "gallery");
      const text = existsSync(join(gallery, "text.ts")) ? ((await import(join(gallery, "text.ts"))) as { text: unknown }).text : undefined;
      const docs = existsSync(join(gallery, "docs.ts")) ? ((await import(join(gallery, "docs.ts"))) as { docs: unknown }).docs : undefined;
      return [text, docs].flatMap((value) => stringsOf(value));
    }),
  );
  return [...new Set(phrases.flat())];
}

/** 値の中の字を全て。`none` (持たない理由) と節の名前 (`section`) は見本帳の字ではなく、部品の名前 (`name`) は語なので外す */
function stringsOf(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(stringsOf);
  if (typeof value === "object" && value !== null) return Object.entries(value).flatMap(([key, inner]) => (["none", "section", "name"].includes(key) ? [] : stringsOf(inner)));
  return [];
}

/**
 * 字で探す file。地図 (`.map`) は束ねた file の元の source の写しで、束に入った字は束ねた file にも在るので読まない (#3381)。
 * 地図は npm に出す file の大きさの 6 割を占め、読まないと探す手間が半分より小さくなる
 */
const TEXT = /\.(?:[cm]?js|[cm]?ts|json|md)$/u;

/** 束ねた JS は日本語の字を `\uXXXX` の形で書く (esbuild の既定の `charset`)。字で探せるように戻す (#3381) */
const unescaped = (text: string): string =>
  text.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/gu, (_, wide: string | undefined, hex: string | undefined) => String.fromCodePoint(parseInt(wide ?? hex ?? "0", 16)));

describe("npm に出す package の file (#3350)", () => {
  it("pack-list-comes-from-setup", () => {
    // npm に出す file の一覧は、この file を回す時だけ準備の段が npm pack を 1 度だけ起こして出し、検査はその一覧を読む (#3410)
    const files = (inject as (key: string) => unknown)("dragonPackFiles") as string[] | undefined;
    expect(files?.length ?? 0, "準備の段が npm に出す file の一覧を渡していない").toBeGreaterThan(0);
    expect(files, "準備の段が渡した一覧に package.json が無い").toContain("package.json");
    // npm の起動は 1 件の上限 (10 秒) の中で数秒かかり、混んだ機械で上限を超えたので、検査の中では起こさない
    const source = readFileSync(join(__dirname, "package-files.test.ts"), "utf8");
    expect(/execFileSync\(\s*"npm"|spawn(?:Sync)?\(\s*"npm"/u.test(source), "package-files.test.ts が検査の中で npm を起こす").toBe(false);
  });

  it("package-excludes-catalog-material", async () => {
    const files = packedFiles();
    expect(files.length, "npm に出す file が無い (走査の空振り)").toBeGreaterThan(0);
    // 共有のブロック集 (`blocks/`) の定義と見本は、使う人が手元で読めるよう npm に出す (#3455)。見本帳の部品の図は src の下に在る
    expect(
      files.filter((path) => /(?:^|\/)gallery\//u.test(path) || (path.startsWith("src/") && path.endsWith(".dragon"))),
      "npm に出す file に入った見本帳の分 (gallery/ と部品の図)",
    ).toEqual([]);
    const phrases = await catalogPhrases();
    expect(phrases.length, "見本帳の名前と説明と段落の字が無い (走査の空振り)").toBeGreaterThan(0);
    const leaked = files.filter((path) => TEXT.test(path)).flatMap((path) => {
      const text = unescaped(readFileSync(join(PACKAGE, path), "utf8"));
      return phrases.filter((phrase) => text.includes(phrase)).map((phrase) => `${path}: ${phrase.slice(0, 24)}`);
    });
    expect(leaked, "npm に出す file に入った見本帳の名前と説明と段落の字").toEqual([]);
  });
});
