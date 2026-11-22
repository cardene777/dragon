/**
 * 検査の件の中の重い仕事を、件の字から数える道具 (#3738)。
 *
 * 別の会話の負荷が高い時、件の中で図を描く、画面を置く、書き出す、子の process を起こす、頁を開く仕事を繰り返す件が 1 件 10 秒の上限を超えた。
 * 件を見本ごとに分けた形と、1 回分の仕事を検査の file を読み込む段 (`at-load.ts`) で済ませた形から外れていないかを、件の字の呼び出しで確かめる。
 *
 * 重い仕事は呼び出しの名前で数える。名前は `HEAVY` の名前と、同じ file の中で定義した関数のうち重い名前を呼ぶ関数の名前 (辿って全て)。
 * 子の process を起こす呼び出しも同じ形で `CHILD` から辿る。
 * 繰り返し (`for`、`while`、配列の `map` などに渡した関数) の中の呼び出しは、何回起きるか字から決まらないので数を無限と数える。
 * 説明の文と字の列の中の名前は呼び出しでないので数えない。
 *
 * 子の process を起こす仕事と頁を開く仕事は、repo の全ての件で件の中に置かない (#3816)。
 * 件を持つ file を集める (`caseFiles`) と、件の中のその呼び出しを件の名前と共に挙げる (`childOrPageIn`) もここが持つ。
 *
 * 頁を読む待ちに上限を付ける部品は`page-wait.ts`だけが持つ (#3843)。部品の写しを名前に依らず形で挙げる (`waitCopiesIn`) もここが持つ。
 */
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

/** 図を描く、画面を置く、書き出す、子の process を起こす、頁を開く仕事の名前。同じ file の中の関数は、これを呼べば重い名前に加わる */
export const HEAVY = new Set([
  "renderDiagram",
  "mountDiagram",
  "exportDiagram",
  "exporter",
  "exportInThread",
  "checkLayoutText",
  "runCli",
  "runCliInProcess",
  "spawnSync",
  "spawn",
  "execFile",
  "execFileSync",
  "fork",
  "figureOf",
  "drawOnce",
  "place",
  "withSite",
  "withPage",
  "withCapturePage",
  "importEntry",
  "loadKind",
  "inFreshNode",
  "makeStandIn",
  "createRoot",
  "mount",
  "bundleSizes",
  "import()",
  // 配管の図の検査が共有の支え (`pipe-diagram-support.ts`) から読む、描く関数。支えは別の file なので、呼ぶ関数を辿れない
  "render",
  "openedAggregator",
  // 図を JSON Schema で検査する。全ての部品の図の記法を 1 件で検査すると、混んだ機械で 1 件の上限に近づいた
  "validateDiagram",
  // 頁を開く呼び出し。混んだ機械で、件の中で Chromium の頁を開く件が 1 件の上限を超えた (#3815)
  "fileChromium",
  "newContext",
  "newPage",
]);

/** 子の process を起こす名前。同じ file の中の関数は、これを呼べば子の process を起こす名前に加わる */
export const CHILD = new Set(["runCli", "spawnSync", "spawn", "execFile", "execFileSync", "fork", "execSync", "inFreshNode"]);

/** Chromium の頁を開く名前 (#3815、#3816)。同じ file の中の関数は、これを呼べば頁を開く名前に加わる */
export const PAGE = new Set(["fileChromium", "newContext", "newPage", "withPage", "withSite", "withCapturePage"]);

/** 部品を名前の字で引く道具 (`draw("renderDiagram")(...)`)。名前の字を呼び出しの名前に数える */
const BY_NAME = new Set(["draw", "api"]);

/** 繰り返しの中で呼ぶ配列の関数。渡した関数の中の呼び出しは繰り返しの中と数える */
const ITERATE = new Set(["map", "flatMap", "forEach", "filter", "some", "every", "reduce", "find", "findIndex", "sort"]);

/** 件の中の 1 つの呼び出し */
export interface Call {
  name: string;
  /** 繰り返しの中で起きる */
  looped: boolean;
}

/** 字の中の 1 つの件 */
export interface FoundCase {
  name: string;
  /** 件の中の重い呼び出し */
  heavy: Call[];
  /** 件の中の子の process を起こす呼び出し */
  child: Call[];
  /** 件の中の Chromium の頁を開く呼び出し */
  page: Call[];
  /** 件が、file を読み込む段で済ませた仕事の結果を読む (`atLoad` で作った物の `get()`) */
  readsAtLoad: boolean;
}

