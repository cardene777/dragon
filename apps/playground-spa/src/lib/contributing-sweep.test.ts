/**
 * 残作業の数え方が `CONTRIBUTING.md` に書かれていることの検証 (#1056)。
 *
 * この repo の issue は Linear と GitHub の 2 箇所にある。 片方だけ見ると残作業が見えない。
 *
 * 2026-08-06 の棚卸しで、GitHub が 0 件になった時点で Linear の tool が出ておらず、
 * `.mcp.json` を見ないまま「非該当」 と判断した。 実際は未認証だっただけで、認証したら
 * 11 件残っていた。 手順が消えると同じ読み替えが起きるため、機械で残す。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

/** repo 直下の `CONTRIBUTING.md`。 */
function contributing(): string {
  return readFileSync(new URL("../../../../CONTRIBUTING.md", import.meta.url), "utf8");
}

/** 「残作業の数え方」 節の本文。 */
function sweepSection(): string {
  const src = contributing();
  const start = src.indexOf("## 残作業の数え方");
  const end = src.indexOf("## Tests");
  expect(start, "節が見つからない").toBeGreaterThan(-1);
  expect(end, "節の終わりが見つからない").toBeGreaterThan(start);
  return src.slice(start, end);
}

/**
 * 節の中の **実行する手順** だけ (```` ``` ```` で囲んだ部分)。
 *
 * 節全体で見ると、経緯を書いた散文に語が出るだけで通ってしまう
 * (実測 = 手順から `In Progress` を消しても、経緯の「Backlog 7 件 / In Progress 4 件」 で通った)。
 */
function sweepCommands(): string {
  return [...sweepSection().matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1]).join("\n");
}

/**
 * 節のうち **手順の部分** だけ (経緯を書いた散文を除く)。
 *
 * 経緯には今回の失敗を書くため、手順で使う語がそのまま出てくる。 節全体で見ると
 * 手順から語が消えても経緯側で通ってしまう
 * (実測 = 手順の「未登録ではなく未認証」 を消しても、経緯の「実際は未認証だっただけで」 で通った)。
 */
function sweepProcedure(): string {
  const section = sweepSection();
  const end = section.indexOf("### なぜこの手順があるか");
  expect(end, "経緯の節が見つからない").toBeGreaterThan(-1);
  return section.slice(0, end);
}

describe("残作業の数え方 (#1056)", () => {
  it("手順の節がある", () => {
    expect(contributing(), "節ごと消えている").toContain("## 残作業の数え方");
  });

  it("Linear を数える手順が 2 つの状態を別々に持つ", () => {
    // 1 行にまとめると、片方の状態だけ数えて 0 と判断できてしまう
    const lines = sweepCommands().split("\n").filter((l) => l.includes("mcp__linear__list_issues"));
    expect(lines.length, `Linear を数える行が ${lines.length} 行 (2 行必要)`).toBe(2);
  });

  it("2 箇所を実測する手順が両方書かれている", () => {
    // 片方だけ書かれていると、書かれていない側を見落とす。
    // **手順の中だけを見る** = 散文に語が出るだけでは通さない
    const cmds = sweepCommands();
    expect(cmds.length, "実行する手順が 1 つも無い").toBeGreaterThan(0);
    expect(cmds, "GitHub の Issue を数えていない").toMatch(/gh issue list/);
    expect(cmds, "GitHub の PR を数えていない").toMatch(/gh pr list/);
    expect(cmds, "Linear を数えていない").toMatch(/mcp__linear__list_issues/);
    for (const state of ["Backlog", "In Progress"]) {
      expect(cmds, `Linear の ${state} を数えていない`).toContain(state);
    }
  });

  it("tool が出ていない時の分岐が書かれている", () => {
    // ここが今回の誤判断そのもの。 書かれていないと同じ読み替えが起きる。
    // **手順の中だけを見る** = 経緯の散文に語が出るだけでは通さない
    const procedure = sweepProcedure();
    expect(procedure, "未登録と未認証の区別が無い").toContain("未認証");
    expect(procedure, "`.mcp.json` を見る手順が無い").toContain(".mcp.json");
    expect(procedure, "認証の呼び方が無い").toContain("mcp__linear__authenticate");
  });

  it("なぜこの手順があるかが書かれている", () => {
    // 理由が無いと次に消される
    const section = sweepSection();
    expect(section, "経緯の節が無い").toContain("なぜこの手順があるか");
    expect(section, "経緯の追跡先が無い").toMatch(/#1055|#1056/);
  });
});
