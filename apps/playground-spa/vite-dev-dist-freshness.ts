import { spawnSync } from "node:child_process";

import type { Plugin } from "vite";

import {
  REPO_ROOT,
  SKIP_ENV,
  TARGETS,
  collectProblems,
} from "../../test-support/dist-freshness-check";

export const BUILD_COMMAND = "pnpm build:packages";

interface BuildResult {
  readonly status: number | null;
  readonly error?: Error;
}

interface EnsureFreshDistOptions {
  readonly env?: Readonly<Record<string, string | undefined>>;
  readonly 判定?: () => readonly string[];
  readonly 組み立て?: () => BuildResult;
  readonly 知らせる?: (message: string) => void;
}

function buildPackages(): BuildResult {
  const result = spawnSync("pnpm", ["build:packages"], {
    cwd: REPO_ROOT,
    stdio: "inherit",
  });
  return { status: result.status, error: result.error };
}

/**
 * `dist` の問題があれば、内容を 1 回知らせて package を同期で組み立て直す。
 *
 * 判定と組み立てを引数で受けるのは、開発 server を実際に立てずに全分岐を検査するため。
 */
export function ensureFreshDist({
  env = process.env,
  判定 = () => collectProblems(TARGETS),
  組み立て = buildPackages,
  知らせる = (message) => console.warn(message),
}: EnsureFreshDistOptions = {}): void {
  if (env[SKIP_ENV.dist] === "1") return;

  const problems = 判定();
  if (problems.length === 0) return;

  知らせる(
    `開発サーバーは記法を dist から読むため、立てる前に ${BUILD_COMMAND} で組み立て直す (#2856)。\n\n` +
      problems.join("\n\n"),
  );
  const result = 組み立て();
  if (result.error !== undefined || result.status !== 0) {
    const cause = result.error === undefined ? "" : `\n起動時の失敗: ${result.error.message}`;
    throw new Error(
      `${BUILD_COMMAND} が失敗した (exit code: ${String(result.status)})。${cause}\n` +
        `直す: 手で ${BUILD_COMMAND} を回して出力を見る。`,
    );
  }

  const afterBuild = 判定();
  if (afterBuild.length > 0) {
    throw new Error(
      `${BUILD_COMMAND} の組み立て後も dist の問題が残った。\n\n${afterBuild.join("\n\n")}\n\n` +
        `直す: 手で ${BUILD_COMMAND} を回して出力を見る。`,
    );
  }
}

/**
 * 開発 server が古い記法を配る前に `dist` を揃える Vite plugin。
 *
 * 2026-10-08、前日の `dist` が残り、追加済みの `legend` を読めず見本帳の頁が空になった。
 * server が立った後では古い頁を先に配るため、起動前の `config` hook に判定を置く。
 *
 * 立てたまま main を取り込んだ時には追いつかないが、立て直せば揃う。source を見張る形は、
 * 見張りが常に動いたうえ型の組み立ても走って重いため採らない。
 */
export function createDevDistFreshnessPlugin(options: EnsureFreshDistOptions = {}): Plugin {
  return {
    name: "dragon-dev-dist-freshness",
    // `vite preview` も command は `serve`。画面の検査一式が使う preview では組み立てない。
    apply: (_config, env) => env.command === "serve" && env.isPreview !== true,
    config() {
      ensureFreshDist(options);
    },
  };
}
