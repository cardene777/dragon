/**
 * 頁を開く検査が使う見本帳の頁を、1 回の実行の準備の段 (`globalSetup`) で 1 度だけ build する (#3381)。
 *
 * 頁を開く検査の file がそれぞれ build し直していた時は、一式の中で同じ build を 18 回行っていた。
 * この段で build し、検査の file へ build した dir を渡す (`provide`)。`startSite` はそれを受けて使う。
 *
 * build するのは、この回に回す検査の file が `startSite()` か、それを包むサイトの検査の道具 `useSite()` (`site-support.ts`) を呼ぶ時だけ。頁を開かない回は build しない。
 * build の設定を名指す検査 (`startSite({ config: join(app, "…") })`) には、その設定の build を別に 1 度だけ行う。
 * 検査の前後処理は 1 件の上限 (10 秒) に収める決まりで、build はその中に収まらないので、前後処理ではなくこの段で行う。
 *
 * 頁を開く Chromium も、build する回にこの段で作業者ごとに 1 つずつ起こし、つなぐ先を渡す (#3384)。検査の file は自分の作業者の Chromium につなぐだけで、閉じるのはこの段の片付け。
 * 混んだ機械では Chromium を閉じるのに 10 秒を超えた回があり、検査が全部通った回を落ちた扱いにしたので、起こすのも閉じるのも前後処理の外に置く。
 * Chromium は 1 つずつ別の node の process で起こす (`chromium-server.mjs`)。この段の process で起こすと、全ての作業者の Playwright の通信が vitest の本体の process に集まり、検査が約 2 倍遅くなった。
 * 頁を開く file が作業者の数より少ない回は、その file の数だけ起こす。
 */
import { spawn } from "node:child_process";
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { TestProject } from "vitest/node";
import { app, type Built, buildPage } from "./site-build";

declare module "vitest" {
  export interface ProvidedContext {
    /** build した見本帳の頁。鍵は build の設定の `apps/playground-spa` からの path で、名指さない build は `default` */
    dragonSites: Record<string, Built>;
    /** この段が作業者ごとに起こした Chromium のつなぐ先。頁を開かない回は空 */
    dragonBrowsers: string[];
  }
}

/** 画面なしの Chromium を 1 つ、この process の外の node の process で起こす。`close` は Chromium を閉じ、その process が終わるまで待つ */
export async function launchChromiumServer(): Promise<{ endpoint: string; pid: number; close: () => Promise<void> }> {
  const child = spawn(process.execPath, [join(app, "src/lib/chromium-server.mjs")], { stdio: ["ignore", "ignore", "inherit", "ipc"] });
  const endpoint = await new Promise<string>((resolve, reject) => {
    child.once("message", (m) => resolve((m as { endpoint: string }).endpoint));
    child.once("exit", (code) => reject(new Error(`Chromium を起こす process が、つなぐ先を渡す前に終わった (終わり方 ${String(code)})`)));
  });
  const exited = new Promise<void>((done) => child.once("exit", () => done()));
  return {
    endpoint,
    pid: child.pid as number,
    close: async () => {
      if (child.connected) child.send("close");
      await exited;
    },
  };
}

/** 名指さない build の鍵 */
export const DEFAULT_SITE = "default";

const NAMED = /startSite\(\{\s*config:\s*join\(app,\s*"([^"]+)"\)\s*\}\)/gu;

/** 検査の file の字から、要る build の鍵を読む */
export function sitesNeeded(sources: string[]): string[] {
  const keys = new Set<string>();
  for (const text of sources) {
    if (/\b(?:startSite|useSite)\(\)/u.test(text)) keys.add(DEFAULT_SITE);
    for (const m of text.matchAll(NAMED)) if (m[1]) keys.add(m[1]);
  }
  return [...keys].sort();
}

export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  // 命令に渡した file の絞り (`vitest run <file>`) は `filenamePattern` に在る。型に出ていないので読む形だけ宣言する
  const vitest = project.vitest as typeof project.vitest & { filenamePattern?: string[] };
  const specs = await vitest.getRelevantTestSpecifications(vitest.filenamePattern);
  const sources = specs.map((spec) => readFileSync(spec.moduleId, "utf8"));
  const keys = sitesNeeded(sources);
  const pageFiles = sources.filter((text) => sitesNeeded([text]).length > 0).length;
  const browserCount = pageFiles === 0 ? 0 : Math.min(project.vitest.config.maxWorkers, pageFiles);
  // build と Chromium の起動は互いを待たないので、同時に始める
  const [built, browsers] = await Promise.all([
    Promise.all(
      keys.map(
        async (key) =>
          [key, await buildPage(key === DEFAULT_SITE ? undefined : join(app, key))] as const,
      ),
    ),
    Promise.all(Array.from({ length: browserCount }, () => launchChromiumServer())),
  ]);
  const sites = Object.fromEntries(built);
  project.provide("dragonSites", sites);
  project.provide("dragonBrowsers", browsers.map((browser) => browser.endpoint));
  return async () => {
    await Promise.all(browsers.map((browser) => browser.close()));
    for (const site of Object.values(sites)) rmSync(site.dir, { recursive: true, force: true });
  };
}
