/**
 * build した頁の中身を読む検査が使う見本帳の頁を、1 回の実行の準備の段 (`globalSetup`) で 1 度だけ build する (#3381)。
 *
 * この段で build し、検査の file へ build した dir を渡す (`provide`)。`builtDir` はそれを受けて使う。
 * build するのは、この回に回す検査の file が `builtDir()` を呼ぶ時だけ。呼ばない回は build しない。
 * 検査の前後処理は 1 件の上限 (10 秒) に収める決まりで、build はその中に収まらないので、前後処理ではなくこの段で行う。
 */
import { readFileSync, rmSync } from "node:fs";
import type { TestProject } from "vitest/node";
import { runSpecs } from "../../../../test-support/run-specs";
import { type Built, buildPage } from "./site-build";
import { sitesNeeded } from "./site-needs";

declare module "vitest" {
  export interface ProvidedContext {
    /** build した見本帳の頁。鍵は `site-needs.ts` の `DEFAULT_SITE` */
    dragonSites: Record<string, Built>;
  }
}

export default async function setup(project: TestProject): Promise<() => void> {
  const specs = await runSpecs(project.vitest);
  const keys = sitesNeeded(specs.map((spec) => readFileSync(spec.moduleId, "utf8")));
  const built = await Promise.all(
    keys.map(async (key) => [key, await buildPage()] as const),
  );
  const sites = Object.fromEntries(built);
  project.provide("dragonSites", sites);
  return () => {
    for (const site of Object.values(sites)) rmSync(site.dir, { recursive: true, force: true });
  };
}
