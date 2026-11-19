/**
 * 検査の前処理と件が、1 件 10 秒の上限の中で重い仕事を待たない (#3759)。
 *
 * 別の会話の負荷が高い時、後から読む塊を前処理で 25 ミリ秒ずつ見て待つ検査、書き出しの部品を読んで Chromium を起こす前処理、
 * 2 つの言葉の崩れの確かめを件の中で回す時計の件が、1 件 10 秒の上限を超えて落ちた。
 * どれも上限を上げずに、その仕事を検査の file を読み込む段 (`at-load.ts`) で済ませ、前処理と件はその結果を読む形に直した。
 *
 * 検査の file の字を構文で読み、直した形から外れた所を file と前処理か件の名前と呼び出しの名前で挙げる。
 * 説明の文と字の列の中の名前は呼び出しでないので数えない。
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { HEAVY } from "./case-work";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/** 前処理と件が呼んではならない名前。前の課題の重い仕事 (#3738) に、Chromium を起こす仕事と崩れの確かめを足す */
const WATCHED = new Set([...HEAVY, "fileChromium", "checkText"]);

/** 前処理を書く呼び出しの名前 */
const HOOKS = new Set(["beforeAll", "beforeEach", "afterAll", "afterEach"]);

/** 後から読む塊を待つ検査の file。前処理で塊を 25 ミリ秒ずつ見て待っていた 21 件 (#3759) */
const WAITING_FILES = [
  "apps/playground-spa/src/lib/catalog-bar.test.tsx",
  "apps/playground-spa/src/lib/catalog-head.test.tsx",
  "apps/playground-spa/src/lib/cycle-examples.test.ts",
  "apps/playground-spa/src/lib/er-examples.test.ts",
  "apps/playground-spa/src/lib/kind-examples.test.ts",
  "apps/playground-spa/src/lib/matrix-examples.test.ts",
  "apps/playground-spa/src/lib/mind-examples.test.ts",
  "apps/playground-spa/src/lib/part-settings.test.tsx",
  "apps/playground-spa/src/lib/sankey-examples.test.ts",
  "apps/playground-spa/src/lib/venn-examples.test.ts",
  "packages/dragon/test/band-look.test.ts",
  "packages/dragon/test/chart-funnel.test.ts",
  "packages/dragon/test/clock-look.test.ts",
  "packages/dragon/test/dots-look.test.ts",
  "packages/dragon/test/icon-paint.test.ts",
  "packages/dragon/test/lineup-layers.test.ts",
  "packages/dragon/test/lineup-stairs.test.ts",
  "packages/dragon/test/lineup-stations.test.ts",
  "packages/dragon/test/sankey-rows.test.ts",
  "packages/dragon/test/sankey-treemap.test.ts",
  "packages/dragon/test/scatter-look.test.ts",
] as const;

/** 書き出しの検査。前処理で書き出しの部品を読み、Chromium を起こしていた */
const EXPORT_FILE = "packages/dragon/test/shared-chromium.test.ts";

/** 時計の検査と、2 つの言葉の崩れの確かめを件の中で回していた件 */
const CLOCK_FILE = "packages/dragon/test/clock-look.test.ts";
const CLOCK_CASE = "clock-short-step-leads-labels-out";

const parse = (source: string, fileName: string): ts.SourceFile =>
  ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);

/** 呼び出しの名前。名前で引けない呼び出しは undefined */
function calleeName(call: ts.CallExpression): string | undefined {
  const callee = call.expression;
  if (callee.kind === ts.SyntaxKind.ImportKeyword) return "import()";
  if (ts.isIdentifier(callee)) return callee.text;
  if (ts.isPropertyAccessExpression(callee)) return callee.name.text;
  return undefined;
}

/** 節の中の呼び出しの名前。呼び出しに名前のまま渡した関数 (`beforeAll(setUp)`、`atLoad("…", exporter)`) も、渡した先が呼ぶので数える */
function callNames(node: ts.Node): Set<string> {
  const names = new Set<string>();
  const visit = (n: ts.Node): void => {
    if (ts.isCallExpression(n)) {
      const name = calleeName(n);
      if (name !== undefined) names.add(name);
      for (const arg of n.arguments) if (ts.isIdentifier(arg)) names.add(arg.text);
    }
    ts.forEachChild(n, visit);
  };
  visit(node);
  return names;
}

/** 同じ file の中で名前を付けた関数と、それぞれが呼ぶ名前 */
function localFunctions(file: ts.SourceFile): Map<string, Set<string>> {
  const found = new Map<string, Set<string>>();
  const visit = (n: ts.Node): void => {
    if (ts.isFunctionDeclaration(n) && n.name && n.body) found.set(n.name.text, callNames(n.body));
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer && (ts.isArrowFunction(n.initializer) || ts.isFunctionExpression(n.initializer)))
      found.set(n.name.text, callNames(n.initializer.body));
    ts.forEachChild(n, visit);
  };
  visit(file);
  return found;
}

