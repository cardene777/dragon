/**
 * 変更履歴の見出しの形 (#2028)。
 *
 * ## 何が起きたか
 *
 * 版を切る時、`## [Unreleased]` の中身をそのまま下へ送る。 溜めている間に書き足すたびに
 * 同じ見出しの塊が増えるので、切った瞬間に散らばったまま固定される。 実測で `0.28.0` の下は
 * `### Added` が 7 回、`### Changed` が 7 回、`### Fixed` が 6 回で、172 件が 21 の塊に
 * 散っていた。 読む人は「この版で何が足されたのか」 を 7 箇所から足し合わせることになる。
 *
 * ## 何を固定するか
 *
 * 1 つの版の下に同じ見出しが 2 回以上現れないこと、 見出しが決めた並びの順に出ること。
 *
 * 「0 件」 を期待する検査なので、**植え込み対照** を置く = 違反する形を作り、本番と同じ探し方が
 * 1 件見つけることを見る。 これが無いと、探し方を何にも当たらない形に壊しても通り続ける。
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { SECTION_ORDER, sectionAudit } from "./support/changelog-sections";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const 本文 = readFileSync(join(ROOT, "CHANGELOG.md"), "utf8");

/** 版 1 つ分の本文を組み立てる。 植え込み対照はこれで作る。 */
function 版(見出し: readonly string[]): string {
  return [`## [9.9.9] - 2026-01-01`, ...見出し.flatMap((h) => [``, `### ${h}`, ``, `- 何か`])].join(
    "\n",
  );
}

describe("この repo の変更履歴 (#2028)", () => {
  it("同じ見出しが 1 つの版に 2 回以上出ない", () => {
    const { versions, problems } = sectionAudit(本文);

    expect(versions.length, "版を 1 つも見つけられていない (検査が空振りしている)").toBeGreaterThan(
      0,
    );
    expect(
      problems.filter((p) => p.kind === "重複"),
      `重複した見出しがある (版 ${versions.length} 件を走査)`,
    ).toEqual([]);
  });

  it("見出しが決めた並びの順に出る", () => {
    const { versions, problems } = sectionAudit(本文);

    expect(versions.length).toBeGreaterThan(0);
    expect(
      problems.filter((p) => p.kind === "並び"),
      `見出しの並びが決めた順と違う (版 ${versions.length} 件を走査)`,
    ).toEqual([]);
  });

  it("並びの一覧に無い見出しを黙って飛ばしていない", () => {
    // 飛ばすと、知らない名前がいくつ増えても 0 件のまま通る。
    const { 見た, 見なかった } = sectionAudit(本文);

    expect(見なかった, "並びの一覧に無い見出しがある").toEqual([]);
    expect(見た, "見出しを 1 つも判定できていない (検査が空振りしている)").toBeGreaterThan(0);
  });
});

describe("植え込み対照 — 違反する形を見つけられる (#2028)", () => {
  it("同じ見出しを 2 回置いた版を 1 件挙げる", () => {
    const { problems } = sectionAudit(版(["Added", "Fixed", "Added"]));
    const 重複 = problems.filter((p) => p.kind === "重複");

    expect(重複).toHaveLength(1);
    expect(重複[0]?.version).toBe("[9.9.9]");
    expect(重複[0]?.説明).toContain("Added");
  });

  it("並びを逆にした版を 1 件挙げる", () => {
    const { problems } = sectionAudit(版(["Fixed", "Added"]));
    const 並び = problems.filter((p) => p.kind === "並び");

    expect(並び).toHaveLength(1);
    expect(並び[0]?.説明).toContain("Added");
  });

  it("正しい形は 1 件も挙げない", () => {
    // 陰性対照。 正しい形でも件数が出るなら、その件数は違反を測っていない。
    expect(sectionAudit(版(["Added", "Changed", "Removed", "Fixed"])).problems).toEqual([]);
  });

  it("対処後の形も走査の対象に残る", () => {
    // 収容対照。 重複を寄せた版が母集団から消えると、直した版を 1 件も見ていないことになる。
    const { versions, 見た } = sectionAudit(版(["Added", "Fixed"]));

    expect(versions).toHaveLength(1);
    expect(見た).toBe(2);
  });
});

describe("見出しの読み取り (#2028)", () => {
  it("囲みの中の見出しらしい行は数えない", () => {
    // 変更履歴は差分や記法の例を囲みで載せる。 囲みの中の `###` を見出しと読むと、
    // 書いた例のせいで落ちる。
    //
    // **囲みは行頭から開く形で書く**。 字下げした囲みだと、中の `  ### Added` は
    // 行頭一致に当たらないので囲みの判定まで届かない = 囲みを読み飛ばす処理を消しても
    // 落ちない (実測した。 いまの変更履歴は 62 個の囲みが全て字下げされている)。
    const 本文 = [
      "## [9.9.9] - 2026-01-01",
      "",
      "### Added",
      "",
      "- 何か",
      "",
      "```md",
      "### Added",
      "```",
    ].join("\n");

    expect(sectionAudit(本文).problems).toEqual([]);
    expect(sectionAudit(本文).見た).toBe(1);
  });

  it("字下げした囲みの中も数えない", () => {
    // こちらは行頭一致が先に外す。 いまの変更履歴に実際に出る形。
    const 本文 = [
      "## [9.9.9] - 2026-01-01",
      "",
      "### Added",
      "",
      "  ```md",
      "  ### Added",
      "  ```",
    ].join("\n");

    expect(sectionAudit(本文).problems).toEqual([]);
    expect(sectionAudit(本文).見た).toBe(1);
  });

  it("版の外にある見出しはどの版にも入らない", () => {
    const 本文 = ["### Added", "", "## [9.9.9] - 2026-01-01", "", "### Added"].join("\n");
    const { versions, problems } = sectionAudit(本文);

    expect(versions).toHaveLength(1);
    expect(problems).toEqual([]);
  });

  it("並びの一覧は同じ名前を 2 度持たない", () => {
    // 2 度持つと、その名前の並びの判定が最初の 1 つで決まって後ろが死ぬ。
    expect(new Set(SECTION_ORDER).size).toBe(SECTION_ORDER.length);
  });
});
