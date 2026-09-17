import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it, expect } from "vitest";
import { 走査するfile } from "../../../test-support/scan-targets";

/**
 * 検査が走る環境が、読んだ通りに決まることの検証 (#2089)。
 *
 * `vitest.config.ts` は glob と環境の対応表 (`environmentMatchGlobs`) を持っていたが、今の vitest は
 * この指定を読まない。 実測 = vitest 4.1.11 の配布物に字が 1 つも無く、当たるはずの検査の実行時間の
 * `environment` が 0ms だった (jsdom を組み立てていない)。 設定を読んだ人は「当たる検査は jsdom」 と
 * 受け取るのに、実際は node で走っていた。
 *
 * 対応表を消して、要る検査が file 冒頭に書く形へ寄せた。 この検査は 2 つを見る。
 *
 * ## 1. 設定に、今の vitest が受け付けない指定が無い
 *
 * `tsc` に `vitest.config.ts` を読ませる。 `defineConfig` に渡す object は型が決まっているので、
 * 今の版に無い指定を書くと誤りになる。
 *
 * 普段の型検査 (`tsc -b`) はこの file を読まない = 3 つの project がどれも自分の dir の中しか
 * 見ないため。 専用の設定 (`tsconfig.config-files.json`) を読ませる。
 *
 * ## 2. 画面の部品を触る検査が、環境の指定を持つ
 *
 * 素の `document` / `window` を使う file を走査し、file 冒頭の環境の指定があることを見る。
 * 指定の綴りは下の `環境の指定` が持つ。
 *
 * **この説明文に指定の綴りをそのまま書かない**。 vitest は file の字から環境を決めるので、
 * 書くとこの検査自身が jsdom で走る (実測 = 書いていた間、組み立てに 457ms かかっていた)。
 *
 * **自分で組み立てる形は対象外**。 `new JSDOM(...)` の返り値から `dom.window.document` と辿る検査は
 * 環境に依存しないので、`.` に続く形は数えない (実測で `edge-label-contrast.test.ts` がこの形)。
 *
 * **取りこぼす形がある**。 画面の部品を直接書かず、呼んだ先が触る形 (`render()` 等) は字から判らない。
 * その分は「指定を持つ file の方が多い」 側に倒れるだけで、落とし穴にはならない
 * (実測 = 素の使い方 14 file に対し、指定を持つ file は 18)。
 */

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..");
const TSC = join(REPO, "node_modules", ".bin", "tsc");
const 設定 = join(REPO, "tsconfig.config-files.json");

/** 素の `document` / `window` を使っているか (`dom.window` のように `.` に続く形は数えない) */
const 素の画面部品 = /(^|[^.\w$])(document|window)\s*[.[]|globalThis\s*\.\s*(document|window)/mu;

/**
 * 対照に使う字は繋いで作る (#2092 と同じ形)。
 *
 * この file は自分も走査対象に入る。 対照の中に通しの綴りを書くと「画面の部品を触っている」 と
 * 判定され、環境の指定を持たないこの file 自身が落ちる (実測で 1 度踏んだ)。
 */
const 文書 = ["docu", "ment"].join("");
const 窓 = ["win", "dow"].join("");

/** file 冒頭の環境の指定 */
const 環境の指定 = /@vitest-environment\s+jsdom/u;

/**
 * 走査対象 = 追跡している検査 file と、未追跡だが無視されていない検査 file。
 *
 * 追跡している file だけを見ると、新しく書いた検査は取り込むまで判定を受けない。
 * この検査自身がその穴に落ちた (書いている間は自分を走査せず、取り込んだ回で初めて落ちた)。
 * 集め方は `test-support/scan-targets.ts` が 1 か所で持つ (#2095)。
 */
const 検査file: string[] = 走査するfile(REPO, "*.test.ts", "*.test.tsx");

const 中身 = new Map(検査file.map((p) => [p, readFileSync(join(REPO, p), "utf8")]));

/** 素の画面部品を使う検査 file */
function 画面部品を使うfile(): string[] {
  return 検査file.filter((p) => 素の画面部品.test(中身.get(p) ?? ""));
}

/**
 * 設定 file の型検査。 誤りの行と、実際に読んだ file を返す。
 *
 * 読んだ file を併せて返すのは、誤り 0 件が「該当なし」 か「1 行も読んでいない」 かを
 * 分けるため (`--listFiles` が読んだ file を 1 行ずつ出す)。
 */
function 型検査(): { 誤り: string[]; 読んだfile: string[] } {
  let 出力 = "";
  try {
    出力 = execFileSync(TSC, ["-p", 設定, "--noEmit", "--listFiles"], {
      encoding: "utf8",
      cwd: REPO,
    });
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    出力 = `${err.stdout ?? ""}${err.stderr ?? ""}`;
  }
  const 行 = 出力.split("\n");
  return {
    誤り: 行.filter((l) => /error TS\d+/u.test(l)),
    読んだfile: 行.filter((l) => l.endsWith(".ts") || l.endsWith(".d.ts")),
  };
}

describe("検査が走る環境が読んだ通りに決まる (#2089)", () => {
  it("設定 file に、今の vitest が受け付けない指定が無い", () => {
    const 結果 = 型検査();
    expect(
      結果.読んだfile.some((f) => f.endsWith("/vitest.config.ts")),
      "型検査が `vitest.config.ts` を読んでいない (誤り 0 件が空振り)",
    ).toBe(true);
    expect(結果.誤り, "`vitest.config.ts` の型検査で誤りが出ている").toEqual([]);
  }, 60_000);

  it("走査対象を集められている", () => {
    // 集められていなければ、以下の検査は通って当然になる
    expect(検査file.length, "検査 file を 1 件も集められていない").toBeGreaterThan(100);
    expect(
      画面部品を使うfile().length,
      "素の画面部品を使う file を 1 件も見つけられていない (空振り)",
    ).toBeGreaterThan(0);
    // 自分も走査対象に入る。 外れると、この file に書いた対照の字が判定を受けなくなる
    expect(検査file, "この検査 file 自身が走査対象に入っていない").toContain(
      "packages/dragon/test/vitest-env-declared-per-file.test.ts",
    );
  });

  it("素の画面部品を使う検査が、環境の指定を持つ", () => {
    const 指定なし = 画面部品を使うfile().filter((p) => !環境の指定.test(中身.get(p) ?? ""));
    expect(指定なし, "画面の部品を触るのに環境の指定が無い").toEqual([]);
  });

  it("素の使い方を拾えている (植え込み対照)", () => {
    // 拾えない判定だと、上の検査は書き忘れがあっても通る
    expect(素の画面部品.test(`const e = ${文書}.createElement('i');`), "素の文書を拾えていない").toBe(true);
    expect(素の画面部品.test(`${窓}.matchMedia('(prefers-color-scheme: dark)');`), "素の窓を拾えていない").toBe(true);
    expect(素の画面部品.test(`globalThis.${文書}.body.innerHTML = '';`), "globalThis 経由を拾えていない").toBe(true);
  });

  it("自分で組み立てる形と文字の中は拾わない (陰性対照)", () => {
    // 拾うと、環境に依存しない検査にまで指定を書かせることになる
    expect(素の画面部品.test(`const el = dom.${窓}.${文書}.querySelector('i');`), "自分で組み立てた形を拾っている").toBe(false);
    expect(素の画面部品.test(`expect(msg).toContain("single ${文書}");`), "文字の中の語を拾っている").toBe(false);
  });
});
