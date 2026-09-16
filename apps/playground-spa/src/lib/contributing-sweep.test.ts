/**
 * 残作業の数え方が `CONTRIBUTING.md` に書かれていることの検証 (#1056 / #2056)。
 *
 * 2026-08-06 の棚卸しで、数えられなかった source (Linear の tool が未認証で出ていなかった) を
 * 「非該当」 と読み、11 件を見落としかけた。 手順が消えると同じ読み替えが起きるため、機械で残す。
 *
 * 数える先は、2026-08-25 に Linear をやめてから GitHub だけになった (#2056)。 同じ誤り方は
 * GitHub 側にも残る = `gh` が失敗した時も標準出力は空で、0 件と見分けられるのは終了コードだけ
 * (実測 = 0 件は 0、未認証は 4、token が無効は 1)。
 *
 * **検査は手順の「今の形」 を固定しない。** 上限を上げた時や表を箇条書きに直した時に、
 * 正しい修正が検査に落とされると、手順を直す側が検査を消しにかかる。
 * 数え漏れが起きる形 (Issue か PR の片方しか見ない / 打ち切りに気付けない /
 * 失敗を 0 件と読む / 原因を 1 つに決めつける) だけを落とす。
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

/** 節のうち経緯を書いた部分の見出し。 */
const 経緯の見出し = "### なぜこの手順があるか";

/**
 * 節のうち **手順の部分** だけ (経緯を書いた散文を除く)。
 *
 * 経緯には過去の失敗を書くため、手順で使う語がそのまま出てくる。 節全体で見ると
 * 手順から語が消えても経緯側で通ってしまう
 * (実測 = 手順の「未登録ではなく未認証」 を消しても、経緯の「実際は未認証だっただけで」 で通った)。
 */
function sweepProcedure(): string {
  const section = sweepSection();
  const end = section.indexOf(経緯の見出し);
  expect(end, "経緯の節が見つからない").toBeGreaterThan(-1);
  return section.slice(0, end);
}

/** 節のうち経緯を書いた部分。 */
function sweepHistory(): string {
  const section = sweepSection();
  const start = section.indexOf(経緯の見出し);
  expect(start, "経緯の節が見つからない").toBeGreaterThan(-1);
  return section.slice(start);
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

/** 数えられなかった時の分岐の本文。 */
function failureBranch(): string {
  const procedure = sweepProcedure();
  const start = procedure.indexOf("### 数えられなかった時");
  expect(start, "数えられなかった時の分岐が無い").toBeGreaterThan(-1);
  return procedure.slice(start);
}

/**
 * markdown の並び (表の行 / 箇条書き) を項目として数える。
 *
 * 表の区切り行 (`|---|---|`) と、その直前の見出し行は数えない。 見出しを数えると、
 * 理由を 1 件減らしても見出しの 1 行で埋まって通ってしまう。
 * 箇条書きの区切り (`-` / `*` / `+`) は後ろに空白を要求する = `**強調**` の先頭 `*` を
 * 項目と誤認しないため (実測 = 誤認したまま「理由を 1 件に減らす」 変異が素通りしていた)。
 */
function listedItems(src: string): string[] {
  const lines = src.split("\n").map((line) => line.trim());
  const 区切り = (line: string | undefined): boolean =>
    line !== undefined && /^\|[\s:|-]*\|?$/.test(line) && line.includes("-");
  return lines.filter(
    (line, i) =>
      /^(\|\s*\S|[-*+]\s+\S)/.test(line) && !区切り(line) && !区切り(lines[i + 1]),
  );
}

describe("残作業の数え方 (#1056 / #2056)", () => {
  it("手順の節がある", () => {
    expect(contributing(), "節ごと消えている").toContain("## 残作業の数え方");
  });

  it("Issue と PR の両方を実測する手順が書かれている", () => {
    // 片方だけ書かれていると、書かれていない側を見落とす。
    // 取り込まれていない PR は、Issue を閉じていても終わっていない作業
    const lines = commandLines();
    expect(
      lines.filter((l) => /^gh\s+issue\s+list(\s|$)/.test(l)).length,
      "GitHub の Issue を数えていない",
    ).toBeGreaterThan(0);
    expect(
      lines.filter((l) => /^gh\s+pr\s+list(\s|$)/.test(l)).length,
      "GitHub の PR を数えていない",
    ).toBeGreaterThan(0);
  });

  it("GitHub を数える行が既定の打ち切りを外している", () => {
    // `--limit` を省くと 30 件で黙って打ち切られ、31 件目以降が最初から無かったことになる
    const lines = ghListLines();
    expect(lines.length, "GitHub を数える行が無い (検査が空振りしている)").toBeGreaterThan(0);
    const missing = lines.filter((line) => !line.includes("--limit"));
    expect(missing, `--limit の無い行がある: ${missing.join(" / ")}`).toEqual([]);
  });

  it("数えられなかった時の分岐が終了コードで 0 件と失敗を分けている", () => {
    // 0 件の時も失敗した時も標準出力は空になる。 出力だけを見ると失敗が 0 件に化ける
    expect(failureBranch(), "終了コードで見分ける手順が無い").toContain("終了コード");
  });

  it("数えられなかった時の分岐が原因を 1 つに決めつけていない", () => {
    // 2026-08-06 の誤判断は「tool が出ない理由」 を 1 つに決めつけたことから始まった。
    // 表でも箇条書きでもよい。 **書き方は問わず、並んでいる理由の数だけを見る** =
    // 表を箇条書きに直すのは中身の変わらない修正で、それを落とす検査は書き換えの邪魔になる
    const causes = listedItems(failureBranch());
    expect(
      causes.length,
      `並んでいる理由が ${causes.length} 件 (原因を決めつけている): ${causes.join(" / ")}`,
    ).toBeGreaterThanOrEqual(3);
  });

  it("数えられない時に 0 件と書かせない", () => {
    // 「数えていない」 と「0 件」 を混ぜると、見ていない source が残作業ゼロになる
    const branch = failureBranch();
    expect(branch, "数えていない source の扱いが書かれていない").toMatch(/数えていない/);
    // **2 つを同じ文の中で求める**。 分岐には「出力が空でも 0 件とは限らない」 のように
    // 「0 件」 が他にも出るため、分岐全体で探すと「0 件として書かない」 の文を消しても通る
    // (実測 = その 1 文を消して 7 件とも通った)
    const 文 = branch.split(/。|\n\n/);
    expect(
      文.filter((s) => s.includes("数えていない") && s.includes("0 件")).length,
      "数えていないものを 0 件と書かせない指示が無い",
    ).toBeGreaterThan(0);
  });

  it("なぜこの手順があるかが書かれている", () => {
    // 理由が無いと次に消される。 Linear をやめた経緯が消えると、数える先を戻す時に
    // 2026-08-06 と同じ「数えられない source を非該当と読む」 誤りを繰り返す
    const history = sweepHistory();
    expect(history, "経緯の追跡先が無い").toMatch(/#1055|#1056/);
    expect(history, "数える先を GitHub だけにした経緯の追跡先が無い").toContain("#2056");
  });
});
