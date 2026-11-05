/**
 * 1 回の実行の上限 (`RUN_LIMIT_MS`、#3381)。準備の段 (`globalSetup`) として、検査を回し始める前に時計を起こす。
 *
 * 上限を過ぎたら、終わっていない検査の名前を出し、残りを回さずに終わり方 1 で終わる。
 * 1 件の上限 (10 秒) に収まる検査でも、数が積もれば待つ時間は延びる。延びたことを名前と共に見せる。
 *
 * 終わっていない検査は、file > 組 > 検査 の名前で出す。まだ中を読んでいない file は file の名前だけを出す。
 * 止める時は、vitest に残りを回させない (`cancelCurrentRun`) うえで、1 秒待って process を閉じる。
 * vitest は走っている検査が終わるまで待つので、それを待つと止まらない検査で止まらない。
 */
import { relative } from "node:path";
import type { TestProject } from "vitest/node";
import { runLimitMs } from "./limits";

declare module "vitest" {
  export interface ProvidedContext {
    /** 1 回の実行の上限 (ms)。上限の検査が読む */
    dragonRunLimitMs: number;
  }
}

interface Task {
  type: string;
  name: string;
  result?: { state?: string };
  tasks?: Task[];
}

const DONE = new Set(["pass", "fail", "skip", "todo"]);

/** 終わっていない検査の名前 */
function unfinished(project: TestProject): string[] {
  const names: string[] = [];
  for (const file of project.vitest.state.getFiles() as unknown as (Task & { filepath: string })[]) {
    const path = relative(project.config.root, file.filepath);
    if (DONE.has(file.result?.state ?? "")) continue;
    const before = names.length;
    const walk = (task: Task, trail: string[]): void => {
      if (task.type === "test") {
        if (!DONE.has(task.result?.state ?? "")) names.push([path, ...trail, task.name].join(" > "));
        return;
      }
      for (const child of task.tasks ?? []) walk(child, task === file ? trail : [...trail, task.name]);
    };
    walk(file, []);
    if (names.length === before) names.push(path);
  }
  return names;
}

export default function setup(project: TestProject): () => void {
  const limit = runLimitMs();
  project.provide("dragonRunLimitMs", limit);
  const timer = setTimeout(() => {
    const names = unfinished(project);
    process.stderr.write(`\n1回の実行の上限 ${limit / 1000} 秒を超えたので、残りの検査を回さずに止める (#3381)。終わっていない検査 ${names.length} 件:\n${names.map((name) => `  ${name}\n`).join("")}`);
    void project.vitest.cancelCurrentRun("test-failure");
    setTimeout(() => process.exit(1), 1_000);
  }, limit);
  // 実行が上限より先に終わった時に、時計だけで process を残さない
  timer.unref();
  return () => clearTimeout(timer);
}
