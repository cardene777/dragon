/**
 * 見本と部品の件数を、コードと検査の題や説明に数字で書かないことの検証 (#2060)。
 *
 * 編集画面の見本 (`EDITOR_SAMPLES`) は足され続けて 25 件になったが、検査の題と説明には
 * 「全」 の後に 12 と sample を続けた書き方が 44 か所残っていた (書いた時点の件数)。
 * 件数を数字と比べる行 (`toBe(25)`) は見本を足すたびに直され、題と説明は直されなかった。
 * 数字を書く場所が残る限り、同じずれは見本や部品を足すたびに起きる。
 *
 * 題に件数を出したい時は `${EDITOR_SAMPLES.length}` のように実物から組む。 この形は数字を
 * 書いていないので拾わない。
 *
 * 対象は追跡中の `*.ts` / `*.tsx` に限る。 `docs/` の Markdown に残る件数は
 * 書いた時点の実測の記録で、その時の数字が正しい。
 *
 * 名詞を先に置いた書き方 (見本の語に件数を続ける形) は別の判定で見る (#2062)。 「全」 を
 * 付けない形は検査の中で決めた個数と文字の上で区別できないため、見る場所を検査の題に、
 * 見る file を見本か部品の一覧を丸ごと読み込む file に絞る。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

const REPO = join(import.meta.dirname, "..", "..", "..");

/**
 * 件数を数字で書いた形。 「全」 の後に数字を置き、見本か部品を表す語を続ける。
 *
 * 「全」 を付けた形に限る。 `5 parts 同時` のように、その検査の中で決めた個数を書く形は
 * 実物の件数とずれようがないので拾わない。
 */
const 数字で書いた件数 = /全 ?[0-9]+ ?(?:個の )?(?:sample|samples|EDITOR_SAMPLES|SAMPLES|見本|parts|部品)/gu;

/** 本文から、件数を数字で書いた箇所を返す */
function 書いた件数(本文: string): string[] {
  return [...本文.matchAll(数字で書いた件数)].map((m) => m[0]);
}

/** 植え込み対照に使う形。 この file 自身が走査に掛からないよう、数字と語を分けて組む */
const 組む = (...部分: string[]): string => 部分.join(" ");

/** 追跡中の `*.ts` / `*.tsx` (repo からの相対 path) */
function 追跡中のfile(): string[] {
  return execFileSync("git", ["-C", REPO, "ls-files", "*.ts", "*.tsx"], { encoding: "utf8" })
    .split("\n")
    .filter((p) => p !== "");
}

/**
 * 見本か部品の一覧を丸ごと読み込む形 (#2062)。
 *
 * この形を持つ file の題に書いた件数は、読み込んだ一覧の件数を指しており、実物から導ける。
 * 部品を名前で 1 つずつ読み込む形 (`import { partsBadgeCount } from ".../parts.cdl"`) は
 * 含めない。 その file の題に書く件数は、検査の中で選んだ部品の数にあたる。
 */
const 一覧を丸ごと読み込む形: readonly RegExp[] = [
  /from ["'][^"']*data\/editor-samples["']/u,
  /import \* as [^ ]+ from ["'][^"']*topics\/catalog\/parts\.cdl["']/u,
  /from ["'][^"']*lib\/parts-catalog["']/u,
];

/**
 * 検査の題。 `it` / `test` / `describe` の第 1 引数で、同じ行で閉じる文字列だけを見る。
 * 題を次の行に送った書き方は拾わない。
 */
