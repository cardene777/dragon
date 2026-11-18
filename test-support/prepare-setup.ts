/**
 * 回す検査の file の重い仕事を、1 回の実行の準備の段 (`globalSetup`) で済ませる (#3734)。
 *
 * この回に回す検査の file のうち、同じ名前の準備の file (`<名前>.prepare.ts`) を持つ file の準備だけを並べて走らせる。
 * 準備の file を持つ file を回さない回は、何も走らせない。
 * 結果は検査の file の path (repo の根から) を鍵にして検査の file へ渡す (`provide`)。件は `packages/dragon/test/prepared.ts` で読む。
 * 準備の段は 1 件 10 秒の上限の外にあり、1 回の実行の上限 (5 分) の中にある (`run-limit.ts` の後に置く)。
 * 準備が使った書き出しの thread と Chromium は、全ての準備が終わった所で閉じる。件が回る間に残さない。
 */
import { relative } from "node:path";
import { pathToFileURL } from "node:url";
import type { TestProject } from "vitest/node";
import { closePrepareTools } from "./prepare-tools";
import { preparesFor, runPrepares } from "./prepare";

export default async function setup(project: TestProject): Promise<void> {
  // 命令に渡した file の絞り (`vitest run <file>`) は `filenamePattern` に在る。型に出ていないので読む形だけ宣言する
  const vitest = project.vitest as typeof project.vitest & { filenamePattern?: string[] };
  const specs = await vitest.getRelevantTestSpecifications(vitest.filenamePattern);
  const chosen = preparesFor([...new Set(specs.map((spec) => spec.moduleId))]);
  try {
    const results = await runPrepares(
      chosen.map(({ testFile, prepareFile }) => ({
        key: relative(project.config.root, testFile),
        run: async () => {
          const mod = (await import(/* @vite-ignore */ pathToFileURL(prepareFile).href)) as {
            default: () => Promise<unknown>;
          };
          return mod.default();
        },
      })),
    );
    project.provide("dragonPrepared", results);
  } finally {
    await closePrepareTools();
  }
}
