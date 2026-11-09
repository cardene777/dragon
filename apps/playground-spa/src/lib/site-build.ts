/**
 * 公開する頁を一時の場所へ build する (#2995)。
 *
 * build した頁の中身を読む検査は、この build を 1 回の実行で 1 度だけ行い (`site-setup.ts`)、全ての file で使い回す (#3381)。
 * そのため、検査の道具 (vitest、Playwright) を読まずに、準備の段からも検査の file からも呼べる形に分けて置く。
 */
import { execFile } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";

const run = promisify(execFile);

export const root = resolve(__dirname, "../../../..");
export const app = join(root, "apps/playground-spa");

export interface Built {
  dir: string;
  /** 配る前に `404.html` を作る script の結果 */
  notFound: { ok: boolean; stderr: string };
}

/**
 * 頁を一時の場所へ build し、配る時と同じ script で `404.html` を作る。
 * 検査の道具は `NODE_ENV` を `test` にして起きるので、そのまま build に渡すと React の開発用の版が入り、配る頁と中身も大きさも違う。
 * 配る時の build (`NODE_ENV` を持たない `vite build`) と同じ `production` で build する (#3163)。
 * `config` を渡すと、`vite.config.ts` の代わりにその設定で build する (字の重なりを 1 件持つ図を描く検査だけの build、#3197)
 */
export async function buildPage(config?: string): Promise<Built> {
  const dir = mkdtempSync(join(tmpdir(), "dragon-page-"));
  const vite = join(app, "node_modules/vite/bin/vite.js");
  const chosen = config === undefined ? [] : ["--config", config];
  await run(
    process.execPath,
    [vite, "build", ...chosen, "--outDir", dir, "--emptyOutDir", "--logLevel", "error"],
    { cwd: app, env: { ...process.env, NODE_ENV: "production" } },
  );
  try {
    await run(process.execPath, [join(app, "scripts/copy-404.mjs"), dir], { cwd: app });
    return { dir, notFound: { ok: true, stderr: "" } };
  } catch (error) {
    return {
      dir,
      notFound: { ok: false, stderr: String((error as { stderr?: unknown }).stderr ?? error) },
    };
  }
}
