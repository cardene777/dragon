/**
 * 重い仕事を件の外 (1 回の実行の準備の段) で済ませる形を守る (#3734)。
 *
 * 命令を子の process で起こす検査と Chromium で頁を開く検査は、別の会話の負荷が高い時 (load average 50 から 100) に 1 件 10 秒の上限を超えて落ちた。
 * 命令の子の process、書き出し、図を描く仕事、型の検査、字の file を組む仕事は、検査の file と同じ名前の準備の file (`<名前>.prepare.ts`) に書き、
 * 準備の段 (`test-support/prepare-setup.ts`) が実行の初めに済ませる。件は済ませた結果を読んで確かめる。
 * 件の中に残すのは、確かめる中身そのもの (jsdom で図を置く仕事と、Chromium の頁で図を動かす仕事) だけ。
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();
const TEST_DIR = join(ROOT, "packages/dragon/test");

/** 背景の表の 6 つの検査の file (#3734) と、判定の表の書き出し (#3923) */
const PREPARED = ["export-language", "cli-language", "export", "package-entries", "export-fonts", "player", "judge-export"];

/** 準備の段の道具。まだ無い時は undefined にして、判定で落とす */
interface PrepareTools {
  PREPARED_FILES: readonly string[];
  heavyCalls: (source: string) => string[];
  preparesFor: (testFiles: readonly string[]) => { testFile: string; prepareFile: string }[];
  runPrepares: (entries: readonly { key: string; run: () => Promise<unknown> }[]) => Promise<Record<string, unknown>>;
  readPrepared: (results: Record<string, unknown>, key: string) => unknown;
}
const tools = async (): Promise<PrepareTools | undefined> => await import("../../../test-support/prepare").catch(() => undefined);

describe("重い仕事を準備の段で済ませる形 (#3734)", () => {
  it("prepared-files-have-prepare-modules", async () => {
    const t = await tools();
    expect(t?.PREPARED_FILES, "準備の段の道具が、準備の file を持つ検査の file の一覧を出していない").toEqual(PREPARED.map((name) => `packages/dragon/test/${name}.test.ts`));
    const missing = PREPARED.filter((name) => !existsSync(join(TEST_DIR, `${name}.prepare.ts`)));
    expect(missing, "準備の file (<名前>.prepare.ts) を持たない検査の file").toEqual([]);
    const unread = PREPARED.filter((name) => !new RegExp(`from "\\./${name}\\.prepare"`, "u").test(readFileSync(join(TEST_DIR, `${name}.test.ts`), "utf8")));
    expect(unread, "準備の file を読まない検査の file (読まないと、準備の file を変えた時に関係する検査に選ばれない)").toEqual([]);
  });

  it("prepared-files-do-no-heavy-work-in-cases", async () => {
    const t = await tools();
    expect(t?.heavyCalls, "重い仕事の呼び出しを探す道具が無い").toBeDefined();
    if (!t) return;
    const found = Object.fromEntries(
      PREPARED.flatMap((name) => {
        const calls = t.heavyCalls(readFileSync(join(TEST_DIR, `${name}.test.ts`), "utf8"));
        return calls.length > 0 ? [[`${name}.test.ts`, calls]] : [];
      }),
    );
    expect(found, "件の中で重い仕事を起こす検査の file と、その呼び出し (準備の file へ移す)").toEqual({});
  });

  it("heavy-work-finder-names-planted-calls", async () => {
    const t = await tools();
    expect(t?.heavyCalls, "重い仕事の呼び出しを探す道具が無い").toBeDefined();
    if (!t) return;
    const planted = [
      'const ran = await runCli(["export"]);',
      'const same = await runCliInProcess(["export"]);',
      "const exportDiagram = await exporter();",
      "await exportDiagram(diagram, { outDir });",
      'execFileSync(process.execPath, ["-e", "0"]);',
      'spawnSync("node", []);',
      "ts.createProgram(entries, {});",
      "await fontFaces(chars);",
      'draw("renderDiagram")(source, {});',
      'const loaded = await import("@cardenelabs/dragon/capture");',
    ].join("\n");
    expect(t.heavyCalls(planted), "書き足した重い仕事の呼び出しの名前").toEqual([
      "createProgram",
      "execFileSync",
      "exportDiagram",
      "exporter",
      "fontFaces",
      "import()",
      "renderDiagram",
      "runCli",
      "runCliInProcess",
      "spawnSync",
    ]);
    // 説明の文と字の列に書いた名前は呼び出しではないので数えない。jsdom で図を置く仕事と頁を開く仕事は確かめる中身なので数えない
    const clean = [
      "// runCli(...) と renderDiagram は準備の段で済ませる",
      'const note = "exporter() を呼ばない";',
      'const player = draw("mountDiagram")(host, diagram, {});',
      "const words = await playerWords(html, 440);",
    ].join("\n");
    expect(t.heavyCalls(clean), "重い仕事でない呼び出しを重い仕事と数えた").toEqual([]);
  });

  it("prepare-runs-only-for-selected-files", async () => {
    const t = await tools();
    expect(t?.preparesFor, "準備の file を選ぶ道具が無い").toBeDefined();
    if (!t) return;
    const dir = mkdtempSync(join(tmpdir(), "dragon-prepare-"));
    mkdirSync(join(dir, "test"));
    const withPrepare = join(dir, "test/a.test.ts");
    const withoutPrepare = join(dir, "test/b.test.ts");
    writeFileSync(withPrepare, "");
    writeFileSync(join(dir, "test/a.prepare.ts"), "export default async () => 1;\n");
    writeFileSync(withoutPrepare, "");
    expect(t.preparesFor([withPrepare, withoutPrepare]), "準備の file を持つ検査の file だけを選ばない").toEqual([{ testFile: withPrepare, prepareFile: join(dir, "test/a.prepare.ts") }]);
    expect(t.preparesFor([withoutPrepare]), "準備の file を持つ検査の file を回さない回で準備を選んだ").toEqual([]);
    let ran = 0;
    expect(await t.runPrepares([]), "準備が無い回で結果を作った").toEqual({});
    await t.runPrepares([{ key: "a", run: () => Promise.resolve(ran++) }]);
    expect(ran, "選んだ準備を 1 度だけ走らせない").toBe(1);
  });

  it("prepare-failure-fails-only-its-file", async () => {
    const t = await tools();
    expect(t?.runPrepares, "準備を走らせる道具が無い").toBeDefined();
    if (!t) return;
    const results = await t.runPrepares([
      {
        key: "packages/dragon/test/broken.test.ts",
        run: () => Promise.reject(new Error("命令を起こせない")),
      },
      { key: "packages/dragon/test/fine.test.ts", run: () => Promise.resolve({ code: 0 }) },
    ]);
    expect(t.readPrepared(results, "packages/dragon/test/fine.test.ts"), "落ちた準備と同じ回の、ほかの file の準備の結果を読めない").toEqual({ code: 0 });
    expect(() => t.readPrepared(results, "packages/dragon/test/broken.test.ts"), "落ちた準備の結果を読んだ件が、file の名前と理由を挙げて落ちない").toThrow(/broken\.test\.ts[\s\S]*命令を起こせない/u);
    expect(() => t.readPrepared(results, "packages/dragon/test/unknown.test.ts"), "準備の段が走らせていない file の結果を読んだ件が、理由を挙げて落ちない").toThrow(/unknown\.test\.ts/u);
  });
});
