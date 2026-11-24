/**
 * 関係する検査を選ぶ命令 (`scripts/test-related.mjs`) が、図の種類ごとに狭まることを確かめる (#3763)。
 *
 * 検査は種類を登録しない入口 (`src/core.ts`) と、使う種類の登録の file (`src/kind-use/<種類>.ts`) だけを読む。
 * 登録の file は図の種類の置き場の dir (`src/kinds/`) の外に置く。`src/kinds/` の dir は全て図の種類と数えられる (`scripts/build-blocks.mjs`)。
 * 全ての種類を描く検査は、全ての種類を読む助けの file (`all-kinds.ts`) を読む。
 * 選ぶ命令の規則は変えず、import のつながりが実際に使う種類だけを指すかを、この repo の索引で確かめる。
 * 索引は file を読み込む時に 1 度だけ作る。件ごとに作ると、混んだ機械で 1 件の上限 (10 秒) を超える (#3733)。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const RUNNER = join(ROOT, "scripts/test-related.mjs");
/** この file の repo の根からの path。自分の字を拒む相手から外す */
const SELF = "packages/dragon/test/related-by-kind.test.ts";
/** 全ての種類を読む助けの file */
const ALL_KINDS_HELPER = "packages/dragon/test/all-kinds.ts";
/** package の名前と package の根。この file が字で書くと、自分が既定の入口と package の根を読むと数えられるので組み立てる */
const PACKAGE_NAME = ["@cardenelabs", "dragon"].join("/");
const PACKAGE_DIR = ["packages", "dragon"].join("/");

interface Runner {
  indexRepo?: (root: string) => unknown;
  choose?: (index: unknown, changed: string[]) => { chosen: string[]; unmapped: string[] };
}
const runner = (await import(RUNNER)) as Runner;
const repoIndex = runner.indexRepo?.(ROOT);

/** 変えた file から選ぶ検査の file */
function pick(changed: string): string[] {
  if (repoIndex === undefined || runner.choose === undefined) throw new Error("scripts/test-related.mjs が indexRepo と choose を書き出さない");
  return runner.choose(repoIndex, [changed]).chosen;
}

const lsFiles = (...paths: string[]): string[] =>
  execFileSync("git", ["-C", ROOT, "ls-files", "--cached", "--others", "--exclude-standard", ...paths], { encoding: "utf8" })
    .split("\n")
    .filter((path) => path !== "" && existsSync(join(ROOT, path)));
