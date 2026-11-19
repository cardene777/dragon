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
import { describe, expect, it, vi } from "vitest";
import { atLoad } from "./at-load";
import { exporter } from "./export-support";
import { fileChromium, fileChromiumLaunches } from "./page-needs";
// src の全ての file を読んで確かめるので、どの file を変えてもこの検査が選ばれるよう、全ての種類を読む助けの file に型だけでつなぐ (#3763)
import type {} from "./all-kinds";

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

// 書き出しの部品を読む仕事、Chromium を起こす仕事、PNG を書き出す仕事は、file を読み込む段で済ませる。
// 件の外の前処理で済ませても、混んだ機械で前処理の上限 (10 秒) を超えた (#3759)。件は書き出した結果と数を読む
const EXPORTER = await atLoad("書き出しの部品を読む", exporter);
const CHROMIUM = await atLoad("file の Chromium を起こす", fileChromium);

/** 既定の名前で書き出す時の鍵 */
const DEFAULT_NAME = "既定の名前";

/** 名前ごとに PNG を書き出し、その間に file の Chromium で頁を開いた回数と、書き出した後の Chromium の様子を返す */
async function exportWatched(names: readonly string[]) {
  const exportDiagram = EXPORTER.get();
  const browser = CHROMIUM.get();
  const opened = vi.spyOn(browser, "newPage");
  const contextsBefore = browser.contexts().length;
  const dir = scratch();
  try {
    const sizes: Record<string, number> = {};
    for (const name of names) {
      const result = await exportDiagram(SMALL, { outDir: dir, ...(name === DEFAULT_NAME ? {} : { name }), formats: ["png"] });
      sizes[name] = statSync(result.files.png as string).size;
    }
    return { sizes, opened: opened.mock.calls.length, launches: fileChromiumLaunches(), connected: browser.isConnected(), contextsBefore, contextsAfter: browser.contexts().length };
  } finally {
    opened.mockRestore();
  }
}

const TWICE = await atLoad("PNG を 2 回書き出す", () => exportWatched(["one", "two"]));
const ONCE = await atLoad("PNG を既定の名前で 1 回書き出す", () => exportWatched([DEFAULT_NAME]));

describe("書き出しの検査が file で 1 つの Chromium を使う (#3599)", () => {
  it("shared-chromium-launches-once-per-file", () => {
    const twice = TWICE.get();
    for (const name of ["one", "two"]) expect(twice.sizes[name], `${name} の PNG が空`).toBeGreaterThan(0);
    // 2 回とも file の Chromium で頁を開いたなら、書き出しは自分で Chromium を起こしていない
    expect(twice.opened, "PNG を 2 回書き出す間に file の Chromium で頁を開いた回数").toBe(2);
    expect(twice.launches, "file で Chromium を起こした回数").toBe(1);
  });

  it("shared-chromium-is-file-chromium", () => {
    const once = ONCE.get();
    expect(once.sizes[DEFAULT_NAME], "PNG が空").toBeGreaterThan(0);
    expect(once.opened, "書き出しが file の Chromium で頁を開いていない").toBeGreaterThan(0);
    expect(once.connected, "書き出しが閉じた時に file の Chromium まで閉じた").toBe(true);
    expect(once.contextsAfter, "書き出しが開いた頁を閉じずに残した").toBe(once.contextsBefore);
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
