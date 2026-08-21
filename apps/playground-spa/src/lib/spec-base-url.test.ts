import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

const URLを自分で持つ記述 =
  /https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?|process\.env\.[A-Z0-9_]*URL\b|\bbaseURL\s*:/u;

/**
 * spec の列挙。 subdir も見る。
 *
 * **今は subdir に spec が 1 件も無いため、この再帰は検査で覆えていない** (`recursive` を
 * 外しても 1 件も落ちない)。 覆うには `tests/` 配下に fixture を置くことになるが、
 * それは Playwright が実行する対象そのものなので置けない。 spec を分類し始めた時に
 * 静かに対象から外れないよう、先に再帰にしてある。
 */
const specFiles = readdirSync(TESTS_DIR, { recursive: true, encoding: "utf8" }).filter((f) =>
  f.endsWith(".spec.ts"),
);

describe("画面の検査が見に行く先", () => {
  it("spec file が 1 つ以上ある (検査が空振りしていない)", () => {
    expect(specFiles.length).toBeGreaterThan(0);
  });

  it("dev server を見る spec は URL を自分で持たない", () => {
    const 持っている: string[] = [];
    let 読めた = 0;
    for (const f of specFiles) {
      if (本番を見る検査.has(f)) continue;
      const src = readFileSync(join(TESTS_DIR, f), "utf8");
      読めた += 1;
      if (URLを自分で持つ記述.test(src)) 持っている.push(f);
    }
    expect(読めた, "dev server を見る spec を 1 つも読めていない").toBeGreaterThan(0);
    expect(持っている, "spec が URL を自分で持つと SPA_URL で別 server に分かれる").toEqual([]);
  });

  it("URL の直書きだけでなく env と baseURL 上書きも見つける", () => {
    // **3 つを別々に突く**。 env と baseURL 上書きを 1 つの記述で見ると、片方を外しても
    // もう片方が同じ記述で当たって落ちない (実測で `baseURL` の側を外して 0 件 FAIL だった)
    for (const src of [
      "const BASE = process.env.AI_VERIFY_BASE_URL;", // env だけ
      "test.use({ baseURL: SERVER });", // baseURL 上書きだけ
      'page.goto("http://localhost:4323/editor");', // 直書きだけ
    ]) {
      expect(URLを自分で持つ記述.test(src), src).toBe(true);
    }
    expect(URLを自分で持つ記述.test('page.goto("/editor");'), "相対 path を誤検出する").toBe(false);
  });

  it("本番を見る検査として除いた file が実在する", () => {
    // 名指しの list が実物からずれると、消えた file を除き続けて対象が静かに減る
    for (const f of 本番を見る検査) expect(specFiles, `${f} が無い`).toContain(f);
  });
});
