/**
 * `package-entries.test.ts` の型検査と、別の Node と入口の読み込みを、1 回の実行の準備の段で済ませる (#3734)。
 *
 * 使う人と同じ設定の型検査 (`tsc`) と、build した型の file を全て読む型の program は、混んだ機械で 1 件の上限 (10 秒) を超えた。
 * 件は準備の段が数えた誤りと、引いた部品の種類を確かめる。
 * 入口の解き方は件の中で読んでいた時と同じで、package の中から自分の名前で引く (Node の self-reference)。件と準備で同じ物を使う値はここに置く。
 */
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import ts from "typescript";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const MANIFEST = join(ROOT, "package.json");

export interface Conditions {
  types?: string;
  default?: string;
}
export type Target = string | Record<string, string | Conditions>;
interface Manifest {
  name: string;
  main: string;
  module: string;
  types: string;
  bin: Record<string, string>;
  exports: Record<string, Target>;
}

export const manifest = (): Manifest => JSON.parse(readFileSync(MANIFEST, "utf8")) as Manifest;

/** 入口と条件 (`import` / `require`) から、渡る型の path を引く */
export function typesOf(entry: Target, condition: "import" | "require"): string | undefined {
  if (typeof entry === "string") return undefined;
  const branch = entry[condition];
  return typeof branch === "object" ? branch.types : undefined;
}

/** 書き出す入口 (#3644) が出す部品の名前 */
export const CAPTURE_NAMES = ["captureFilm", "captureGif", "captureMp4", "capturePng", "captureSvg", "canCaptureMp4"];

/** package の README 2 つと、それぞれの頁に置く節の見出し。英語の README は日本語と同じ例を置く (#3317) */
export const PLACE_SECTIONS = [
  { file: "README.ja.md", heading: "## 頁に置く" },
  { file: "README.md", heading: "## Put it on a page" },
] as const;

/** package の README の頁に置く節の、`ts` の囲みの中身。節か囲みが無ければ空 */
export function mountExample(file: string, heading: string): string {
  const readme = readFileSync(join(ROOT, file), "utf8");
  const start = readme.indexOf(`\n${heading}\n`);
  if (start < 0) return "";
  const end = readme.indexOf("\n## ", start + 1);
  const section = readme.slice(start, end < 0 ? undefined : end);
  return /```ts\n([\s\S]*?)```/u.exec(section)?.[1] ?? "";
}

const run = promisify(execFile);

