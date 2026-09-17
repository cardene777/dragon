import { afterEach, describe, it, expect } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import globby from "globby";

import { 掃除の対象 } from "../../scripts/deploy-pages.mjs";

/**
 * 配信の掃除が dotfile に届き、`.git` を巻き込まないことの検証 (#1347)。
 *
 * `gh-pages` は公開用の clone を掃除してから `dist` を写す。 掃除が届かない file は
 * **そのまま公開される**。 実際に 1 度配信したところ 48 file のうち 12 件が repo の dotfile
 * だった (`.claude` / `.mcp.json` / `.npmrc` / `.github` 等)。
 *
 * 掃除は `globby` に pattern を渡す形で、既定は `dot: false`。 pattern が `.` で始まらない
 * 限り dotfile に一致しない。
 *
 * ## 実際に配信して確かめる形は採らない
 *
 * 公開対象を実物で見るには push が要る。 検査のたびに remote へ push する形は取れないため、
 * **掃除の pattern が何に一致するか** を一時 dir で確かめる。 掃除に使う値は配信 script から
 * import するので、script を直せば検査も追随する。
 *
 * ## `globby` を直接使う
 *
 * 掃除は `gh-pages` が `globby` に投げる。 別の matcher で測ると本物と違う判定になるため、
 * 同じ物を使う。 `gh-pages` の推移依存としてしか入っていなかったので、同じ版域
 * (`^11.1.0`) を `devDependencies` に足した。
 *
 * **版がずれたら落ちる検査を置く**。 `dot` の既定はこの matcher の仕様に依っており、
 * major が変われば判定が変わりうる。
 */

/** 配信の clone を模した一時 dir を作る (repo の dotfile と `.git` を含む) */
const 一時dirs = new Set<string>();
const 元の作業dir = process.cwd();

function 模したclone(): string {
  const d = mkdtempSync(join(tmpdir(), "deploy-payload-"));
  一時dirs.add(d);
  writeFileSync(join(d, "index.html"), "x");
  mkdirSync(join(d, "assets"));
  writeFileSync(join(d, "assets", "app.js"), "x");
  writeFileSync(join(d, "assets", ".old"), "x");
  mkdirSync(join(d, "assets", ".cache"));
  writeFileSync(join(d, "assets", ".cache", "entry.json"), "x");
  // repo から残る dotfile
  writeFileSync(join(d, ".npmrc"), "x");
  writeFileSync(join(d, ".prettierrc"), "x");
  mkdirSync(join(d, ".github"));
  writeFileSync(join(d, ".github", "t.yml"), "x");
  mkdirSync(join(d, ".claude"));
  mkdirSync(join(d, ".claude", "skills"));
  writeFileSync(join(d, ".claude", "skills", "s.md"), "x");
  // clone の管理情報
  mkdirSync(join(d, ".git"));
  mkdirSync(join(d, ".git", "objects"));
  writeFileSync(join(d, ".git", "HEAD"), "x");
  writeFileSync(join(d, ".git", "objects", "o"), "x");
  return d;
}

const 掃除される = (pattern: readonly string[]): string[] =>
  globby.sync([...pattern], { cwd: 模したclone() }).sort();

afterEach(() => {
  process.chdir(元の作業dir);
  for (const d of 一時dirs) rmSync(d, { recursive: true, force: true });
  一時dirs.clear();
});

describe("配信の掃除が dotfile に届く (#1347)", () => {
  it("gh-pages と同じ matcher を使っている", async () => {
    // 別の版で測ると本物と違う判定になる。 `dot` の既定が仕様の中心なので major を見る
    const 使う = (await import("globby/package.json")).default as { version: string };
    const ghpages = (await import("gh-pages/package.json")).default as {
      dependencies?: Record<string, string>;
    };
    const 要求 = ghpages.dependencies?.globby ?? "";
    expect(要求, "gh-pages が globby を要求していない (前提が変わっている)").not.toBe("");
    expect(
      使う.version.split(".")[0],
      `検査の globby (${使う.version}) が gh-pages の要求 (${要求}) と major で食い違う`,
    ).toBe(要求.replace(/^[^0-9]*/u, "").split(".")[0]);
  });

  it("模した clone を作れている", () => {
    // 作れていなければ、以下の検査は通って当然になる
    const 全部 = globby.sync(["**/*", ".*", ".*/**"], { cwd: 模したclone() });
    expect(全部.length, "模した clone が空 (検査が空振りしている)").toBeGreaterThan(0);
    expect(全部, "dotfile を置けていない").toContain(".npmrc");
    expect(全部, "`.git` を置けていない").toContain(".git/HEAD");
  });

  it("repo の dotfile を掃除の対象にする", () => {
    const 消える = 掃除される(掃除の対象);
    for (const f of [
      ".npmrc",
      ".prettierrc",
      ".github/t.yml",
      ".claude/skills/s.md",
      "assets/.old",
      "assets/.cache/entry.json",
    ]) {
      expect(消える, `dotfile が掃除されない: ${f}`).toContain(f);
    }
  });

  it("`.git` を掃除の対象にしない", () => {
    // clone の管理情報を消すと配信そのものが壊れる
    const 消える = 掃除される(掃除の対象);
    expect(
      消える.filter((f) => f === ".git" || f.startsWith(".git/")),
      "`.git` を掃除の対象にしている",
    ).toEqual([]);
  });

  it("build 成果物も掃除の対象にする (dist で上書きされる)", () => {
    // 掃除の後に `dist` を写すため、成果物も一度消えるのが正しい。 残すと前回の配信の
    // 名残 (消した図の file 等) が公開され続ける
    const 消える = 掃除される(掃除の対象);
    expect(消える, "index.html が掃除されない").toContain("index.html");
    expect(消える, "assets が掃除されない").toContain("assets/app.js");
  });

  it("既定の pattern では dotfile が残る (陰性対照)", () => {
    // 掃除の対象を絞る前の既定の pattern。 これで dotfile が残ることを見せないと、対象を
    // 変えた意味が読めない
    const 消える = 掃除される(["."]);
    expect(消える, "既定でも dotfile が消えている (前提が変わっている)").not.toContain(".npmrc");
    expect(消える, "既定で成果物が消えない").toContain("index.html");
  });

  it(".git が file の場所からも掃除の対象を走らせられる", () => {
    // Given: worktree と同じく `.git` が file の起動場所
    const 起動場所 = 模したclone();
    rmSync(join(起動場所, ".git"), { recursive: true });
    writeFileSync(join(起動場所, ".git"), "gitdir: /tmp/worktree-git");

    // When: globby が否定 pattern を起動場所に対して stat する
    process.chdir(起動場所);

    // Then: worktree でも掃除の対象は例外を投げない
    expect(() => 掃除される(掃除の対象)).not.toThrow();
  });

  it(".git が dir の場所では従来どおり .git を掃除しない", () => {
    // Given: 通常の repository と同じく `.git` が dir の起動場所
    const 起動場所 = 模したclone();

    // When: 掃除の対象を走らせる
    process.chdir(起動場所);

    // Then: clone の管理情報は対象外のまま
    expect(掃除される(掃除の対象)).not.toContain(".git/HEAD");
  });

  it(".git が無い場所からも掃除の対象を走らせられる", () => {
    // Given: `.git` を持たない起動場所
    const 起動場所 = mkdtempSync(join(tmpdir(), "deploy-payload-cwd-"));
    一時dirs.add(起動場所);

    // When: 掃除の対象を走らせる
    process.chdir(起動場所);

    // Then: 起動場所に `.git` がなくても例外を投げない
    expect(() => 掃除される(掃除の対象)).not.toThrow();
  });
});