/** 呼び出しの名前。名前で引けない呼び出しは undefined */
function calleeName(call: ts.CallExpression): string | undefined {
  const callee = call.expression;
  if (callee.kind === ts.SyntaxKind.ImportKeyword) return "import()";
  if (ts.isCallExpression(callee) && ts.isIdentifier(callee.expression) && BY_NAME.has(callee.expression.text)) {
    const [first] = callee.arguments;
    if (first && ts.isStringLiteralLike(first)) return first.text;
  }
  if (ts.isIdentifier(callee)) return callee.text;
  if (ts.isPropertyAccessExpression(callee)) return callee.name.text;
  return undefined;
}

const isFunctionLike = (node: ts.Node): node is ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration =>
  ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node);

/** 呼び出しの先頭が `it` か `test` の件の呼び出し (`it(...)`、`it.each(...)(...)`、`it.for(...)(...)`) */
function isCaseCall(call: ts.CallExpression): boolean {
  let at: ts.Expression = call.expression;
  for (;;) {
    if (ts.isIdentifier(at)) return at.text === "it" || at.text === "test";
    if (ts.isPropertyAccessExpression(at)) at = at.expression;
    else if (ts.isCallExpression(at)) at = at.expression;
    else return false;
  }
}

/** 括弧と型の書き添え (`as`、`!`) を外した式 */
function bare(node: ts.Expression): ts.Expression {
  let at = node;
  while (ts.isParenthesizedExpression(at) || ts.isAsExpression(at) || ts.isNonNullExpression(at) || ts.isSatisfiesExpression(at)) at = at.expression;
  return at;
}

/** 字の中の呼び出しの名前を全て */
function callNames(node: ts.Node): string[] {
  const names: string[] = [];
  const visit = (at: ts.Node): void => {
    if (ts.isCallExpression(at)) {
      const name = calleeName(at);
      if (name !== undefined) names.push(name);
    }
    ts.forEachChild(at, visit);
  };
  visit(node);
  return names;
}

/** 字の中で値として名指した名前 (変数の名前と、`.` の後の名前) を全て */
function mentionedNames(node: ts.Node): string[] {
  const names: string[] = [];
  const visit = (at: ts.Node): void => {
    if (ts.isIdentifier(at)) names.push(at.text);
    ts.forEachChild(at, visit);
  };
  visit(node);
  return names;
}

/**
 * file の中で名前を付けた関数ごとに、その関数が呼ぶ名前。
 * 関数の宣言と、関数を入れた変数を数える。同じ名前が複数在る時は合わせる。
 * 別の名前の関数をそのまま入れた変数 (`const found = (dragon as Api).checkLayoutText`) は、入れた名前を呼ぶ。
 * 関数を返す関数の結果を入れた変数 (`const check = checker()`) は、返す関数が名指す名前を呼ぶ
 */
function namedCalls(file: ts.SourceFile): Map<string, Set<string>> {
  const calls = new Map<string, Set<string>>();
  const mentions = new Map<string, string[]>();
  const results: [string, string][] = [];
  const add = (name: string, called: Iterable<string>): void => {
    const set = calls.get(name) ?? new Set<string>();
    for (const c of called) set.add(c);
    calls.set(name, set);
  };
  const visit = (node: ts.Node): void => {
    if (ts.isFunctionDeclaration(node) && node.name && node.body) {
      add(node.name.text, callNames(node.body));
      mentions.set(node.name.text, [...(mentions.get(node.name.text) ?? []), ...mentionedNames(node.body)]);
    }
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      const name = node.name.text;
      const init = bare(node.initializer);
      if (ts.isArrowFunction(init) || ts.isFunctionExpression(init)) {
        add(name, callNames(init.body));
        mentions.set(name, [...(mentions.get(name) ?? []), ...mentionedNames(init.body)]);
      } else if (ts.isPropertyAccessExpression(init)) add(name, [init.name.text]);
      else if (ts.isIdentifier(init)) add(name, [init.text]);
      else if (ts.isCallExpression(init) && ts.isIdentifier(init.expression)) results.push([name, init.expression.text]);
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  for (const [name, maker] of results) if (mentions.has(maker)) add(name, (mentions.get(maker) ?? []).filter((m) => m !== maker));
  return calls;
}

/** 元の名前に、同じ file の中でそれを呼ぶ関数の名前を辿って足す */
function reach(base: ReadonlySet<string>, calls: Map<string, Set<string>>): Set<string> {
  const names = new Set(base);
  for (let grew = true; grew; ) {
    grew = false;
    for (const [name, called] of calls) {
      if (!names.has(name) && [...called].some((c) => c !== name && names.has(c))) {
        names.add(name);
        grew = true;
      }
    }
  }
  return names;
}

/** file の一番上で `await atLoad(...)` の結果を入れた変数の名前 (`Promise.all` で並べて受けた物を含む) */
function atLoadNames(file: ts.SourceFile): Set<string> {
  const out = new Set<string>();
  const callsAtLoad = (node: ts.Node): boolean => {
    let found = false;
    const visit = (at: ts.Node): void => {
      if (ts.isCallExpression(at) && calleeName(at) === "atLoad") found = true;
      if (!found) ts.forEachChild(at, visit);
    };
    visit(node);
    return found;
  };
  for (const statement of file.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const init = declaration.initializer;
      if (!init || !ts.isAwaitExpression(init) || !callsAtLoad(init)) continue;
      if (ts.isIdentifier(declaration.name)) out.add(declaration.name.text);
      else if (ts.isArrayBindingPattern(declaration.name) || ts.isObjectBindingPattern(declaration.name))
        for (const element of declaration.name.elements) if (ts.isBindingElement(element) && ts.isIdentifier(element.name)) out.add(element.name.text);
    }
  }
  return out;
}

