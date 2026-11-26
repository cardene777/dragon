/**
 * package の入口 (#3021)。
 *
 * 使う人は `import` でも `require` でも、package の名前から入口を引く。
 * 0.35.0 は `exports` の `./export` に `require` の行が無く、`dist/export.cjs` を配っていながら
 * `require("@cardenelabs/dragon/export")` が断られた。
 * ここでは package の中から自分の名前で引き (Node の self-reference)、使う人と同じ解き方で確かめる。
 * 型検査と別の Node と入口の import は 1 回の実行の準備の段で済ませ (`package-entries.prepare.ts`、#3734)、件は結果を確かめる。
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { builtinModules, createRequire } from "node:module";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import prepare, { CAPTURE_NAMES, type Conditions, MANIFEST, manifest, mountExample, PLACE_SECTIONS, ROOT, type Target, typesOf } from "./package-entries.prepare";
import { prepared } from "./prepared";

/** 準備の段が型検査し、読んだ結果 */
const done = (): Awaited<ReturnType<typeof prepare>> => prepared(import.meta.url);

/** `exports` の中の path を全て拾う (入れ子の条件も辿る) */
function targets(entry: Target | Conditions): string[] {
  if (typeof entry === "string") return [entry];
  return Object.values(entry).flatMap((value) => (value === undefined ? [] : targets(value)));
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

  it("node-entry-requirable", () => {
    const require = createRequire(MANIFEST);
    const required = require(`${manifest().name}/node`) as { migrateFile?: unknown };
    expect({ require: typeof required.migrateFile, import: done().nodeImport.migrateFile }, "Node の入口から原本の file を移す部品を引く").toEqual({
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

  it("capture-entry-browser-safe", () => {
    // 書き出す入口 (#3644) は頁が読み、ブラウザで描いた図を画像にする。頁を束ねる道具は入口の読み込みを全て解くので、Node の組み込みの module を読まない
    const capture = manifest().exports["./capture"];
    expect(capture, "exports に ./capture が在る").toBeDefined();
    if (capture === undefined) return;
    const files = targets(capture).filter((path) => !/\.d\.c?ts$/.test(path));
    expect(files, "書き出す入口の file").toEqual(["./dist/capture.js", "./dist/capture.cjs"]);
    const builtins = Object.fromEntries(files.map((file) => [file, nodeBuiltinsRead(join(ROOT, file))]));
    expect(builtins, "書き出す入口の file が読む Node の組み込みの module").toEqual({ "./dist/capture.js": [], "./dist/capture.cjs": [] });
    expect({ import: typesOf(capture, "import"), require: typesOf(capture, "require") }, "書き出す入口の型").toEqual({ import: "./dist/capture.d.ts", require: "./dist/capture.d.cts" });

    const require = createRequire(MANIFEST);
    const required = require(`${manifest().name}/capture`) as Record<string, unknown>;
    const kinds = (loaded: Record<string, unknown>): Record<string, string> => Object.fromEntries(CAPTURE_NAMES.map((name) => [name, typeof loaded[name]]));
    const all = Object.fromEntries(CAPTURE_NAMES.map((name) => [name, "function"]));
    expect({ require: kinds(required), import: done().captureImport }, "書き出す入口が出す部品").toEqual({ require: all, import: all });
  });

  it("capture-entry-imports-in-node", () => {
    // 包んだ物を入れて入口を読む確かめ (`check:pack`) は Node の ESM で書き出す入口を読む。`gifenc` を Node は CommonJS の build で読み、
    // 部品を名前で見せないので、名前で読んだ入口は読んだ所で止まった (#3659)。vitest の読み込みは CommonJS の部品を名前で見せるため、別の Node で読んだ
    expect(done().captureInNode.trim(), "Node の ESM で読んだ書き出す入口が出す部品").toBe(JSON.stringify(Object.fromEntries(CAPTURE_NAMES.map((name) => [name, "function"]))));
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

  it("entries-load-capture-beside", () => {
    // 帯の入口は書き出す部品 (`capture.js`) を入口の隣から後で読む (#3786)。使い手の Vite や webpack は読む先を字の形で拾い、書き出す部品を束ねる。
    // 検査が src の入口から書き出す部品を読む `src/frame/capture.js` (#3798) を置いても、build は読む先を外に残す
    // 軽い入口の帯の入口 (#3789) も、同じ置き場の隣から読む
    const entries = ["dist/frame.js", "dist/embed.js", "dist/light-frame.js", "dist/cdn/dragon-main.js"];
    // build した file が無い入口は、読まないと数えて判定の文で落とす
    const reads = Object.fromEntries(entries.map((file) => [file, existsSync(join(ROOT, file)) && readFileSync(join(ROOT, file), "utf8").includes('import("./capture.js")')]));
    expect(reads, '書き出す部品を import("./capture.js") の字の形で読む入口').toEqual(Object.fromEntries(entries.map((file) => [file, true])));
  });

  it("entries-skip-capture-body", () => {
    // 書き出す部品は動画の道具ごと束ねると大きいので、配る入口に束ねず隣の file に分ける (#3644、#3699)。
    // 書き出す部品だけが持つ誤りの文で、`src/frame/capture.js` (#3798) を束ねた入口の file を探す
    const mark = "Cannot encode the PNG";
    const holds = (file: string): boolean => existsSync(join(ROOT, file)) && readFileSync(join(ROOT, file), "utf8").includes(mark);
    const cdn = readdirSync(join(ROOT, "dist/cdn"))
      .filter((file) => file.endsWith(".js") && file !== "capture.js")
      .map((file) => `dist/cdn/${file}`);
    expect(cdn.length, "script の1行の入口の塊の file の数").toBeGreaterThan(2);
    // 埋める script (`offline.global.js`) は外を読めない頁で書き出すので、書き出す部品を束ねる (#3792)。判定の表の絵を撮る`capturePng`も束ねる (#3945)
    const shipped = ["dist/frame.js", "dist/frame.cjs", "dist/embed.js", "dist/embed.cjs", "dist/light-frame.js", "dist/light-frame.cjs", ...cdn];
    expect(shipped.filter((file) => !existsSync(join(ROOT, file))), "build した file が無い配る入口").toEqual([]);
    expect(shipped.filter(holds), "書き出す部品の中身を持つ配る入口の file").toEqual([]);
    // 陰性でない対照。書き出す部品の file では、同じ字を見つける (探す字が古くなっていない)
    expect(["dist/capture.js", "dist/cdn/capture.js", "dist/offline.global.js"].filter(holds), "書き出す部品の中身を持つ書き出す部品の file").toEqual(["dist/capture.js", "dist/cdn/capture.js", "dist/offline.global.js"]);
  });

  it("offline-script-skips-icon-table", () => {
    // 埋めた頁は図が使う絵柄だけを頁に収めて登録するので、埋める script は絵柄集の表 (約 1.1MB) を束ねない (#3493)。
    // 帯の HTML の書き出しを束ねても、頁を組む処理が読む表は外す (#3792)。表だけが持つ絵柄 `a-b` の形で探す
    const mark = "M-7.5 3.33V-1.25A2.085 2.085 0 0 1-3.33-1.25V3.33M-3.33 0H-7.5";
    const holds = (file: string): boolean => readFileSync(join(ROOT, file), "utf8").includes(mark);
    expect(existsSync(join(ROOT, "dist/offline.global.js")), "build した埋める script").toBe(true);
    expect(holds("dist/offline.global.js"), "埋める script が絵柄集の表を持つ").toBe(false);
    // 陰性でない対照。表を束ねる既定の入口では、同じ字を見つける (探す字が古くなっていない)
    expect(holds("dist/index.js"), "既定の入口が絵柄集の表を持つ").toBe(true);
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
    // 使う人と同じく、型で組んだ設定を変数に入れてから `mountDiagram` に渡す code を ESM と CJS の両方で型検査した
    expect(done().playerOptionsErrors, "PlayerOptions で組んだ設定を渡す code の型の誤り").toEqual([]);
  });
});

describe("入口から届く型 (#3149)", () => {
  it("entry-types-all-exported", () => {
    // 入口の名前は手で並べているので、型を足して並べ忘れても build は通る。import 用と require 用の型の file ごとに、全部の入口を合わせて数える
    const types = done().entryTypes;
    for (const condition of ["import", "require"] as const) expect(types[condition].entries, `${condition} に型を渡す入口の数`).toBeGreaterThan(1);
    const missing = { import: types.import.missing, require: types.require.missing };
    expect(missing, "型の file で、どの入口からも出ていない型").toEqual({ import: [], require: [] });
  });
});

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
    // 英語の README は日本語の README と同じ例を置く。同じなので型を確かめるのは 1 つで足りる (#3317)。型は日本語の README の例で確かめた
    expect(examples[1], "英語と日本語の README で頁に置く節の例が違う").toBe(examples[0]);
    expect(done().readmeErrors, "README の頁に置く節の例の型の誤り").toEqual([]);
  });

  it("readme-light-example-matches", () => {
    // 図の種類の部品を後から読む節の例も、英語と日本語の README で同じ物を置く (#3317)
    const en = mountExample("README.md", "## Load diagram kinds on demand");
    expect(en, "英語の README に後から読む節の例が無い").not.toBe("");
    expect(en, "英語と日本語の README で後から読む節の例が違う").toBe(mountExample("README.ja.md", "## 図の種類の部品を後から読む"));
  });
});
