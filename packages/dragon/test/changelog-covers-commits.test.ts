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
 * tag があればそれを使う。 **無い時は版を最後に変えた commit へ落とす** = この repo は
 * tag を 1 つも持たない状態で 55 commit 積んだ実績があり、tag が無いと検査ごと止まる形に
 * すると同じことが起きる。
 */
function 前の版(): string {
  const tag = git("tag", "--list", "v*", "--sort=-v:refname").split("\n")[0]?.trim();
  if (tag) return tag;
  const 上げた = git("log", "--format=%H", `-S"version": "${版}"`, "--", "packages/dragon/package.json")
    .split("\n")
    .filter((l) => l !== "")
    .pop();
  if (!上げた) throw new Error(`版 ${版} へ上げた commit が見つからない`);
  return 上げた;
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
  "1274": "一致検査の作り方を変えた。 出力は変わらない",
};

describe("版に入る commit が変更履歴から辿れる (#1277)", () => {
  const 範囲 = `${前の版()}..HEAD`;
  const commit = git("log", "--format=%s", 範囲)
    .split("\n")
    .filter((l) => l !== "");

  it("commit を 1 件以上集められている", () => {
    // 集められていなければ、以下の検査は通って当然になる
    expect(commit.length, `${範囲} の commit が 1 件も無い (検査が空振りしている)`).toBeGreaterThan(0);
  });

  it("全ての commit が変更履歴か宣言のどちらかから辿れる", () => {
    const 載っている = new Set([...版の節().matchAll(/#(\d+)/g)].map((m) => m[1]!));
    const 辿れない = commit.filter((s) => {
      const 番号 = [...s.matchAll(/#(\d+)/g)].map((m) => m[1]!);
      return !番号.some((n) => 載っている.has(n) || n in 利用者から見えない);
    });
    expect(辿れない, "変更履歴にも宣言にも無い commit がある").toEqual([]);
  });

  it("宣言が実物の範囲に残っている", () => {
    // 宣言が古くなったまま残らないようにする。 同じ番号が別の変更で再び現れた時に
    // 黙って除外されるのを防ぐ
    const 範囲の番号 = new Set(commit.flatMap((s) => [...s.matchAll(/#(\d+)/g)].map((m) => m[1]!)));
    expect(範囲の番号.size, "commit から番号を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    const 範囲に無い = Object.keys(利用者から見えない).filter((n) => !範囲の番号.has(n));
    expect(範囲に無い, "宣言に、この版の範囲に無い番号がある").toEqual([]);
  });

  it("宣言に理由が書かれている", () => {
    const 理由なし = Object.entries(利用者から見えない).filter(([, v]) => v.trim() === "");
    expect(理由なし, "宣言に理由の無い項目がある").toEqual([]);
  });
});
