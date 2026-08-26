import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

/**
 * 画面の検査が見に行く先を 1 箇所に保つ (#1318)。
 *
 * spec が URL を自分で持つと、`SPA_URL` を渡した時に **同じ回の検査が別々の server に
 * 分かれる**。 依存の版を上げた直後は動いている server が古い版を配り続けるため
 * (Vite は起動時に依存を抱え込む)、分かれていること自体に気付けない。
 *
 * 実際に踏んだ = `playwright.config.ts` の `baseURL` が固定で、`SPA_URL` を読むのは
 * `chart-line-draw.spec.ts` だけだった。 新しく足した検査だけが古い server に当たって落ち、
 * 原因を掴むまでに数回の回り道をした。
 *
 * 見に行く先は `playwright.config.ts` が持ち、spec は相対 path で書く。
 *
 * ## 相対 path は先頭 `/` を付けない (#1438)
 *
 * 既定の見に行く先は build 済の画面 (`ports.ts` の `PREVIEW_BASE_URL`) になった。 base path
 * (`/dragon/`) が付くので、`new URL(path, base)` が先頭 `/` を「origin 直下」 と読んで base を
 * 捨てる形が効いてくる = `goto("/editor")` は base の外を開き、画面が出ないまま時間切れに
 * なる。 落ち方が「動かない」 形になり原因が読めない (Phase 1 で 291 件が同じ形で落ちた)。
 */

const TESTS_DIR = join(import.meta.dirname, "../../tests");

/**
 * 本番 build の preview を見る spec。 `PROD_BASE_URL` から自分で絶対 URL を組むので対象外。
 *
 * 名前ではなく **`PROD_BASE_URL` を読んでいるか** で判定したいところだが、その形は
 * dev server を指す既定値を持つこともできてしまう (実際に `rendered-contrast.spec.ts` が
 * `PROD_BASE_URL` の名前で 4323 を既定にしていた)。 名指しにして、増える時に気付く形にする。
 */
const 本番を見る検査 = new Set(["a11y-check.spec.ts", "final-check.spec.ts", "prod-check.spec.ts"]);

/**
 * 開発 server を見る spec (#1438)。 先頭 `/` の判定から外す。
 *
 * 開発時のみの頁 (`/__render`) を使うため build 済には route が無く、`playwright.config.ts` の
 * `dev` project だけが開発 server を見る。 相手に base path が付かないので先頭 `/` が正しい。
 *
 * 名指しにするのは `本番を見る検査` と同じ理由で、増える時に気付く形にするため。
 */
const 開発serverを見る検査 = new Set(["row-bounds-offset.spec.ts"]);

const URLを自分で持つ文字列 =
  /https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?|process\.env\.[A-Z0-9_]*URL\b/u;

const baseURL名か = (name: ts.PropertyName) => {
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return name.text === "baseURL";
  return ts.isComputedPropertyName(name) && ts.isStringLiteral(name.expression) && name.expression.text === "baseURL";
};

const testUseか = (call: ts.CallExpression) =>
  ts.isPropertyAccessExpression(call.expression) &&
  ts.isIdentifier(call.expression.expression) &&
  call.expression.expression.text === "test" &&
  call.expression.name.text === "use";

/**
 * spec が見に行く先を自分で持っている記述。
 *
 * `baseURL: ...` は object property の時だけ拾う。 text の並びだけで判定すると、Playwright が
 * 渡す値の別名 destructuring (`async ({ baseURL: serverURL })`) まで上書きと誤認する。
 *
 * 短縮記法 (`test.use({ baseURL })`) は `test.use` の直下だけを見る。 AST で object を辿るため、
 * その前に何段の入れ子があっても外側の `}` までの正規表現を組み立てる必要がない。
 */
