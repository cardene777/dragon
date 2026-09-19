import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join, relative } from "node:path";
import { 説明書のfile, いまを述べる説明書 } from "../../../test-support/scan-targets";

/**
 * 走査すれば出る件数を、注記に手で書いていないことの検証 (#2080)。
 *
 * 対象は「数が動く一覧」 を主語にした注記だけに絞る。 実測では `NodeKind` の種類が 28 から
 * 117 へ増え、見本の名前の表が 432 件から 443 件へ増えた後も、注記は書いた日の数のまま残って
 * いた。 `NodeKind` の 1 件は配る型 (`packages/dragon/dist/index.d.ts`) にもそのまま入るため、
 * この package を使う人の補完にも古い数が見えていた。
 *
 * ## 主語と同じ行だけを見る
 *
 * 注記の中の数を一律に止めると、過去の実測を根拠として書いた数 (「当時 412 件中 9 件しか
 * 収まっていなかった」) まで巻き込む。 根拠まで消すと、その規約がなぜ在るかが読めなくなる。
 *
 * 主語 (`NodeKind` / `ITEM_NAME_JA` / `ITEM_NAME_EN`) と数が同じ行に並んだ時だけ落とす。
 * 別の行に置いた過去の実測は残る。
 *
 * ## 走査する木を検査の側へ広げない (#2238)
 *
 * 隣の 2 本 (`current-total-prose.test.ts` / `readability-count-prose.test.ts`) は
 * repo 全体の `.ts` / `.tsx` を見る。 こちらは配る側と画面側の `src` だけを見ており、
 * **検査の file を 1 つも読んでいない**。 広げるとどうなるかを測った。
 *
 * | 広げた先で当たる行 | 中身 | 直すべきか |
 * |---|---|---|
 * | この file の冒頭 | 「`NodeKind` の 1 件は配る型にも入る」 | いいえ (一覧の中の 1 件の話) |
 * | `dsl-only-kinds.test.ts` | 「`NodeKind` に戻しても 139 件すべて通った」 | いいえ (測った時点の記録) |
 *
 * 当たる行 2 件、直すべき行 0 件。 主語を書いた行を見る形なので、検査の file には
 * 「一覧の中の 1 件」 と「測った時点の記録」 が集まる。 広げると誤って止める行だけが増える。
 *
 * 除くための判定を足せば広げられるが、**直すべき行が 0 件なので足す理由が無い**。
 * 検査の側に主語つきの件数を書く形が実際に出たら、その時に測り直す。
 *
 * ## 説明書には広げる (#2260)
 *
 * source の注釈だけを見ていた間、**いまを述べる文書に書いた数は 1 度も読まれていなかった**。
 * `docs/spec-parts-actors-unified.md` は `status = active` を持ちながら
 * 「既存 kind list = 28 個」 を前提事実として並べており、実物は 117 件だった
 * (文書に無い種類が 89 件)。 数が動く一覧を主語にした行という点で source の注釈と同じ形で、
 * **人が最初に読む面のほうが判定の外に置かれていた**。
 *
 * 広げ方は 2 通りあり、外す件数で決めた。
 *
 * | 広げる先 | 当たる行 | うち直すべき | 宣言が要る件数 |
 * |---|---|---|---|
 * | 説明書 (`説明書のfile`、md 37 枚) | 1 件 | 1 件 | 0 件 |
 * | 注釈を読む file 全件 (922 枚) | 7 件 | 1 件 | 6 件 |
 *
 * 後者の 6 件はこの file の植え込み対照と `dsl-only-kinds.test.ts` の記録で、
 * 上の節が既に「直すべき行 0 件」 と測った先と同じ。 **説明書だけなら宣言が 1 件も要らない**。
 *
 * 広げた結果、同じ file の隣の行 2 つが同じ形で止まっていた (`parts identifier`)。
 * 主語を 1 語足すだけで落ちるので同じ回に直した (下の `主語` の注釈が測定を持つ)。
 *
 * ## 説明書は行の形が違う
 *
 * source は注釈の行だけを見るが、説明書は全ての行が人に読ませる文になる。
 * 走査する側で `.md` かどうかを見て、**見る行の決め方を分ける**。
 * 同じ判定 (`主語と数が並ぶ`) を両方が使うので、片方だけ緩む形にはならない。
 */

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..");

