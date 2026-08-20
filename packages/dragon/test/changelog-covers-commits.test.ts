/**
 * 版に入る commit が変更履歴から辿れること (#1277)。
 *
 * `0.8.0` を切る時点で **55 commit のうち 43 件が変更履歴に載っていなかった**。
 * 既存の `changelog-covers-notation.test.ts` (#1206) は「記法に書ける項目」 と
 * 「cdl の依存の版」 が載っているかだけを見るため、commit の記載漏れは素通りする。
 *
 * ## 何を見るか
 *
 * 前の版から HEAD までの各 commit について、その commit が持つ番号 (`(#N)`) のどれかが
 * **変更履歴に載っている** か **「利用者から見えない」 と宣言されている** ことを見る。
 *
 * commit が持つ番号は Issue と PR の両方で、どちらで書いても辿れる = 変更履歴は Issue で
 * 書くことが多いのに、PR 番号だけを求めると書き方を縛ることになる。
 *
 * ## 宣言は両方向で見る
 *
 * 宣言に「実際には範囲に無い番号」 が残ると、消えた commit の宣言が残り続ける。
 * 同じ番号が別の変更で再び現れた時に黙って除外されるので、そちらも落とす。
 */
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { describe, it, expect } from "vitest";

const ここ = dirname(fileURLToPath(import.meta.url));
const REPO = join(ここ, "..", "..", "..");
const CHANGELOG = readFileSync(join(REPO, "CHANGELOG.md"), "utf8");
const 版 = (JSON.parse(readFileSync(join(ここ, "..", "package.json"), "utf8")) as { version: string })
  .version;

const git = (...args: string[]): string =>
  execFileSync("git", ["-C", REPO, ...args], { encoding: "utf8" }).trim();

/**
 * 前の版の位置。
 *
 * **いま切ろうとしている版の tag は使わない** (Round 1 の指摘)。 使うと `v0.8.0` を
 * 打った直後に `v0.8.0..HEAD` が空になり、検査が何も見なくなる。
 *
 * 1 つ前の版の tag があればそれを使う。 **無い時は版を最後に変えた commit へ落とす** =
 * この repo は tag を 1 つも持たない状態で 55 commit 積んだ実績があり、tag が無いと
 * 検査ごと止まる形にすると同じことが起きる。
 */
/** 版を最後に変えた commit。 tag が無い時の起点に使う */
function 版を上げたcommit(): string | undefined {
  return git("log", "--format=%H", `-S"version": "${版}"`, "--", "packages/dragon/package.json")
    .split("\n")
    .filter((l) => l !== "")
    .pop();
}

/**
 * いま切ろうとしている版に属する tag か。
 *
 * `v0.8.0` だけでなく `v0.8.0-rc1` のような前触れの tag も含む (Round 2 の指摘)。
 * 含めないと、前触れを前の版とみなして範囲がその後ろだけに縮む。
 */
function 今の版のtag(tag: string): boolean {
  return tag === `v${版}` || tag.startsWith(`v${版}-`);
}

function 前の版(): string {
  const 前 = git("tag", "--list", "v*", "--sort=-v:refname")
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l !== "" && !今の版のtag(l))[0];
  if (前) return 前;
  const 上げた = 版を上げたcommit();
  if (!上げた) throw new Error(`版 ${版} へ上げた commit が見つからない`);
  // **その commit 自身も範囲に含める** = 版を上げたcommit は次の版の一部で、
  // `..` は始点を含まないため 1 件取りこぼす
  return `${上げた}^`;
}

/**
 * 履歴が切り詰められていないか (Round 1 の指摘)。
 *
 * `--depth 1` の clone では版を変えた commit を辿れず、範囲が空になって検査が通ってしまう。
 * **通してはいけない** ので、その場で止めて理由を出す。
 */
function 履歴が揃っている(): void {
  const shallow = git("rev-parse", "--is-shallow-repository");
  if (shallow === "true") {
    throw new Error(
      "履歴が切り詰められている (shallow clone)。 版の範囲を導けないため検査できない。 " +
        "`git fetch --unshallow` で完全な履歴を取ってから実行する",
    );
  }
}

/** 変更履歴のうち、いま切ろうとしている版の節 */
function 版の節(): string {
  const 始 = CHANGELOG.indexOf(`## [${版}]`);
  if (始 < 0) throw new Error(`変更履歴に [${版}] の節が無い`);
  const 次 = CHANGELOG.indexOf("\n## [", 始 + 1);
  return CHANGELOG.slice(始, 次 < 0 ? undefined : 次);
}

