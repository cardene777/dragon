/**
 * 見本や入力ごとに分けた件を数える道具 (#3421、#3424、#3733)。
 *
 * 書き出しの道具 (`export-support.ts`) は Chromium と動画の道具を読むので、件を数えるだけの検査はこの file から読む。
 * 見本帳の検査 (`apps/playground-spa`) も同じ関数をここから読み、写しを持たない。
 */
import type { RunnerTask, RunnerTestFile } from "vitest";

/**
 * 集めた件の木で、名前が `name` の件が入る describe の名前を、file の中の出た順に返す。
 * `describe.for` の `$name` は字の列を引用符で囲んだ名前にするので、囲みを外して返す
 */
export function casesNamed(file: RunnerTestFile, name: string): string[] {
  const found: string[] = [];
  const walk = (seen: RunnerTask): void => {
    if (seen.type === "test" && seen.name === name) found.push((seen.suite?.name ?? "").replace(/^'(.*)'$/, "$1"));
    if (seen.type === "suite") seen.tasks.forEach(walk);
  };
  file.tasks.forEach(walk);
  return found;
}
