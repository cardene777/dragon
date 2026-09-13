// @vitest-environment node
/**
 * 説明書が実物から導ける値を人手で書いていないことの検証 (#1801 / #1803)。
 *
 * `rules/quality.md § 導出可能記述は人手で書かない` は、実物から導ける値を文書に
 * literal で書く時に 3 つの経路のいずれかを採ることを求めている。
 * 説明書はどれも採らずに数と一覧を書いており、実際にずれていた。
 *
 * | ずれ | 実物 | 書いてあった値 |
 * |---|---|---|
 * | カタログの図の数 | 444 枚 (検査の走査結果) | 385 / 280 / 380+ |
 * | 分類の呼び名 | `テキスト記法` | `テキスト DSL` |
 * | 分類の件数 | 11 件 | 9 件 (2 件が一覧から抜けていた) |
 *
 * **数は落とし、一覧は突き合わせる**。 件数は追加のたびに書き換えが要るので数を書かない
 * (経路 2)。 一覧は中身そのものが情報なので、実物と丸ごと突き合わせる (経路 1)。
 *
 * **量の一覧は手で並べている**。 散文のどの数が実物から導けるかは機械で見分けられない
 * (同じ「4 図」 が、決めた日の実測にも今の枚数にもなる)。 代わりに 2 つの対照で境目を留める。
 * 植え込み対照が「今を指す数を拾えること」 を、対象外の対照が「決めた日の実測を拾わないこと」 を見る。
 *
 * #1801 は走査先を意匠帳 (`docs/design/`) に限っており、repo の入口である `README.md` が
 * 外に残っていた。 #1803 で説明書全体へ広げた。
 */
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { CATEGORIES } from "./catalog";

/** この file から見た repo の根 (`apps/playground-spa/src/lib/` の 4 つ上) */
const 根 = fileURLToPath(new URL("../../../../", import.meta.url));
const 意匠帳 = join(根, "docs/design");

/**
 * 実装から導ける量と、意匠帳でその量を指す時に使われる語。
 *
 * **導き方を 1 件ずつ書く** = 導けない量をここに足すと、検査が「書いてはいけない」 と
 * 言うだけで、では何を書けばよいかが決まらない。
 */
const 導ける量: { 名: string; 導き方: string; 語: RegExp }[] = [
  {
    名: "カタログの図の数",
    導き方: "カタログの記法 file が持つ図を数える (`packages/dragon/test/inline-stage-height.test.ts` の走査結果)",
    // 「図」 の直後の字で分ける。 `4 図とも 0 件になった` は測った時点の記録、
    // `1 図 1 枚` は 1 図あたりの話で、どちらも今の枚数を指していない
    語: /\d+\s*図(が|を|すべて|ある|あり)|他の図\s*\d+\s*件/,
  },
  {
    名: "画面の検査の件数",
    導き方: "カタログの見た目を見る検査を数える",
    語: /(検査|catalog)[^\n]*?\d+\s*件|\d+\s*件[^\n]*?(検査|catalog)/,
  },
  {
    名: "分類の数",
    導き方: "`CATEGORIES.length`",
    // 「1 枚につき」 は 1 枚あたりの中身の話で枚数ではないため、枚の直後の字で分ける
    語: /分類の札[^\n]*?\d+\s*枚(並|は|が|を|の)|\d+\s*枚[^\n]*?分類/,
  },
  {
    名: "色変数の数",
    導き方: "`docs/design/app.pen` を JSON として読み、色の変数を数える",
    語: /\d+\s*個の色変数|色変数[^\n]*?\d+\s*個|\d+\s*個[^\n]*?色変数/,
  },
  {
    名: "色変数を参照する箇所の数",
    導き方: "同じく `.pen` を読み、変数を指している所と直書きの所を数える",
    語: /\d+\s*箇所[^\n]*?(変数|直書き)|(変数|直書き)[^\n]*?\d+\s*箇所/,
  },
];

function md一覧(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...md一覧(p));
    else if (e.endsWith(".md")) out.push(p);
  }
  return out;
}

/**
 * 走査しない根の直下の md。
 *
 * 変更履歴は「その版で何が起きたか」 を書く場所で、決めた日の記録そのもの。
 * 今を指す数として読むと、過去の版の記述を今の実物に合わせて書き換えることになる。
 */
const 走査しない = new Set(["CHANGELOG.md"]);

/** 説明書として走査する md (意匠帳を含む `docs/` 全体 + 手順書 + 根の直下) */
export function 説明書のfile一覧(): string[] {
  return [
    ...md一覧(join(根, "docs")),
    ...md一覧(join(根, ".claude")),
    ...readdirSync(根)
      .filter((e) => e.endsWith(".md") && !走査しない.has(e))
      .map((e) => join(根, e)),
  ];
}