/** 節が呼ぶ名前を、同じ file の関数を辿って全て集める */
function reachedNames(node: ts.Node, local: ReadonlyMap<string, Set<string>>): Set<string> {
  const reached = new Set<string>();
  const queue = [...callNames(node)];
  while (queue.length > 0) {
    const name = queue.pop() as string;
    if (reached.has(name)) continue;
    reached.add(name);
    for (const next of local.get(name) ?? []) queue.push(next);
  }
  return reached;
}

/** 字の行の番号 (1 から数える) */
const lineOf = (file: ts.SourceFile, node: ts.Node): number => file.getLineAndCharacterOfPosition(node.getStart(file)).line + 1;

/** 繰り返しの条件が、後から読む塊の状態 (`state().status`) を読み込み中 (`"loading"`) と比べる所。塊を少しずつ見て待つ形 */
function chunkPolls(source: string, fileName: string): string[] {
  // 全ての検査の file を構文で読むと、混んだ機械で 1 件の上限に近づく。読み込み中の字を持たない file は読まない
  if (!source.includes("loading")) return [];
  const file = parse(source, fileName);
  const found: string[] = [];
  const visit = (n: ts.Node): void => {
    const condition = ts.isForStatement(n) ? n.condition : ts.isWhileStatement(n) || ts.isDoStatement(n) ? n.expression : undefined;
    if (condition) {
      let reads = false;
      let loading = false;
      const look = (c: ts.Node): void => {
        if (ts.isCallExpression(c) && calleeName(c) === "state") reads = true;
        if (ts.isStringLiteralLike(c) && c.text === "loading") loading = true;
        ts.forEachChild(c, look);
      };
      look(condition);
      if (reads && loading) found.push(`${fileName}:${lineOf(file, n)} 後から読む塊の状態を見て待つ繰り返し`);
    }
    ts.forEachChild(n, visit);
  };
  visit(file);
  return found;
}

/** 前処理 (`beforeAll` ほか) が、同じ file の関数を辿って呼ぶ見張る名前 */
function heavyHooks(source: string, fileName: string): string[] {
  const file = parse(source, fileName);
  const local = localFunctions(file);
  const found: string[] = [];
  const visit = (n: ts.Node): void => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && HOOKS.has(n.expression.text)) {
      const hit = [...reachedNames(n, local)].filter((name) => WATCHED.has(name)).sort();
      if (hit.length > 0) found.push(`${fileName}:${lineOf(file, n)} ${n.expression.text} が呼ぶ ${hit.join("、")}`);
    }
    ts.forEachChild(n, visit);
  };
  visit(file);
  return found;
}

/** file を読み込む段 (一番上の `const 名前 = await atLoad(...)`) の仕事ごとの、名前と呼ぶ名前 */
function loadWorks(source: string, fileName: string): Map<string, Set<string>> {
  const file = parse(source, fileName);
  const local = localFunctions(file);
  const works = new Map<string, Set<string>>();
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const init = declaration.initializer;
      if (!ts.isIdentifier(declaration.name) || !init || !ts.isAwaitExpression(init)) continue;
      const call = init.expression;
      if (ts.isCallExpression(call) && calleeName(call) === "atLoad") works.set(declaration.name.text, reachedNames(call, local));
    }
  }
  return works;
}

/** 名前の件が、同じ file の関数を辿って呼ぶ見張る名前と、読む段の仕事の結果 (`名前.get()`) を読むか。件が無い時は undefined */
function caseWork(source: string, fileName: string, caseName: string): { heavy: string[]; readsLoaded: boolean } | undefined {
  const file = parse(source, fileName);
  const local = localFunctions(file);
  const loaded = new Set(loadWorks(source, fileName).keys());
  let result: { heavy: string[]; readsLoaded: boolean } | undefined;
  const visit = (n: ts.Node): void => {
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && (n.expression.text === "it" || n.expression.text === "test")) {
      const [name, body] = n.arguments;
      if (name && ts.isStringLiteralLike(name) && name.text === caseName && body) {
        let readsLoaded = false;
        const look = (c: ts.Node): void => {
          if (ts.isCallExpression(c) && ts.isPropertyAccessExpression(c.expression) && c.expression.name.text === "get" && ts.isIdentifier(c.expression.expression) && loaded.has(c.expression.expression.text))
            readsLoaded = true;
          ts.forEachChild(c, look);
        };
        look(body);
        result = { heavy: [...reachedNames(body, local)].filter((x) => WATCHED.has(x)).sort(), readsLoaded };
      }
    }
    ts.forEachChild(n, visit);
  };
  visit(file);
  return result;
}

/** repo の全ての検査の file (repo の根から) */
function testFiles(): string[] {
  const out: string[] = [];
  const walk = (dir: string): void => {
    for (const entry of readdirSync(join(ROOT, dir), { withFileTypes: true })) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (/\.test\.tsx?$/u.test(entry.name)) out.push(path);
    }
  };
  for (const top of ["packages", "apps"]) walk(top);
  return out.sort();
}