const URLを自分で持つ記述か = (src: string) => {
  if (URLを自分で持つ文字列.test(src)) return true;

  const source = ts.createSourceFile("candidate.spec.ts", src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  let 見つけた = false;
  const visit = (node: ts.Node) => {
    if (見つけた) return;
    if (ts.isPropertyAssignment(node) && baseURL名か(node.name)) {
      見つけた = true;
      return;
    }
    if (ts.isCallExpression(node) && testUseか(node)) {
      const options = node.arguments[0];
      if (
        options &&
        ts.isObjectLiteralExpression(options) &&
        options.properties.some((property) => ts.isShorthandPropertyAssignment(property) && property.name.text === "baseURL")
      ) {
        見つけた = true;
        return;
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return 見つけた;
};

/** literal の先頭。 template は差し込みの手前まで見る */
const 頭を取る = (node: ts.Expression): string | null => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isTemplateExpression(node)) return node.head.text;
  return null;
};

/**
 * 経路を受け取って `goto` に渡す helper と、その引数の位置。
 *
 * **spec 同士は import できない** (Playwright が禁じる。 経緯は `tests/opened-sample.ts`)。
 * helper は必ず同じ file にあるので、1 file の中だけを見れば helper 経由の呼出も追える。
 *
 * これを見ないと取りこぼす。 実測 = 直接の `goto` だけを見ていた版が 4 件を素通しし、
 * うち 2 件が実行で 30 秒の時間切れとして落ちた (#1438)。
 */
const goto経由のhelper = (source: ts.SourceFile): Map<string, number> => {
  const 位置 = new Map<string, number>();
  const 本体を見る = (名: string, params: readonly ts.ParameterDeclaration[], body: ts.Node) => {
    const 引数名 = params.map((x) => (ts.isIdentifier(x.name) ? x.name.text : null));
    const visit = (node: ts.Node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.name.text === "goto"
      ) {
        const arg = node.arguments[0];
        if (arg !== undefined && ts.isIdentifier(arg)) {
          const i = 引数名.indexOf(arg.text);
          if (i >= 0) 位置.set(名, i);
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(body);
  };
  const 宣言を見る = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node) && node.name !== undefined && node.body !== undefined) {
      本体を見る(node.name.text, node.parameters, node.body);
    }
    if (
      ts.isVariableDeclaration(node) &&
      ts.isIdentifier(node.name) &&
      node.initializer !== undefined &&
      (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer))
    ) {
      本体を見る(node.name.text, node.initializer.parameters, node.initializer.body);
    }
    ts.forEachChild(node, 宣言を見る);
  };
  宣言を見る(source);
  return 位置;
};

/**
 * 経路として `goto` に届く、先頭 `/` の literal を集める。
 *
 * 直接渡す形 (`page.goto("/editor")`) と、同じ file の helper 経由 (`開く(page, "/editor")`)
 * の 2 つを見る。
 *
 * **覆えていない形が 2 つある**。 変数を渡す形 (`goto(path)`) は値の出どころを静的に追えず、
 * helper が別の helper を呼ぶ 2 段の形も追わない。 経路を data で持つ spec は data 側を
 * base 相対で書く。
 */
