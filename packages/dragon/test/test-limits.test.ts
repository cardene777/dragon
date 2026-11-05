/**
 * 検査の時間の上限 (#3381)。
 *
 * 1 件の検査と、その前後処理は 10 秒で止める。
 * 1 回の実行は 5 分で全体を止め、終わっていない検査の名前を出して終わり方 1 で終わる。
 * 止まらずに待ち続ける検査と、遅いまま残る検査を、待つ人が気付く前に名前で見せるため。
 *
 * 上限は環境変数で下げられるが、上げられない (`DRAGON_TEST_LIMIT_MS`、`DRAGON_RUN_LIMIT_MS`)。
 * 下げられるのは、上限を超える見本の検査をこの検査の中で数秒で起こすため。
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, inject, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const VITEST = join(dirname(createRequire(import.meta.url).resolve("vitest/package.json")), "vitest.mjs");
const FIXTURES = "test-support/fixtures/limits";

interface Ran {
  code: number | null;
  out: string;
  /**
   * 失敗の文に載せる、子の vitest の出力の要る行。各行の頭に `| ` を付ける。
   * 子の結果の行 (`✓`、`×`、`Tests`) をそのまま載せると、親の出力を読む関門が子の検査を親の検査と数える
   */
  brief: string;
}

/** 上限を超える見本の検査を、repo の設定で回す。`env` で上限を下げる */
function runFixture(file: string | string[], env: Record<string, string>, args: string[] = []): Ran {
  const files = (Array.isArray(file) ? file : [file]).map((name) => `${FIXTURES}/${name}`);
  const ran = spawnSync(process.execPath, [VITEST, "run", "--config", `${FIXTURES}/vitest.config.ts`, "--reporter=verbose", ...args, ...files], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, ...env },
  });
  const out = `${ran.stdout}${ran.stderr}`;
  const brief = out
    .split("\n")
    .filter((line) => /fixture-|上限|timed out|Error/u.test(line))
    .map((line) => `| ${line.trim()}`)
    .join("\n");
  return { code: ran.status, out, brief };
}

/** 準備の段が検査へ渡す値。渡していない時は undefined */
const provided = (key: string): unknown => (inject as (k: string) => unknown)(key);

describe("検査の時間の上限 (#3381)", () => {
  it("test-limit-is-ten-seconds", ({ task }) => {
    expect(task.timeout, "1 件の検査の上限が 10 秒でない").toBe(10_000);
  });

  it("test-over-limit-is-stopped-and-named", () => {
    const test = runFixture("slow-test.fixture.ts", { DRAGON_TEST_LIMIT_MS: "500", FIXTURE_SLEEP_MS: "1500" });
    expect(test.code, `上限を超えた検査が落ちなかった:\n${test.brief}`).toBe(1);
    expect(test.out, "上限を超えた検査の名前と、上限で止めたことを出していない").toMatch(/fixture-sleeps-past-test-limit[\s\S]*timed out/u);
    expect(test.out, "自分で長い上限を書いた検査を、repo の上限で止めていない").toMatch(/×[^\n]*fixture-raises-its-own-limit/u);
    const hook = runFixture("slow-hook.fixture.ts", { DRAGON_TEST_LIMIT_MS: "500", FIXTURE_SLEEP_MS: "1500" });
    expect(hook.code, `上限を超えた前処理が落ちなかった:\n${hook.brief}`).toBe(1);
    expect(hook.out, "上限を超えた前処理を止めたことを出していない").toMatch(/Hook timed out/u);
  });

  it("run-limit-is-five-minutes", () => {
    expect(provided("dragonRunLimitMs"), "1 回の実行の上限が 5 分でない").toBe(300_000);
  });

  it("run-limit-stops-whole-run", () => {
    const ran = runFixture("long-run.fixture.ts", { DRAGON_RUN_LIMIT_MS: "3000" });
    expect(ran.code, `1 回の実行の上限を超えたのに終わり方 1 で終わらなかった:\n${ran.brief}`).toBe(1);
    expect(ran.out, "1 回の実行の上限で止めたことと、終わっていない検査の名前を出していない").toMatch(/1回の実行の上限[\s\S]*fixture-runs-past-run-limit/u);
    expect(ran.out, "上限で止めずに、検査が終わるまで待った").not.toMatch(/✓[^\n]*fixture-runs-past-run-limit/u);
  });

  it("run-limit-writes-unfinished-files", () => {
    // 上限で止めた時、`DRAGON_UNFINISHED_OUT` が名指す file に、終わっていない検査の file と、終わった file で落ちた検査の名前を書く (#3386)。
    // 関係する検査を回す命令 (`scripts/test-related.mjs`) が、これを読んで続きを回す。
    // 作業者を 1 つにして 3 秒より長い見本を 2 つ渡すので、上限の時に片方は必ずまだ始まっていない。始まっていない file も終わっていない file に数える
    const dir = mkdtempSync(join(tmpdir(), "dragon-unfinished-"));
    const out = join(dir, "unfinished.json");
    const quick = `${FIXTURES}/quick-fail.fixture.ts`;
    try {
      const ran = runFixture(["quick-fail.fixture.ts", "long-run.fixture.ts", "slow-test.fixture.ts"], { DRAGON_RUN_LIMIT_MS: "3000", FIXTURE_SLEEP_MS: "7000", DRAGON_UNFINISHED_OUT: out }, ["--maxWorkers=1"]);
      expect(ran.code, `1 回の実行の上限を超えたのに終わり方 1 で終わらなかった:\n${ran.brief}`).toBe(1);
      expect(existsSync(out), `上限で止めた時に、終わっていない file を書いていない:\n${ran.brief}`).toBe(true);
      const written = JSON.parse(readFileSync(out, "utf8")) as { unfinished?: string[]; failed?: string[] };
      expect(written.unfinished, "上限で止まった見本と、まだ始まっていない見本の両方を、終わっていない file に数えていない").toEqual(expect.arrayContaining([`${FIXTURES}/long-run.fixture.ts`, `${FIXTURES}/slow-test.fixture.ts`]));
      // 先に落ちる見本は、上限より前に回ったなら落ちた検査に、まだ始まっていないなら終わっていない file に、どちらか一方だけ入る
      const quickLeft = written.unfinished?.includes(quick) ?? false;
      expect(written.unfinished, "終わっていない file に、渡していない file か同じ file が在る").toHaveLength(quickLeft ? 3 : 2);
      expect(written.failed, "終わった file で落ちた検査の名前を書いていない").toEqual(quickLeft ? [] : [`${quick} > 1 回の実行の上限の前に落ちる見本 > fixture-fails-before-run-limit`]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
