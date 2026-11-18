/**
 * 重い仕事を件の外 (1 回の実行の準備の段) で済ませる道具 (#3734)。
 *
 * 命令の子の process、書き出し、図を描く仕事、型の検査、字の file を組む仕事は、混んだ機械で 1 件 10 秒の上限を超えた。
 * 検査の file と同じ名前の準備の file (`<名前>.prepare.ts`) が、その仕事を既定の書き出し (`default`) で行い、結果を返す。
 * 準備の段 (`prepare-setup.ts`) は、この回に回す検査の file のうち準備の file を持つ file の準備だけを並べて走らせ、結果を検査の file へ渡す。
 * 件は渡された結果を読んで確かめる (`packages/dragon/test/prepared.ts`)。
 *
 * 1 つの file の準備が落ちても実行を止めない。落ちた理由を結果に残し、その file の件が読んだ時に理由を挙げて落ちる。
 */
import { existsSync } from "node:fs";
import ts from "typescript";

/** 準備の file を持つ検査の file。背景の表の 6 つ (#3734) */
export const PREPARED_FILES = [
  "packages/dragon/test/export-language.test.ts",
  "packages/dragon/test/cli-language.test.ts",
  "packages/dragon/test/export.test.ts",
  "packages/dragon/test/package-entries.test.ts",
  "packages/dragon/test/export-fonts.test.ts",
  "packages/dragon/test/player.test.ts",
] as const;

/**
 * 件の中で起こすと重い仕事の呼び出しの名前。
 * 命令の子の process と同じ process での命令、書き出し、図を描く仕事、型の検査、字の file を組む仕事、入口の読み込み (`import()`)
 */
const HEAVY = new Set([
  "runCli",
  "runCliInProcess",
  "exporter",
  "exportDiagram",
  "exportInThread",
  "execFile",
  "execFileSync",
  "spawn",
  "spawnSync",
  "fork",
  "createProgram",
  "fontFaces",
  "renderDiagram",
  "import()",
]);

/** 部品を名前の字で引く道具 (`draw("renderDiagram")`、`api("parseNotation")`)。名前の字を呼び出しの名前に数える */
const BY_NAME = new Set(["draw", "api"]);

/** 呼び出しの名前。名前で引けない呼び出しは undefined */
function calleeName(call: ts.CallExpression): string | undefined {
  const callee = call.expression;
  if (callee.kind === ts.SyntaxKind.ImportKeyword) return "import()";
  if (ts.isIdentifier(callee)) {
    const [first] = call.arguments;
    if (BY_NAME.has(callee.text) && first && ts.isStringLiteralLike(first)) return first.text;
    return callee.text;
  }
  if (ts.isPropertyAccessExpression(callee)) return callee.name.text;
  return undefined;
}

/** 検査の字が起こす重い仕事の呼び出しの名前 (重ならず、字の順)。説明の文と字の列の中の名前は数えない */
export function heavyCalls(source: string): string[] {
  const file = ts.createSourceFile(
    "checked.ts",
    source,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TS,
  );
  const found = new Set<string>();
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node)) {
      const name = calleeName(node);
      if (name !== undefined && HEAVY.has(name)) found.add(name);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return [...found].sort();
}

/** 検査の file と同じ名前の準備の file の path */
const prepareFileOf = (testFile: string): string => testFile.replace(/\.test\.ts$/u, ".prepare.ts");

/** 回す検査の file のうち、準備の file を持つ file と、その準備の file */
export function preparesFor(
  testFiles: readonly string[],
): { testFile: string; prepareFile: string }[] {
  return testFiles.flatMap((testFile) => {
    const prepareFile = prepareFileOf(testFile);
    return prepareFile !== testFile && existsSync(prepareFile) ? [{ testFile, prepareFile }] : [];
  });
}

/** 1 つの file の準備の結果。落ちた時は理由の文 */
export type PrepareResult = { ok: true; value: unknown } | { ok: false; error: string };

declare module "vitest" {
  export interface ProvidedContext {
    /** 準備の file が済ませた仕事の結果。鍵は検査の file の path (repo の根から)。準備の段 (`prepare-setup.ts`) が渡す */
    dragonPrepared: Record<string, PrepareResult>;
  }
}

/** 準備を並べて走らせ、鍵ごとの結果を返す。落ちた準備は理由を残し、ほかの準備を止めない */
export async function runPrepares(
  entries: readonly { key: string; run: () => Promise<unknown> }[],
): Promise<Record<string, PrepareResult>> {
  const settled = await Promise.allSettled(entries.map((entry) => entry.run()));
  return Object.fromEntries(
    entries.map((entry, i) => {
      const done = settled[i] as PromiseSettledResult<unknown>;
      const result: PrepareResult =
        done.status === "fulfilled"
          ? { ok: true, value: done.value }
          : {
              ok: false,
              error:
                done.reason instanceof Error
                  ? (done.reason.stack ?? done.reason.message)
                  : String(done.reason),
            };
      return [entry.key, result];
    }),
  );
}

/** 鍵の file の準備の結果。準備が落ちた時と、準備の段が走らせていない時は、file の名前と理由を挙げて落とす */
export function readPrepared(results: Record<string, unknown>, key: string): unknown {
  const result = results[key] as PrepareResult | undefined;
  if (result === undefined)
    throw new Error(
      `準備の段が ${key} の準備を走らせていない。準備の段 (test-support/prepare-setup.ts) を持つ設定 (vitest.config.ts) で回す`,
    );
  if (!result.ok) throw new Error(`${key} の準備が落ちた: ${result.error}`);
  return result.value;
}