const read = (path: string): string => readFileSync(join(ROOT, path), "utf8");

/** 読む段の仕事のうち、どれかの名前を呼ぶ仕事があるか */
const loadsAny = (path: string, names: readonly string[]): boolean => [...loadWorks(read(path), path).values()].some((calls) => names.some((name) => calls.has(name)));

describe("検査の前処理と件が待つ重い仕事 (#3759)", () => {
  it("hook-work-no-chunk-polling", () => {
    const files = testFiles();
    // 歩き方が検査の file を見落とすと、何も見ずに通るので、待っていた file が全て見えていることを先に確かめる
    expect(WAITING_FILES.filter((path) => !files.includes(path)), "歩いた中に無い見張る検査の file").toEqual([]);
    expect(files.flatMap((path) => chunkPolls(read(path), path)), "後から読む塊を少しずつ見て待つ所").toEqual([]);
    // 待っていた file は、塊が届くのを読む段で待つ
    expect(WAITING_FILES.filter((path) => !loadsAny(path, ["whenReady"])), "塊が届くのを読む段で待たない file").toEqual([]);
  });

  it("hook-work-no-heavy-call-in-hooks", () => {
    expect(heavyHooks(read(EXPORT_FILE), EXPORT_FILE), "書き出しの検査の前処理が呼ぶ重い仕事").toEqual([]);
    // 書き出しの部品を読む仕事と Chromium を起こす仕事は、読む段で済ませる
    expect(loadsAny(EXPORT_FILE, ["exporter"]), "書き出しの部品を読む段で読まない").toBe(true);
    expect(loadsAny(EXPORT_FILE, ["fileChromium"]), "Chromium を読む段で起こさない").toBe(true);
  });

  it("hook-work-clock-checks-at-load", () => {
    const work = caseWork(read(CLOCK_FILE), CLOCK_FILE, CLOCK_CASE);
    expect(work, `${CLOCK_FILE} に件 ${CLOCK_CASE} が無い`).toBeDefined();
    expect(work?.heavy, `${CLOCK_CASE} が件の中で呼ぶ重い仕事`).toEqual([]);
    expect(work?.readsLoaded, `${CLOCK_CASE} が読む段の仕事の結果を読まない`).toBe(true);
    expect(loadsAny(CLOCK_FILE, ["checkText"]), "時計の図の崩れの確かめを読む段で済ませない").toBe(true);
  });

  it("hook-work-finder-names-planted-work", () => {
    const planted = [
      'import { beforeAll, it } from "vitest";',
      "beforeAll(async () => {",
      '  for (let i = 0; i < 200 && CHUNK.state().status === "loading"; i += 1) await wait();',
      "});",
      "async function arrived() {",
      '  while (OTHER.state().status === "loading") await wait();',
      "}",
      "beforeAll(async () => { browser = await fileChromium(); });",
      "beforeEach(async () => { await setUp(); });",
      "const setUp = async () => { run = await exporter(); };",
      "afterAll(setUp);",
      'const SAID = "for (;CHUNK.state().status === \\"loading\\";) checkText(x)";',
      'const READY = await atLoad("塊を待つ", () => whenReady(CHUNK));',
      "beforeAll(() => { READY.get(); });",
      'it("planted-check", () => { checkText("a.dragon", A, "notation", "ja"); });',
      'it("planted-check-via-helper", () => { lint(A); });',
      'function lint(text) { return checkText("a.dragon", text, "notation", "en"); }',
      'it("planted-reads", () => { expect(READY.get()).toBeDefined(); });',
    ].join("\n");
    const name = "planted.test.ts";
    expect(chunkPolls(planted, name), "塊を見て待つ繰り返し").toEqual([`${name}:3 後から読む塊の状態を見て待つ繰り返し`, `${name}:6 後から読む塊の状態を見て待つ繰り返し`]);
    expect(heavyHooks(planted, name), "前処理の重い仕事").toEqual([
      `${name}:8 beforeAll が呼ぶ fileChromium`,
      `${name}:9 beforeEach が呼ぶ exporter`,
      `${name}:11 afterAll が呼ぶ exporter`,
    ]);
    expect(caseWork(planted, name, "planted-check"), "件の中の崩れの確かめ").toEqual({ heavy: ["checkText"], readsLoaded: false });
    expect(caseWork(planted, name, "planted-check-via-helper"), "同じ file の関数を通した崩れの確かめ").toEqual({ heavy: ["checkText"], readsLoaded: false });
    expect(caseWork(planted, name, "planted-reads"), "読む段の結果を読むだけの件").toEqual({ heavy: [], readsLoaded: true });
    expect([...(loadWorks(planted, name).get("READY") ?? [])], "読む段の仕事が呼ぶ名前").toContain("whenReady");
  });
});