/**
 * 測った時点の記録であることを示す語。
 *
 * この語を持つ行は、今を指す数ではなく決めた日の実測として扱う。
 * 「実測すると catalog 422 件のうち 65% が静止画」 は、その日に測った値をそのまま残すのが正しい。
 */
const 実測の印 = /実測/;

/** 1 行の中に、導ける量を数で書いている所を返す。 本番と植え込み対照が同じ関数を使う */
export function 数で書いた量(行: string): string[] {
  if (実測の印.test(行)) return [];
  return 導ける量.filter((q) => q.語.test(行)).map((q) => q.名);
}

/**
 * 括弧の中の「A / B / C」 の並びを取り出す。 探す手掛かりは実物の 1 件目。
 *
 * **手掛かりを実物から引く** = 「カタログ (」 のような語を書くと、説明文を言い換えた日に
 * 探し方が何にも当たらなくなり、検査が黙って通る。
 */
export function 括弧の並び(src: string, 先頭: string): string[] | null {
  const 開き = src.indexOf(`(${先頭} / `);
  if (開き < 0) return null;
  const 閉じ = src.indexOf(")", 開き);
  if (閉じ < 0) return null;
  return src
    .slice(開き + 1, 閉じ)
    .split("/")
    .map((s) => s.trim());
}