const 検査の題 = /\b(?:it|test|describe)(?:\.(?:each|skip|only|todo)(?:\([^)]*\))?)?\(\s*(["'`])((?:(?!\1).)*)\1/gu;

/**
 * 名詞を先に置いた件数。 見本か部品を表す語の後に 2 以上の数を置き、件 / 個 / 種 で受ける。
 *
 * 1 を外すのは、`見本 1 件ごとに` のように 1 件を単位として書いた題が一覧の件数を指さないため。
 */
const 名詞が先の件数 = /(?:見本|sample|samples|SAMPLES|EDITOR_SAMPLES|parts|部品) ?(?:[2-9]|[1-9][0-9]+) ?(?:件|個|種)/u;

/** 1 file の本文から、一覧を丸ごと読み込む file の題に書いた件数を行番号つきで返す */
function 題に書いた件数(本文: string): Array<{ 行: number; 形: string }> {
  if (!一覧を丸ごと読み込む形.some((形) => 形.test(本文))) return [];
  return 本文.split("\n").flatMap((行, i) =>
    [...行.matchAll(検査の題)].flatMap((題) => {
      const 件数 = (題[2] ?? "").match(名詞が先の件数);
      return 件数 ? [{ 行: i + 1, 形: 件数[0] }] : [];
    }),
  );
}

/**
 * 対照に使う読み込みの行。 この file 自身が一覧を読み込む file とみなされないよう、
 * path を分けて組む (文字として続けて書くと、この file の対照の題が本番の走査に掛かる)。
 */
const 読み込む = {
  見本: `import { EDITOR_SAMPLES } from "../src/${["data", "editor-samples"].join("/")}";`,
  部品を丸ごと: `import * as 部品 from "../src/topics/catalog/${["parts", "cdl"].join(".")}";`,
  部品の一覧: `import { 部品の一覧を作る } from "../src/lib/${["parts", "catalog"].join("-")}";`,
  部品を名前で: `import { partsBadgeCount } from "../src/topics/catalog/${["parts", "cdl"].join(".")}";`,
};

describe("見本と部品の件数を数字で書かない (#2060)", () => {
  it("追跡中の *.ts / *.tsx に件数を数字で書いた箇所が無い", () => {
    const 対象 = 追跡中のfile();
    expect(対象.length, "file を 1 つも拾えていない (検査が空振りしている)").toBeGreaterThan(0);

    const 見つけた: string[] = [];
    for (const rel of 対象) {
      const 行たち = readFileSync(join(REPO, rel), "utf8").split("\n");
      行たち.forEach((行, i) => {
        for (const 形 of 書いた件数(行)) 見つけた.push(`${rel}:${i + 1}: ${形}`);
      });
    }
    expect(
      見つけた,
      "見本や部品の件数を数字で書いている (足すたびにずれる。 数字を消すか、実物から組む)",
    ).toEqual([]);
  });

  it("件数を数字で書いた 4 つの形をそれぞれ拾う", () => {
    // 植え込み対照。 本番の走査は 0 件を期待するので、探し方が何にも一致しない形に
    // 壊れていても通ってしまう。 同じ判定に違反の形を渡して、拾えることを確かめる
    for (const 形 of [
      組む("全", "12", "sample"),
      組む("全", "80", "parts"),
      組む("全", "19", "見本"),
      組む("全", "25", "EDITOR_SAMPLES"),
    ]) {
      expect(書いた件数(`describe("iter: ${形} × 検査", () => {`), 形).toEqual([形]);
    }
  });

  it("数字を持たない形とその検査の中で決めた個数は拾わない", () => {
    // 陰性対照。 上の対照が、何でも拾う判定で通っていないことを確かめる
    const 形 = [
      "describe(\"iter: 全 sample × 検査\", () => {",
      "it(\"5 parts 同時 inject でも id が重ならない\", () => {",
      "test(`全 ${見本.length} 見本で文字が読める`, async () => {",
    ];
    expect(形.flatMap(書いた件数)).toEqual([]);
  });
});

describe("名詞を先に置いた件数を検査の題に書かない (#2062)", () => {
  it("見本か部品の一覧を丸ごと読み込む file の題に件数を数字で書いていない", () => {
    const 対象 = 追跡中のfile();
    let 一覧を読み込むfile = 0;
    const 見つけた: string[] = [];
    for (const rel of 対象) {
      const 本文 = readFileSync(join(REPO, rel), "utf8");
      if (一覧を丸ごと読み込む形.some((形) => 形.test(本文))) 一覧を読み込むfile++;
      for (const { 行, 形 } of 題に書いた件数(本文)) 見つけた.push(`${rel}:${行}: ${形}`);
    }
    expect(一覧を読み込むfile, "一覧を丸ごと読み込む file を 1 つも拾えていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(
      見つけた,
      "検査の題に見本か部品の件数を数字で書いている (足すたびにずれる。 数字を消すか、実物から組む)",
    ).toEqual([]);
  });

  it("一覧を丸ごと読み込む 3 つの形で、題に書いた件数をそれぞれ拾う", () => {
    // 植え込み対照。 本番の走査は 0 件を期待するので、判定が何にも一致しない形に壊れていても
    // 通ってしまう。 読み込みの形ごとに違反の題を 1 つ置き、拾えることを確かめる
    const 対照 = [
      { 読み込み: 読み込む.見本, 題: 組む("見本", "12", "件で読めなかった項目が 0 件"), 件数: 組む("見本", "12", "件") },
      { 読み込み: 読み込む.部品を丸ごと, 題: 組む("parts", "80", "個 export 検出"), 件数: 組む("parts", "80", "個") },
      { 読み込み: 読み込む.部品の一覧, 題: 組む("部品", "80", "種をどれで並べても"), 件数: 組む("部品", "80", "種") },
    ];
    for (const { 読み込み, 題, 件数 } of 対照) {
      const 本文 = [読み込み, "", `  it("${題}", () => {`].join("\n");
      expect(題に書いた件数(本文), 題).toEqual([{ 行: 3, 形: 件数 }]);
    }
  });

  it("一覧を読み込まない file の題、1 件を単位とした題、題の外の説明は拾わない", () => {
    // 陰性対照。 上の対照が、読み込みの形や題の位置を見ずに数字だけで拾う判定で通って
    // いないことを確かめる
    const 対照 = [
      { 名前: "一覧を読み込まない", 本文: [`import { 部品の表 } from "../src/v05/parser";`, `describe("${組む("部品", "7", "種を読む")}", () => {`] },
      { 名前: "部品を名前で読み込む", 本文: [読み込む.部品を名前で, `it("${組む("parts", "2", "個を同時に置く")}", () => {`] },
      { 名前: "1 件を単位とした題", 本文: [読み込む.見本, `it("${組む("見本", "1", "件ごとに読める")}", () => {`] },
      { 名前: "題の外の説明", 本文: [読み込む.見本, `// ${組む("見本", "12", "件で読めなかった項目を数える")}`] },
    ];
    for (const { 名前, 本文 } of 対照) {
      expect(題に書いた件数(本文.join("\n")), 名前).toEqual([]);
    }
  });
});
