/**
 * 段に書いた値の書き換えと変化が、読めない時に知らせを出すことの検査 (#2403)。
 *
 * 段には値を動かす書き方が 2 つある。 `tween` は 2 つの数の間を動かし、`set` はその場で
 * 置き換える。 **直す前は `set` だけが何も言わずに捨てていた**。
 *
 * `tween` は知らせていたが、名前の規則を外れただけの行にも形の案内を返していた =
 * 書いた本文は案内どおりの形なので、従って書き直しても同じ案内が返り続ける (#2401 と同じ形)。
 *
 * ## 走査の組み方
 *
 * 読み手 2 つ (`set` / `tween`) × 書き方 2 つ (1 行にまとめる / 縦に並べる) ×
 * 断り方 2 つ (名前が規則外 / 区切りが無い) の 8 通りで、黙る組み合わせを数える。
 *
 * 空振りを防ぐため、同じ読み手と書き方で **正しく書いた 4 通り** が誤り 0 件で段に
 * 1 件として入ることを併せて見る。 入る側が壊れていると、黙る組み合わせが 0 件であることが
 * 「全部弾いている」 状態でも成立する。
 */
import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05/parser";

/** 段を 1 つだけ持つ最小形。 段の中身だけを差し替えて使う */
const 本文 = (段の中身: string): string =>
  `title: "t"\ntype: flow\n\nactors:\n  - A\n  - B\n\nflow:\n  - A -> B: "x"\n\nanimation:\n  - step: "s1" 1s\n${段の中身}\n`;

/** 誤りの一覧。 直し方まで見るため hint を繋ぐ */
const 誤り = (段の中身: string): string[] => {
  const r = parseTextDslV05(本文(段の中身));
  return r.ok ? [] : r.errors.map((e) => `${e.message} ${e.hint ?? ""}`);
};

/** 段に入った件数。 読めた時に載ることの確認に使う */
const 段に入った数 = (段の中身: string): { 書き換え: number; 変化: number } => {
  const r = parseTextDslV05(本文(段の中身));
  if (!r.ok) return { 書き換え: -1, 変化: -1 };
  const ph = r.doc.animate?.phases[0];
  return { 書き換え: ph?.sets?.length ?? -1, 変化: ph?.tweens?.length ?? -1 };
};

/** 名前が規則を外れた時に返ってほしい語 (`value-syntax.ts` の `valueNameIssue`) */
const 名前の案内 = "invalid value name";

/** 読み手 2 つ × 書き方 2 つ × 断り方 2 つ */
const 走査: readonly (readonly [string, string, "名前" | "区切り"])[] = [
  ["set 1 行 名前が規則外", '    set: すすみ "done"', "名前"],
  ["set 1 行 区切りが無い", "    set: status", "区切り"],
  ["set 縦 名前が規則外", '    set:\n      すすみ: "done"', "名前"],
  ["set 縦 区切りが無い", "    set:\n      status", "区切り"],
  ["tween 1 行 名前が規則外", "    tween: すすみ 0 -> 1", "名前"],
  ["tween 1 行 区切りが無い", "    tween: bal", "区切り"],
  ["tween 縦 名前が規則外", "    tween:\n      すすみ: 0 -> 1", "名前"],
  ["tween 縦 区切りが無い", "    tween:\n      bal", "区切り"],
];

describe("段に書いた値の書き換えと変化が黙って消えない (#2403)", () => {
  it("8 通りのどれでも知らせが 1 件以上出る", () => {
    const 黙った = 走査.filter(([, 中身]) => 誤り(中身).length === 0).map(([名]) => 名);
    expect(黙った, "知らせが 1 件も出なかった書き方").toEqual([]);
  });

  it("名前が規則を外れた時は、宣言と同じ理由が返る", () => {
    const 別の理由 = 走査
      .filter(([, , 断り]) => 断り === "名前")
      .filter(([, 中身]) => !誤り(中身).join("\n").includes(名前の案内))
      .map(([名]) => 名);
    expect(別の理由, "名前の案内とは別の理由が返った書き方").toEqual([]);
  });

  it("区切りが無い時は、形の案内が返る", () => {
    // 名前の案内へ寄せた結果、形の誤りまで名前の話になると別の「従っても直らない」 が生まれる
    const 名前の話になった = 走査
      .filter(([, , 断り]) => 断り === "区切り")
      .filter(([, 中身]) => 誤り(中身).join("\n").includes(名前の案内))
      .map(([名]) => 名);
    expect(名前の話になった, "形の誤りに名前の案内が返った書き方").toEqual([]);
  });

  it("形の案内には 1 行と縦の両方の書き方が載る", () => {
    // 文を読み手 1 か所に置いたため、呼出側の書き方を案内が知らない。 両方載せて補う
    expect(誤り("    set: status").join("\n")).toContain('set: name "done"');
    expect(誤り("    set: status").join("\n")).toContain('name: "done"');
    expect(誤り("    tween: bal").join("\n")).toContain("tween: name 100 -> 90");
    expect(誤り("    tween: bal").join("\n")).toContain("name: 100 -> 90");
  });

  it("知らせに書いた行の中身が入る", () => {
    expect(誤り('    set: すすみ "done"').join("\n")).toContain("すすみ");
    expect(誤り("    tween: すすみ 0 -> 1").join("\n")).toContain("すすみ");
  });

  it("正しく書いた 4 通りは誤り 0 件で段に入る (走査が空振りしていない)", () => {
    const 正しい: readonly (readonly [string, string, "書き換え" | "変化"])[] = [
      ["set 1 行", '    set: status "done"', "書き換え"],
      ["set 縦", '    set:\n      status: "done"', "書き換え"],
      ["tween 1 行", "    tween: bal 0 -> 1", "変化"],
      ["tween 縦", "    tween:\n      bal: 0 -> 1", "変化"],
    ];
    const 読めなかった: string[] = [];
    for (const [名, 中身, 欄] of 正しい) {
      const e = 誤り(中身);
      if (e.length > 0) 読めなかった.push(`${名} = ${e.join(" ")}`);
      else if (段に入った数(中身)[欄] !== 1) 読めなかった.push(`${名} = 段に入らなかった`);
    }
    expect(読めなかった, "正しく書いたのに読めなかった書き方").toEqual([]);
  });
});

describe("段の中でコロンを書き落とした行が黙って消えない (#2403)", () => {
  // すぐ下の分岐が「知らない項目名」 を知らせているのに、項目名として読めなかった行だけが
  // 入口で飛ばされていた

  it("英字でも日本語でも知らせが 1 件出る", () => {
    const 黙った = ["    focus", "    強調"].filter((中身) => 誤り(中身).length === 0);
    expect(黙った, "知らせが 1 件も出なかった行").toEqual([]);
  });

  it("知らせに行の中身と使える項目が入る", () => {
    const e = 誤り("    focus").join("\n");
    expect(e).toContain('"focus"');
    expect(e).toContain("項目名: 値");
    expect(e).toContain("badge");
  });

  it("コメント行と空行は知らせにしない", () => {
    // 集める側が飛ばしている。 飛ばさないとコメントが誤りとして報告される
    expect(誤り('    # めも\n\n    focus: ["A"]')).toEqual([]);
    expect(誤り('    # めも: あ\n    focus: ["A"]')).toEqual([]);
  });
});