/**
 * 利用者から見えない commit。 変更履歴に書かない代わりにここへ理由付きで宣言する。
 *
 * **書かない判断も残す**。 宣言が無いと「書き忘れ」 と「書かないと決めた」 が区別できない。
 *
 * ## 番号は commit の本文まで見て探す (#1279)
 *
 * squash merge した commit の **件名** は「PR の題 + PR 番号」 に置き換わるため、
 * 件名だけを見ると branch 上の `(#1277)` が取り込み後に `(#1278)` になり、宣言がずれる
 * (実際に踏んだ)。
 *
 * **本文には元の commit の件名がそのまま残る** (実測 = 取り込んだ `#1278` の本文に
 * `(#1277)` が 4 回現れる)。 本文まで見れば、取り込みの前と後で同じ番号で辿れる。
 *
 * したがって宣言は **branch 上の commit が持つ番号** で書けばよく、取り込み後もそのまま
 * 効く。 未来の番号を通す抜け道は要らない。
 */
const 利用者から見えない: Record<string, string> = {
  "1208": "spec の例を分けただけ。 記法も出力も変わらない",
  "1210": "変更履歴そのものの更新",
  "1211": "spec の注記を実際の原因に合わせただけ",
  "1212": "検査が判定に到達していなかったのを直した。 出力は変わらない",
  "1214": "検査の判定材料から badge を外した。 出力は変わらない",
  "1235": "spec の記述が実装と食い違っていたのを直しただけ",
  "1245": "一致検査に比べる軸を足した。 出力は変わらない",
  "1270": "組み立て 3 経路の死んだ受け渡しを外した。 出力は 98 形で 1 文字も変わらない",
  // **branch 上の番号で書く** = 本文まで見るので取り込み後もそのまま効く。
  // 実際 `#1277` は取り込んだ commit の件名には無く、本文にだけ残っている
  "1277": "版を切る commit そのもの。 変更履歴の更新が中身",
  "1279": "記載漏れの検査を取り込み前後で通るようにした commit。 記法も出力も変わらない",
};

/**
 * `git log --format=%B%x00` の出力を commit ごとに割る (#1279)。
 *
 * **区切りは NUL** (Round 2 の指摘)。 記録区切り (U+001E) は commit の本文に書けてしまう
 * ため、その文字を含む 1 件が複数に割れて番号の対応が壊れる。 NUL は commit message に
 * 含められないので、どんな本文でも 1 件が 1 件のまま残る。
 */
function 本文で割る(raw: string): string[] {
  return raw
    .split("\u0000")
    .map((c) => c.trim())
    .filter((c) => c !== "");
}

/**
 * その commit を名乗る番号 (#1279)。
 *
 * **説明の本文からは拾わない** (Round 2 の指摘)。 本文には review の指摘や関連 Issue の
 * 番号も書くため、丸ごと拾うと「変更履歴に載っている別の番号がたまたま本文にある」 だけで
 * 辿れた扱いになる。
 *
 * 見るのは 2 種類の行だけ。
 *
 * | 行 | 何か |
 * |---|---|
 * | 1 行目 | その commit の件名 |
 * | `* type(scope): ... (#N)` の形の行 | squash merge が並べた、元の commit の件名 |
 *
 * squash した commit は件名が「PR の題 + PR 番号」 に置き換わるが、元の件名は `* ` 付きで
 * 本文の先頭に並ぶ。 この 2 種類を見れば、取り込みの前と後で同じ番号で辿れる。
 */
