/**
 * package の入口 (#3021)。
 *
 * 使う人は `import` でも `require` でも、package の名前から入口を引く。
 * 0.35.0 は `exports` の `./export` に `require` の行が無く、`dist/export.cjs` を配っていながら
 * `require("@cardenelabs/dragon/export")` が断られた。
 * ここでは package の中から自分の名前で引き (Node の self-reference)、使う人と同じ解き方で確かめる。
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { builtinModules, createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MANIFEST = join(ROOT, "package.json");

interface Conditions {
  types?: string;
  default?: string;
}
type Target = string | Record<string, string | Conditions>;
interface Manifest {
  name: string;
  main: string;
  module: string;
  types: string;
  bin: Record<string, string>;
  exports: Record<string, Target>;
}

const manifest = (): Manifest => JSON.parse(readFileSync(MANIFEST, "utf8")) as Manifest;

/** `exports` の中の path を全て拾う (入れ子の条件も辿る) */
function targets(entry: Target | Conditions): string[] {
  if (typeof entry === "string") return [entry];
  return Object.values(entry).flatMap((value) => (value === undefined ? [] : targets(value)));
}

/** 入口と条件 (`import` / `require`) から、渡る型の path を引く */
function typesOf(entry: Target, condition: "import" | "require"): string | undefined {
  if (typeof entry === "string") return undefined;
  const branch = entry[condition];
  return typeof branch === "object" ? branch.types : undefined;
}

