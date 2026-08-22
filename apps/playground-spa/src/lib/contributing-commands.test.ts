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
 * `--filter <pkg>` が付く形はその package、`cd <dir> && pnpm ...` は移動先、
 * どちらも付かない形は root の `package.json` を見る。
 */
type 書かれたCmd = { 行: string; script: string; filter?: string; cwd?: string };

export function 書かれたcmd(md: string): 書かれたCmd[] {
  const 拾う: 書かれたCmd[] = [];
  let block = false;
  let cwd: string | undefined;
  for (const 行 of md.split("\n")) {
    if (行.startsWith("```")) {
      block = !block;
      cwd = undefined;
      continue;
    }
    if (!block) continue;
    for (const 部分 of 行.trim().split(/\s*&&\s*/u)) {
      const cd = /^cd\s+(\S+)$/u.exec(部分);
      if (cd !== null) {
        cwd = cd[1]!;
        continue;
      }
      const m = /^pnpm\s+(?:--filter\s+(\S+)\s+)?([a-z][a-z0-9:._-]*)/u.exec(部分);
      if (m === null) continue;
      const script = m[2];
      // pnpm 自身の cmd は script ではない
      if (["install", "exec", "dlx", "add", "remove", "run", "why", "up"].includes(script))
        continue;
      拾う.push({
        行: 行.trim(),
        script,
        ...(m[1] === undefined ? {} : { filter: m[1] }),
        ...(cwd === undefined ? {} : { cwd }),
      });
    }
  }
  return 拾う;
}

/** filter 名から `package.json` の場所を引く。 載っていない package は検査できない */
const packageの場所: Readonly<Record<string, string>> = {
  "dragon-playground-spa": "apps/playground-spa/package.json",
};

/** code block 内で `cd` した先。 repo 外の path を文書から読ませないため allowlist にする */
const cwdのpackageの場所: Readonly<Record<string, string>> = {
  dragon: "package.json",
  "apps/playground-spa": "apps/playground-spa/package.json",
};

function 実在しないcmd(cmds: readonly 書かれたCmd[]): string[] {
  const root = scriptsを引く("package.json");
  const 無い: string[] = [];
  for (const c of cmds) {
    if (c.filter === undefined && c.cwd === undefined) {
      if (!root.has(c.script)) 無い.push(`${c.行} (root に ${c.script} が無い)`);
      continue;
    }
    const 場所 =
      c.filter !== undefined
        ? packageの場所[c.filter]
        : c.cwd !== undefined
          ? cwdのpackageの場所[c.cwd]
          : undefined;
    if (場所 === undefined) {
      const 対象 = c.filter === undefined ? c.cwd : c.filter;
      無い.push(`${c.行} (${対象} の package.json の場所を知らない)`);
      continue;
    }
    if (!scriptsを引く(場所).has(c.script)) {
      const 対象 = c.filter === undefined ? c.cwd : c.filter;
      無い.push(`${c.行} (${対象} に ${c.script} が無い)`);
    }
  }
  return 無い;
}

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

  it("cd の後に続く cmd を、その移動先と一緒に拾えている", () => {
    expect(cmds).toContainEqual({
      行: "cd apps/playground-spa && pnpm preview",
      script: "preview",
      cwd: "apps/playground-spa",
    });
  });

  it("code block を跨いで cd の移動先を持ち越さない", () => {
    // **実物では区別できない**。 `cd dragon` を含む block の後ろに来る block の cmd は、
    // 持ち越しても `dragon` が root を指すため同じ結果になる (変異で 0 件 FAIL を実測)。
    // 判定を直接突いて、block が変われば cwd が切れることを見る
    const 拾えた = 書かれたcmd(
      ["```bash", "cd apps/playground-spa", "```", "", "```bash", "pnpm test:watch", "```"].join(
        "\n",
      ),
    );
    expect(拾えた, "block を跨いで cwd を持ち越している").toEqual([
      { 行: "pnpm test:watch", script: "test:watch" },
    ]);
  });

  it("同じ block の中では cd の移動先が続く", () => {
    // 上の検査だけだと、cwd を 1 度も持たない実装 (cd を無視する) でも通る
    const 拾えた = 書かれたcmd(
      ["```bash", "cd apps/playground-spa", "pnpm preview", "```"].join("\n"),
    );
    expect(拾えた, "同じ block の中で cwd が続いていない").toEqual([
      { 行: "pnpm preview", script: "preview", cwd: "apps/playground-spa" },
    ]);
  });

  it("cd の後は root でなく移動先の package scripts と照合する", () => {
    const 拾えた = 書かれたcmd(
      ["```bash", "cd apps/playground-spa", "pnpm test:e2e", "pnpm test", "```"].join("\n"),
    );
    // test:e2e は移動先だけ、test は root だけにある。片側だけでは照合先の退行を検出できない
    expect(実在しないcmd(拾えた)).toEqual(["pnpm test (apps/playground-spa に test が無い)"]);
  });

  it("書いた cmd がすべて実在する", () => {
    expect(実在しないcmd(cmds), "CONTRIBUTING.md に実在しない cmd が書かれている").toEqual([]);
  });
});