/** 件の字の中の呼び出しを、繰り返しの中かと共に集める */
function callsInCase(body: ts.Node): Call[] {
  const out: Call[] = [];
  const visit = (node: ts.Node, looped: boolean): void => {
    if (ts.isForStatement(node) || ts.isForOfStatement(node) || ts.isForInStatement(node) || ts.isWhileStatement(node) || ts.isDoStatement(node)) {
      ts.forEachChild(node, (child) => visit(child, true));
      return;
    }
    if (ts.isCallExpression(node)) {
      const name = calleeName(node);
      if (name !== undefined) out.push({ name, looped });
      visit(node.expression, looped);
      const iterates = ts.isPropertyAccessExpression(node.expression) && ITERATE.has(node.expression.name.text);
      for (const arg of node.arguments) visit(arg, looped || (iterates && isFunctionLike(arg)));
      return;
    }
    ts.forEachChild(node, (child) => visit(child, looped));
  };
  visit(body, false);
  return out;
}

/** 件が `atLoad` で作った物の `get()` を呼ぶか */
function readsLoaded(body: ts.Node, loaded: ReadonlySet<string>): boolean {
  let found = false;
  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "get" &&
      ts.isIdentifier(node.expression.expression) &&
      loaded.has(node.expression.expression.text)
    )
      found = true;
    if (!found) ts.forEachChild(node, visit);
  };
  visit(body);
  return found;
}

/** 検査の file の字から、件ごとの重い呼び出しと子の process を起こす呼び出しを集める。同じ名前の件が複数在る時は全てを返す */
export function casesIn(source: string, fileName = "checked.test.ts"): FoundCase[] {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const functions = namedCalls(file);
  const heavy = reach(HEAVY, functions);
  const child = reach(CHILD, functions);
  const page = reach(PAGE, functions);
  const loaded = atLoadNames(file);
  const found: FoundCase[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isCallExpression(node) && isCaseCall(node)) {
      const [first] = node.arguments;
      const body = [...node.arguments].reverse().find(isFunctionLike);
      if (first && (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first)) && body) {
        const calls = callsInCase(body);
        found.push({
          name: first.text,
          heavy: calls.filter((c) => heavy.has(c.name)),
          child: calls.filter((c) => child.has(c.name)),
          page: calls.filter((c) => page.has(c.name)),
          readsAtLoad: readsLoaded(body, loaded),
        });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return found;
}

/** 呼び出しの数。繰り返しの中の呼び出しが在れば無限 */
export const countOf = (calls: readonly Call[]): number => (calls.some((c) => c.looped) ? Number.POSITIVE_INFINITY : calls.length);

/** 呼び出しを人が読む形にする (`render`、`checkLayoutText (繰り返しの中)`) */
export const describeCalls = (calls: readonly Call[]): string => calls.map((c) => (c.looped ? `${c.name} (繰り返しの中)` : c.name)).join("、");

/**
 * 件を持つ file の名前。vitest が回す検査の file (`vitest.config.ts` の `include`) と、
 * `kind-cli.test.ts` と `kind-playground.test.ts` が読む種類の検査の助けの file (`*-cli-checks.ts`、`*-playground-checks.ts`)
 */
const CASE_FILE = /(?:\.test\.(?:ts|tsx|mjs)|-checks\.ts)$/;

/** 件を持つ file を探す置き場 (repo の根から)。package の検査は `packages/<名前>/test`、見本帳の検査は `apps/<名前>/src` に在る */
const CASE_PLACES: readonly (readonly [string, string])[] = [
  ["packages", "test"],
  ["apps", "src"],
];

/** repo の根 `root` から見た、件を持つ全ての file の path (#3816)。子の process を起こさずに字の置き場を辿る */
export function caseFiles(root: string): string[] {
  const out: string[] = [];
  for (const [top, inner] of CASE_PLACES) {
    if (!existsSync(join(root, top))) continue;
    for (const name of readdirSync(join(root, top))) {
      const place = join(top, name, inner);
      if (!existsSync(join(root, place))) continue;
      for (const rel of readdirSync(join(root, place), { recursive: true, encoding: "utf8" }))
        if (!rel.split("/").includes("node_modules") && CASE_FILE.test(rel)) out.push(join(place, rel));
    }
  }
  return out.sort();
}

/**
 * file の字から、件の中で子の process を起こすか頁を開く件を `file > 件の名前: 理由` の形で全て返す (#3816)。
 * 同じ file の関数を通した呼び出しも数え、file を読み込む段 (`atLoad`) と前処理の中の呼び出しは件の中に数えない
 */
export function childOrPageIn(source: string, fileName: string): string[] {
  return casesIn(source, fileName).flatMap((c) => {
    const why = [
      ...(c.child.length > 0 ? [`子の process を起こす ${describeCalls(c.child)}`] : []),
      ...(c.page.length > 0 ? [`頁を開く ${describeCalls(c.page)}`] : []),
    ];
    return why.length > 0 ? [`${fileName} > ${c.name}: ${why.join("。")}`] : [];
  });
}

/** 待ちを上限で切る写しの形 (#3843) */
const RACE_COPY = "Promise.raceとsetTimeoutで切る";
/** 期限まで読み直す写しの形 (#3843) */
const POLL_COPY = "期限まで50msごとに読み直す";
/** 読み直す写しが待つ間 (ms) */
const POLL_MS = 50;

type FunctionNode = ts.FunctionDeclaration | ts.FunctionExpression | ts.ArrowFunction | ts.MethodDeclaration;

const isFunctionNode = (node: ts.Node): node is FunctionNode =>
  ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node) || ts.isMethodDeclaration(node);

