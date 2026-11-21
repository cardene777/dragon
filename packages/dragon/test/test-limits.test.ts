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
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, inject, it } from "vitest";
import { atLoad } from "./at-load";

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

// 見本の検査は子の vitest を起こし、混んだ機械で 1 件の上限 (10 秒) を超えた (#3738)。file を読み込む段で 1 つずつ順に済ませ、件はその結果を読む

const OVER_LIMIT = await atLoad("上限を超える検査と前処理の見本", () => ({
  test: runFixture("slow-test.fixture.ts", { DRAGON_TEST_LIMIT_MS: "500", FIXTURE_SLEEP_MS: "1500" }),
  hook: runFixture("slow-hook.fixture.ts", { DRAGON_TEST_LIMIT_MS: "500", FIXTURE_SLEEP_MS: "1500" }),
}));

const WHOLE_RUN = await atLoad("1 回の実行の上限を超える見本", () => {
  // 上限で止めた回も、見本が作った一時フォルダを残さない (#3587)。走っている実行の一時フォルダの下に試す場所を作るので、この検査の分も残らない
  const sandbox = mkdtempSync(join(tmpdir(), "dragon-sandbox-"));
  const madeOut = join(mkdtempSync(join(tmpdir(), "dragon-sandbox-out-")), "made.txt");
  const ran = runFixture("long-run.fixture.ts", { DRAGON_RUN_LIMIT_MS: "3000", TMPDIR: sandbox, FIXTURE_TMP_OUT: madeOut });
  return { ran, made: existsSync(madeOut), left: readdirSync(sandbox) };
});

