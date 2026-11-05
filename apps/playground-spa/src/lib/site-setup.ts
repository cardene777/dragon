/**
 * 頁を開く検査が使う見本帳の頁を、1 回の実行の準備の段 (`globalSetup`) で 1 度だけ build する (#3381)。
 *
 * 頁を開く検査の file がそれぞれ build し直していた時は、一式の中で同じ build を 18 回行っていた。
 * この段で build し、検査の file へ build した dir を渡す (`provide`)。`startSite` はそれを受けて使う。
 *
 * build するのは、この回に回す検査の file が `startSite()` か、それを包むサイトの検査の道具 `useSite()` (`site-support.ts`) を呼ぶ時だけ。頁を開かない回は build しない。
 * build の設定を名指す検査 (`startSite({ config: join(app, "…") })`) には、その設定の build を別に 1 度だけ行う。
 * 検査の前後処理は 1 件の上限 (10 秒) に収める決まりで、build はその中に収まらないので、前後処理ではなくこの段で行う。
 */
import { readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import type { TestProject } from "vitest/node";
import { app, type Built, buildPage } from "./site-build";

declare module "vitest" {
  export interface ProvidedContext {
    /** build した見本帳の頁。鍵は build の設定の `apps/playground-spa` からの path で、名指さない build は `default` */
    dragonSites: Record<string, Built>;
  }
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

export default async function setup(project: TestProject): Promise<() => void> {
  // 命令に渡した file の絞り (`vitest run <file>`) は `filenamePattern` に在る。型に出ていないので読む形だけ宣言する
  const vitest = project.vitest as typeof project.vitest & { filenamePattern?: string[] };
  const specs = await vitest.getRelevantTestSpecifications(vitest.filenamePattern);
  const keys = sitesNeeded(specs.map((spec) => readFileSync(spec.moduleId, "utf8")));
  const built = await Promise.all(
    keys.map(
      async (key) =>
        [key, await buildPage(key === DEFAULT_SITE ? undefined : join(app, key))] as const,
    ),
  );
  const sites = Object.fromEntries(built);
  project.provide("dragonSites", sites);
  return () => {
    for (const site of Object.values(sites)) rmSync(site.dir, { recursive: true, force: true });
  };
}
