/**
 * 記法の検査の段 (`scripts/dragon-lint.mjs`) が、隣のファイルを読み込む見本を読めることの検査 (#1918)。
 *
 * ## なぜ段を起動して確かめるのか
 *
 * カタログの検査 (`vitest`) は `Vite` が拡張子なしの相対読み込みを解決するので、見本を読めて当然に見える。
 * 段は `pnpm lint:notation` から素の `node` で起動され、`node` は拡張子なしの読み込みを解決しない。
 * `presets.cdl.ts` が `./relation-focus` を読むようになってから (#1758)、段は最初のファイルで落ち、
 * 並べた 12 ファイルのどれも検査していなかった。 同じ読み方で起動しないとこの食い違いは見えない。
 *
 * ## この検査が見るもの
 *
 * 1. 隣のファイルを拡張子なしで読む見本を渡すと、段が終了値 0 で終わり、見本の図を数える
 * 2. 読み込む先が無い見本を渡すと、段は黙って飛ばさず非 0 で終わる
 *
 * 見本は一時 dir に書く。 カタログの図の一覧や他の検査が走査する場所に置くと、試験用の図が紛れ込む。
 * 一時 dir には `"type": "module"` の `package.json` を置く。 repo の見本は全て `"type": "module"` の
 * package の下にあり (root も `apps/playground-spa` も同じ)、置かないと `.ts` が CommonJS として扱われて
 * 実物と別の読み方を確かめることになる。
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const ここ = dirname(fileURLToPath(import.meta.url));
const 検査の段 = join(ここ, "../scripts/dragon-lint.mjs");

/** 型の注釈を持つ隣のファイル。 段が型を剥がして読めることも併せて確かめる。 */
const 隣のファイル = `export const 図の題: string = "隣から読んだ題";\n`;

function 見本を書く(読み込む先: string): string {
  return [
    `import { 図の題 } from "${読み込む先}";`,
    ``,
    `export const 隣を読む図 = {`,
    `  id: "lint-cli-neighbor",`,
    `  topic: 図の題,`,
    `  lanes: [{ id: "l", x: 0, width: 400 }],`,
    `  nodes: [{ id: "a", lane: "l", stack: 0, title: "箱" }],`,
    `  edges: [],`,
    `  states: [],`,
    `  phases: [{ id: "p", duration: 1000, title: "段", body: "", activate: [], tweens: [], sets: [] }],`,
    `};`,
    ``,
  ].join("\n");
}

function 段を起動する(見本: string) {
  return spawnSync("node", [検査の段, 見本], { encoding: "utf8" });
}

describe("記法の検査の段は隣のファイルを読む見本を読める (#1918)", () => {
  let 置き場: string;

  beforeAll(() => {
    置き場 = mkdtempSync(join(tmpdir(), "dragon-lint-cli-"));
    writeFileSync(join(置き場, "package.json"), `{ "type": "module" }\n`);
    writeFileSync(join(置き場, "neighbor.ts"), 隣のファイル);
    writeFileSync(join(置き場, "reads-neighbor.cdl.ts"), 見本を書く("./neighbor"));
    writeFileSync(join(置き場, "reads-missing.cdl.ts"), 見本を書く("./missing"));
  });

  afterAll(() => {
    rmSync(置き場, { recursive: true, force: true });
  });

  it("拡張子なしで隣を読む見本を検査して終了値 0 で終わる", () => {
    const 結果 = 段を起動する(join(置き場, "reads-neighbor.cdl.ts"));
    expect(結果.status, `段が落ちた:\n${結果.stderr}`).toBe(0);
    expect(結果.stdout, "見本の見出しが出ていない (見本を読めていない)").toContain(
      "reads-neighbor.cdl.ts` (図 1 件)",
    );
    expect(結果.stdout, "図を 1 つも数えていない (検査が空振りしている)").toContain(
      "検査した図: 1 件",
    );
  });

  it("読み込む先が無い見本は黙って飛ばさず非 0 で終わる", () => {
    const 結果 = 段を起動する(join(置き場, "reads-missing.cdl.ts"));
    expect(結果.status, "読めない見本を検査したことにしている").not.toBe(0);
    expect(結果.stdout, "読めない見本を数えている").not.toContain("検査した図: 1 件");
  });
});
