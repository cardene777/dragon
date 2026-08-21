import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

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

const specFiles = readdirSync(TESTS_DIR).filter((f) => f.endsWith(".spec.ts"));

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
      if (/https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?/u.test(src)) 持っている.push(f);
    }
    expect(読めた, "dev server を見る spec を 1 つも読めていない").toBeGreaterThan(0);
    expect(持っている, "spec が URL を自分で持つと SPA_URL で別 server に分かれる").toEqual([]);
  });

  it("本番を見る検査として除いた file が実在する", () => {
    // 名指しの list が実物からずれると、消えた file を除き続けて対象が静かに減る
    for (const f of 本番を見る検査) expect(specFiles, `${f} が無い`).toContain(f);
  });
});
