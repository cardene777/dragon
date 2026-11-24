/**
 * 1 件の上限に近い件の一覧 (#3740)。
 *
 * 新しく足した見本や件が負荷の下で 1 件の上限 (10 秒) を超えても、関門が時間切れで落ちるまで気付けなかった。
 * 上限に近い件を、落ちる前に名前と秒数で知らせる。
 * 報告の部品 (`scripts/near-limit-reporter.mjs`) は、関係する検査を回す命令 (`pnpm test:related`) と一式が vitest へ渡す。
 * 目安は上限の 4 割で、上限は設定の `testTimeout` から読む。上限を下げる環境変数 (`DRAGON_TEST_LIMIT_MS`) で目安も下がるので、
 * 上限を 3 秒へ下げた見本の実行で、目安の 1.2 秒を超える件と超えない件を確かめる。
 * 知らせるだけで、実行の終わり方は変えない。
 */
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { atLoad } from "./at-load";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const VITEST = join(dirname(createRequire(import.meta.url).resolve("vitest/package.json")), "vitest.mjs");
const FIXTURES = "test-support/fixtures/limits";
const FIXTURE = `${FIXTURES}/near-limit.fixture.ts`;
/** 関門の命令が vitest へ渡す報告の部品 */
const REPORTER = "./scripts/near-limit-reporter.mjs";
/** 見本の実行の 1 件の上限。目安はその 4 割の 1.2 秒 */
const LOWERED_LIMIT_MS = 3_000;
const LONG = `${FIXTURE} > 上限に近い見本 > fixture-near-limit-long`;
const SHORT = `${FIXTURE} > 上限に近い見本 > fixture-near-limit-short`;

/** 知らせの 1 行目。上限の秒数、目安の秒数、件の数、負荷平均を読む */
const HEADING = /^1件の上限(\d+(?:\.\d+)?)秒の4割 \((\d+(?:\.\d+)?)秒\) 以上かかった件が(\d+)件ある。負荷平均は(\d+(?:\.\d+)?)$/u;
/** 知らせの一覧の行。秒数と件の名前を読む */
const ROW = /^\s+(\d+(?:\.\d+)?)秒 (\S.*)$/u;

interface Notice {
  heading?: RegExpExecArray;
  lines: string[];
  rows: { seconds: number; name: string }[];
}

interface Ran {
  code: number | null;
  out: string;
  /** 失敗の文に載せる、子の vitest の出力の要る行。結果の行を親の検査と数えさせないよう、各行の頭に `| ` を付ける */
  brief: string;
  notice: Notice;
}

/** 出力から知らせを読む。1 行目と、その後に続く字下げした一覧の行 */
function noticeIn(out: string): Notice {
  const lines = out.split("\n");
  const at = lines.findIndex((line) => HEADING.test(line));
  if (at === -1) return { lines: [], rows: [] };
  const block = [lines[at] ?? ""];
  for (const line of lines.slice(at + 1)) {
    if (!ROW.test(line)) break;
    block.push(line);
  }
  const rows = block.slice(1).map((line) => {
    const [, seconds = "", name = ""] = ROW.exec(line) ?? [];
    return { seconds: Number(seconds), name };
  });
  return { heading: HEADING.exec(block[0] ?? "") ?? undefined, lines: block, rows };
}

/** 上限に近い見本を、上限を下げて報告の部品と共に回す */
function runNearLimit(sleepMs: number): Ran {
  const ran = spawnSync(process.execPath, [VITEST, "run", "--config", `${FIXTURES}/vitest.config.ts`, "--reporter=verbose", `--reporter=${REPORTER}`, FIXTURE], {
    cwd: ROOT,
    encoding: "utf8",
    env: { ...process.env, DRAGON_TEST_LIMIT_MS: String(LOWERED_LIMIT_MS), FIXTURE_SLEEP_MS: String(sleepMs) },
  });
  const out = `${ran.stdout}${ran.stderr}`;
  const brief = out
    .split("\n")
    .filter((line) => /fixture-|上限|Error|error/u.test(line))
    .map((line) => `| ${line.trim()}`)
    .join("\n");
  return { code: ran.status, out, brief, notice: noticeIn(out) };
}

// 見本の実行は子の vitest を起こすので、file を読み込む段で 1 つずつ順に済ませ、件はその結果を読む (#3738)
const RUNS = await atLoad("上限に近い件と軽い件の見本", () => ({
  // 長い件 2 秒、短い件 1.5 秒。どちらも目安の 1.2 秒を超え、10 秒の 4 割 (4 秒) には届かない
  near: runNearLimit(2_000),
  // 長い件 0.1 秒、短い件 0.075 秒。どちらも目安に届かない
  light: runNearLimit(100),
}));

