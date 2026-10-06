import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..");

function 設計path(...部分: string[]): string {
  return join(REPO, "docs/design", ...部分);
}

function 見本path(...部分: string[]): string {
  return 設計path("proposal", ...部分);
}

const 図種 = [
  "図表",
  "型",
  "工程",
  "数",
  "時間軸",
  "構成",
  "段箱",
  "流れ",
  "路線",
  "関係",
  "階層",
  "順序",
];
const 意匠 = [
  { 日本語: "図録", 場所: "catalog" },
  { 日本語: "図面", 場所: "blueprint" },
  { 日本語: "手描き", 場所: "sketch" },
  { 日本語: "活版", 場所: "letterpress" },
  { 日本語: "浮彫", 場所: "relief" },
  { 日本語: "端末", 場所: "terminal" },
  { 日本語: "電飾", 場所: "neon" },
];
const 組合せ = 図種.flatMap((種類) => 意匠.map(({ 日本語 }) => `${種類}-${日本語}`)).sort();
const 対応表 = 見本path("README.md");
const 一覧頁 = 見本path("index.html");
const markdownLink = /\[[^\]]+\]\(([^)]+)\)/gu;
const 一覧頁の画像Link = /src="(img\/[^"]+)"/gu;

function 拡張子を付ける(ext: ".jpg" | ".html"): string[] {
  return 組合せ.map((名前) => `${名前}${ext}`);
}

function file一覧(dir: string, ext: ".jpg" | ".html"): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((名前) => 名前.endsWith(ext))
    .sort();
}

function link先(path: string, 書式: RegExp): string[] {
  const 本文 = existsSync(path) ? readFileSync(path, "utf8") : "";
  return [...本文.matchAll(書式)].map((一致) => 一致[1] ?? "");
}

describe("意匠の見本", () => {
  it("jpg が図種と意匠の全組合せだけを持つ", () => {
    expect(file一覧(見本path("img"), ".jpg"), "jpg の組合せが揃っていない").toEqual(
      拡張子を付ける(".jpg"),
    );
  });

  it("元 SVG を含む html が図種と意匠の全組合せだけを持つ", () => {
    expect(file一覧(見本path("static"), ".html"), "html の組合せが揃っていない").toEqual(
      拡張子を付ける(".html"),
    );
  });

  it("一覧頁が読む画像が全て実在する", () => {
    const 参照 = link先(一覧頁, 一覧頁の画像Link);
    expect(参照.length, "index.html から画像参照を拾えていない").toBeGreaterThan(0);
    expect(
      参照.filter((相対path) => !existsSync(見本path(相対path))),
      "index.html が実在しない画像を読んでいる",
    ).toEqual([]);
  });

  it("README の対応表が全組合せの画像と html を一度ずつ指す", () => {
    const 実際 = link先(対応表, markdownLink)
      .filter((path) => /^(img|static)\//u.test(path))
      .sort();
    const 期待 = [
      ...拡張子を付ける(".jpg").map((名前) => `img/${名前}`),
      ...拡張子を付ける(".html").map((名前) => `static/${名前}`),
    ].sort();
    expect(実際, "README の対応表に過不足がある").toEqual(期待);
  });

  const 意匠帳 = 意匠.map(({ 日本語, 場所 }) => ({
    name: `${日本語}の意匠帳`,
    path: 設計path(場所, "note.md"),
  }));
  const 索引と意匠帳 = [{ name: "意匠帳の索引", path: 設計path("README.md") }, ...意匠帳];

  it.each(索引と意匠帳)("$name から見本を開ける", ({ path }) => {
    const 参照 = link先(path, markdownLink).filter((相対path) => 相対path.includes("proposal/"));
    expect(参照.length, "見本への link が 1 行になっていない").toBe(1);
    expect(
      参照.filter((相対path) => !existsSync(join(dirname(path), 相対path))),
      "見本への link 先が実在しない",
    ).toEqual([]);
  });
});
