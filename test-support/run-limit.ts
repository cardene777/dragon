/**
 * 1 回の実行の上限 (`RUN_LIMIT_MS`、#3381)。準備の段 (`globalSetup`) として、検査を回し始める前に時計を起こす。
 *
 * 上限を過ぎたら、終わっていない検査の名前を出し、残りを回さずに終わり方 1 で終わる。
 * 1 件の上限 (10 秒) に収まる検査でも、数が積もれば待つ時間は延びる。延びたことを名前と共に見せる。
 *
 * 終わっていない検査は、file > 組 > 検査 の名前で出す。まだ中を読んでいない file は file の名前だけを出す。
 * 止める時は、vitest に残りを回させない (`cancelCurrentRun`) うえで、1 秒待って process を閉じる。
 * vitest は走っている検査が終わるまで待つので、それを待つと止まらない検査で止まらない。
 *
 * 環境変数 `DRAGON_UNFINISHED_OUT` が file を名指す時は、止める前にそこへ JSON を書く (#3386)。
 * `unfinished` は終わっていない検査を持つ file、`failed` は終わった file で落ちた検査の名前で、関係する検査を回す命令 (`scripts/test-related.mjs`) が読んで続きを回す。
 * 終わっていない file で落ちた検査は書かない。続きでその file を丸ごと回し直すので、そちらの結果を使う。
 */
import { writeFileSync } from "node:fs";
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

/** 検査の file と、その中の検査を 1 つずつ渡す */
function eachFile(project: TestProject, visit: (path: string, file: Task) => void): void {
  for (const file of project.vitest.state.getFiles() as unknown as (Task & { filepath: string })[]) visit(relative(project.config.root, file.filepath), file);
}

/** 検査を、file > 組 > 検査 の名前と共に 1 つずつ渡す */
function eachTest(path: string, file: Task, visit: (name: string, test: Task) => void): void {
  const walk = (task: Task, trail: string[]): void => {
    if (task.type === "test") {
      visit([path, ...trail, task.name].join(" > "), task);
      return;
    }
    for (const child of task.tasks ?? []) walk(child, task === file ? trail : [...trail, task.name]);
  };
  walk(file, []);
}

/** 終わっていない検査の名前 */
function unfinished(project: TestProject): string[] {
  const names: string[] = [];
  eachFile(project, (path, file) => {
    if (DONE.has(file.result?.state ?? "")) return;
    const before = names.length;
    eachTest(path, file, (name, test) => {
      if (!DONE.has(test.result?.state ?? "")) names.push(name);
    });
    if (names.length === before) names.push(path);
  });
  return names;
}

/** 続きを回す命令へ渡す、終わっていない file と、終わった file で落ちた検査の名前 */
function leftover(project: TestProject): { unfinished: string[]; failed: string[] } {
  const files: string[] = [];
  const failed: string[] = [];
  eachFile(project, (path, file) => {
    if (!DONE.has(file.result?.state ?? "")) {
      files.push(path);
      return;
    }
    eachTest(path, file, (name, test) => {
      if (test.result?.state === "fail") failed.push(name);
    });
  });
  return { unfinished: files, failed };
}

export default function setup(project: TestProject): () => void {
  const limit = runLimitMs();
  project.provide("dragonRunLimitMs", limit);
  const timer = setTimeout(() => {
    const names = unfinished(project);
    process.stderr.write(`\n1回の実行の上限 ${limit / 1000} 秒を超えたので、残りの検査を回さずに止める (#3381)。終わっていない検査 ${names.length} 件:\n${names.map((name) => `  ${name}\n`).join("")}`);
    const out = process.env.DRAGON_UNFINISHED_OUT;
    if (out) writeFileSync(out, JSON.stringify(leftover(project)));
    void project.vitest.cancelCurrentRun("test-failure");
    setTimeout(() => process.exit(1), 1_000);
  }, limit);
  // 実行が上限より先に終わった時に、時計だけで process を残さない
  timer.unref();
  return () => clearTimeout(timer);
}