/**
 * 数が動く一覧の主語。 これと同じ行に件数を書くと、一覧が動いた日にずれる。
 *
 * `parts identifier` は #2260 で足した。 説明書へ広げた時に同じ file の隣の行が
 * 同じ形で止まっており (書いた 80 個 に対し実物 126 件)、主語を 1 語足すだけで
 * 落ちる形だった。 足した結果 source 側で当たる行は 0 件、説明書側は 2 件で、
 * 2 件とも実際にずれていた = 宣言が 1 件も要らない。
 */
const 主語 = ["NodeKind", "NODE_KIND_VALID", "ITEM_NAME_JA", "ITEM_NAME_EN", "parts identifier"];

/** 走査する木 (repo 相対) */
const 走査する木 = ["packages/dragon/src", "apps/playground-spa/src"];

function file一覧(dir: string, 出: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) file一覧(p, 出);
    else if (/\.tsx?$/u.test(e.name)) 出.push(p);
  }
  return 出;
}

/** 注記の行か (`//` と JSDoc の行) */
function 注記の行(line: string): boolean {
  const t = line.trim();
  return t.startsWith("//") || t.startsWith("*") || t.startsWith("/*");
}

/** 主語と件数が同じ行に並んでいるか */
function 主語と数が並ぶ(line: string): boolean {
  if (!主語.some((s) => line.includes(s))) return false;
  return /\d+\s*(件|個|種)/u.test(line);
}

/**
 * 登録簿そのものを単位にして大きさを名乗る形 (#2264)。
 *
 * 上の `主語と数が並ぶ` は「数 + 件 / 個 / 種」 を見るので、
 * **数えるものの名前が単位になっている書き方**が素通りしていた。
 * 図の部品の手順書が「既存 20 parts のどれとも異なるか」 を判定基準に置いており、
 * 登録簿の実物 110 件に対して 5 か所が 20 のまま止まっていた。
 *
 * ## 「いま何件あるか」 と読める形だけを見る
 *
 * 数と名前が並ぶだけの形を止めると、その数を持つものを指す言い回し
 * (`3 parts 並置`) と、原則を述べた文 (`1 parts = 1 concept`) を巻き込む。
 *
 * **全体を指す語が前に付く形**に絞る = `現状 / 現 / 既存 / 全` は
 * 「数えるとこうなる」 としか読めない。 実測で当たる 8 行のうち、
 * 5 行が止まっていた手順書、3 行が履歴として残した文書だった。
 */
const 全体を指す語 = ["現状", "現", "既存", "全"];
const 登録簿の大きさ = new RegExp(`(${全体を指す語.join("|")})\\s*[0-9]+\\s*parts\\b`, "u");

const 走査したfile = 走査する木.flatMap((d) => file一覧(join(REPO, d)));

/**
 * いまを述べる説明書。
 *
 * `CHANGELOG.md` は過去の版の記録なので入らず、
 * 履歴として残したと自分で宣言した md (`status = superseded`) も入らない (#2264)。
 * 当時の数がそのまま書いてあるのが正しい文書なので、いまの実物と突き合わせない。
 */
const 走査した説明書 = いまを述べる説明書(REPO);

/** 履歴として外した説明書。 0 でないものを 0 と書かないための数 */
const 履歴として外した = 説明書のfile(REPO).length - 走査した説明書.length;

/**
 * その file で人に読ませる文の行か。
 *
 * source は注釈だけ、説明書は全ての行。 判定そのもの (`主語と数が並ぶ`) は共通で、
 * ここで分けるのは「どの行を文とみなすか」 だけ。
 */
function 述べる行(path: string, line: string): boolean {
  return path.endsWith(".md") ? true : 注記の行(line);
}

interface 当たり {
  場所: string;
  行: string;
}

function 走る(files: string[]): {
  主語のある行: number;
  当たり: 当たり[];
  登録簿: 当たり[];
} {
  const 当たり: 当たり[] = [];
  const 登録簿: 当たり[] = [];
  let 主語のある行 = 0;
  for (const p of files) {
    readFileSync(p, "utf8")
      .split("\n")
      .forEach((line, i) => {
        if (!述べる行(p, line)) return;
        const 場所 = `${relative(REPO, p)}:${i + 1}`;
        if (登録簿の大きさ.test(line)) 登録簿.push({ 場所, 行: line.trim() });
        if (!主語.some((s) => line.includes(s))) return;
        主語のある行 += 1;
        if (主語と数が並ぶ(line)) 当たり.push({ 場所, 行: line.trim() });
      });
  }
  return { 主語のある行, 当たり, 登録簿 };
}

const source側 = 走る(走査したfile);
const 説明書側 = 走る(走査した説明書);

