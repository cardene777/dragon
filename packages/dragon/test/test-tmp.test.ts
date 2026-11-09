/**
 * 検査が作る一時フォルダを、実行の終わりに丸ごと消す (#3587)。
 *
 * 準備の段 (`test-support/run-tmp.ts`) が実行ごとの一時フォルダを作り、`TMPDIR` をそこへ向ける。
 * 検査と、検査が起こす子の process の一時フォルダは全てその下に入るので、検査の file が消し忘れても残らない。
 * 止められて消せなかった分は次の実行が消す。別の作業場所で走っている実行の分は消さない。
 *
 * 上限で止めた回は `packages/dragon/test/test-limits.test.ts` の `run-limit-stops-whole-run` が確かめる。
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const VITEST = join(dirname(createRequire(import.meta.url).resolve("vitest/package.json")), "vitest.mjs");
const FIXTURES = "test-support/fixtures/limits";

interface RunTmp {
  default: () => () => void;
  sweepDeadRuns: (base: string) => void;
}
const RUN_TMP = "../../../test-support/run-tmp";
/** 準備の段の道具。file が無い間も、この file を読み込んだ所で落とさず、検査ごとに無いと断って落とす */
const runTmp = async (): Promise<Partial<RunTmp>> => (await import(/* @vite-ignore */ RUN_TMP).catch(() => ({}))) as Partial<RunTmp>;

/** 走っている実行の一時フォルダの下に、試す場所を作る。この場所もその実行の終わりに消える */
const sandbox = (): string => mkdtempSync(join(tmpdir(), "dragon-sandbox-"));

describe("実行ごとの一時フォルダ (#3587)", () => {
  it("run-tmp-points-tests-at-run-dir", () => {
    // 名前の番号は実行の親の process。動いているかを次の実行がこの番号で読むので、検査の file の process の番号では困る
    expect(basename(tmpdir()), "検査の中の tmpdir() がこの実行の一時フォルダでない").toMatch(new RegExp(`^dragon-run-${process.ppid}-`, "u"));
  });

  it("run-tmp-cleans-after-passing-run", async () => {
    const { default: setup } = await runTmp();
    expect(setup, "準備の段の道具 (test-support/run-tmp.ts) が無い").toBeTypeOf("function");
    if (!setup) return;
    const before = process.env.TMPDIR;
    const base = sandbox();
    process.env.TMPDIR = base;
    try {
      const stop = setup();
      const made = mkdtempSync(join(tmpdir(), "dragon-left-"));
      writeFileSync(join(made, "left.txt"), "消さずに終わる");
      expect(dirname(dirname(made)), "検査の一時フォルダが実行の一時フォルダの下に入っていない").toBe(base);
      stop();
      expect(readdirSync(base), "実行の一時フォルダが中身ごと消えていない").toEqual([]);
      expect(process.env.TMPDIR, "片付けの後に TMPDIR が元に戻っていない").toBe(base);
    } finally {
      process.env.TMPDIR = before;
    }
  });

  it("run-tmp-cleans-after-failing-run", () => {
    const base = sandbox();
    const madeOut = join(sandbox(), "made.txt");
    const ran = spawnSync(process.execPath, [VITEST, "run", "--config", `${FIXTURES}/vitest.config.ts`, "--reporter=dot", `${FIXTURES}/quick-fail.fixture.ts`], {
      cwd: ROOT,
      encoding: "utf8",
      env: { ...process.env, TMPDIR: base, FIXTURE_TMP_OUT: madeOut },
    });
    expect(ran.status, "見本の検査が落ちなかった").toBe(1);
    expect(existsSync(madeOut), "見本の検査が一時フォルダを作らなかった").toBe(true);
    expect(existsSync(readFileSync(madeOut, "utf8")), "落ちた検査が作った一時フォルダが残っている").toBe(false);
    expect(readdirSync(base), "落ちた実行の一時フォルダが残っている").toEqual([]);
  });

  it("run-tmp-sweeps-dead-runs", async () => {
    const { sweepDeadRuns } = await runTmp();
    expect(sweepDeadRuns, "止められた実行の分を消す道具が無い").toBeTypeOf("function");
    if (!sweepDeadRuns) return;
    const base = sandbox();
    // 起こして終わるのを待った process の番号は、もう動いていない
    const ended = spawnSync(process.execPath, ["-p", "process.pid"], { encoding: "utf8" }).stdout.trim();
    mkdirSync(join(base, `dragon-run-${ended}-abc123`, "left"), { recursive: true });
    sweepDeadRuns(base);
    expect(readdirSync(base), "持ち主の process が終わった実行の一時フォルダが残っている").toEqual([]);
  });

  it("run-tmp-keeps-live-runs", async () => {
    const { sweepDeadRuns } = await runTmp();
    expect(sweepDeadRuns, "止められた実行の分を消す道具が無い").toBeTypeOf("function");
    if (!sweepDeadRuns) return;
    const base = sandbox();
    const kept = [
      // 動いている process の実行。別の作業場所で走っている実行に当たる
      `dragon-run-${process.pid}-abc123`,
      // 番号 1 は動いているが、自分の物でないので確かめる権限が無い。動いていないと読まない
      "dragon-run-1-abc123",
      // 名前から持ち主を読めない
      "dragon-run-nopid-abc123",
      // 実行の一時フォルダでない。古い版の検査が走っている最中に作った物かもしれない
      "dragon-export-abc123",
    ];
    for (const name of kept) mkdirSync(join(base, name));
    sweepDeadRuns(base);
    expect(readdirSync(base).sort(), "消してはいけないフォルダを消した").toEqual([...kept].sort());
  });

  it("run-tmp-runs-before-page-build", () => {
    const config = readFileSync(join(ROOT, "vitest.config.ts"), "utf8");
    const setups = [...(/globalSetup: \[([^\]]*)\]/u.exec(config)?.[1] ?? "").matchAll(/"([^"]+)"/gu)].map((match) => match[1]);
    expect(setups, "準備の段の一覧を読めない (走査の空振り)").toContain("./apps/playground-spa/src/lib/site-setup.ts");
    expect(setups[0], "一時フォルダを作る段が準備の段の最初にない").toBe("./test-support/run-tmp.ts");
    const build = readFileSync(join(ROOT, "apps/playground-spa/src/lib/site-build.ts"), "utf8");
    expect(build, "見本帳の頁の build が tmpdir() の下に書かない").toMatch(/mkdtempSync\(join\(tmpdir\(\), "dragon-page-"\)\)/u);
  });
});
