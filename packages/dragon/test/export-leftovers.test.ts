/**
 * 書き出しに失敗した時は、書き出し先に何も残さない (#3013)。
 *
 * 書き出しは撮る物を全て撮り終えてから、書き出し先の dir を作って file を書く。
 * 撮る道具 (`playwright-core`) が無くて撮る所で失敗しても、dir も HTML も残らない。
 * 書いている途中で失敗した時は、この回に作った dir を中身ごと消し、前から在った dir は消さない。
 */
import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { exporter, runCli, withoutPlaywright } from "./export-support";

const JSON_FILE = join(process.cwd(), "packages/dragon/examples/oauth.json");

const scratch = (): string => mkdtempSync(join(tmpdir(), "dragon-export-leftovers-"));

describe("書き出しに失敗した時に残す物 (#3013)", () => {
  it("export-failure-leaves-no-out-dir", async () => {
    const dir = scratch();
    const ran = await runCli(["export", JSON_FILE, "--out", join(dir, "new", "nested"), "--format", "png"], withoutPlaywright());
    expect(ran.code, "道具が無いのに終了 1 にならない").toBe(1);
    expect(readdirSync(dir), "書き出し先の dir か途中の dir が残った").toEqual([]);
  });

  it("export-failure-writes-no-html", async () => {
    const dir = scratch();
    const ran = await runCli(["export", JSON_FILE, "--out", join(dir, "new"), "--format", "html,png"], withoutPlaywright());
    expect(ran.code, "道具が無いのに終了 1 にならない").toBe(1);
    expect(existsSync(join(dir, "new")), "撮れなかったのに HTML を書き出した").toBe(false);
  });

  it("export-failure-keeps-existing-dir", async () => {
    const out = join(scratch(), "out");
    mkdirSync(out);
    writeFileSync(join(out, "keep.txt"), "前から在る");
    const ran = await runCli(["export", JSON_FILE, "--out", out, "--format", "html,png"], withoutPlaywright());
    expect(ran.code).toBe(1);
    expect(readdirSync(out), "前から在った dir の中身が変わった").toEqual(["keep.txt"]);
  });

  it("export-write-failure-removes-created-dir", async () => {
    const exportDiagram = await exporter();
    const dir = scratch();
    const diagram = JSON.parse(readFileSync(JSON_FILE, "utf8")) as unknown;
    // 名前に無い dir を挟むと、作った dir の中に書けずに失敗する
    await expect(exportDiagram(diagram, { outDir: join(dir, "new", "nested"), name: "missing/x", formats: ["html"] })).rejects.toThrow(/ENOENT/u);
    expect(readdirSync(dir), "書けなかったのに作った dir が残った").toEqual([]);

    const out = join(dir, "out");
    mkdirSync(out);
    writeFileSync(join(out, "keep.txt"), "前から在る");
    await expect(exportDiagram(diagram, { outDir: out, name: "missing/x", formats: ["html"] })).rejects.toThrow(/ENOENT/u);
    expect(readdirSync(out), "前から在った dir を消した").toEqual(["keep.txt"]);
  });
});
