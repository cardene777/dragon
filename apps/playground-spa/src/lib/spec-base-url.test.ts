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
 */

const TESTS_DIR = join(import.meta.dirname, "../../tests");

/**
 * 本番 build の preview を見る spec。 dev server とは別の相手なので対象外にする。
 *
 * 名前ではなく **`PROD_BASE_URL` を読んでいるか** で判定したいところだが、その形は
 * dev server を指す既定値を持つこともできてしまう (実際に `rendered-contrast.spec.ts` が
 * `PROD_BASE_URL` の名前で 4323 を既定にしていた)。 名指しにして、増える時に気付く形にする。
 */
const 本番を見る検査 = new Set(["a11y-check.spec.ts", "final-check.spec.ts", "prod-check.spec.ts"]);

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

const specFilesを列挙 = (dir: string) =>
  readdirSync(dir, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".spec.ts"));

const 本番を見る検査か = (file: string) => 本番を見る検査.has(basename(file));

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

  it("dev server を見る spec は URL を自分で持たない", () => {
    const 持っている: string[] = [];
    let 読めた = 0;
    for (const f of specFiles) {
      if (本番を見る検査か(f)) continue;
      const src = readFileSync(join(TESTS_DIR, f), "utf8");
      読めた += 1;
      if (URLを自分で持つ記述か(src)) 持っている.push(f);
    }
    expect(読めた, "dev server を見る spec を 1 つも読めていない").toBeGreaterThan(0);
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

  it("本番を見る検査として除いた file が実在する", () => {
    // 名指しの list が実物からずれると、消えた file を除き続けて対象が静かに減る。
    // **除外と同じく basename で見る** = 除外は深さを問わないのに、実在の確認だけ
    // top-level に限ると、prod の spec を subdir へ移しただけでここが落ちる
    const 名前 = specFiles.map((f) => basename(f));
    for (const f of 本番を見る検査) expect(名前, `${f} が無い`).toContain(f);
  });
});