/** 関数の名前。宣言の名前か、関数を入れた変数と欄の名前。名前の無い関数は「(名前の無い関数)」 */
function functionName(node: FunctionNode): string {
  if (node.name !== undefined && ts.isIdentifier(node.name)) return node.name.text;
  const { parent } = node;
  if ((ts.isVariableDeclaration(parent) || ts.isPropertyAssignment(parent)) && ts.isIdentifier(parent.name)) return parent.name.text;
  return "(名前の無い関数)";
}

/** `a.b` の形の `a` と `b` が `owner` と `name` か */
const isMember = (node: ts.Node, owner: string, name: string): boolean =>
  ts.isPropertyAccessExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === owner && node.name.text === name;

/** 呼び出しの名前の最後の語 (`setTimeout(...)` と `globalThis.setTimeout(...)` は `setTimeout`) */
const calleeTail = (callee: ts.Expression): string | undefined =>
  ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : undefined;

/** 関数の中身 (中の関数を含む) が持つ写しの形 */
function copyShapes(fn: FunctionNode): string[] {
  let race = false;
  let timer = false;
  let now = false;
  let pollWait = false;
  const visit = (node: ts.Node, inLoop: boolean): void => {
    if (ts.isCallExpression(node)) {
      if (isMember(node.expression, "Promise", "race")) race = true;
      if (calleeTail(node.expression) === "setTimeout") {
        timer = true;
        const ms = node.arguments[1];
        if (inLoop && ms !== undefined && ts.isNumericLiteral(ms) && Number(ms.text) === POLL_MS) pollWait = true;
      }
    }
    if (isMember(node, "Date", "now")) now = true;
    const loop = inLoop || ts.isIterationStatement(node, false);
    ts.forEachChild(node, (child) => visit(child, loop));
  };
  if (fn.body !== undefined) visit(fn.body, false);
  return [...(race && timer ? [RACE_COPY] : []), ...(pollWait && now ? [POLL_COPY] : [])];
}

/**
 * fileの字から、待ちに上限を付ける部品 (`page-wait.ts`) の写しを`file > 関数の名前: 形`の形で全て返す (#3843)。
 * 名前に依らず形で探す。`Promise.race`と`setTimeout`の両方を呼ぶ関数と、繰り返しの中で50msの`setTimeout`を待ち`Date.now()`で期限を見る関数を写しと数える。
 * 写しを中に持つ外側の関数は挙げず、形を持つ一番内側の関数だけを挙げる。説明の文と字の列の中の字は数えない
 */
export function waitCopiesIn(source: string, fileName: string): string[] {
  const file = ts.createSourceFile(fileName, source, ts.ScriptTarget.Latest, true, fileName.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const matched: { fn: FunctionNode; shapes: string[] }[] = [];
  const visit = (node: ts.Node): void => {
    if (isFunctionNode(node)) {
      const shapes = copyShapes(node);
      if (shapes.length > 0) matched.push({ fn: node, shapes });
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  const inside = (inner: ts.Node, outer: ts.Node): boolean => inner !== outer && inner.pos >= outer.pos && inner.end <= outer.end;
  return matched
    .filter((m) => !matched.some((other) => inside(other.fn, m.fn)))
    .map((m) => `${fileName} > ${functionName(m.fn)}: ${m.shapes.join("、")}`);
}
