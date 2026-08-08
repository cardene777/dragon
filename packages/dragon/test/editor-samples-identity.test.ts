import { describe, it, expect } from "vitest";
import { EDITOR_SAMPLES } from "../../../apps/playground-spa/src/data/editor-samples";

/**
 * 見本の名前と識別子の整合の検証 (#1092)。
 *
 * 一覧で選んだ名前と、 開いた図の題が違っていた (12 件中 5 件)。 選んだものと開いたものの名前が
 * 一致しないので、 別の図を開いたのか確かめる手立てが無い。
 *
 * 識別子も 2 件が重複しており (`sequence`)、 2 件目には URL が無く、 同じ `data-testid` が画面に
 * 2 つ出ていた。
 */

/** 一覧の名前から `(種類)` の部分を落とす。 図の題と比べるのはこの部分。 */
const 名前 = (label: string): string => label.replace(/\s*\(.+\)$/, "");

/** 見本の本文から題を取り出す。 取れなければ空。 */
const 題 = (code: string): string => /title:\s*"(.+?)"/.exec(code)?.[1] ?? "";

describe("見本の名前と題が一致する (#1092)", () => {
  it("全件で一致する", () => {
    const 食い違い = EDITOR_SAMPLES.filter((s) => 名前(s.label) !== 題(s.code)).map(
      (s) => `${名前(s.label)} ≠ ${題(s.code)}`,
    );
    expect(食い違い, `名前と題が違う: ${食い違い.join(" / ")}`).toEqual([]);
  });

  it("題を取り出せない見本が無い (検査が空振りしていない)", () => {
    // 題が取れないと `"" === ""` で一致してしまう。 空でないことを別に見る
    const 空 = EDITOR_SAMPLES.filter((s) => 題(s.code) === "").map((s) => s.label);
    expect(空, `題を取り出せない: ${空.join(", ")}`).toEqual([]);
  });
});

describe("見本の識別子が一意 (#1092)", () => {
  it("重複が無い", () => {
    const slugs = EDITOR_SAMPLES.map((s) => s.slug);
    const 重複 = [...new Set(slugs.filter((x, i) => slugs.indexOf(x) !== i))];
    expect(重複, `識別子が重複している: ${重複.join(", ")}`).toEqual([]);
  });

  it("URL に載せられる形になっている", () => {
    // 記号や空白が入ると `#preset=` の照合が `decodeURIComponent` を挟んで揺れる。
    // 1 文字以上を要求するので、 空の識別子もここで落ちる
    const 不正 = EDITOR_SAMPLES.filter((s) => !/^[a-z0-9-]+$/.test(s.slug)).map((s) => s.slug || "(空)");
    expect(不正, `識別子に使えない文字がある: ${不正.join(", ")}`).toEqual([]);
  });

  it("カタログからの経路が残っている", () => {
    // `lib/presets.ts` の一覧は `#preset=sequence` で繋がる。 2 件目に固有の識別子を与えた
    // 時に 1 件目まで変えると、 カタログからの遷移が切れる
    expect(EDITOR_SAMPLES.some((s) => s.slug === "sequence"), "sequence が消えている").toBe(true);
  });
});