function commitの番号(message: string): string[] {
  const 行 = message.split("\n");
  // **単なる箇条書きは元件名にしない**。 GitHub が並べる行頭 `* ` に加え、この repo の
  // commit 件名 (`type(scope): ... (#N)`、先頭の絵文字は任意) の形まで固定する。
  // `trimStart` すると、説明中で字下げした Markdown の箇条書きまで名乗る行になってしまう。
  const squashの元件名 = /^\* (?:\S+ )?[a-z]+(?:\([^)]+\))?!?: .+ \(#\d+\)$/;
  const 名乗る行 = [行[0] ?? "", ...行.slice(1).filter((l) => squashの元件名.test(l))];
  return 名乗る行.flatMap((l) => [...l.matchAll(/#(\d+)/g)].map((m) => m[1]!));
}

describe("版に入る commit が変更履歴から辿れる (#1277)", () => {
  履歴が揃っている();
  const 範囲 = `${前の版()}..HEAD`;
  // **本文まで読む** (#1279)。 件名だけだと squash で番号が変わる。
  //
  // 区切りは **NUL** にする (Round 2 の指摘)。 記録区切り (U+001E) は commit の本文に
  // 書けてしまうため、その文字を含む 1 件が複数に割れて番号の対応が壊れる。
  // NUL は commit message に含められない
  const commit = 本文で割る(git("log", "--format=%B%x00", 範囲));

  it("commit を 1 件以上集められている", () => {
    // 集められていなければ、以下の検査は通って当然になる
    expect(commit.length, `${範囲} の commit が 1 件も無い (検査が空振りしている)`).toBeGreaterThan(0);
  });

  it("全ての commit が変更履歴か宣言のどちらかから辿れる", () => {
    const 載っている = new Set([...版の節().matchAll(/#(\d+)/g)].map((m) => m[1]!));
    const 辿れない = commit.filter((s) => {
      const 番号 = commitの番号(s);
      return !番号.some((n) => 載っている.has(n) || n in 利用者から見えない);
    });
    expect(
      辿れない.map((c) => c.split("\n")[0]),
      "変更履歴にも宣言にも無い commit がある",
    ).toEqual([]);
  });

  it("宣言が実物の範囲に残っている", () => {
    // 宣言が古くなったまま残らないようにする。 同じ番号が別の変更で再び現れた時に
    // 黙って除外されるのを防ぐ
    const 範囲の番号 = new Set(commit.flatMap((s) => commitの番号(s)));
    expect(範囲の番号.size, "commit から番号を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    // **抜け道は持たない** (#1279)。 本文まで見るので、branch 上の番号がそのまま
    // 取り込み後も残る = 宣言は常に範囲の中にあるはず
    const 範囲に無い = Object.keys(利用者から見えない).filter((n) => !範囲の番号.has(n));
    expect(範囲に無い, "宣言に、この版の範囲に無い番号がある").toEqual([]);
  });

  it("版を上げた commit が範囲に入っている", () => {
    // **範囲を狭める向きの誤りは、上の検査では捕まらない** (Round 1 の指摘)。
    // 覆う対象が減るだけなので「全て辿れる」 は通ってしまう。 下端を直接固定する。
    //
    // **tag を使っている時も見る** (Round 2 の指摘)。 前の版の tag から測っても、版を
    // 上げた commit はその後ろにあるので範囲に入るはず。 入らないなら起点が誤っている
    const 上げた = 版を上げたcommit();
    expect(上げた, "版を上げた commit が見つからない (検査が空振りしている)").toBeDefined();
    if (!上げた) return;
    const 範囲のsha = new Set(git("log", "--format=%H", 範囲).split("\n").filter((l) => l !== ""));
    expect(範囲のsha.size, "範囲の commit を 1 件も読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(範囲のsha.has(上げた), "版を上げた commit が範囲から漏れている").toBe(true);
  });

  describe("commit の割り方 (#1279)", () => {
    // **記録区切りでは割れない形を固定する**。 実履歴に U+001E を含む commit は無いので、
    // 割り方だけを切り出して確かめる
    it("NUL で 1 件ずつに割る", () => {
      const raw = "題 A\n\n本文 A\u0000題 B\n\n本文 B\u0000";
      expect(本文で割る(raw)).toEqual(["題 A\n\n本文 A", "題 B\n\n本文 B"]);
    });

    it("本文に記録区切り (U+001E) があっても 1 件のまま", () => {
      const raw = "題 A\n\n本文に \u001e が入る\u0000題 B\u0000";
      const 割った = 本文で割る(raw);
      expect(割った.length, "本文の U+001E で割れてしまっている").toBe(2);
      expect(割った[0]).toContain("\u001e");
    });

    it("末尾の空きは数えない", () => {
      expect(本文で割る("題 A\u0000")).toEqual(["題 A"]);
      expect(本文で割る("")).toEqual([]);
    });
  });

  describe("番号を拾う行 (#1279)", () => {
    // **説明の本文からは拾わない**。 本文には review の指摘や関連 Issue の番号も書くため、
    // 丸ごと拾うと「別の番号がたまたま本文にある」 だけで辿れた扱いになる
    it("件名から拾う", () => {
      expect(commitの番号("✨ feat(dsl): 何かする (#1234)")).toEqual(["1234"]);
    });

    it("squash が並べた元の件名から拾う", () => {
      const m = [
        "🔖 chore(release): 版を切る (#1278)",
        "",
        "* 🔖 chore(release): 版を切る (#1277)",
        "",
        "* test(catalog): 絵文字なしの元件名 (#1267)",
      ].join("\n");
      expect(commitの番号(m)).toEqual(["1278", "1277", "1267"]);
    });

    it("説明の本文にある番号は拾わない", () => {
      const m = [
        "🐛 fix(dsl): 何かを直す (#1234)",
        "",
        "既存の検査 (#9999) は別の観点を見る。 関連は #8888。",
      ].join("\n");
      expect(commitの番号(m), "説明の本文から拾ってしまっている").toEqual(["1234"]);
    });

    it("説明本文の箇条書きにある番号は拾わない", () => {
      const m = [
        "🐛 fix(dsl): 何かを直す (#1234)",
        "",
        "* 関連 Issue は別の変更で扱う (#9999)",
        "  * fix(test): 字下げした補足 (#8888)",
      ].join("\n");
      expect(commitの番号(m), "説明の箇条書きから拾ってしまっている").toEqual(["1234"]);
    });

    it("番号を持たない commit は空", () => {
      expect(commitの番号("題だけの commit")).toEqual([]);
    });
  });

  it("宣言に理由が書かれている", () => {
    const 理由なし = Object.entries(利用者から見えない).filter(([, v]) => v.trim() === "");
    expect(理由なし, "宣言に理由の無い項目がある").toEqual([]);
  });
});
