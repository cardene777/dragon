import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * `CONTRIBUTING.md` に書いた cmd が実在することの検証 (#1328)。
 *
 * 実在しない script を `--filter` 付きで呼ぶと、pnpm は **黙って skip して exit 0 を返す**。
 * 手順どおりに打った人は「通った」 と読むが、1 件も走っていない。
 *
 * 実際に踏んだ = `pnpm --filter dragon-playground-spa test` と書かれていたが、その script は
 * 無かった。 出力 0 行 / exit 0 で、誰も気付かないまま画面の検査が回されない状態が続いた。
 */

const ROOT = join(import.meta.dirname, "../../../..");

const 読む = (rel: string): string => readFileSync(join(ROOT, rel), "utf8");

const scriptsを引く = (rel: string): ReadonlySet<string> => {
  const pkg = JSON.parse(読む(rel)) as { scripts?: Record<string, string> };
  return new Set(Object.keys(pkg.scripts ?? {}));
};

/**
 * `CONTRIBUTING.md` から `pnpm` の cmd を拾う。
 *
 * 拾うのは code block の中だけ。 地の文で `pnpm test` に触れた時まで実在を求めると、
 * 説明が書けなくなる。
 *
 * `--filter <pkg>` が付く形は、その package の `package.json` を見る。 付かない形は root。
 */
function 書かれたcmd(md: string): Array<{ 行: string; script: string; filter?: string }> {
  const 拾う: Array<{ 行: string; script: string; filter?: string }> = [];
  let block = false;
  for (const 行 of md.split("\n")) {
    if (行.startsWith("```")) {
      block = !block;
      continue;
    }
    if (!block) continue;
    const m = /^pnpm\s+(?:--filter\s+(\S+)\s+)?([a-z][a-z0-9:._-]*)/u.exec(行.trim());
    if (m === null) continue;
    const script = m[2]!;
    // pnpm 自身の cmd は script ではない
    if (["install", "exec", "dlx", "add", "remove", "run", "why", "up"].includes(script)) continue;
    拾う.push({ 行: 行.trim(), script, ...(m[1] === undefined ? {} : { filter: m[1] }) });
  }
  return 拾う;
}

/** filter 名から `package.json` の場所を引く。 載っていない package は検査できない */
const packageの場所: Readonly<Record<string, string>> = {
  "dragon-playground-spa": "apps/playground-spa/package.json",
};

describe("CONTRIBUTING.md に書いた cmd (#1328)", () => {
  const md = 読む("CONTRIBUTING.md");
  const cmds = 書かれたcmd(md);

  it("cmd を 1 つ以上拾えている (検査が空振りしていない)", () => {
    expect(cmds.length).toBeGreaterThan(0);
  });

  it("filter 付きの cmd を 1 つ以上拾えている", () => {
    // filter 付きが本 Issue で踏んだ形。 拾えていないと肝心の経路を見ていない
    expect(cmds.filter((c) => c.filter !== undefined).length).toBeGreaterThan(0);
  });

  it("書いた cmd がすべて実在する", () => {
    const root = scriptsを引く("package.json");
    const 無い: string[] = [];
    for (const c of cmds) {
      if (c.filter === undefined) {
        if (!root.has(c.script)) 無い.push(`${c.行} (root に ${c.script} が無い)`);
        continue;
      }
      const 場所 = packageの場所[c.filter];
      if (場所 === undefined) {
        無い.push(`${c.行} (${c.filter} の package.json の場所を知らない)`);
        continue;
      }
      if (!scriptsを引く(場所).has(c.script)) 無い.push(`${c.行} (${c.filter} に ${c.script} が無い)`);
    }
    expect(無い, "CONTRIBUTING.md に実在しない cmd が書かれている").toEqual([]);
  });
});
