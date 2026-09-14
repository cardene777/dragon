/**
 * 記法の検査の道具 (`dragon-lint.mjs`) と実証用の台本 (`lint-proof-fixture.mjs`) が端末に出す字に、
 * 開いていない英単語とカタカナ語が残っていないことの検証 (#1946)。
 *
 * 指摘の文は #1940 で開いたが、道具の見出しと案内の文 (`diagram total:` / `auto-fixable:` / `Usage:` など) は
 * 英語のまま残っていた。 指摘の文と同じ約束 (識別子と書き手の値だけを `` ` `` で囲む) で判定する。
 *
 * 道具は `pnpm lint:notation` から素の `node` で起動されるので、同じ起動の仕方で出力を集める。
 * 出力の経路を 1 つでも踏まないとその経路の字は判定されないので、経路ごとの行が出ていることも確かめる。
 */
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { 文に残る語 } from "./screen-words";

const 道具の置き場 = fileURLToPath(
  new URL("../../../../packages/dragon/scripts/", import.meta.url),
);
const 検査の道具 = join(道具の置き場, "dragon-lint.mjs");
const 実証の台本 = join(道具の置き場, "lint-proof-fixture.mjs");

/** 自動修正できる指摘 (図の説明) とできない指摘 (値の無い図表) の両方を出す図 */
const 指摘の出る図 = `export const 指摘の出る図 = {
  id: "lint-cli-words",
  topic: "flow preset (詳細)",
  lanes: [{ id: "l", x: 0, width: 400 }],
  nodes: [{ id: "c0", lane: "l", stack: 0, kind: "chart-line", title: "値", chartData: [] }],
  edges: [],
  states: [],
  phases: [{ id: "p", duration: 1000, title: "段", body: "", activate: [], tweens: [], sets: [] }],
};
`;

/**
 * 集めた出力が踏むべき経路と、その経路でしか出ない字。
 *
 * **他の経路の行に含まれない字を選ぶ**。 検査の道具のまとめの見出し `== まとめ ==` は台本の
 * `=== まとめ ===` の中にも現れ、道具のまとめが出なくても踏んだことになる。 まとめは件数の行で見る。
 *
 * 台本の 2 つの失敗の経路 (規則を読めない / 指摘を出さない規則がある) は、正しい台本では踏めないので
 * ここに置かない。 その 2 行の字は #1944 で日本語に書いた。
 */
const 経路: Record<string, string> = {
  使い方: "使い方: ",
  書き出しが無い: "の書き出し (`export`) が無い",
  図の見出し: "` (図 1 件) ==",
  図ごとの指摘の数: "の指摘 2 件",
  指摘の行: "⚠ 注意 `chart-empty-datum` (対象 `c0`)",
  自動修正の書き出し: "`--fix`: 図 1 件に自動修正を当てた結果を",
  まとめ: "  検査した図: 1 件",
  走らせ直しの案内: "→ 自動修正を当てるには `--fix` を付けて走らせ直す",
  台本の見出し: "=== わざと問題を入れた図に記法の検査 (`lintDiagram`) を当てる ===",
  台本の自動修正: "直した後: `",
  台本のまとめ: "のすべてが指摘を出した",
};

function 起動する(台本: string, 引数: string[]): string {
  const 結果 = spawnSync("node", [台本, ...引数], { encoding: "utf8" });
  return `${結果.stdout}${結果.stderr}`;
}

function 残る語の行(出力たち: readonly string[], 種類: "英" | "カナ"): string[] {
  return 出力たち
    .flatMap((出力) => 出力.split("\n"))
    .flatMap((行) => 文に残る語(行)[種類].map((語) => `${語}: ${行.trim()}`));
}

describe("記法の検査の道具が端末に出す字 (#1946)", () => {
  let 置き場: string;
  let 出力たち: string[];

  beforeAll(() => {
    置き場 = mkdtempSync(join(tmpdir(), "lint-cli-words-"));
    writeFileSync(join(置き場, "package.json"), `{ "type": "module" }\n`);
    writeFileSync(join(置き場, "has-issues.cdl.ts"), 指摘の出る図);
    writeFileSync(join(置き場, "no-diagram.cdl.ts"), `export const 数 = 1;\n`);
    出力たち = [
      起動する(検査の道具, []),
      起動する(検査の道具, [join(置き場, "no-diagram.cdl.ts")]),
      起動する(検査の道具, [join(置き場, "has-issues.cdl.ts")]),
      起動する(検査の道具, [join(置き場, "has-issues.cdl.ts"), "--fix"]),
      起動する(実証の台本, []),
    ];
  });

  afterAll(() => {
    rmSync(置き場, { recursive: true, force: true });
  });

  it("集めた出力が、道具の出力の経路をすべて踏んでいる", () => {
    const 全部 = 出力たち.join("\n");
    const 踏まない = Object.entries(経路)
      .filter(([, 字]) => !全部.includes(字))
      .map(([名前]) => 名前);
    expect(踏まない, "出力の経路を踏んでいない (検査が空振りしている)").toEqual([]);
  });

  it("`` ` `` の外に、残す語の一覧の外の英単語が無い", () => {
    expect(残る語の行(出力たち, "英")).toEqual([]);
  });

  it("`` ` `` の外に、残す語の一覧の外のカタカナ語が無い", () => {
    expect(残る語の行(出力たち, "カナ")).toEqual([]);
  });

  it("植え込み対照: 直す前の見出しと案内の文は、どの行も英単語として見つける", () => {
    const 直す前 = [
      "Usage: dragon-lint <cdl-file.ts> [--fix]",
      "  [dragon-lint] has-issues.cdl.ts に CdlDiagram export なし",
      "== has-issues.cdl.ts (1 diagram) ==",
      "  [指摘の出る図] lint-cli-words — 2 issue",
      "    ⚠ chart-empty-datum @ c0",
      "    ⚠ topic-redundant-implementation-detail @ lint-cli-words (auto-fix 可)",
      "== summary ==",
      "  diagram total: 1",
      "  issue total: 2",
      "  auto-fixable: 1",
      "  → 自動修正するには --fix flag を付けて再実行",
      "issues detected: 10",
      'before: "chart preset (SVG polyline + tone 別 slice)"',
    ];
    const 見つからない = 直す前.filter((行) => 文に残る語(行).英.length === 0);
    expect(見つからない).toEqual([]);
  });
});
