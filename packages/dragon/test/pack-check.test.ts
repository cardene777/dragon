/**
 * 公開の直前に包んだ物を確かめる判定 (#3023)。
 *
 * 0.35.0 は `exports` の `./export` に `require` の行が無いまま公開した (#3021)。
 * 確かめる組を `exports` に書かれた条件から導くと、書き忘れた条件は確かめる組からも抜け、
 * 同じ穴を通してしまう。ここでは、条件を書き忘れた `exports` からも `require` を確かめる組が出ることと、
 * 何も確かめられなかった回を「通った」と出さないことを確かめる。
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

interface Entry {
  名前: string;
  入れ方: "import" | "require";
}
interface Result {
  何を: string;
  通った: boolean;
  理由?: string;
}

const require_ = createRequire(import.meta.url);
const { 入口を導く, 型の確かめの中身, 型を持つ入口, 結果をまとめる } = require_("../scripts/lib/pack-check.mjs") as {
  入口を導く: (manifest: unknown) => Entry[];
  型を持つ入口: (manifest: unknown) => string[];
  型の確かめの中身: (names: string[]) => { mts: string; cts: string };
  結果をまとめる: (results: Result[]) => { 通った: boolean; 文: string[] };
};

const MANIFEST = join(dirname(fileURLToPath(import.meta.url)), "../package.json");
const current = (): Record<string, unknown> => JSON.parse(readFileSync(MANIFEST, "utf8")) as Record<string, unknown>;

/** 0.35.0 の `exports` (`./export` に `require` が無い) */
const released0350 = {
  name: "@cardenelabs/dragon",
  exports: {
    ".": { types: "./dist/index.d.ts", import: "./dist/index.js", require: "./dist/index.cjs" },
    "./fonts": { import: "./dist/fonts.js", require: "./dist/fonts.cjs" },
    "./export": { types: "./dist/export.d.ts", import: "./dist/export.js" },
  },
};

const key = (entry: Entry): string => `${entry.入れ方} ${entry.名前}`;

describe("確かめる入口 (#3023)", () => {
  it("entries-derived-from-exports", () => {
    const entries = 入口を導く(current()).map(key).sort();
    expect(entries).toEqual(
      [
        "import @cardenelabs/dragon",
        "require @cardenelabs/dragon",
        "import @cardenelabs/dragon/fonts",
        "require @cardenelabs/dragon/fonts",
        "import @cardenelabs/dragon/export",
        "require @cardenelabs/dragon/export",
      ].sort(),
    );
  });

  it("require-checked-even-when-exports-omit-it", () => {
    expect(入口を導く(released0350).map(key)).toContain("require @cardenelabs/dragon/export");
  });

  it("wildcard-subpath-refused", () => {
    expect(() => 入口を導く({ name: "x", exports: { ".": "./a.js", "./parts/*": "./parts/*.js" } })).toThrow(/\*/);
  });

  it("typed-entries", () => {
    expect(型を持つ入口(current()).sort()).toEqual(["@cardenelabs/dragon", "@cardenelabs/dragon/export"]);
    expect(型を持つ入口(released0350).sort(), "条件のどれかに型があれば型を持つ入口").toEqual(["@cardenelabs/dragon", "@cardenelabs/dragon/export"]);
  });

  it("type-check-sources-import-every-typed-entry", () => {
    const names = ["@cardenelabs/dragon", "@cardenelabs/dragon/export"];
    const { mts, cts } = 型の確かめの中身(names);
    for (const name of names) {
      expect(mts, `.mts が ${name} を読む`).toContain(`from ${JSON.stringify(name)}`);
      expect(cts, `.cts が ${name} を読む`).toContain(`from ${JSON.stringify(name)}`);
    }
  });
});

describe("結果のまとめ (#3023)", () => {
  it("zero-results-not-passed", () => {
    const summary = 結果をまとめる([]);
    expect(summary.通った).toBe(false);
    expect(summary.文.join("\n")).toMatch(/0 件/);
  });

  it("one-failure-fails", () => {
    const summary = 結果をまとめる([
      { 何を: "import @cardenelabs/dragon", 通った: true },
      { 何を: "require @cardenelabs/dragon/export", 通った: false, 理由: "ERR_PACKAGE_PATH_NOT_EXPORTED" },
    ]);
    expect(summary.通った).toBe(false);
    expect(summary.文.join("\n")).toContain("ERR_PACKAGE_PATH_NOT_EXPORTED");
  });

  it("all-ok-passes", () => {
    const summary = 結果をまとめる([
      { 何を: "import @cardenelabs/dragon", 通った: true },
      { 何を: "require @cardenelabs/dragon", 通った: true },
    ]);
    expect(summary.通った).toBe(true);
    expect(summary.文.join("\n")).toMatch(/2 件/);
  });
});