describe("走査すれば出る件数を注記に書いていない (#2080)", () => {
  it("走査対象を集められている", () => {
    // 集められていなければ、以下の検査は通って当然になる
    expect(走査したfile.length, "走査する file を 1 件も集められていない").toBeGreaterThan(100);
  });

  it("説明書を集められている (#2260)", () => {
    // 0 件が「該当なし」 か「集められていない」 かを分けるための母数
    expect(走査した説明書.length, "説明書を 1 枚も集められていない").toBeGreaterThan(20);
  });

  it("主語を書いた注記を 1 件以上見つけられている (空振り防止)", () => {
    expect(source側.主語のある行, "主語を書いた注記を 1 件も見ていない").toBeGreaterThan(0);
  });

  it("説明書で主語を書いた行を 1 件以上見つけられている (空振り防止)", () => {
    expect(説明書側.主語のある行, "説明書で主語を書いた行を 1 件も見ていない").toBeGreaterThan(0);
  });

  it("主語と件数が同じ行に並んだ注記が無い", () => {
    const 一覧 = source側.当たり.map((h) => `${h.場所} ${h.行}`);
    expect(一覧, "一覧の件数を注記に手で書いている (件数は一覧そのものが持つ)").toEqual([]);
  });

  it("主語と件数が同じ行に並んだ説明書の行が無い (#2260)", () => {
    const 一覧 = 説明書側.当たり.map((h) => `${h.場所} ${h.行}`);
    expect(一覧, "一覧の件数を説明書に手で書いている (件数は一覧そのものが持つ)").toEqual([]);
  });

  it("登録簿の大きさを数で名乗る行が無い (#2264)", () => {
    const 一覧 = [...source側.登録簿, ...説明書側.登録簿].map((h) => `${h.場所} ${h.行}`);
    expect(一覧, "登録簿の大きさを手で書いている (大きさは登録簿そのものが持つ)").toEqual([]);
  });

  it("履歴として外した枚数を数えている (#2264)", () => {
    // 0 でないものを 0 と書かないための数。 印を書いた文書が消えたら気付ける
    expect(履歴として外した, "履歴として残したと宣言した説明書が 1 枚も無い").toBeGreaterThan(0);
  });

  it("主語と件数が並んだ行を拾える (植え込み対照)", () => {
    // 拾えない判定だと、上の検査は書いてあっても通る
    expect(主語と数が並ぶ(" * 既存 NodeKind (28 個) に加えて parts identifier を accept する"), "").toBe(
      true,
    );
    expect(主語と数が並ぶ(" * 見本の一覧に出る名前 432 件。 ITEM_NAME_JA が持つ"), "").toBe(true);
    // 説明書の書き方 (行頭が `-` の箇条書き)。 注釈の印を持たないので、
    // 行の見方を分けていないと拾えない
    const 説明書の行 = "- 既存 kind list = 28 個、 `NODE_KIND_VALID` set で管理";
    expect(述べる行("docs/spec.md", 説明書の行) && 主語と数が並ぶ(説明書の行), "").toBe(true);
  });

  it("登録簿の大きさを名乗る形を拾える (植え込み対照)", () => {
    // **この file 自身が走査の母数に入る**ので、通しの綴りは繋いで作る
    // (literal で書くと自分が当たる、 #2092 / #2244 / #2246 / #2258 で 4 回踏んだ形)
    for (const 語 of 全体を指す語) {
      expect(登録簿の大きさ.test([語, " 20 parts のどれとも異なる"].join("")), `拾えていない: ${語}`).toBe(
        true,
      );
    }
  });

  it("その数を持つものを指す言い回しは拾わない (陰性対照)", () => {
    // 全体を指す語を持たない形。 登録簿の大きさを言っていない
    expect(登録簿の大きさ.test("- `widgets-multi` = 3 parts 並置 (arc + bar + counter)"), "").toBe(false);
    expect(登録簿の大きさ.test("- **1 parts = 1 concept** — parts は minimal、 混在禁止"), "").toBe(false);
  });

  it("主語の無い行と、数の無い行は拾わない (陰性対照)", () => {
    // 何でも拾う判定だと、過去の実測を根拠に書いた注記まで落ちる
    expect(主語と数が並ぶ(" * 以前の実測では 412 件中 9 件しか収まっていなかった"), "").toBe(false);
    expect(主語と数が並ぶ(" * 種類の一覧は NODE_KIND_VALID が持つ"), "").toBe(false);
    // source では注釈でない行を見ない。 説明書の書き方をそのまま `.ts` に置いても拾わない
    expect(述べる行("src/foo.ts", "- 既存 NodeKind = 28 個"), "").toBe(false);
  });
});
