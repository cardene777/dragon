/**
 * package の入口 (#3021)。
 *
 * 使う人は `import` でも `require` でも、package の名前から入口を引く。
 * 0.35.0 は `exports` の `./export` に `require` の行が無く、`dist/export.cjs` を配っていながら
 * `require("@cardenelabs/dragon/export")` が断られた。
 * ここでは package の中から自分の名前で引き (Node の self-reference)、使う人と同じ解き方で確かめる。
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

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
