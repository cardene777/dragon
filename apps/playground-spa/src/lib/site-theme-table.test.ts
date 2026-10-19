/**
 * サイトの見た目を決める意匠ごとの値の表 (#2962)。
 *
 * サイトの部品は画面の変数 (`--d-*`) だけを読み、その値は html の `data-site-theme` に応じて
 * `styles/site-theme.css` の表が決める。 確かめるのは 4 つ。
 *
 * 1. 記法の `THEMES` の 7 つの名前ごとに表が 1 組ある
 * 2. 7 組が同じ名前の組を宣言し、サイトのどこかが読む変数を 1 つも欠かさない
 *    (欠けた意匠では部品が値を失い、色や字体が既定値へ落ちる)
 * 3. 表の外で html に画面の変数を宣言しない (表の値が上書きされて意匠ごとに替わらない)
 * 4. `color-scheme` は各表の地から導いた明暗と一致する。 記述欄へ渡す明暗 (`地が暗いか`) も同じ
 *
 * 一覧は手で書かず、表とサイトの source から導く。
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { THEMES } from "@cardenelabs/dragon";

import { 地が暗いか } from "./site-theme";

const src = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const 表の置き場 = resolve(src, "styles/site-theme.css");

type 規則 = { 選択子: string; 中身: string };

function 規則を読む(css: string): 規則[] {
  return [...css.replace(/\/\*[\s\S]*?\*\//g, "").matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((m) => ({
    選択子: (m[1] ?? "").replace(/\s+/g, " ").trim(),
    中身: m[2] ?? "",
  }));
}

function 宣言(中身: string): Map<string, string> {
  return new Map(
    [...中身.matchAll(/(?:^|;)\s*([a-z-][a-z0-9-]*)\s*:\s*([^;]+)/gi)].map((m) => [
      m[1]!.toLowerCase(),
      m[2]!.replace(/\s+/g, " ").trim(),
    ]),
  );
}

/** src の下の file を全部集める (検査自身は数えない) */
function file一覧(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return file一覧(path);
    if (!/\.(css|ts|tsx)$/.test(name) || /\.test\.tsx?$/.test(name)) return [];
    return [path];
  });
}

const 表の規則 = 規則を読む(readFileSync(表の置き場, "utf8"));
const 表 = new Map(
  THEMES.map((意匠) => {
    const 当たる = 表の規則.filter((r) => r.選択子 === `html[data-site-theme="${意匠}"]`);
    return [意匠, 当たる.length === 1 ? 宣言(当たる[0]!.中身) : null] as const;
  }),
);
const 画面の変数 = (値: Map<string, string>): string[] =>
  [...値.keys()].filter((名前) => 名前.startsWith("--d-")).sort();

/** サイトのどこかが `var(--d-*)` で読む名前 */
const 読まれる名前 = [
  ...new Set(
    file一覧(src).flatMap((path) =>
      [...readFileSync(path, "utf8").matchAll(/var\(\s*(--d-[a-z0-9-]+)/g)].map((m) => m[1]!),
    ),
  ),
].sort();

function 輝度(hex: string): number {
  const h = hex.replace("#", "").slice(0, 6);
  const [r = 0, g = 0, b = 0] = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** 地に白い字と黒い字を置き、対比の高い方が白なら暗い地 */
const 地の明暗 = (地: string): "dark" | "light" => {
  const y = 輝度(地);
  return (1.05 / (y + 0.05) > (y + 0.05) / 0.05 ? "dark" : "light");
};

describe("意匠ごとの値の表 (#2962)", () => {
  it("記法の 7 つの意匠それぞれに表が 1 組だけある", () => {
    const 欠けた = THEMES.filter((意匠) => 表.get(意匠) === null);
    console.log(`意匠 ${THEMES.length} 件 (${THEMES.join(" / ")})、表の無い意匠 ${欠けた.length} 件`);
    expect(欠けた).toEqual([]);
  });

  it("7 組の表が同じ画面の変数の組を宣言している", () => {
    const 基準 = 画面の変数(表.get(THEMES[0]) ?? new Map());
    const ずれ = THEMES.filter((意匠) => {
      const 名前 = 画面の変数(表.get(意匠) ?? new Map());
      return 名前.join(",") !== 基準.join(",");
    });
    console.log(`表 1 組あたりの画面の変数 ${基準.length} 個`);
    expect(基準.length, "表が画面の変数を 1 つも宣言していない (検査が空振りしている)").toBeGreaterThan(0);
    expect(ずれ).toEqual([]);
  });

  it("サイトが読む画面の変数を、7 組の表が全部宣言している", () => {
    expect(読まれる名前.length, "読む名前を 1 つも導けていない (検査が空振りしている)").toBeGreaterThan(0);
    const 欠け = THEMES.flatMap((意匠) => {
      const 名前 = new Set(画面の変数(表.get(意匠) ?? new Map()));
      return 読まれる名前.filter((n) => !名前.has(n)).map((n) => `${意匠}: ${n}`);
    });
    console.log(`サイトが読む画面の変数 ${読まれる名前.length} 個、表の欠け ${欠け.length} 件`);
    expect(欠け).toEqual([]);
  });

  it("表は空の値を持たない", () => {
    const 空 = THEMES.flatMap((意匠) =>
      [...(表.get(意匠) ?? new Map())].filter(([, 値]) => 値 === "").map(([名前]) => `${意匠}: ${名前}`),
    );
    expect(空).toEqual([]);
  });

  it("表の外で html に画面の変数を宣言する規則が 0 件", () => {
    const 外 = file一覧(resolve(src, "styles"))
      .filter((path) => path !== 表の置き場 && path.endsWith(".css"))
      .flatMap((path) =>
        規則を読む(readFileSync(path, "utf8"))
          .filter((r) => /(^|,\s*)(:root|html)\b/.test(r.選択子))
          .filter((r) => 画面の変数(宣言(r.中身)).length > 0)
          .map((r) => `${relative(src, path)}: ${r.選択子}`),
      );
    expect(外).toEqual([]);
  });

  it.each(THEMES.map((意匠) => [意匠]))("%s の `color-scheme` が地の明暗と一致する", (意匠) => {
    const 値 = 表.get(意匠) ?? new Map();
    const 地 = 値.get("--d-bg") ?? "";
    expect(地, `${意匠} の地 (--d-bg) が 6 桁の色ではない`).toMatch(/^#[0-9a-f]{6}$/i);
    expect(値.get("color-scheme")).toBe(地の明暗(地));
  });

  it.each(THEMES.map((意匠) => [意匠]))("%s で記述欄へ渡す明暗が表の `color-scheme` と一致する", (意匠) => {
    expect(地が暗いか(意匠) ? "dark" : "light").toBe(表.get(意匠)?.get("color-scheme"));
  });
});
