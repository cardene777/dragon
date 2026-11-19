/**
 * 集めた件の木を読む手助け (#3421、#3763)。
 * build した `dist` と軽い入口を読まないので、種類の検査が読んでも、関係する検査を選ぶ命令から見て全ての入口へ結ばれない。
 * `dist` を読む手助けは `export-support.ts` が持つ
 */
import type { RunnerTask, RunnerTestFile } from "vitest";

/**
 * 集めた件の木で、名前が `name` の件が入る describe の名前 (#3421、#3424)。
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
