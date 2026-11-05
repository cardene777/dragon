/**
 * 頁を開く検査の Chromium を、検査の file の process の中で、file を読む前に起こし始める準備の段 (`chromium-preload.ts`、#3388)。
 *
 * この file は頁を開かないので、準備の段が Chromium を起こさないことをこの file の中で確かめる。
 * process が終わった後に何も残らないことは、頁を開く見本の検査を子の vitest で回して確かめる。
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const HERE = fileURLToPath(import.meta.url);
const ROOT = join(dirname(HERE), "../../../..");
const VITEST = join(dirname(createRequire(import.meta.url).resolve("vitest/package.json")), "vitest.mjs");
const FIXTURES = "test-support/fixtures/chromium";
const KEY = Symbol.for("dragon.chromium");

/** 準備の段が頁を開く file かを決める関数。まだ無い時もこの file の他の検査を走らせるため、読めない時は undefined を返す */
const loadOpensPages = async (): Promise<((path: string) => boolean) | undefined> => {
  const modulePath = "./chromium-preload";
  return ((await import(/* @vite-ignore */ modulePath).catch(() => ({}))) as { opensPages?: (path: string) => boolean }).opensPages;
};

const alive = (pid: number): boolean => {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
};

describe("頁を開く検査の Chromium を file の前に起こす準備の段 (#3388)", () => {
  it("chromium-not-preloaded-without-pages", async () => {
    // 頁を開かない検査の file では、準備の段は Chromium を起こさない
    const opensPages = await loadOpensPages();
    expect(opensPages, "頁を開く file かを決める関数 (chromium-preload.ts の opensPages) が無い").toBeTypeOf("function");
    expect((opensPages as (path: string) => boolean)(HERE), "頁を開かないこの file を、頁を開く file と読んだ").toBe(false);
    expect((opensPages as (path: string) => boolean)(join(dirname(HERE), "site-pages.test.ts")), "頁を開く file を、頁を開かない file と読んだ").toBe(true);
    expect((globalThis as Record<symbol, unknown>)[KEY], "頁を開かない検査の file で、準備の段が Chromium を起こした").toBeUndefined();
  });

  it("chromium-cleaned-on-process-exit", () => {
    // 検査の file の前後処理は Chromium を閉じず、file の process が終わると、Chromium の process と作業用の folder が残らない
    const dir = mkdtempSync(join(tmpdir(), "dragon-preload-"));
    const out = join(dir, "browser.json");
    try {
      const ran = spawnSync(process.execPath, [VITEST, "run", "--config", `${FIXTURES}/vitest.config.ts`, `${FIXTURES}/opens-chromium.fixture.ts`], {
        cwd: ROOT,
        encoding: "utf8",
        env: { ...process.env, FIXTURE_OUT: out },
      });
      const brief = `${ran.stdout}${ran.stderr}`
        .split("\n")
        .filter((line) => /fixture-|Error|準備の段/u.test(line))
        .map((line) => `| ${line.trim()}`)
        .join("\n");
      expect(ran.status, `頁を開く見本の検査が通らなかった:\n${brief}`).toBe(0);
      expect(existsSync(out), `見本の検査が Chromium の process を書いていない:\n${brief}`).toBe(true);
      const { pid, profile } = JSON.parse(readFileSync(out, "utf8")) as { pid: number; profile: string };
      expect(alive(pid), `file の process が終わった後も Chromium の process (${pid}) が残る`).toBe(false);
      expect(profile, "Chromium の作業用の folder を読めていない").toMatch(/playwright_chromiumdev_profile-/u);
      expect(existsSync(profile), `file の process が終わった後も作業用の folder が残る (${profile})`).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