/** 関門が検査の結果の行を読む形 (`.ikkan/checks.md` の `通った行の形` と `落ちた行の形`) */
function resultLinePatterns(): RegExp[] {
  const text = readFileSync(join(ROOT, ".ikkan/checks.md"), "utf8");
  return ["通った行の形", "落ちた行の形"].map((field) => {
    const row = text.split("\n").find((line) => line.startsWith(`| ${field} |`)) ?? "";
    const pattern = /`([^`]+)`/u.exec(row)?.[1] ?? "";
    return new RegExp(pattern, "u");
  });
}

describe("1 件の上限に近い件の一覧 (#3740)", () => {
  it("near-limit-case-is-named-with-seconds", () => {
    const { near } = RUNS.get();
    expect(near.notice.heading, `目安を超えた件が在るのに、知らせの 1 行目を出していない:\n${near.brief}`).toBeDefined();
    const long = near.notice.rows.find((row) => row.name === LONG);
    expect(long, `目安を超えた件の名前を file > 組 > 件 の形で出していない:\n${near.notice.lines.join("\n")}`).toBeDefined();
    expect(long?.seconds ?? 0, "目安を超えた件の秒数が、見本の待つ秒数より短い").toBeGreaterThanOrEqual(1.9);
  });

  it("near-limit-list-is-longest-first-with-load", () => {
    const { near } = RUNS.get();
    expect(
      near.notice.rows.map((row) => row.name),
      `一覧が秒数の長い順に並んでいない:\n${near.notice.lines.join("\n")}`,
    ).toEqual([LONG, SHORT]);
    const seconds = near.notice.rows.map((row) => row.seconds);
    expect(seconds, "一覧の秒数が長い順でない").toEqual([...seconds].sort((a, b) => b - a));
    expect(near.notice.heading?.[3], "1 行目の件の数が一覧の行の数と違う").toBe(String(near.notice.rows.length));
    expect(near.out.match(/負荷平均/gu) ?? [], "負荷平均を 1 回だけ添えていない").toHaveLength(1);
    expect(Number(near.notice.heading?.[4] ?? "-1"), "負荷平均を数で出していない").toBeGreaterThanOrEqual(0);
  });

  it("near-limit-threshold-is-four-tenths-of-limit", () => {
    // 上限を 3 秒へ下げた実行では、目安は 4 割の 1.2 秒になり、1.5 秒の件も 2 秒の件も一覧に入る。
    // 目安を 10 秒の 4 割 (4 秒) に決め打ちすると、どちらも入らない
    const { near } = RUNS.get();
    expect(near.notice.heading?.[1], `1 行目が下げた上限の秒数を出していない:\n${near.notice.lines.join("\n")}`).toBe("3");
    expect(near.notice.heading?.[2], "目安が下げた上限の 4 割でない").toBe("1.2");
    expect(near.notice.rows.map((row) => row.name).sort(), "下げた上限の 4 割を超えた件を一覧に入れていない").toEqual([LONG, SHORT].sort());
  });

  it("light-case-is-not-named", () => {
    const { light } = RUNS.get();
    expect(light.code, `軽い件だけの実行が通らなかった:\n${light.brief}`).toBe(0);
    expect(light.notice.lines, "目安を超えた件が無いのに、知らせを出した").toEqual([]);
    expect(light.out, "目安を超えた件が無いのに、知らせの 1 行目に当たる文を出した").not.toMatch(/以上かかった件が/u);
  });

  it("near-limit-does-not-fail-the-run", () => {
    const { near } = RUNS.get();
    expect(near.notice.heading, `目安を超えた件の知らせを出していない:\n${near.brief}`).toBeDefined();
    expect(near.code, `目安を超えた件が在るだけで、通った実行を落とした:\n${near.brief}`).toBe(0);
  });

  it("near-limit-lines-are-not-result-lines", () => {
    // 関門は出力の通った行と落ちた行から検査の名前を読む。知らせの行がその形に当たると、知らせの件を 2 度数える
    const { near } = RUNS.get();
    expect(near.notice.lines.length, `知らせの行を読めない:\n${near.brief}`).toBeGreaterThanOrEqual(2);
    const patterns = resultLinePatterns();
    expect(patterns.map(String), "`.ikkan/checks.md` の行の形を読めない").not.toContain("/(?:)/u");
    expect(
      near.notice.lines.filter((line) => patterns.some((pattern) => pattern.test(line))),
      "関門が検査の結果の行と読む知らせの行",
    ).toEqual([]);
  });
});
