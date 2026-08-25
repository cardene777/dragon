import { describe, it, expect } from "vitest";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * script が名指しする検査が実在することの検証 (#1339)。
 *
 * `#923` (図の直接操作を外す) と `#1095` (判定を持たない 91 件を外す) で検査 file が消えたが、
 * それを呼ぶ script 側が残った。 実測で `package.json` の 20 件中 10 件、dashboard の
 * 25 件中 14 件が実在しない file を名指ししていた。
 *
 * ## 落ち方が実行系で違う
 *
 * | 実行系 | 名指しが外れた時 |
 * |---|---|
 * | Playwright | `No tests found` を出して **exit 0** = 打った人は「通った」 と読む |
 * | vitest | `No test files found, exiting with code 1` = 落ちるので気付く |
 *
 * Playwright 側が危ない。 `pnpm test:audit` は 0 件のまま exit 0 を返し続けていた。
 *
 * ## `#1328` との関係
 *
 * `contributing-commands.test.ts` は「`CONTRIBUTING.md` に書いた cmd が `package.json` に
 * 実在するか」 を見る。 本検査はその 1 つ先、「script が名指しする検査 file が実在するか」 を見る。
 * 同じ鎖の別の環で、どちらが欠けても「打ったが 1 件も走らない」 が起きる。
 */

const ROOT = join(import.meta.dirname, "../../../..");
const SPA = join(ROOT, "apps/playground-spa");

/** 走査する file と、その中の相対 path が何を起点にするか */
const 走査対象 = [
  { rel: "package.json", 起点: ROOT, 種別: "package" as const },
  { rel: "apps/playground-spa/package.json", 起点: SPA, 種別: "package" as const },
  { rel: "apps/playground-spa/scripts/test-editor-dashboard.sh", 起点: SPA, 種別: "shell" as const },
];

/**
 * 検査 file を名指しする path を拾う。
 *
 * 拾うのは `src/` / `tests/` で始まり検査の拡張子で終わるものだけ。 `scripts/*.sh` のような
 * 実行 file は対象にしない = 名指しの意味が違う (呼ぶ相手であって検査ではない)。
 */
function 名指しされたpath(text: string): string[] {
  const 拾う = text.matchAll(/(?<![\w./-])((?:src|tests)\/[A-Za-z0-9._/-]+\.(?:test|spec)\.(?:ts|tsx))/gu);
  // 必須の群。 取れない形は regex と噛み合っていないので捨てる
  return [...new Set([...拾う].flatMap((m) => (m[1] === undefined ? [] : [m[1]])))];
}

/**
 * `playwright test <pattern>` の形で名指しする pattern を拾う。
 *
 * path ではなく正規表現なので、実在は「file 名に含まれるか」 で見る。 Playwright 自身が
 * file path への部分一致で絞るため、同じ判定になる。
 */
function 名指しされたpattern(text: string): string[] {
  const 拾う = text.matchAll(/playwright test\s+([A-Za-z0-9][A-Za-z0-9._-]*)(?=\s|"|$)/gu);
  // 必須の群。 取れない形は regex と噛み合っていないので捨てる
  return [...new Set([...拾う].flatMap((m) => (m[1] === undefined ? [] : [m[1]])))].filter(
    (p) => !p.includes("/"),
  );
}

/** 検査 file の一覧 (`src/` と `tests/` を再帰で舐める) */
function 検査fileら(dir: string, 出: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) 検査fileら(p, 出);
    else if (/\.(test|spec)\.(ts|tsx)$/u.test(e.name)) 出.push(e.name);
  }
  return 出;
}

const Vitest検査file = 検査fileら(join(SPA, "src"));
const Playwright検査file = 検査fileら(join(SPA, "tests"));

/** Playwright の `testDir` (`tests/`) 内で pattern に一致する検査があるか */
function Playwright検査に一致する(pattern: string): boolean {
  return Playwright検査file.some((f) => f.includes(pattern));
}

describe("script が名指しする検査が実在する (#1339)", () => {
  it("走査対象を読めている", () => {
    // 読めていなければ、以下の検査は通って当然になる
    for (const t of 走査対象) {
      expect(existsSync(join(ROOT, t.rel)), `走査対象が無い: ${t.rel}`).toBe(true);
    }
    expect(Vitest検査file.length, "Vitest の検査 file を 1 件も集められていない").toBeGreaterThan(0);
    expect(Playwright検査file.length, "Playwright の検査 file を 1 件も集められていない").toBeGreaterThan(0);
  });

  it("名指しを 1 件以上拾えている", () => {
    // 拾えていなければ「実在しない名指しが 0 件」 は自明に通る
    const 総数 = 走査対象.reduce((n, t) => {
      const text = readFileSync(join(ROOT, t.rel), "utf8");
      return n + 名指しされたpath(text).length + 名指しされたpattern(text).length;
    }, 0);
    expect(総数, "script から名指しを 1 件も拾えていない (検査が空振りしている)").toBeGreaterThan(0);
  });

  it("名指しした path が全て実在する", () => {
    const 無い: string[] = [];
    for (const t of 走査対象) {
      const text = readFileSync(join(ROOT, t.rel), "utf8");
      for (const p of 名指しされたpath(text)) {
        if (!existsSync(join(t.起点, p))) 無い.push(`${t.rel} → ${p}`);
      }
    }
    expect(無い, "script が実在しない検査を名指ししている").toEqual([]);
  });

  it("名指しした pattern が 1 件以上の検査に一致する", () => {
    // Playwright は一致 0 件でも exit 0 を返す。 打った人は「通った」 と読む
    const 空振り: string[] = [];
    for (const t of 走査対象) {
      const text = readFileSync(join(ROOT, t.rel), "utf8");
      for (const pat of 名指しされたpattern(text)) {
        if (!Playwright検査に一致する(pat)) 空振り.push(`${t.rel} → ${pat}`);
      }
    }
    expect(空振り, "script の pattern がどの検査にも一致しない").toEqual([]);
  });

  it("実在しない名指しを見つけられる (陽性対照)", () => {
    // 通る検査だけを置くと、判定が恒真でも気付けない
    // 実物の検査 file は全て ASCII 名なので、対照も同じ形にする
    const 偽 = '"test:x": "vitest run src/lib/no-such-check.test.ts"';
    const 拾えた = 名指しされたpath(偽);
    expect(拾えた, "名指しを拾えていない").toHaveLength(1);
    // 上の `toHaveLength(1)` が先に落ちるので、 ここへは 1 件ある時しか来ない
    const 先頭 = 拾えた[0];
    if (先頭 === undefined) return;
    expect(existsSync(join(SPA, 先頭)), "存在しない file を実在と判定している").toBe(false);
  });

  it("名指しを持たない script を拾わない (陰性対照)", () => {
    // 何でも拾う実装だと、上の検査は名指しの有無に関わらず落ちる
    expect(名指しされたpath('"build": "vite build"'), "名指しの無い script を拾っている").toEqual([]);
    expect(名指しされたpattern('"dev": "vite"'), "pattern の無い script を拾っている").toEqual([]);
  });

  it("Playwright pattern の一致対象を tests/ に限る (陽性・陰性対照)", () => {
    expect(Playwright検査に一致する("editor-stage-svg.spec"), "E2E 検査に一致しない").toBe(true);
    expect(Playwright検査に一致する("diagram-scale.test"), "Vitest の検査を E2E と判定している").toBe(false);
  });
});