/** tmp の dir に file を書き、使う人と同じ設定 (`--module node16`、`--strict`) で型検査した時の誤りの行 */
async function typeErrors(files: Record<string, string>): Promise<string[]> {
  const tsc = createRequire(import.meta.url).resolve("typescript/bin/tsc");
  const work = mkdtempSync(join(tmpdir(), "dragon-types-"));
  try {
    for (const [name, text] of Object.entries(files)) writeFileSync(join(work, name), text);
    const args = [tsc, "--noEmit", "--strict", "--skipLibCheck", "--module", "node16", "--moduleResolution", "node16", "--target", "es2022", "--lib", "es2022,dom", ...Object.keys(files)];
    let out = "";
    try {
      out = (await run(process.execPath, args, { cwd: work, encoding: "utf8" })).stdout;
    } catch (error) {
      const failed = error as { stdout?: string; stderr?: string };
      out = `${failed.stdout ?? ""}${failed.stderr ?? ""}`;
    }
    return out.match(/error TS\d+.*/g) ?? [];
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

/** 使う人と同じく、型で組んだ設定を変数に入れてから `mountDiagram` に渡す code を ESM と CJS の両方で型検査した誤り */
function playerOptionsErrors(): Promise<string[]> {
  const body = [
    "const options: PlayerOptions = { onStep: (step: number) => void step, fitHeight: true };",
    "declare const host: HTMLElement;",
    "export const player = mountDiagram(host, {}, options);",
    "",
  ].join("\n");
  const esm = JSON.stringify(join(ROOT, "dist/index.js"));
  const cjs = JSON.stringify(join(ROOT, "dist/index.cjs"));
  return typeErrors({
    "check.mts": `import { mountDiagram, type PlayerOptions } from ${esm};\n${body}`,
    "check.cts": `import { mountDiagram, type PlayerOptions } from ${cjs};\n${body}`,
  });
}

/** README の頁に置く節の例 (日本語の README の物) の型の誤り。入口の名前は build した file の path に替える */
function readmeErrors(): Promise<string[]> {
  const [first] = PLACE_SECTIONS;
  const code = mountExample(first.file, first.heading)
    .replaceAll('"@cardenelabs/dragon/fonts"', JSON.stringify(join(ROOT, "dist/fonts.js")))
    .replaceAll('"@cardenelabs/dragon"', JSON.stringify(join(ROOT, "dist/index.js")));
  return typeErrors({ "example.mts": code });
}

/** 別の Node の ESM で書き出す入口を読み、出す部品の種類を JSON で書いた行。読めない時は誤りの行 */
async function captureInNode(): Promise<string> {
  const script = `const m = await import(${JSON.stringify(`${manifest().name}/capture`)}); console.log(JSON.stringify(Object.fromEntries(${JSON.stringify(CAPTURE_NAMES)}.map((name) => [name, typeof m[name]]))));`;
  try {
    return (await run(process.execPath, ["--input-type=module", "-e", script], { cwd: ROOT, encoding: "utf8" })).stdout;
  } catch (error) {
    return String((error as { stderr?: string }).stderr ?? error).split("\n").find((line) => /Error/.test(line)) ?? String(error);
  }
}

/**
 * build した型の file に宣言された型のうち、どの入口からも出ていない型 (`<file> <名前>` の形)。
 * 型の file は入口から届く型だけを持つので、宣言されていて出ていない型は、使う人が名前で受け取れない型になる。
 */
function unexportedTypes(entries: string[]): string[] {
  const program = ts.createProgram(entries, {
    noEmit: true,
    module: ts.ModuleKind.Node16,
    moduleResolution: ts.ModuleResolutionKind.Node16,
  });
  const checker = program.getTypeChecker();
  const exported = new Set<ts.Symbol>();
  for (const entry of entries) {
    const source = program.getSourceFile(entry);
    const module = source === undefined ? undefined : checker.getSymbolAtLocation(source);
    if (module === undefined) throw new Error(`${entry} を型の file として読めない`);
    for (const symbol of checker.getExportsOfModule(module)) {
      exported.add(symbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(symbol) : symbol);
    }
  }
  const dist = join(ROOT, "dist");
  return program
    .getSourceFiles()
    .filter((source) => source.fileName.startsWith(dist))
    .flatMap((source) =>
      source.statements
        .filter((node) => ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node))
        .filter((node) => {
          const symbol = checker.getSymbolAtLocation(node.name);
          return symbol === undefined || !exported.has(symbol);
        })
        .map((node) => `${source.fileName.slice(dist.length + 1)} ${node.name.text}`),
    );
}

/** import 用と require 用の型の file ごとに、型を渡す入口の数と、全部の入口を合わせてどの入口からも出ていない型 */
function entryTypes(): Record<"import" | "require", { entries: number; missing: string[] }> {
  const { exports } = manifest();
  const of = (condition: "import" | "require"): { entries: number; missing: string[] } => {
    const entries = Object.values(exports).flatMap((target) => {
      const path = typesOf(target, condition);
      return path === undefined ? [] : [join(ROOT, path)];
    });
    return { entries: entries.length, missing: unexportedTypes(entries) };
  };
  return { import: of("import"), require: of("require") };
}

/** 読んだ入口が出す部品の種類 */
const kinds = (loaded: Record<string, unknown>, names: string[]): Record<string, string> => Object.fromEntries(names.map((name) => [name, typeof loaded[name]]));

export default async function prepare() {
  const { name } = manifest();
  // 子の process (型検査と別の Node) を先に起こし、待つ間にこの process で入口を読み、型の program を組む
  const children = Promise.all([playerOptionsErrors(), readmeErrors(), captureInNode()]);
  const node = (await import(/* @vite-ignore */ `${name}/node`)) as Record<string, unknown>;
  const capture = (await import(/* @vite-ignore */ `${name}/capture`)) as Record<string, unknown>;
  const types = entryTypes();
  const [playerOptions, readme, inNode] = await children;
  return {
    /** import で読んだ Node の入口が出す部品の種類 */
    nodeImport: kinds(node, ["migrateFile"]),
    /** import で読んだ書き出す入口が出す部品の種類 */
    captureImport: kinds(capture, CAPTURE_NAMES),
    /** 別の Node の ESM で読んだ書き出す入口が出す部品の種類 (JSON の行) */
    captureInNode: inNode,
    playerOptionsErrors: playerOptions,
    readmeErrors: readme,
    entryTypes: types,
  };
}
