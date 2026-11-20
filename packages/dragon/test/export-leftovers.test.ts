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
import { atLoad } from "./at-load";
import { exporter, runCli, withoutPlaywright } from "./export-support";

const JSON_FILE = join(process.cwd(), "packages/dragon/examples/oauth.json");

const scratch = (): string => mkdtempSync(join(tmpdir(), "dragon-export-leftovers-"));

/** 書き出しが落ちた理由の文。落ちなかった時は undefined */
async function failure(run: () => Promise<unknown>): Promise<string | undefined> {
  try {
    await run();
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

// 子の Node で書き出しの命令を起こす仕事と、書き出しの入口を読む仕事は、混んだ機械で 1 件 10 秒の上限に近づいた (#3739)。
// file を読み込む段で 1 つずつ順に済ませ、件はその結果を読む

const NO_OUT_DIR = await atLoad("道具の無い書き出しの命令 (書き出し先の dir)", async () => {
  const dir = scratch();
  const ran = await runCli(["export", JSON_FILE, "--out", join(dir, "new", "nested"), "--format", "png"], withoutPlaywright());
  return { code: ran.code, left: readdirSync(dir) };
});

const NO_HTML = await atLoad("道具の無い書き出しの命令 (HTML と PNG)", async () => {
  const dir = scratch();
  const ran = await runCli(["export", JSON_FILE, "--out", join(dir, "new"), "--format", "html,png"], withoutPlaywright());
  return { code: ran.code, made: existsSync(join(dir, "new")) };
});

const KEEPS_DIR = await atLoad("道具の無い書き出しの命令 (前から在る dir)", async () => {
  const out = join(scratch(), "out");
  mkdirSync(out);
  writeFileSync(join(out, "keep.txt"), "前から在る");
  const ran = await runCli(["export", JSON_FILE, "--out", out, "--format", "html,png"], withoutPlaywright());
  return { code: ran.code, left: readdirSync(out) };
});

const WRITE_FAILURE = await atLoad("書けずに落ちる書き出し", async () => {
  const exportDiagram = await exporter();
  const dir = scratch();
  const diagram = JSON.parse(readFileSync(JSON_FILE, "utf8")) as unknown;
  // 名前に無い dir を挟むと、作った dir の中に書けずに失敗する
  const created = await failure(() => exportDiagram(diagram, { outDir: join(dir, "new", "nested"), name: "missing/x", formats: ["html"] }));
  const createdLeft = readdirSync(dir);
  const out = join(dir, "out");
  mkdirSync(out);
  writeFileSync(join(out, "keep.txt"), "前から在る");
  const existing = await failure(() => exportDiagram(diagram, { outDir: out, name: "missing/x", formats: ["html"] }));
  return { created, createdLeft, existing, existingLeft: readdirSync(out) };
});

describe("書き出しに失敗した時に残す物 (#3013)", () => {
  it("export-failure-leaves-no-out-dir", () => {
    const { code, left } = NO_OUT_DIR.get();
    expect(code, "道具が無いのに終了 1 にならない").toBe(1);
    expect(left, "書き出し先の dir か途中の dir が残った").toEqual([]);
  });

  it("export-failure-writes-no-html", () => {
    const { code, made } = NO_HTML.get();
    expect(code, "道具が無いのに終了 1 にならない").toBe(1);
    expect(made, "撮れなかったのに HTML を書き出した").toBe(false);
  });

  it("export-failure-keeps-existing-dir", () => {
    const { code, left } = KEEPS_DIR.get();
    expect(code).toBe(1);
    expect(left, "前から在った dir の中身が変わった").toEqual(["keep.txt"]);
  });

  it("export-write-failure-removes-created-dir", () => {
    const { created, createdLeft, existing, existingLeft } = WRITE_FAILURE.get();
    expect(created, "書けない名前で書き出したのに落ちなかった").toMatch(/ENOENT/u);
    expect(createdLeft, "書けなかったのに作った dir が残った").toEqual([]);
    expect(existing, "前から在る dir へ書けない名前で書き出したのに落ちなかった").toMatch(/ENOENT/u);
    expect(existingLeft, "前から在った dir を消した").toEqual(["keep.txt"]);
  });
});