/** 分類の表の行 (`| 呼び名 | 説明 |`) から呼び名を取り出す */
export function 表の呼び名(src: string): string[] {
  const 頭 = src.indexOf("| 分類 | 何が置かれているか |");
  if (頭 < 0) return [];
  const out: string[] = [];
  for (const ln of src.slice(頭).split("\n").slice(2)) {
    if (!ln.startsWith("|")) break;
    const 列 = ln.split("|").map((s) => s.trim());
    if (列.length < 3) break;
    out.push(列[1]!.replace(/`/g, ""));
  }
  return out;
}

describe("説明書が実物から導ける値を人手で書いていない (#1801 / #1803)", () => {
  it("導ける量を数で書いている行が無い", () => {
    const files = 説明書のfile一覧();
    expect(files.length, "説明書を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(20);
    expect(
      files.filter((f) => f.startsWith(意匠帳)).length,
      "意匠帳を 1 つも見ていない (走査先を広げた時に落とした)",
    ).toBeGreaterThan(5);
    expect(
      files.some((f) => f === join(根, "README.md")),
      "紹介文を見ていない (#1803 が広げた先)",
    ).toBe(true);
    let 行数 = 0;
    const 残る: string[] = [];
    for (const f of files) {
      readFileSync(f, "utf8")
        .split("\n")
        .forEach((ln, i) => {
          行数 += 1;
          for (const 名 of 数で書いた量(ln)) {
            残る.push(`${f.slice(根.length)}:${i + 1} [${名}] ${ln.trim().slice(0, 90)}`);
          }
        });
    }
    console.log(`[導ける量] md=${files.length} 行=${行数} 量の種類=${導ける量.length} 数で書いた所=${残る.length}`);
    expect(行数, "説明書の行を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(3000);
    expect(残る, `実物から導ける量を数で書いている:\n${残る.join("\n")}`).toEqual([]);
  });

  it("数で書いた行を拾える (植え込み対照)", () => {
    // 探し方が何にも当たらない形に壊れていると、上は必ず通る。
    // 直した 5 file の直す前の文面をそのまま通す
    expect(数で書いた量("385 図が engine の出力そのままで並び、画面の検査 561 件がその見た目を見ている。")).toEqual([
      "カタログの図の数",
      "画面の検査の件数",
    ]);
    expect(数で書いた量("| catalog | 385 | 自動 | 561 件 |")).toEqual(["画面の検査の件数"]);
    expect(数で書いた量("崩れた時に原因を切り分けられない。 カタログの 280 図が 1 回で全部動く。")).toEqual(["カタログの図の数"]);
    expect(数で書いた量("他の図 280 件の見た目も変わる。")).toEqual(["カタログの図の数"]);
    expect(数で書いた量("戻す時は 280 図すべての線の根元が動く。")).toEqual(["カタログの図の数"]);
    expect(数で書いた量("その下に分類の札を 11 枚並べる。")).toEqual(["分類の数"]);
    expect(数で書いた量("配色は 28 個の色変数に集約してあり、 図の側は 3231 箇所が変数を参照する。")).toEqual([
      "色変数の数",
      "色変数を参照する箇所の数",
    ]);
    expect(数で書いた量("直書きは透明 2 箇所だけなので、 変数を直せば図全体に届く。")).toEqual([
      "色変数を参照する箇所の数",
    ]);
  });

  it("決めた日の実測は拾わない (対象外の対照)", () => {
    // 歴史の記録は書き換えない。 その場の観察として数が残るのは正しい
    expect(数で書いた量("重なって走る区間は 4 図とも 0 件になった。")).toEqual([]);
    expect(数で書いた量("多対多は 7 件の重なりが 0 になり、集まる形に 1 件残っている。")).toEqual([]);
    expect(数で書いた量("角の丸みは 18。 6 件のうち 5 件で測れ、1 件は角を持たない形のため測れない。")).toEqual([]);
    expect(数で書いた量("それを確かめる経路が無かったため 14 箇所ずれていた。")).toEqual([]);
    // 意匠として決めた数も対象外。 実装から導くのではなく、ここで決めている
    expect(数で書いた量("札を 3 枚横に並べ、 1 枚につき図の縮小版 + 見出し + 説明を入れる。")).toEqual([]);
    expect(数で書いた量("3 枚の下に `図のカタログを見る →` を置く。")).toEqual([]);
    // 1 枚あたりの中身を言う「1 枚につき」 は枚数ではない
    expect(数で書いた量("その下に分類の札を並べる。 1 枚につき見出し + 3 行程度の説明 + `開く →`。")).toEqual([]);
  });

  it("実測の印を外すと同じ行を拾う (除外が広すぎないことの対照)", () => {
    // 「実測」 で外す規則が、今を指す数まで黙らせていないことを 1 対で見る
    const 文 = "catalog 422 件のうち 65% が静止画で、";
    expect(数で書いた量(`実測すると ${文}`), "測った時点の記録を拾っている").toEqual([]);
    expect(数で書いた量(文), "実測の語を外しても拾えていない (除外が広すぎる)").toEqual(["画面の検査の件数"]);
  });

  it("分類の表が CATEGORIES の呼び名と丸ごと一致する", () => {
    const src = readFileSync(join(意匠帳, "specs/screens.md"), "utf8");
    const 出た = 表の呼び名(src);
    expect(出た.length, "分類の表を読めていない (検査が空振りしている)").toBe(CATEGORIES.length);
    expect(出た, "意匠帳の分類の表が CATEGORIES と違う").toEqual(CATEGORIES.map((c) => c.label));
  });

  it("表の呼び名を取り出せる (植え込み対照)", () => {
    const 元 = "| 分類 | 何が置かれているか |\n|---|---|\n| プリセット | 説明 |\n| テキスト記法 | 説明 |\n";
    expect(表の呼び名(元)).toEqual(["プリセット", "テキスト記法"]);
    expect(表の呼び名("表が無い本文"), "表が無いのに呼び名を返している").toEqual([]);
  });

  it("紹介文の分類の一覧が CATEGORIES と丸ごと一致する (#1803)", () => {
    // 紹介文は呼び名と識別子の 2 通りで並べている。 片方だけ見ると残りが手書きのまま残る
    const src = readFileSync(join(根, "README.md"), "utf8");
    const 呼び名 = 括弧の並び(src, CATEGORIES[0]!.label);
    const 識別子 = 括弧の並び(src, CATEGORIES[0]!.slug);
    expect(呼び名, "呼び名の並びを見つけられない (検査が空振りしている)").not.toBeNull();
    expect(識別子, "識別子の並びを見つけられない (検査が空振りしている)").not.toBeNull();
    console.log(`[紹介文の分類] 実物=${CATEGORIES.length} 呼び名=${呼び名?.length} 識別子=${識別子?.length}`);
    expect(呼び名, "紹介文の呼び名の並びが CATEGORIES と違う").toEqual(CATEGORIES.map((c) => c.label));
    expect(識別子, "紹介文の識別子の並びが CATEGORIES と違う").toEqual(CATEGORIES.map((c) => c.slug));
  });

  it("括弧の並びを取り出せる (植え込み対照)", () => {
    const 全 = CATEGORIES.map((c) => c.label);
    const 頭 = 全[0]!;
    expect(括弧の並び(`分類 (${全.join(" / ")}) で探せる`, 頭)).toEqual(全);
    // 1 件落ちた並びを、落ちたものとして返す (丸ごと一致の検査が拾える形か)
    const 欠け = [頭, ...全.slice(2)];
    expect(括弧の並び(`分類 (${欠け.join(" / ")}) で探せる`, 頭)).toEqual(欠け);
    expect(括弧の並び("並びが無い本文", 頭), "並びが無いのに返している").toBeNull();
    expect(括弧の並び(`分類 (${全.join(" / ")}) で探せる`, "無い呼び名"), "頭が合わないのに返している").toBeNull();
  });
});