const text = (path: string): string => readFileSync(join(ROOT, path), "utf8");
/** 注釈を外す。選ぶ命令が字と import を読む前に外す形と同じ */
const stripComments = (source: string): string => source.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/(^|[^:"'`\\])\/\/[^\n]*/gu, "$1");

/** 検査の file と、検査が読む助けの file。package の検査の dir の全ての code と、見本帳の検査と助けの file */
const TEST_SIDE = lsFiles("packages/dragon/test", "apps/playground-spa/src").filter(
  (path) => /\.(?:tsx?|mjs)$/u.test(path) && path !== SELF && (path.startsWith("packages/dragon/test/") || /\.test\.tsx?$|-support\.ts$/u.test(path)),
);
const PACKAGE_TEST_SIDE = TEST_SIDE.filter((path) => path.startsWith("packages/dragon/test/"));

/** 全ての種類を読む助けの file を読む file。全ての種類を描く検査と名乗る */
const readsAllKinds = (path: string): boolean =>
  path === ALL_KINDS_HELPER ||
  [...stripComments(text(path)).matchAll(/\bfrom\s*["']([^"']+)["']|\bimport\s*["']([^"']+)["']/gu)]
    .map((match) => match[1] ?? match[2] ?? "")
    .some((spec) => spec.startsWith(".") && posix.normalize(posix.join(posix.dirname(path), spec)) === ALL_KINDS_HELPER.replace(/\.ts$/u, ""));

/** 字の中身を、書いた file から見た repo の中の path として読む。読めない時は空 */
function resolved(from: string, literal: string): string[] {
  const trimmed = literal.trim();
  if (trimmed === "" || trimmed.includes("${") || /^[a-z]+:/iu.test(trimmed) || trimmed.startsWith("/")) return [];
  return [posix.normalize(trimmed.replace(/^\.\//u, "")), posix.normalize(posix.join(posix.dirname(from), trimmed))].map((path) => path.replace(/\/$/u, ""));
}
const LITERAL = /["'`]([^"'`\n]{1,300})["'`]/gu;
const literalsOf = (source: string): string[] => [...source.matchAll(LITERAL)].map((m) => m[1] ?? "");

/** 既定の入口と、読み込むと全ての種類を登録する file */
const DEFAULT_ENTRY_FILES = new Set(["src/index.ts", "src/render/svg.ts", "src/kinds/all.ts"].map((path) => `${PACKAGE_DIR}/${path}`));
const ENTRY_EXTENSIONS = ["", ".ts", ".js", "/index.ts"];

/** file が既定の入口を読む字。package の名前と、既定の入口か全ての種類を登録する file を指す相対の字 */
function defaultEntryReads(path: string): string[] {
  const source = stripComments(text(path));
  const found = new Set<string>();
  for (const literal of literalsOf(source)) {
    if (literal === PACKAGE_NAME) found.add(literal);
    if (!literal.startsWith(".")) continue;
    for (const target of resolved(path, literal)) if (ENTRY_EXTENSIONS.some((ext) => DEFAULT_ENTRY_FILES.has(target + ext))) found.add(literal);
  }
  return [...found];
}

/** dir を歩く file の印。選ぶ命令が、dir の字の下の code も読むと数える形 */
const SCANS = /\breaddir(?:Sync)?\b|\bls-files\b|\bglobSync\b|\bopendir(?:Sync)?\b/u;
/** 下に全ての種類の code を持つ dir。package の根と src の根 */
const WIDE_DIRS = new Set([PACKAGE_DIR, `${PACKAGE_DIR}/src`]);

/** dir を歩く file が書いた、package の根か src の根を指す字 */
function wideWalks(path: string): string[] {
  const source = stripComments(text(path));
  if (!SCANS.test(source)) return [];
  return literalsOf(source).filter((literal) => resolved(path, literal).some((target) => WIDE_DIRS.has(target)));
}

/** 種類の置き場の dir と、そのうち後から読む種類 (`kind.ts` に `later: true` を書く種類) */
const KIND_DIRS = lsFiles(`${PACKAGE_DIR}/src/kinds`)
  .map((path) => /^packages\/dragon\/src\/kinds\/([^/]+)\/kind\.ts$/u.exec(path)?.[1])
  .filter((name): name is string => name !== undefined)
  .sort();
const LATER = KIND_DIRS.filter((kind) => /^\s*later: true,?$/mu.test(text(`${PACKAGE_DIR}/src/kinds/${kind}/kind.ts`)));

/** 描く所を変えた時に、全ての種類を描く検査を確かめる file */
const KIND_DRAWS = ["src/render/pipe.ts", "src/render/venn.ts", "src/kinds/sequence/layout.ts", "src/kinds/architecture/layout.ts"].map((path) => `${PACKAGE_DIR}/${path}`);
/** 全ての種類を描くと決まっている検査 */
const ALL_KIND_TESTS = ["packages/dragon/test/examples.test.ts", "packages/dragon/test/export.test.ts", "packages/dragon/test/light-entry.test.ts", "apps/playground-spa/src/lib/playground.test.ts"];

describe("図の種類の描く所を変えた時に選ぶ検査の数 (#3763)", () => {
  it("related-pipe-draw-picks-at-most-130", () => {
    const chosen = pick(`${PACKAGE_DIR}/src/render/pipe.ts`);
    expect(chosen.length, `render/pipe.ts で選んだ検査の file が ${chosen.length}`).toBeLessThanOrEqual(130);
  });

  // 全ての種類の全体図の部品を数える検査 (`overview-all-kinds.test.ts`、#3852) は、どの種類を変えても選ぶので、ベン図と順の図の上限を 1 つずつ上げた。
  // その検査は並べ方だけを数えて絵もブラウザも読まないので、選ばれても 1 回の実行を数秒しか延ばさない
  // 押すと出る札の検査 (`note-pop.test.ts`、#3877) は、どの種類の図も載せる Markdown の頁を書き出すので、ベン図と順の図の上限をもう 1 つずつ上げた。
  // その検査も jsdom で小さな図を数枚描くだけで、ブラウザを読まない
  it("related-venn-draw-picks-at-most-112", () => {
    const chosen = pick(`${PACKAGE_DIR}/src/render/venn.ts`);
    expect(chosen.length, `render/venn.ts で選んだ検査の file が ${chosen.length}`).toBeLessThanOrEqual(112);
  });

  // jsDelivr の入口を読む検査 (`pipe-ahead.test.ts`、#3753) は、入口が読む軽い入口が時系列図の登録を最初から読むので選ばれる
  // 命令 (`src/cli.ts`) も書き出しから軽い入口を通って時系列図の登録を読むので、命令を包んで走らせる検査は`overlap-cli.test.ts`の1つのfileに集める (#3837)
  it("related-sequence-layout-picks-at-most-158", () => {
    const chosen = pick(`${PACKAGE_DIR}/src/kinds/sequence/layout.ts`);
    expect(chosen.length, `kinds/sequence/layout.ts で選んだ検査の file が ${chosen.length}`).toBeLessThanOrEqual(158);
  });

  it("related-pipe-draw-skips-other-kind-tests", () => {
    const chosen = pick(`${PACKAGE_DIR}/src/render/pipe.ts`);
    const others = ["venn-diagram.test.ts", "clock-look.test.ts", "er-diagram.test.ts"].map((name) => `${PACKAGE_DIR}/test/${name}`);
    expect(
      others.filter((path) => chosen.includes(path)),
      "配管の図を描かないのに render/pipe.ts で選ばれた種類の検査",
    ).toEqual([]);
  });
});

describe.for(KIND_DRAWS)("%s", (changed) => {
  it("related-all-kind-tests-picked-for-every-kind", () => {
    const chosen = pick(changed);
    const declared = PACKAGE_TEST_SIDE.filter((path) => /\.test\.(?:tsx?|mjs)$/u.test(path) && readsAllKinds(path));
    expect(
      [...ALL_KIND_TESTS, ...declared].filter((path) => !chosen.includes(path)),
      `${changed} を変えた時に選ばれない、全ての種類を描く検査`,
    ).toEqual([]);
  });
});

describe("種類の登録と検査の読み方の書き忘れを拒む (#3763)", () => {
  it("kind-registrations-match-kind-folders", () => {
    expect(KIND_DIRS.length, "種類の置き場を数えられない").toBeGreaterThan(2);
    const all = stripComments(text(`${PACKAGE_DIR}/src/kinds/all.ts`));
    // 軽い入口は初めから持つ種類を `light.ts` で読み、後から読む種類の読み込みを読む処理の file (`light-load.ts`) に置く (#3782)
    const light = [`${PACKAGE_DIR}/src/light.ts`, `${PACKAGE_DIR}/src/light-load.ts`].map((path) => stripComments(text(path))).join("\n");
    const missing: string[] = [];
    for (const kind of KIND_DIRS) {
      if (!existsSync(join(ROOT, PACKAGE_DIR, "src/kind-use", `${kind}.ts`))) missing.push(`${kind} の登録の file (src/kind-use/${kind}.ts)`);
      if (!new RegExp(`\\bimport\\s*["']\\.\\./kind-use/${kind}["']`, "u").test(all)) missing.push(`${kind} を kinds/all.ts が読む行`);
      const lightReads = LATER.includes(kind)
        ? new RegExp(`\\b${kind}:\\s*\\(\\)\\s*=>\\s*import\\(["']\\./(?:kinds|kind-use)/${kind}["']\\)`, "u")
        : new RegExp(`\\bimport\\s*["']\\./kind-use/${kind}["']`, "u");
      if (!lightReads.test(light)) missing.push(`${kind} を light.ts か light-load.ts が読む行`);
    }
    expect(missing, "種類の置き場の一覧に在るのに欠けた登録").toEqual([]);
  });

  it("tests-read-default-entry-only-through-all-kinds", () => {
    expect(PACKAGE_TEST_SIDE.length, "package の検査の file を数えられない").toBeGreaterThan(10);
    const offenders = PACKAGE_TEST_SIDE.filter((path) => !readsAllKinds(path))
      .map((path) => ({ path, reads: defaultEntryReads(path) }))
      .filter(({ reads }) => reads.length > 0)
      .map(({ path, reads }) => `${path} (${reads.join("、")})`);
    expect(offenders, "全ての種類を読む助けの file を通らずに既定の入口を読む file").toEqual([]);
  });

  it("tests-skip-package-root-walks", () => {
    expect(TEST_SIDE.length, "検査の file を数えられない").toBeGreaterThan(10);
    const offenders = TEST_SIDE.filter((path) => !readsAllKinds(path))
      .map((path) => ({ path, walks: wideWalks(path) }))
      .filter(({ walks }) => walks.length > 0)
      .map(({ path, walks }) => `${path} (${walks.join("、")})`);
    expect(offenders, "package の根か src の根の字と dir を歩く処理を同じ file に書く file").toEqual([]);
  });

  it("registry-reads-no-kind-file", () => {
    const path = `${PACKAGE_DIR}/src/kinds/registry.ts`;
    const lines = stripComments(text(path))
      .split("\n")
      .filter((line) => /\b(?:import|export)\b[^;]*\bfrom\s*["']\.\/([^"'/]+)["']/u.test(line))
      .filter((line) => KIND_DIRS.some((kind) => new RegExp(`from\\s*["']\\./${kind}["']`, "u").test(line)));
    expect(lines, "登録簿が種類の file を読む行").toEqual([]);
  });
});
