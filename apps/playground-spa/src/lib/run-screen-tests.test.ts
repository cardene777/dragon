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

  it("自分で起動した preview の URL と指定された project を Playwright へ渡す", () => {
    expect(SCRIPT).toContain("SPA_URL: PREVIEW_BASE_URL");
    expect(SCRIPT).toContain("PROD_BASE_URL: PREVIEW_URL");
    expect(SCRIPT).toContain('"--project=default"');
    expect(SCRIPT).toContain('"--project=serial"');
    expect(SCRIPT).toContain('"--no-deps"');
    expect(SCRIPT.match(/\.\.\.additionalArgs/gu)).toHaveLength(2);
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
});
