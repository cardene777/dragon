/**
 * 残作業の数え方が `CONTRIBUTING.md` に書かれていることの検証 (#1056)。
 *
 * この repo の issue は Linear と GitHub の 2 箇所にある。 片方だけ見ると残作業が見えない。
 *
 * 2026-08-06 の棚卸しで、GitHub が 0 件になった時点で Linear の tool が出ておらず、
 * `.mcp.json` を見ないまま「非該当」 と判断した。 実際は未認証だっただけで、認証したら
 * 11 件残っていた。 手順が消えると同じ読み替えが起きるため、機械で残す。
 *
 * **検査は手順の「今の形」 を固定しない。** 状態が増えた時や上限を上げた時に、
 * 正しい修正が検査に落とされると、手順を直す側が検査を消しにかかる。
 * 数え漏れが起きる形 (片方の source しか見ない / 打ち切りに気付けない /
 * project 未設定を取りこぼす / 原因を 1 つに決めつける) だけを落とす。
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

/**
 * **実行する command の行だけ**。
 *
 * 手順の部分にある ```` ``` ```` の中を行に割る。 散文に語が出るだけでは通さない。
 */
function commandLines(): string[] {
  const fences = [...sweepProcedure().matchAll(/```[a-z]*\n([\s\S]*?)```/g)].map((m) => m[1]);
  expect(fences.length, "実行する手順が 1 つも無い").toBeGreaterThan(0);
  return fences
    .join("\n")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** `gh issue list` / `gh pr list` の行 (`gh issue list-broken` のような別 cmd は含めない)。 */
function ghListLines(): string[] {
  return commandLines().filter((line) => /^gh\s+(issue|pr)\s+list(\s|$)/.test(line));
}

/** Linear の issue を数える行。 */
function linearListLines(): string[] {
  return commandLines().filter((line) => line.includes("mcp__linear__list_issues"));
}

/** tool が出ていない時の分岐の本文。 */
function authBranch(): string {
  const procedure = sweepProcedure();
  const start = procedure.indexOf("### Linear の tool が見当たらない時");
  expect(start, "tool が出ていない時の分岐が無い").toBeGreaterThan(-1);
  return procedure.slice(start);
}

describe("残作業の数え方 (#1056)", () => {
  it("手順の節がある", () => {
    expect(contributing(), "節ごと消えている").toContain("## 残作業の数え方");
  });

  it("2 箇所を実測する手順が両方書かれている", () => {
    // 片方だけ書かれていると、書かれていない側を見落とす
    const lines = commandLines();
    expect(
      lines.filter((l) => /^gh\s+issue\s+list(\s|$)/.test(l)).length,
      "GitHub の Issue を数えていない",
    ).toBeGreaterThan(0);
    expect(
      lines.filter((l) => /^gh\s+pr\s+list(\s|$)/.test(l)).length,
      "GitHub の PR を数えていない",
    ).toBeGreaterThan(0);
    expect(linearListLines().length, "Linear を数えていない").toBeGreaterThan(0);
  });

  it("GitHub を数える行が既定の打ち切りを外している", () => {
    // `--limit` を省くと 30 件で黙って打ち切られ、31 件目以降が最初から無かったことになる
    const missing = ghListLines().filter((line) => !line.includes("--limit"));
    expect(missing, `--limit の無い行がある: ${missing.join(" / ")}`).toEqual([]);
  });

  it("Linear を project 無しでも数える手順がある", () => {
    // 起票直後の issue は project 未設定のことがあり、project で絞ると数から消える
    // (実測 = この手順自身の issue CAR-2948 が Triage + project 未設定で漏れた)。
    //
    // **project で絞る行があること自体は求めない**。 team 全体を 1 query で数えるのは
    // 取りこぼしが減る側の修正で、それを落とす検査は手順を直す側の邪魔にしかならない
    expect(
      linearListLines().filter((l) => !l.includes("project=")).length,
      "project を付けずに数える行が無い (project 未設定の issue が漏れる)",
    ).toBeGreaterThan(0);
  });

  it("Linear の数え方が完了扱いの除外で書かれている", () => {
    // 「見た状態」 を並べる書き方だと、見ていない状態が最初から無いことになる。
    // 状態は後から増えるので、完了扱いを除いた残り全部として数える
    const procedure = sweepProcedure();
    for (const done of ["Done", "Canceled", "Duplicate"]) {
      expect(procedure, `完了扱いの ${done} が挙がっていない`).toContain(done);
    }
  });

  it("tool が出ていない時の分岐が原因を 1 つに決めつけていない", () => {
    // ここが今回の誤判断そのもの。 `.mcp.json` の登録は server 登録しか示さず、
    // 未認証以外の理由でも tool は出ない
    const branch = authBranch();
    expect(branch, "`.mcp.json` を見る手順が無い").toContain(".mcp.json");
    expect(branch, "未認証の経路が無い").toContain("未認証");
    const rows = branch.split("\n").filter((line) => line.trim().startsWith("|"));
    // 見出し + 区切り + 理由 3 つ以上
    expect(rows.length, `理由の表が ${rows.length} 行 (原因を 1 つに決めつけている)`).toBeGreaterThan(4);
  });

  it("認証の呼び方が client ごとに書かれている", () => {
    // command は client 依存で、片方しか書かないと他方の利用者が実行できない
    const branch = authBranch();
    expect(branch, "Claude Code の認証 command が無い").toContain("claude mcp login linear");
    expect(branch, "Codex CLI の認証 command が無い").toContain("codex mcp login linear");
  });

  it("数えられない時に 0 件と書かせない", () => {
    // Linear は private で、外部の contributor は招待されていない。
    // 「数えていない」 と「0 件」 を混ぜると、見ていない source が残作業ゼロになる
    const branch = authBranch();
    expect(branch, "数えていない source の扱いが書かれていない").toMatch(/数えていない/);
    expect(branch, "0 件と書かせない指示が無い").toMatch(/0 件/);
  });

  it("なぜこの手順があるかが書かれている", () => {
    // 理由が無いと次に消される
    const section = sweepSection();
    expect(section, "経緯の節が無い").toContain("なぜこの手順があるか");
    expect(section, "経緯の追跡先が無い").toMatch(/#1055|#1056/);
  });
});