const UNFINISHED = await atLoad("終わっていない file を書く見本", () => {
  // 作業者を 1 つにして 3 秒より長い見本を 2 つ渡すので、上限の時に片方は必ずまだ始まっていない。始まっていない file も終わっていない file に数える
  const dir = mkdtempSync(join(tmpdir(), "dragon-unfinished-"));
  const out = join(dir, "unfinished.json");
  try {
    const ran = runFixture(["quick-fail.fixture.ts", "long-run.fixture.ts", "slow-test.fixture.ts"], { DRAGON_RUN_LIMIT_MS: "3000", FIXTURE_SLEEP_MS: "7000", DRAGON_UNFINISHED_OUT: out }, ["--maxWorkers=1"]);
    const wrote = existsSync(out);
    return { ran, wrote, written: wrote ? (JSON.parse(readFileSync(out, "utf8")) as { unfinished?: string[]; failed?: string[] }) : {} };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

const PROBE = await atLoad("書き先を受け継がない見本", () => {
  const dir = mkdtempSync(join(tmpdir(), "dragon-unfinished-"));
  const out = join(dir, "unfinished.json");
  const probe = join(dir, "probe.json");
  try {
    const ran = runFixture("env-probe.fixture.ts", { DRAGON_UNFINISHED_OUT: out, FIXTURE_OUT: probe });
    const probed = existsSync(probe);
    return { ran, probed, seen: probed ? (JSON.parse(readFileSync(probe, "utf8")) as { out: string | null }).out : undefined, wrote: existsSync(out) };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** 止める段が `DRAGON_UNFINISHED_OUT` に書く、終わっていない file と落ちた物の名前 */
interface Leftover {
  unfinished?: string[];
  failed?: string[];
}

/** 続きを回す命令の処理 (`scripts/test-related.mjs` の `runUntilFinished`、#3386) の形 */
type Until = (files: string[], run: (files: string[], out: string) => number | null, say: (text: string) => void) => number;

const LOAD_FAIL = `${FIXTURES}/load-fail.fixture.ts`;
const HOOK_FAIL = `${FIXTURES}/hook-fail.fixture.ts`;
const WAIT = `${FIXTURES}/wait-then-pass.fixture.ts`;

const LOAD_FAILED = await atLoad("読む所で落ちる見本を続きの実行へ渡す", async () => {
  // 1 回目は、読む所で落ちる見本と前処理で落ちる見本を 9 秒待つ見本と並べて回し、上限 8 秒で止める。落ちる 2 つは上限より前に終わる。
  // 上限をほかの見本の 3 秒より長くするのは、混んだ機械では 3 つの worker を起こして見本を読むだけで 3 秒を超え、落ちる 2 つが上限より前に終わらないため。
  // 待つ見本の 9 秒は 1 件の上限 (10 秒) より短いので、1 回目を止めるのは 1 回の実行の上限だけになる。
  // 続きの実行では待つ見本を待たずに通し、続きが全て通った後も、1 回目に落ちた file の名前で終わり方 1 になるかを見る (#3800)。
  // `slow-test.fixture.ts` は自分で長い上限を書く件が必ず落ちるので、続きの実行で通す見本には使わない
  const { runUntilFinished } = (await import(join(ROOT, "scripts/test-related.mjs"))) as { runUntilFinished: Until };
  const runs: { files: string[]; code: number | null; written?: Leftover; brief: string }[] = [];
  const said: string[] = [];
  const status = runUntilFinished(
    [LOAD_FAIL, HOOK_FAIL, WAIT],
    (left, out) => {
      // 上限を下げるのは 1 回目だけにする。続きの実行も上限を下げると、混んだ機械では見本が通った後の片付けの間に上限で止まる
      const first = runs.length === 0;
      const ran = runFixture(
        left.map((path) => path.slice(FIXTURES.length + 1)),
        first ? { DRAGON_RUN_LIMIT_MS: "8000", FIXTURE_SLEEP_MS: "9000", DRAGON_UNFINISHED_OUT: out } : { FIXTURE_SLEEP_MS: "0", DRAGON_UNFINISHED_OUT: out },
      );
      runs.push({ files: left, code: ran.code, written: existsSync(out) ? (JSON.parse(readFileSync(out, "utf8")) as Leftover) : undefined, brief: ran.brief });
      return ran.code;
    },
    (text) => said.push(text),
  );
  return { status, runs, said: said.join("\n") };
});

describe("検査の時間の上限 (#3381)", () => {
  it("test-limit-is-ten-seconds", ({ task }) => {
    expect(task.timeout, "1 件の検査の上限が 10 秒でない").toBe(10_000);
  });

  it("test-over-limit-is-stopped-and-named", () => {
    const { test, hook } = OVER_LIMIT.get();
    expect(test.code, `上限を超えた検査が落ちなかった:\n${test.brief}`).toBe(1);
    expect(test.out, "上限を超えた検査の名前と、上限で止めたことを出していない").toMatch(/fixture-sleeps-past-test-limit[\s\S]*timed out/u);
    expect(test.out, "自分で長い上限を書いた検査を、repo の上限で止めていない").toMatch(/×[^\n]*fixture-raises-its-own-limit/u);
    expect(hook.code, `上限を超えた前処理が落ちなかった:\n${hook.brief}`).toBe(1);
    expect(hook.out, "上限を超えた前処理を止めたことを出していない").toMatch(/Hook timed out/u);
  });

  it("run-limit-is-five-minutes", () => {
    expect(provided("dragonRunLimitMs"), "1 回の実行の上限が 5 分でない").toBe(300_000);
  });

  it("limit-env-names-unchanged", () => {
    // 上限を変える環境変数は下げる 2 つだけ (#3734)。検査が重い時に上限を緩める環境変数を足すと、遅い検査を上限だけ緩めて残す道ができる。
    // 検査の設定と準備の段と検査の道具 (検査の file でない file) と、関門の命令が vitest へ渡す報告の部品 (`scripts/`、#3740) が読む、
    // 名前に LIMIT を含む環境変数の名前を集める
    const files = [
      "vitest.config.ts",
      ...readdirSync(join(ROOT, "scripts")).filter((name) => name.endsWith(".mjs")).map((name) => `scripts/${name}`),
      ...readdirSync(join(ROOT, "test-support")).filter((name) => name.endsWith(".ts")).map((name) => `test-support/${name}`),
      ...readdirSync(join(ROOT, "packages/dragon/test")).filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts")).map((name) => `packages/dragon/test/${name}`),
      ...readdirSync(join(ROOT, "apps/playground-spa/src/lib")).filter((name) => /-setup\.ts$/u.test(name)).map((name) => `apps/playground-spa/src/lib/${name}`),
    ];
    // 説明の文は数えない。code の中で環境変数として読む名前 (`process.env.<名前>`) と、字の列として渡す名前を数える
    const code = (file: string): string =>
      readFileSync(join(ROOT, file), "utf8")
        .replace(/\/\*[\s\S]*?\*\//gu, "")
        .replace(/(^|[^:"'`])\/\/.*$/gmu, "$1");
    const names = new Set(files.flatMap((file) => [...code(file).matchAll(/process\.env\.([A-Z0-9_]*LIMIT[A-Z0-9_]*)|["']([A-Z0-9_]*LIMIT[A-Z0-9_]*)["']/gu)].map((match) => match[1] ?? match[2] ?? "")));
    expect([...names].sort(), "上限の環境変数の名前").toEqual(["DRAGON_RUN_LIMIT_MS", "DRAGON_TEST_LIMIT_MS"]);
  });

  it("run-limit-stops-whole-run", () => {
    const { ran, made, left } = WHOLE_RUN.get();
    expect(ran.code, `1 回の実行の上限を超えたのに終わり方 1 で終わらなかった:\n${ran.brief}`).toBe(1);
    expect(ran.out, "1 回の実行の上限で止めたことと、終わっていない検査の名前を出していない").toMatch(/1回の実行の上限[\s\S]*fixture-runs-past-run-limit/u);
    expect(ran.out, "上限で止めずに、検査が終わるまで待った").not.toMatch(/✓[^\n]*fixture-runs-past-run-limit/u);
    expect(made, `見本の検査が一時フォルダを作る前に止まった:\n${ran.brief}`).toBe(true);
    expect(left, "上限で止めた実行の一時フォルダが残っている").toEqual([]);
  });

  it("run-limit-writes-unfinished-files", () => {
    // 上限で止めた時、`DRAGON_UNFINISHED_OUT` が名指す file に、終わっていない検査の file と、終わった file で落ちた検査の名前を書く (#3386)。
    // 関係する検査を回す命令 (`scripts/test-related.mjs`) が、これを読んで続きを回す
    const { ran, wrote, written } = UNFINISHED.get();
    const quick = `${FIXTURES}/quick-fail.fixture.ts`;
    expect(ran.code, `1 回の実行の上限を超えたのに終わり方 1 で終わらなかった:\n${ran.brief}`).toBe(1);
    expect(wrote, `上限で止めた時に、終わっていない file を書いていない:\n${ran.brief}`).toBe(true);
    expect(written.unfinished, "上限で止まった見本と、まだ始まっていない見本の両方を、終わっていない file に数えていない").toEqual(expect.arrayContaining([`${FIXTURES}/long-run.fixture.ts`, `${FIXTURES}/slow-test.fixture.ts`]));
    // 先に落ちる見本は、上限より前に回ったなら落ちた検査に、まだ始まっていないなら終わっていない file に、どちらか一方だけ入る
    const quickLeft = written.unfinished?.includes(quick) ?? false;
    expect(written.unfinished, "終わっていない file に、渡していない file か同じ file が在る").toHaveLength(quickLeft ? 3 : 2);
    expect(written.failed, "終わった file で落ちた検査の名前を書いていない").toEqual(quickLeft ? [] : [`${quick} > 1 回の実行の上限の前に落ちる見本 > fixture-fails-before-run-limit`]);
  });

  it("unfinished-out-not-inherited-by-tests", () => {
    // 続きを回す命令が渡す書き先 (`DRAGON_UNFINISHED_OUT`) を、検査の file の process は受け継がない (#3388)。
    // 受け継ぐと、検査が起こす vitest (この file の見本の検査など) も受け継ぎ、上限で止まった時に親の実行の終わっていない file の一覧を上書きする
    const { ran, probed, seen, wrote } = PROBE.get();
    expect(ran.code, `書き先を見る見本の検査が通らなかった:\n${ran.brief}`).toBe(0);
    expect(probed, `見本の検査が、受け取った書き先を書いていない:\n${ran.brief}`).toBe(true);
    expect(seen, "検査の file の process が、続きを回す命令の書き先を受け継いだ").toBeNull();
    expect(wrote, "上限で止まっていない実行が、書き先に書いた").toBe(false);
  });

  it("run-limit-names-load-failed-file", () => {
    // 上限で止めた時、読む所で落ちた file (落ちた件を 1 つも持たない) の名前を、落ちた物として書く (#3800)
    const first = LOAD_FAILED.get().runs[0];
    expect(first?.written, `上限で止めた時に、終わっていない file を書いていない:\n${first?.brief ?? ""}`).toBeDefined();
    expect(first?.written?.unfinished, `読む所で落ちる見本が、上限より前に終わらなかった:\n${first?.brief ?? ""}`).not.toContain(LOAD_FAIL);
    expect(first?.written?.failed, "読む所で落ちた file の名前を、落ちた物として書いていない").toContain(LOAD_FAIL);
  });

  it("run-limit-names-hook-failed-file", () => {
    // 上限で止めた時、前処理 (`beforeAll`) で落ちて中の件が全て飛ばされた file の名前を、落ちた物として書く (#3800)。#3798 の検査がこの形で落ちた
    const first = LOAD_FAILED.get().runs[0];
    expect(first?.written?.unfinished, `前処理で落ちる見本が、上限より前に終わらなかった:\n${first?.brief ?? ""}`).not.toContain(HOOK_FAIL);
    expect(first?.written?.failed, "前処理で落ちて件が全て飛ばされた file の名前を、落ちた物として書いていない").toContain(HOOK_FAIL);
  });

  it("continued-run-fails-on-load-failed-file", () => {
    // 続きの実行が全て通っても、1 回目に読む所で落ちた file の名前を出して終わり方 1 で終わる (#3800)
    const { status, runs, said } = LOAD_FAILED.get();
    expect(runs.map((run) => run.files), "1 回目が上限で止まった後に、終わっていない file だけを続きで回していない").toEqual([[LOAD_FAIL, HOOK_FAIL, WAIT], [WAIT]]);
    expect(runs[1]?.code, `続きの実行が通らなかった:\n${runs[1]?.brief ?? ""}`).toBe(0);
    expect(status, "続きが全て通った後に、1 回目に読む所で落ちた file を落ちた物に数えず、終わり方 0 で終わった").toBe(1);
    expect(said, "1 回目に読む所で落ちた file の名前を出していない").toContain(LOAD_FAIL);
    expect(said, "1 回目に前処理で落ちた file の名前を出していない").toContain(HOOK_FAIL);
  });

  it("run-limit-keeps-load-failed-file-out-of-unfinished", () => {
    // 読む所で落ちた file は終わった file に数え、続きの実行で回し直さない (#3800)。回し直すと、負荷で落ちた file が続きで通った時に 1 回目の失敗が消える
    const { runs } = LOAD_FAILED.get();
    expect(runs[0]?.written?.unfinished, "読む所で落ちた file か前処理で落ちた file を、終わっていない file に数えた").toEqual([WAIT]);
    const rerun = runs.slice(1).flatMap((run) => run.files);
    expect(rerun, "読む所で落ちた file を、続きの実行で回し直した").not.toContain(LOAD_FAIL);
    expect(rerun, "前処理で落ちた file を、続きの実行で回し直した").not.toContain(HOOK_FAIL);
  });

  it("run-limit-names-failed-test-not-its-file", () => {
    // 件が落ちた file は落ちた件の名前だけを書き、file の名前を重ねて書かない (#3800)。重ねると、同じ失敗を 2 度数えて名前を出す
    const { written } = UNFINISHED.get();
    const files = [`${FIXTURES}/quick-fail.fixture.ts`, `${FIXTURES}/long-run.fixture.ts`, `${FIXTURES}/slow-test.fixture.ts`];
    expect(
      (written.failed ?? []).filter((name) => files.includes(name)),
      "件が落ちた file か終わっていない file の名前を、落ちた物として書いた",
    ).toEqual([]);
  });
});
