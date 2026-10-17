import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

import { PREVIEW_PORT } from "../../ports";

const ROOT = join(import.meta.dirname, "../../../..");
const SCRIPT_REL = "apps/playground-spa/scripts/run-screen-tests.mjs";
const SCRIPT_PATH = join(ROOT, SCRIPT_REL);
const SCRIPT = readFileSync(SCRIPT_PATH, "utf8");

function callScriptExport(exportName: string, args: unknown[]): unknown {
  const program = [
    `const script = await import(${JSON.stringify(pathToFileURL(SCRIPT_PATH).href)});`,
    `console.log(JSON.stringify(script[${JSON.stringify(exportName)}](...${JSON.stringify(args)})));`,
  ].join("\n");
  const result = spawnSync(process.execPath, ["--input-type=module", "--eval", program], {
    encoding: "utf8",
  });

  expect(result.status, result.stderr).toBe(0);
  return JSON.parse(result.stdout);
}

function listResult(testCount: number) {
  const noTests = testCount === 0;
  return {
    exitCode: noTests ? 1 : 0,
    failedToStart: false,
    output: [
      ...(noTests ? ["Error: No tests found."] : ["Listing tests:"]),
      `Total: ${testCount} tests in ${testCount === 0 ? "0 files" : "1 file"}`,
    ].join("\n"),
  };
}

describe("画面の検査を 1 命令で回す script (#2826)", () => {
  it("root の test:screens が実在する script を起動する", () => {
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.["test:screens"]).toBe(`node ${SCRIPT_REL}`);
    expect(existsSync(SCRIPT_PATH), "test:screens が指す file が無い").toBe(true);
  });

  it("port と URL を ports.ts から読み、port の数字を持たない", () => {
    expect(SCRIPT).toContain('from "../ports.ts"');
    for (const name of ["PREVIEW_PORT", "PREVIEW_URL", "PREVIEW_BASE_URL"]) {
      expect(SCRIPT, `${name} を ports.ts から読んでいない`).toMatch(
        new RegExp(`import \\{[^}]*\\b${name}\\b[^}]*\\} from "../ports\\.ts"`, "su"),
      );
    }
    expect(SCRIPT, "script が preview port の数字を直接持っている").not.toMatch(
      new RegExp(`\\b${PREVIEW_PORT}\\b`, "u"),
    );
  });

  it("preview の URL と指定された project と絞り込みを一覧と実行へ渡す", () => {
    expect(SCRIPT).toContain("SPA_URL: PREVIEW_BASE_URL");
    expect(SCRIPT).toContain("PROD_BASE_URL: PREVIEW_URL");
    expect(SCRIPT).toContain('"--project=default"');
    expect(SCRIPT).toContain('"--project=serial"');
    expect(SCRIPT).toContain('"--no-deps"');
    expect(SCRIPT.match(/\.\.\.additionalArgs/gu)).toHaveLength(3);
  });

  it("preview を新しい process group で起動し、group 全体を止める", () => {
    expect(SCRIPT).toContain("detached: true");
    expect(SCRIPT).toContain("process.kill(-pid, signal)");
    expect(SCRIPT).toContain('signalProcessGroup(pid, "SIGTERM")');
    expect(SCRIPT).toContain('signalProcessGroup(pid, "SIGKILL")');
  });

  it("lsof の出力から使用中 process の pid と command を取り出す", () => {
    const output = [
      "COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME",
      "node 123 alice 21u IPv6 0x0 0t0 TCP *:9999 (LISTEN)",
      "vite 456 alice 22u IPv4 0x0 0t0 TCP 127.0.0.1:9999 (LISTEN)",
    ].join("\n");
    const program = [
      `const { parseLsofListeners } = await import(${JSON.stringify(pathToFileURL(SCRIPT_PATH).href)});`,
      `console.log(JSON.stringify(parseLsofListeners(${JSON.stringify(output)})));`,
    ].join("\n");
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", program], {
      encoding: "utf8",
    });

    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual([
      { command: "node", pid: "123" },
      { command: "vite", pid: "456" },
    ]);
  });

  it.each([
    [["--", "--grep", "foo"], ["--grep", "foo"]],
    [["--grep", "foo"], ["--grep", "foo"]],
    [["--grep", "foo", "--", "bar"], ["--grep", "foo", "--", "bar"]],
  ])("Playwright へ渡す引数は先頭の -- だけを取り除く", (argv, expected) => {
    const program = [
      `const { playwrightArgs } = await import(${JSON.stringify(pathToFileURL(SCRIPT_PATH).href)});`,
      `console.log(JSON.stringify(playwrightArgs(${JSON.stringify(argv)})));`,
    ].join("\n");
    const result = spawnSync(process.execPath, ["--input-type=module", "--eval", program], {
      encoding: "utf8",
    });

    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout)).toEqual(expected);
  });

  it("該当がある project は件数を読み取って回す", () => {
    expect(
      callScriptExport("decideScreenTestRuns", [
        ["tests/theme-rendered-rule-values.spec.ts"],
        { default: listResult(28), serial: listResult(0) },
      ]),
    ).toEqual({
      shouldCount: true,
      default: { testCount: 28, shouldRun: true },
      serial: { testCount: 0, shouldRun: false },
      allEmpty: false,
    });
  });

  it("No tests found の exit 1 は 0 件として読み取り、project を回さない", () => {
    expect(callScriptExport("playwrightListCount", [listResult(0)])).toBe(0);
  });

  it("件数を読めない時は検査を飛ばさずに回す", () => {
    const unreadableResults = [
      { exitCode: 2, failedToStart: false, output: "config error" },
      { exitCode: 0, failedToStart: false, output: "unexpected output" },
    ];
    for (const unreadableResult of unreadableResults) {
      expect(
        callScriptExport("decideScreenTestRuns", [
          ["tests/broken-filter.spec.ts"],
          { default: unreadableResult, serial: listResult(0) },
        ]),
      ).toEqual({
        shouldCount: true,
        default: { testCount: null, shouldRun: true },
        serial: { testCount: 0, shouldRun: false },
        allEmpty: false,
      });
    }
  });

  it("両方の project が 0 件なら全体を失敗させる判定にする", () => {
    expect(
      callScriptExport("decideScreenTestRuns", [
        ["tests/not-found.spec.ts"],
        { default: listResult(0), serial: listResult(0) },
      ]),
    ).toEqual({
      shouldCount: true,
      default: { testCount: 0, shouldRun: false },
      serial: { testCount: 0, shouldRun: false },
      allEmpty: true,
    });
  });

  it("絞り込みが無い時は件数を数えずに両方を回す", () => {
    expect(callScriptExport("decideScreenTestRuns", [[], {}])).toEqual({
      shouldCount: false,
      default: { testCount: null, shouldRun: true },
      serial: { testCount: null, shouldRun: true },
      allEmpty: false,
    });
  });
});
