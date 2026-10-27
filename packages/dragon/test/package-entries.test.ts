/**
 * package の入口 (#3021)。
 *
 * 使う人は `import` でも `require` でも、package の名前から入口を引く。
 * 0.35.0 は `exports` の `./export` に `require` の行が無く、`dist/export.cjs` を配っていながら
 * `require("@cardenelabs/dragon/export")` が断られた。
 * ここでは package の中から自分の名前で引き (Node の self-reference)、使う人と同じ解き方で確かめる。
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
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

  it("entry-types-match-module-system", () => {
    const { exports } = manifest();
    for (const entry of [".", "./export"]) {
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
    const tsc = createRequire(import.meta.url).resolve("typescript/bin/tsc");
    const work = mkdtempSync(join(tmpdir(), "dragon-player-options-"));
    const body = [
      "const options: PlayerOptions = { onStep: (step: number) => void step, fitHeight: true };",
      "declare const host: HTMLElement;",
      "export const player = mountDiagram(host, {}, options);",
      "",
    ].join("\n");
    try {
      const esm = join(ROOT, "dist/index.js");
      const cjs = join(ROOT, "dist/index.cjs");
      writeFileSync(join(work, "check.mts"), `import { mountDiagram, type PlayerOptions } from ${JSON.stringify(esm)};\n${body}`);
      writeFileSync(join(work, "check.cts"), `import { mountDiagram, type PlayerOptions } from ${JSON.stringify(cjs)};\n${body}`);
      const args = [tsc, "--noEmit", "--strict", "--skipLibCheck", "--module", "node16", "--moduleResolution", "node16", "--lib", "es2022,dom", "check.mts", "check.cts"];
      let out = "";
      try {
        out = execFileSync(process.execPath, args, { cwd: work, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      } catch (error) {
        const failed = error as { stdout?: string; stderr?: string };
        out = `${failed.stdout ?? ""}${failed.stderr ?? ""}`;
      }
      expect(out.match(/error TS\d+.*/g) ?? [], "PlayerOptions で組んだ設定を渡す code の型の誤り").toEqual([]);
    } finally {
      rmSync(work, { recursive: true, force: true });
    }
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