const 先頭スラッシュの経路 = (src: string): string[] => {
  const source = ts.createSourceFile("candidate.spec.ts", src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const helper = goto経由のhelper(source);
  const out: string[] = [];
  const visit = (node: ts.Node) => {
    if (ts.isCallExpression(node)) {
      let arg: ts.Expression | undefined;
      if (ts.isPropertyAccessExpression(node.expression) && node.expression.name.text === "goto") {
        arg = node.arguments[0];
      } else if (ts.isIdentifier(node.expression)) {
        const i = helper.get(node.expression.text);
        if (i !== undefined) arg = node.arguments[i];
      }
      const 頭 = arg === undefined ? null : 頭を取る(arg);
      if (頭 !== null && 頭.startsWith("/")) out.push(頭);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return out;
};

const specFilesを列挙 = (dir: string) =>
  readdirSync(dir, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".spec.ts"));

const 本番を見る検査か = (file: string) => 本番を見る検査.has(basename(file));
const 開発serverを見る検査か = (file: string) => 開発serverを見る検査.has(basename(file));

/**
 * spec の列挙。 subdir も見る。
 *
 * 実物の `tests/` に fixture を置くと Playwright が実行してしまうため、
 * 再帰の回帰検査は一時 directory で行う。
 */
const specFiles = specFilesを列挙(TESTS_DIR);

describe("画面の検査が見に行く先", () => {
  it("spec file が 1 つ以上ある (検査が空振りしていない)", () => {
    expect(specFiles.length).toBeGreaterThan(0);
  });

  it("本番用以外の spec は URL を自分で持たない", () => {
    const 持っている: string[] = [];
    let 読めた = 0;
    for (const f of specFiles) {
      if (本番を見る検査か(f)) continue;
      const src = readFileSync(join(TESTS_DIR, f), "utf8");
      読めた += 1;
      if (URLを自分で持つ記述か(src)) 持っている.push(f);
    }
    expect(読めた, "対象の spec を 1 つも読めていない").toBeGreaterThan(0);
    expect(持っている, "spec が URL を自分で持つと SPA_URL で別 server に分かれる").toEqual([]);
  });

  it("URL の直書きだけでなく env と baseURL 上書きも見つける", () => {
    // **5 つを別々に突く**。 env と baseURL 上書きを 1 つの記述で見ると、片方を外しても
    // もう片方が同じ記述で当たって落ちない (実測で `baseURL` の側を外して 0 件 FAIL だった)
    for (const src of [
      "const BASE = process.env.AI_VERIFY_BASE_URL;", // env だけ
      "test.use({ baseURL: SERVER });", // baseURL 上書きだけ
      "test.use({ baseURL });", // baseURL 短縮記法だけ
      "test.use({ storageState: { cookies: [{ name: 'sid' }], origins: [] }, baseURL });", // 深い入れ子の後ろ
      'page.goto("http://localhost:4323/editor");', // 直書きだけ
    ]) {
      expect(URLを自分で持つ記述か(src), src).toBe(true);
    }
    expect(URLを自分で持つ記述か('page.goto("/editor");'), "相対 path を誤検出する").toBe(false);
    expect(
      URLを自分で持つ記述か("test('uses config', async ({ page, baseURL }) => {});"),
      "config の baseURL fixture を誤検出する",
    ).toBe(false);
    expect(
      URLを自分で持つ記述か("test('aliases config', async ({ baseURL: serverURL }) => {});"),
      "別名で受け取る baseURL fixture を誤検出する",
    ).toBe(false);
    // 短縮記法を上書きとみなすのは `test.use` に渡した時だけ。 他の呼出に同じ名前で
    // 渡すのは、設定側から受け取った値をそのまま流す形で、自分で持っているわけではない
    expect(
      URLを自分で持つ記述か("const ctx = await browser.newContext({ baseURL });"),
      "設定側の値を流すだけの短縮記法を誤検出する",
    ).toBe(false);
  });

  it("subdir の spec も列挙し、本番用の名前は深さに関係なく除外する", () => {
    const fixtureRoot = mkdtempSync(join(tmpdir(), "spec-base-url-"));
    try {
      const nestedDir = join(fixtureRoot, "nested");
      mkdirSync(nestedDir);
      writeFileSync(join(nestedDir, "a11y-check.spec.ts"), "");

      const nestedSpec = join("nested", "a11y-check.spec.ts");
      const files = specFilesを列挙(fixtureRoot);
      expect(files).toContain(nestedSpec);
      expect(files.filter(本番を見る検査か)).toEqual([nestedSpec]);
    } finally {
      rmSync(fixtureRoot, { recursive: true, force: true });
    }
  });

  it("除外に名指しした file が実在する", () => {
    // 名指しの list が実物からずれると、消えた file を除き続けて対象が静かに減る。
    // **除外と同じく basename で見る** = 除外は深さを問わないのに、実在の確認だけ
    // top-level に限ると、prod の spec を subdir へ移しただけでここが落ちる
    const 名前 = specFiles.map((f) => basename(f));
    for (const f of [...本番を見る検査, ...開発serverを見る検査]) {
      expect(名前, `${f} が無い`).toContain(f);
    }
  });

  it("build 済の画面を見る spec は goto に先頭 / を付けない", () => {
    const 付いている: string[] = [];
    let 読めた = 0;
    for (const f of specFiles) {
      if (本番を見る検査か(f) || 開発serverを見る検査か(f)) continue;
      const src = readFileSync(join(TESTS_DIR, f), "utf8");
      読めた += 1;
      for (const 頭 of 先頭スラッシュの経路(src)) 付いている.push(`${f}: ${頭}`);
    }
    expect(読めた, "build 済の画面を見る spec を 1 つも読めていない").toBeGreaterThan(0);
    expect(付いている, "先頭 / を付けると base (/dragon/) が落ちて画面が出ない").toEqual([]);
  });

  it("先頭 / の判定が文字列と template の両方で効く", () => {
    // **陽性と陰性を対にする**。 陽性だけだと、何を渡しても件数を返す形 (恒真) に気付けない
    for (const src of [
      'await page.goto("/editor");',
      "await page.goto(`/editor#s=${x}`);",
      "await page.goto(`/__render#d=${b64}`);",
      'await page.goto("/", { waitUntil: "networkidle" });',
    ]) {
      expect(先頭スラッシュの経路(src), src).not.toEqual([]);
    }
    for (const src of [
      'await page.goto("editor");', // base 相対
      'await page.goto("");', // トップ
      "await page.goto(`${BASE}/editor`);", // 絶対 URL を自分で組む形
      "await page.goto(path);", // 変数。 静的には追えないので見ない (覆えていない)
    ]) {
      expect(先頭スラッシュの経路(src), src).toEqual([]);
    }
  });

  it("同じ file の helper に渡す経路も見る", () => {
    // 直接の `goto` だけを見ていた版が 4 件を素通しした (#1438)。 helper 経由が本体
    const 関数宣言 = "async function 開く(page, path) { await page.goto(path); }\n";
    const 変数宣言 = "const 開く = async (page, path) => { await page.goto(path); };\n";
    for (const 宣言 of [関数宣言, 変数宣言]) {
      expect(先頭スラッシュの経路(`${宣言}await 開く(page, "/catalog/styles");`)).toEqual([
        "/catalog/styles",
      ]);
      // 陰性 = base 相対で渡している形
      expect(先頭スラッシュの経路(`${宣言}await 開く(page, "catalog/styles");`)).toEqual([]);
    }
    // 陰性 = `goto` に渡さない helper。 名前が似ていても対象にしない
    expect(
      先頭スラッシュの経路('function 印(x) { return x; }\n印("/catalog/styles");'),
      "goto に渡さない helper を誤検出する",
    ).toEqual([]);
    // 陰性 = 経路ではない位置に渡した literal。 引数の位置まで見ていないと当たる
    expect(
      先頭スラッシュの経路(
        'async function 開く(page, path, 印) { await page.goto(path); }\nawait 開く(page, "catalog", "/印");',
      ),
      "経路ではない引数を誤検出する",
    ).toEqual([]);
  });
});
