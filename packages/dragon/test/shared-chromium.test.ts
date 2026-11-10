/**
 * 書き出しの検査が 1 つの file で使う Chromium (#3599)。
 *
 * 書き出しは呼ぶたびに Chromium を起こして閉じる。検査の中でもそうすると、1 つの file で書き出す回数だけ Chromium を起こし、
 * 混んだ機械で 1 件の上限 (10 秒) を超えた (0.70.0 の配る前の関門で 27 件中 17 件)。
 * 検査の中だけで起動を包み、画面を開く検査と同じ file で 1 つの Chromium (`fileChromium`) を返す。製品の書き出しは変えない。
 *
 * 書き出しの命令を子の Node のプロセスで起こす件も、書き出しの検査の file からは外す。子のプロセスには包みが届かないため。
 */
import { mkdtempSync, readdirSync, readFileSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import type { Browser } from "playwright-core";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { exporter } from "./export-support";
import { fileChromium, fileChromiumLaunches } from "./page-needs";

const ROOT = process.cwd();
const scratch = (): string => mkdtempSync(join(tmpdir(), "dragon-shared-chromium-"));

/** 箱 2 つと線 1 本の小さな時系列図。PNG を撮るだけの重さに留める */
const SMALL = {
  version: 1,
  kind: "sequence",
  title: "Small",
  boxes: [
    { id: "a", name: "A" },
    { id: "b", name: "B" },
  ],
  steps: [{ title: "Call", body: "A calls B.", events: [{ type: "edge", from: "a", to: "b", label: "hi", carry: { kind: "envelope" } }] }],
  sequence: { lifelines: ["a", "b"] },
};

describe("書き出しの検査が file で 1 つの Chromium を使う (#3599)", () => {
  // 書き出しの部品を読むのと Chromium を起こすのは、件の外の前処理で済ませる。混んだ機械で 1 件の上限 (10 秒) に入れないため
  let exportDiagram: Awaited<ReturnType<typeof exporter>>;
  let browser: Browser;
  beforeAll(async () => {
    exportDiagram = await exporter();
    browser = await fileChromium();
  });

  it("shared-chromium-launches-once-per-file", async () => {
    const opened = vi.spyOn(browser, "newPage");
    const dir = scratch();
    try {
      for (const name of ["one", "two"]) {
        const result = await exportDiagram(SMALL, { outDir: dir, name, formats: ["png"] });
        expect(statSync(result.files.png as string).size, `${name} の PNG が空`).toBeGreaterThan(0);
      }
      // 2 回とも file の Chromium で頁を開いたなら、書き出しは自分で Chromium を起こしていない
      expect(opened, "PNG を 2 回書き出す間に file の Chromium で頁を開いた回数").toHaveBeenCalledTimes(2);
      expect(fileChromiumLaunches(), "file で Chromium を起こした回数").toBe(1);
    } finally {
      opened.mockRestore();
    }
  });

  it("shared-chromium-is-file-chromium", async () => {
    const opened = vi.spyOn(browser, "newPage");
    const contexts = browser.contexts().length;
    try {
      const result = await exportDiagram(SMALL, { outDir: scratch(), formats: ["png"] });
      expect(statSync(result.files.png as string).size, "PNG が空").toBeGreaterThan(0);
      expect(opened, "書き出しが file の Chromium で頁を開いていない").toHaveBeenCalled();
      expect(browser.isConnected(), "書き出しが閉じた時に file の Chromium まで閉じた").toBe(true);
      expect(browser.contexts().length, "書き出しが開いた頁を閉じずに残した").toBe(contexts);
    } finally {
      opened.mockRestore();
    }
  });
});

describe("書き出しの検査の置き場 (#3599)", () => {
  it("export-tests-spawn-no-cli", () => {
    const spawning = ["export.test.ts", "export-language.test.ts"].flatMap((file) =>
      readFileSync(join(ROOT, "packages/dragon/test", file), "utf8")
        .split("\n")
        .flatMap((line, i) => (/\brunCli\(/u.test(line) ? [`${file}:${i + 1}`] : [])),
    );
    expect(spawning, "書き出しの命令を子の Node のプロセスで起こす行").toEqual([]);
  });

  it("product-reads-no-shared-chromium", () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]));
    const reading = walk(join(ROOT, "packages/dragon/src")).flatMap((file) =>
      /\b(page-needs|shared-chromium|test-support)\b/u.test(readFileSync(file, "utf8")) ? [relative(ROOT, file)] : [],
    );
    expect(reading, "検査の中で Chromium を包む処理を読む製品の file").toEqual([]);
  });
});
