/**
 * 状態と値の名前が規則を外れた時、4 経路のどれでも同じ理由が返ることの検査 (#2401)。
 *
 * 名前の判定そのものは `value-syntax.ts` の 1 か所にある。 判定は共有できていたが、
 * **伝え方が共有できていなかった** = 記法の `states` だけが「行が読めません」 と形の案内を
 * 返し、書いた本文は案内どおりの形なので **従っても直らない** 状態だった。
 * 1 行にまとめた形 (`states: { すすみ: 0 }`) に至っては知らせを 1 件も出していなかった。
 *
 * ここで測るのは案内の中身で、名前の規則そのものは変えていない。
 *
 * ## 走査の組み方
 *
 * 欄 2 つ (`states` / `values`) × 入口 2 つ (記法 / JSON) の 4 経路に、記法の `states` だけが
 * 持つ 2 つ目の書き方 (1 行にまとめる) を足して 5 通り。
 * 記法の `values` が 1 行の形を持たないのは、式に `,` が入るため受けていないから。
 *
 * 空振りを防ぐため、同じ走査で **規則に合う名前が 5 通りとも読める** ことを併せて見る。
 * 基準の側が読めないと、案内が揃っていることが常に成立して通る。
 *
 * **案内は message と hint を繋いで見る**。 直し方は hint に入るため、message だけを見ると
 * 「語は揃っているが直し方が伝わらない」 形を見落とす。
 */
import { describe, it, expect } from "vitest";
import { parseTextDslV05 } from "../src/v05/parser";
import { validateDragonJson } from "../src/index";

/** 記法の最小形。 `states` / `values` の節だけを差し替えて使う */
const 記法の本文 = (節: string): string =>
  `title: "t"\ntype: flow\n\nactors:\n  - A\n  - B\n\nflow:\n  - A -> B: "x"\n\n${節}\n`;

/** 記法の誤り。 直し方まで見るため hint を繋ぐ */
const 記法の誤り = (節: string): string[] => {
  const r = parseTextDslV05(記法の本文(節));
  return r.ok ? [] : r.errors.map((e) => `${e.message} ${e.hint ?? ""}`);
};

/** JSON の最小形 */
const jsonの本文 = (extra: Record<string, unknown>) => ({
  title: "t",
  type: "flow",
  actors: [{ name: "A" }, { name: "B" }],
  flow: [{ from: "A", to: "B", label: "x" }],
  ...extra,
});

/** JSON の誤り。 記法と同じく hint を繋ぐ */
const jsonの誤り = (extra: Record<string, unknown>): string[] => {
  const r = validateDragonJson(jsonの本文(extra));
  return r.ok ? [] : r.errors.map((e) => `${e.message} ${e.hint ?? ""}`);
};

/** 名前が規則を外れた時に返ってほしい語 (`value-syntax.ts` の `valueNameIssue`) */
const 名前の案内 = "invalid value name";

/** 規則を外れた名前。 日本語と、数字で始まる形の 2 通りを見る */
const 規則外の名前 = ["すすみ", "1x"] as const;

/** 規則に合う名前。 走査が空振りしていないことの基準 */
const 規則に合う名前 = ["progress", "_ok"] as const;

/** 名前を受け取り、その名前で書いた本文の誤りを返す 5 通り */
const 経路: readonly (readonly [string, (名: string) => string[]])[] = [
  ["記法 states 縦", (名) => 記法の誤り(`states:\n  ${名}: 0`)],
  ["記法 states 1 行", (名) => 記法の誤り(`states: { ${名}: 0 }`)],
  ["記法 values 縦", (名) => 記法の誤り(`values:\n  ${名}: "1 + 1"`)],
  ["JSON states", (名) => jsonの誤り({ states: { [名]: 0 } })],
  ["JSON values", (名) => jsonの誤り({ values: { [名]: "1 + 1" } })],
];

describe("名前が規則を外れた理由が入口で食い違わない (#2401)", () => {
  it("規則を外れた名前は、どの経路でも同じ理由が返る", () => {
    const 黙った: string[] = [];
    const 別の理由: string[] = [];
    for (const [名札, 測る] of 経路) {
      for (const 名 of 規則外の名前) {
        const e = 測る(名);
        if (e.length === 0) 黙った.push(`${名札} / ${名}`);
        else if (!e.join("\n").includes(名前の案内))
          別の理由.push(`${名札} / ${名} = ${e.join(" ")}`);
      }
    }
    expect(黙った, "知らせが 1 件も出なかった経路").toEqual([]);
    expect(別の理由, "名前の案内とは別の理由が返った経路").toEqual([]);
  });

  it("案内に直し方が入る", () => {
    // 語が揃っていても直し方が伝わらない形を見落とさないため、hint まで見る
    const 直し方の無い経路: string[] = [];
    for (const [名札, 測る] of 経路) {
      if (!測る("すすみ").join("\n").includes("英数字と _ だけを使う")) 直し方の無い経路.push(名札);
    }
    expect(直し方の無い経路, "案内に直し方が無い経路").toEqual([]);
  });

  it("規則に合う名前は、どの経路でも読める (走査が空振りしていない)", () => {
    const 読めなかった: string[] = [];
    for (const [名札, 測る] of 経路) {
      for (const 名 of 規則に合う名前) {
        const e = 測る(名);
        if (e.length > 0) 読めなかった.push(`${名札} / ${名} = ${e.join(" ")}`);
      }
    }
    expect(読めなかった, "正しい名前で誤りが出た経路").toEqual([]);
  });
});

describe("コロンを書き落とした形は、これまでどおり形の案内が返る (#2401)", () => {
  // 名前の案内へ寄せた結果、形の誤りまで名前の話になると別の「従っても直らない」 が生まれる

  it("`states` でコロンを落とすと、形の案内が返る", () => {
    const e = 記法の誤り("states:\n  progress 0").join("\n");
    expect(e).toContain("状態の行が読めません");
    expect(e).toContain("name: initial");
    expect(e).not.toContain(名前の案内);
  });

  it("`values` でコロンを落とすと、形の案内が返る", () => {
    const e = 記法の誤り('values:\n  waiting "1 + 1"').join("\n");
    expect(e).toContain("値の行が読めません");
    expect(e).not.toContain(名前の案内);
  });

  it("形の案内と名前の案内は別の 1 種類になる", () => {
    const 形 = 記法の誤り("states:\n  progress 0").join("\n");
    const 名前 = 記法の誤り("states:\n  すすみ: 0").join("\n");
    expect(形).not.toBe(名前);
  });
});
