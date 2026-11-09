/**
 * 見本帳の検査の道具 (#2995)。部品の図の file の置き場と、build した頁の中身を読む。
 *
 * 頁は開かない。見た目は本人の目で見て決める (#3585)。
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";
import { inject } from "vitest";
import { app, root } from "./site-build";
import { DEFAULT_SITE } from "./site-needs";

export { app, root };

/** ブロックの置き場。部品の図は全て `<名前>/gallery/` に在る (#3345、#3348) */
const BLOCK_FOLDERS = join(root, "packages/dragon/src/blocks");

/** 部品の図を置く dir。ブロックの置き場の見本帳の分 (`gallery/`) */
export function partFigureDirs(): string[] {
  return readdirSync(BLOCK_FOLDERS)
    .sort()
    .map((name) => join(BLOCK_FOLDERS, name, "gallery"))
    .filter((dir) => existsSync(dir));
}

/** 部品の図の file の名前 (`<名札>.<図の種類>.dragon` と英語の `.en.dragon`)。置き場を問わず名前の順 */
export function partFigureNames(): string[] {
  return partFigureDirs()
    .flatMap((dir) => readdirSync(dir).filter((name) => name.endsWith(".dragon")))
    .sort();
}

/** 部品の図の file の path。file の在る見本帳の分を返し、どこにも無ければ名札のブロックの見本帳の path を返す */
export function partFigure(name: string): string {
  return (
    partFigureDirs()
      .map((dir) => join(dir, name))
      .find((path) => existsSync(path)) ?? join(BLOCK_FOLDERS, name.split(".")[0] ?? name, "gallery", name)
  );
}
/** 頁を配る場所。`vite.config.ts` が build の時に使う前置きと同じ */
export const BASE = "/dragon/";

/** この回の準備の段 (`site-setup.ts`) が build した頁の dir。呼ぶ検査の file があると準備の段が build する */
export function builtDir(): string {
  const built = inject("dragonSites")[DEFAULT_SITE];
  if (!built) throw new Error("見本帳の頁が build されていない (site-setup.ts)");
  return built.dir;
}

/** build した script と CSS の file ごとの gzip の大きさ (byte) */
export function bundleSizes(dir: string): Record<string, number> {
  const assets = join(dir, "assets");
  if (!existsSync(assets)) return {};
  return Object.fromEntries(
    readdirSync(assets)
      .filter((name) => /\.(js|css)$/u.test(name))
      .map((name) => [name, gzipSync(readFileSync(join(assets, name))).length]),
  );
}

/**
 * build した頁が最初に読む script と CSS の file の名前 (#3246)。
 * `index.html` が `src` と `href` で名指す `assets/` の下の file で、入口と、入口が先に読むよう名指す file を含む。
 * ほかの script は頁が動いてから読む後から読む塊
 */
export function firstLoadFiles(dir: string): string[] {
  const html = readFileSync(join(dir, "index.html"), "utf8");
  return [...new Set([...html.matchAll(/\b(?:src|href)="[^"]*\/assets\/([^"/]+\.(?:js|css))"/gu)].map((m) => m[1] ?? ""))].filter(Boolean).sort();
}

/** 頁の source (検査と検査の助けを除く) を path と中身の組で返す */
export function pageSources(): [string, string][] {
  const out: [string, string][] = [];
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name);
      if (statSync(path).isDirectory()) walk(path);
      else if (/\.tsx?$/u.test(name) && !/\.test\.tsx?$/u.test(name) && !/-support\.ts$/u.test(name)) {
        out.push([path.slice(root.length + 1), readFileSync(path, "utf8")]);
      }
    }
  };
  walk(join(app, "src"));
  return out;
}
