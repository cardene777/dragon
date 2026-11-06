/**
 * npm に出す package の file の一覧を、1 回の実行の準備の段 (`globalSetup`) で 1 度だけ出す (#3410)。
 *
 * `npm pack --dry-run` は npm の起動と、41MB を圧縮した大きさまで数える手間で、1 つで回しても数秒から 20 秒を超えた。
 * 検査の中で起こすと、混んだ機械で 1 件の上限 (10 秒) を超えて落ちる。準備の段はその上限の外にあるので、ここで起こして一覧を検査の file へ渡す (`provide`)。
 * 一覧は npm 自身の答えをそのまま使い、選び方を写さない。写すと npm が実際に出す物と食い違う形を見落とす。
 *
 * 起こすのは、この回に回す検査の file が一覧を読む時 (字に `dragonPackFiles` を持つ時) だけ。読まない回は npm を起こさない。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    /** `npm pack --dry-run` が npm に出すと答えた file の path (package の dir から見た相対 path)。一覧を読む検査の file を回さない回は空 */
    dragonPackFiles: string[];
  }
}

const PACKAGE = join(import.meta.dirname, "../packages/dragon");

/** 検査の file の字が、npm に出す file の一覧を読むか */
export const needsPackFiles = (sources: readonly string[]): boolean => sources.some((text) => text.includes("dragonPackFiles"));

/** `npm pack --dry-run` が npm に出すと答えた file の path */
export function packFiles(dir: string = PACKAGE): string[] {
  const out = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const [pack] = JSON.parse(out) as { files: { path: string }[] }[];
  return (pack?.files ?? []).map((file) => file.path);
}

export default async function setup(project: TestProject): Promise<void> {
  // 命令に渡した file の絞り (`vitest run <file>`) は `filenamePattern` に在る。型に出ていないので読む形だけ宣言する
  const vitest = project.vitest as typeof project.vitest & { filenamePattern?: string[] };
  const specs = await vitest.getRelevantTestSpecifications(vitest.filenamePattern);
  const sources = specs.map((spec) => readFileSync(spec.moduleId, "utf8"));
  project.provide("dragonPackFiles", needsPackFiles(sources) ? packFiles() : []);
}