/** build した file の `import` と `require` が読む先のうち、Node の組み込みの module (`node:` の付く名前を含む) */
function nodeBuiltinsRead(file: string): string[] {
  const builtins = new Set(builtinModules.flatMap((name) => [name, `node:${name}`]));
  const text = readFileSync(file, "utf8");
  const read = [...text.matchAll(/(?:\bimport\s*\(\s*|\brequire\s*\(\s*|\bfrom\s*|\bimport\s+)["']([^"']+)["']/g)].map((match) => match[1] ?? "");
  return [...new Set(read.filter((name) => builtins.has(name)))].sort();
}

describe("package の入口 (#3021)", () => {
  it("export-entry-requirable", () => {
    const require = createRequire(MANIFEST);
    const loaded = require(`${manifest().name}/export`) as { exportDiagram?: unknown };
    expect(typeof loaded.exportDiagram, "require で書き出しの部品を引く").toBe("function");
  });

  it("main-entry-requirable", () => {
    const require = createRequire(MANIFEST);
    const loaded = require(manifest().name) as { parseNotation?: unknown; renderDiagram?: unknown };
    expect(typeof loaded.parseNotation, "require で記法を読む部品を引く").toBe("function");
    expect(typeof loaded.renderDiagram, "require で描く部品を引く").toBe("function");
  });

  it("node-entry-requirable", async () => {
    const require = createRequire(MANIFEST);
    const required = require(`${manifest().name}/node`) as { migrateFile?: unknown };
    const imported = (await import(/* @vite-ignore */ `${manifest().name}/node`)) as { migrateFile?: unknown };
    expect({ require: typeof required.migrateFile, import: typeof imported.migrateFile }, "Node の入口から原本の file を移す部品を引く").toEqual({
      require: "function",
      import: "function",
    });
  });

  it("light-entry-browser-safe", () => {
    // 軽い入口と種類の部品の塊を頁を束ねる道具が読む (#3248)。既定の入口と同じく Node の組み込みの module を読まない
    const light = manifest().exports["./light"];
    expect(light, "exports に ./light が在る").toBeDefined();
    if (light === undefined) return;
    const files = targets(light).filter((path) => !/\.d\.c?ts$/.test(path));
    expect(files, "軽い入口の file").toEqual(["./dist/light/index.js", "./dist/light/index.cjs"]);
    const chunks = readdirSync(join(ROOT, "dist/light")).filter((file) => /\.c?js$/.test(file));
    expect(chunks.length, "軽い入口と種類の部品の塊の file の数").toBeGreaterThan(files.length);
    const read = chunks.flatMap((file) => nodeBuiltinsRead(join(ROOT, "dist/light", file)));
    expect(read, "軽い入口と種類の部品の塊が読む Node の組み込みの module").toEqual([]);

    const require = createRequire(MANIFEST);
    const loaded = require(`${manifest().name}/light`) as { loadKind?: unknown; renderDiagram?: unknown; readDiagram?: unknown };
    expect({ loadKind: typeof loaded.loadKind, renderDiagram: typeof loaded.renderDiagram, readDiagram: typeof loaded.readDiagram }, "軽い入口が出す部品").toEqual({
      loadKind: "function",
      renderDiagram: "function",
      readDiagram: "function",
    });
  });

  it("main-entry-browser-safe", () => {
    // 頁を束ねる道具は、呼ぶかどうかに関わらず入口の file の読み込みを全て解く。Node の組み込みの module を 1 つでも読むと、
    // ブラウザ向けの build が止まる (Next.js の Turbopack が `migrateFile` の `fs/promises` で止まった、#3206)
    const main = manifest().exports["."];
    expect(main, "exports に . が在る").toBeDefined();
    if (main === undefined) return;
    const files = targets(main).filter((path) => !/\.d\.c?ts$/.test(path));
    expect(files, "頁の入口の file").toEqual(["./dist/index.js", "./dist/index.cjs"]);
    const builtins = Object.fromEntries(files.map((file) => [file, nodeBuiltinsRead(join(ROOT, file))]));
    expect(builtins, "頁の入口の file が読む Node の組み込みの module").toEqual({ "./dist/index.js": [], "./dist/index.cjs": [] });
    // 陰性でない対照。node で動く書き出しの入口では、同じ走査が組み込みの module を見つける (走査が空振りしていない)
    expect(nodeBuiltinsRead(join(ROOT, "dist/export.js")).length, "書き出しの入口が読む組み込みの module の数").toBeGreaterThan(0);

    const require = createRequire(MANIFEST);
    const loaded = require(manifest().name) as { migrateFile?: unknown; readDiagram?: unknown };
    expect({ migrateFile: typeof loaded.migrateFile, readDiagram: typeof loaded.readDiagram }, "頁の入口が出す部品").toEqual({
      migrateFile: "undefined",
      readDiagram: "function",
    });
  });

  it("capture-entry-browser-safe", async () => {
    // 書き出す入口 (#3644) は頁が読み、ブラウザで描いた図を画像にする。頁を束ねる道具は入口の読み込みを全て解くので、Node の組み込みの module を読まない
    const capture = manifest().exports["./capture"];
    expect(capture, "exports に ./capture が在る").toBeDefined();
    if (capture === undefined) return;
    const files = targets(capture).filter((path) => !/\.d\.c?ts$/.test(path));
    expect(files, "書き出す入口の file").toEqual(["./dist/capture.js", "./dist/capture.cjs"]);
    const builtins = Object.fromEntries(files.map((file) => [file, nodeBuiltinsRead(join(ROOT, file))]));
    expect(builtins, "書き出す入口の file が読む Node の組み込みの module").toEqual({ "./dist/capture.js": [], "./dist/capture.cjs": [] });
    expect({ import: typesOf(capture, "import"), require: typesOf(capture, "require") }, "書き出す入口の型").toEqual({ import: "./dist/capture.d.ts", require: "./dist/capture.d.cts" });

    const names = ["captureFilm", "captureGif", "captureMp4", "capturePng", "captureSvg", "canCaptureMp4"];
    const require = createRequire(MANIFEST);
    const required = require(`${manifest().name}/capture`) as Record<string, unknown>;
    const imported = (await import(/* @vite-ignore */ `${manifest().name}/capture`)) as Record<string, unknown>;
    const kinds = (loaded: Record<string, unknown>): Record<string, string> => Object.fromEntries(names.map((name) => [name, typeof loaded[name]]));
    const all = Object.fromEntries(names.map((name) => [name, "function"]));
    expect({ require: kinds(required), import: kinds(imported) }, "書き出す入口が出す部品").toEqual({ require: all, import: all });
  });

  it("main-entry-skips-encoders", () => {
    // 描く入口は書き出さない頁も読むので、コマを詰める道具 (gifenc と mediabunny) を読まない (#3644)。道具を読むのは書き出す入口だけ
    const encoders = (file: string): string[] => {
      const text = readFileSync(join(ROOT, file), "utf8");
      const read = [...text.matchAll(/(?:\bimport\s*\(\s*|\brequire\s*\(\s*|\bfrom\s*|\bimport\s+)["']([^"']+)["']/g)].map((match) => match[1] ?? "");
      // 束の中に写し込んだ時も見つけるよう、道具の部品の名前も探す
      const inlined = ["GIFEncoder", "Mp4OutputFormat"].filter((name) => text.includes(name));
      return [...new Set([...read.filter((name) => /^(?:gifenc|mediabunny)(?:\/|$)/.test(name)), ...inlined])].sort();
    };
    const light = readdirSync(join(ROOT, "dist/light"))
      .filter((file) => /\.c?js$/.test(file))
      .map((file) => `dist/light/${file}`);
    const drawing = ["dist/index.js", "dist/index.cjs", ...light];
    expect(light.length, "軽い入口の塊の file の数").toBeGreaterThan(2);
    const read = Object.fromEntries(drawing.flatMap((file) => (encoders(file).length ? [[file, encoders(file)]] : [])));
    expect(read, "描く入口と軽い入口の file が読む詰める道具").toEqual({});
    // 陰性でない対照。書き出す入口では、同じ走査が 2 つの道具を見つける (走査が空振りしていない)
    const capture = existsSync(join(ROOT, "dist/capture.js")) ? encoders("dist/capture.js") : [];
    expect(capture, "書き出す入口が読む詰める道具").toEqual(expect.arrayContaining(["gifenc", "mediabunny"]));
  });

  it("entry-types-match-module-system", () => {
    const { exports } = manifest();
    for (const entry of [".", "./export", "./node"]) {
      const target = exports[entry];
      expect(target, `exports に ${entry} が在る`).toBeDefined();
      if (target === undefined) continue;
      expect(typesOf(target, "import"), `${entry} の import に渡る型`).toMatch(/\.d\.ts$/);
      expect(typesOf(target, "require"), `${entry} の require に渡る型`).toMatch(/\.d\.cts$/);
    }
  });

  it("entries-point-at-built-files", () => {
    const m = manifest();
    const paths = [m.main, m.module, m.types, ...Object.values(m.bin), ...Object.values(m.exports).flatMap(targets)];
    expect(paths.length, "確かめる path の数").toBeGreaterThan(10);
    const missing = paths.filter((path) => !existsSync(join(ROOT, path)));
    expect(missing, "build の後に無い入口").toEqual([]);
  });

  it("bin-path-needs-no-fix", () => {
    // npm は公開の時に bin の path の先頭の `./` を外し、「無効なので外した」と警告する
    for (const [command, path] of Object.entries(manifest().bin)) {
      expect(path.startsWith("./"), `bin の ${command} の path ${path}`).toBe(false);
    }
  });
});

/** tmp の dir に file を書き、使う人と同じ設定 (`--module node16`、`--strict`) で型検査した時の誤りの行 */
function typeErrors(files: Record<string, string>): string[] {
  const tsc = createRequire(import.meta.url).resolve("typescript/bin/tsc");
  const work = mkdtempSync(join(tmpdir(), "dragon-types-"));
  try {
    for (const [name, text] of Object.entries(files)) writeFileSync(join(work, name), text);
    const args = [tsc, "--noEmit", "--strict", "--skipLibCheck", "--module", "node16", "--moduleResolution", "node16", "--target", "es2022", "--lib", "es2022,dom", ...Object.keys(files)];
    let out = "";
    try {
      out = execFileSync(process.execPath, args, { cwd: work, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    } catch (error) {
      const failed = error as { stdout?: string; stderr?: string };
      out = `${failed.stdout ?? ""}${failed.stderr ?? ""}`;
    }
    return out.match(/error TS\d+.*/g) ?? [];
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

/** 型の file の `export { … }` が出す名前 (`X as Y` は外から見える `Y`) */
function exportedNames(text: string): string[] {
  return [...text.matchAll(/export \{([^}]*)\}/g)].flatMap((m) =>
    (m[1] ?? "")
      .split(",")
      .map((part) => part.replace(/\btype\s+/, "").split(/\s+as\s+/).at(-1)?.trim() ?? "")
      .filter((name) => name !== ""),
  );
}

describe("入口が出す型 (#3147)", () => {
  it("player-options-type-exported", () => {
    // `mountDiagram` の設定 (`onStep` と `fitHeight`) の型を、import と require のどちらで入れても名前で受け取れる
    const main = manifest().exports["."];
    expect(main, "exports に . が在る").toBeDefined();
    if (main === undefined) return;
    for (const condition of ["import", "require"] as const) {
      const path = typesOf(main, condition);
      expect(path, `. の ${condition} に渡る型`).toBeDefined();
      if (path === undefined) continue;
      const names = exportedNames(readFileSync(join(ROOT, path), "utf8"));
      expect(names, `${path} が出す名前`).toContain("mountDiagram");
      expect(names, `${path} が PlayerOptions を出さない`).toContain("PlayerOptions");
    }
  });

  it("player-options-type-checks", () => {
    // 使う人と同じく、型で組んだ設定を変数に入れてから `mountDiagram` に渡す code を ESM と CJS の両方で型検査する
    const body = [
      "const options: PlayerOptions = { onStep: (step: number) => void step, fitHeight: true };",
      "declare const host: HTMLElement;",
      "export const player = mountDiagram(host, {}, options);",
      "",
    ].join("\n");
    const esm = JSON.stringify(join(ROOT, "dist/index.js"));
    const cjs = JSON.stringify(join(ROOT, "dist/index.cjs"));
    const errors = typeErrors({
      "check.mts": `import { mountDiagram, type PlayerOptions } from ${esm};\n${body}`,
      "check.cts": `import { mountDiagram, type PlayerOptions } from ${cjs};\n${body}`,
    });
    expect(errors, "PlayerOptions で組んだ設定を渡す code の型の誤り").toEqual([]);
  });
});

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

describe("入口から届く型 (#3149)", () => {
  it("entry-types-all-exported", () => {
    // 入口の名前は手で並べているので、型を足して並べ忘れても build は通る。import 用と require 用の型の file ごとに、全部の入口を合わせて数える
    const { exports } = manifest();
    const missing = Object.fromEntries(
      (["import", "require"] as const).map((condition) => {
        const entries = Object.values(exports).flatMap((target) => {
          const path = typesOf(target, condition);
          return path === undefined ? [] : [join(ROOT, path)];
        });
        expect(entries.length, `${condition} に型を渡す入口の数`).toBeGreaterThan(1);
        return [condition, unexportedTypes(entries)];
      }),
    );
    expect(missing, "型の file で、どの入口からも出ていない型").toEqual({ import: [], require: [] });
  });
});

/** package の README 2 つと、それぞれの頁に置く節の見出し。英語の README は日本語と同じ例を置く (#3317) */
const PLACE_SECTIONS = [
  { file: "README.ja.md", heading: "## 頁に置く" },
  { file: "README.md", heading: "## Put it on a page" },
] as const;

/** package の README の頁に置く節の、`ts` の囲みの中身。節か囲みが無ければ空 */
function mountExample(file: string, heading: string): string {
  const readme = readFileSync(join(ROOT, file), "utf8");
  const start = readme.indexOf(`\n${heading}\n`);
  if (start < 0) return "";
  const end = readme.indexOf("\n## ", start + 1);
  const section = readme.slice(start, end < 0 ? undefined : end);
  return /```ts\n([\s\S]*?)```/u.exec(section)?.[1] ?? "";
}

describe("README の頁に置く節 (#3153)", () => {
  it("readme-mount-imports-fonts", () => {
    // 図は同梱の字で測った幅で組むので、頁で字の入口を読み込まないと端末の字で描かれて札から字がはみ出す
    for (const { file, heading } of PLACE_SECTIONS) {
      const lines = mountExample(file, heading).split("\n");
      expect(lines, `${file} の頁に置く節の例が字の入口を import しない`).toContain('import "@cardenelabs/dragon/fonts";');
      expect(lines.some((line) => line.includes("mountDiagram(")), `${file} の頁に置く節の例が mountDiagram を呼ばない`).toBe(true);
    }
  });

  it("readme-mount-example-type-checks", () => {
    // 使う人が写して使うので、公開する型の file に対して型の誤りが無いかを確かめる。入口の名前は build した file の path に替える
    const examples = PLACE_SECTIONS.map(({ file, heading }) => mountExample(file, heading));
    for (const [i, example] of examples.entries()) expect(example, `${PLACE_SECTIONS[i]?.file} に頁に置く節の ts の例が在る`).not.toBe("");
    // 英語の README は日本語の README と同じ例を置く。同じなので型を確かめるのは 1 つで足りる (#3317)
    expect(examples[1], "英語と日本語の README で頁に置く節の例が違う").toBe(examples[0]);
    const code = (examples[0] ?? "")
      .replaceAll('"@cardenelabs/dragon/fonts"', JSON.stringify(join(ROOT, "dist/fonts.js")))
      .replaceAll('"@cardenelabs/dragon"', JSON.stringify(join(ROOT, "dist/index.js")));
    expect(typeErrors({ "example.mts": code }), "README の頁に置く節の例の型の誤り").toEqual([]);
  });

  it("readme-light-example-matches", () => {
    // 図の種類の部品を後から読む節の例も、英語と日本語の README で同じ物を置く (#3317)
    const en = mountExample("README.md", "## Load diagram kinds on demand");
    expect(en, "英語の README に後から読む節の例が無い").not.toBe("");
    expect(en, "英語と日本語の README で後から読む節の例が違う").toBe(mountExample("README.ja.md", "## 図の種類の部品を後から読む"));
  });
});
