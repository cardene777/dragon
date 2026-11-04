/**
 * npm に出す package の file に、見本帳の分が入らないこと (#3350)。
 *
 * 見本帳の分 (名前と説明、部品の図、棚の名前、使い方の頁の段落) はブロックの置き場の `gallery/` に置き、見本帳だけが読む。
 * package の `files` から `gallery/` を外し、入口からも読まないので、npm に出す file に見本帳の字は入らない。
 * `npm pack --dry-run` が出す file の一覧と、その file の中身の両方を見る。一覧だけを見ると、見本帳の字を別の file へ写した形を捕まえられない。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const PACKAGE = join(__dirname, "..");
const BLOCKS = join(PACKAGE, "src/blocks");

/** `npm pack --dry-run` が npm に出すと答えた file の path (package の dir から見た相対 path) */
function packedFiles(): string[] {
  const out = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: PACKAGE, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const [pack] = JSON.parse(out) as { files: { path: string }[] }[];
  return (pack?.files ?? []).map((file) => file.path);
}

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

describe("npm に出す package の file (#3350)", () => {
  it("package-excludes-catalog-material", async () => {
    const files = packedFiles();
    expect(files.length, "npm に出す file が無い (走査の空振り)").toBeGreaterThan(0);
    expect(
      files.filter((path) => /(?:^|\/)gallery\//u.test(path) || path.endsWith(".dragon")),
      "npm に出す file に入った見本帳の分 (gallery/ と部品の図)",
    ).toEqual([]);
    const phrases = await catalogPhrases();
    expect(phrases.length, "見本帳の名前と説明と段落の字が無い (走査の空振り)").toBeGreaterThan(0);
    const leaked = files.flatMap((path) => {
      const text = readFileSync(join(PACKAGE, path), "utf8");
      return phrases.filter((phrase) => text.includes(phrase)).map((phrase) => `${path}: ${phrase.slice(0, 24)}`);
    });
    expect(leaked, "npm に出す file に入った見本帳の名前と説明と段落の字").toEqual([]);
  });
});
