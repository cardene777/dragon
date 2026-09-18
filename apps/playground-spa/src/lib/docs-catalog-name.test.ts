// @vitest-environment node
/**
 * 説明書がカタログの頁を現行の呼び名で指していることの検証 (#1799)。
 *
 * 分類の呼び名を `テキストDSL` から `テキスト記法` にした (#1787 / #1788) 時、
 * 見本の名前 (#1790) と図の題 (#1792) は揃えたが、説明書だけが古いまま残っていた。
 * 画面を開くとその頁の題は「テキスト記法」 で、説明書の指す先と名前が合わない。
 *
 * **呼び名は分類の一覧から導く**。 古い呼び名を手で並べると、次に呼び名を変えた時に
 * また並べ直すことになる (#1788 で直したのと同じ形)。
 */
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { CATEGORIES } from "./catalog";
import { 説明書のfile } from "../../../../test-support/scan-targets";

/** この file から見た repo の根 (`apps/playground-spa/src/lib/` の 4 つ上) */
const 根 = fileURLToPath(new URL("../../../../", import.meta.url));

/**
 * 説明書がカタログの頁を指す形。
 *
 * **この形に絞っている** = 説明書の地の文で分類名がどう出るかは書き手ごとに違い、
 * 全ての言い方を拾おうとすると分類名と同じ字を含む普通の文まで巻き込む。
 * 「カタログの ◯◯ の頁」 は頁を名指しする定型なので、名前がずれたら必ず読み手が迷う。
 */
const 頁の指し方 = /カタログの\s*([^。、\n]{1,20}?)\s*の頁/g;

/**
 * 説明書として走査する md。
 *
 * **どの md を見るかは `test-support/scan-targets.ts` が 1 か所で持つ** (#2240)。
 * `docs/` だけを見ていた間、配る package の説明書が外に残っていた (#2236)。
 * その時は隣の検査 (`docs-derived-values.test.ts`) と同じ 1 行を両方に書いており、
 * 集合を 2 か所に持つ形そのものが直っていなかった。
 */
function 説明書のfile一覧(): string[] {
  return 説明書のfile(根);
}

/** 本文から、カタログの頁を指している名前を取り出す。 本番と植え込み対照が同じ関数を使う */
export function 指している呼び名(src: string): string[] {
  return [...src.matchAll(頁の指し方)].map((m) => m[1]!);
}

describe("説明書が指すカタログの頁の呼び名 (#1799)", () => {
  it("指している呼び名が全て分類の一覧にある", () => {
    const 呼び名 = new Set(CATEGORIES.map((c) => c.label));
    expect(呼び名.size, "分類を 1 件も引けていない (検査が空振りしている)").toBeGreaterThan(10);
    const files = 説明書のfile一覧();
    expect(files.length, "説明書を 1 つも見ていない (検査が空振りしている)").toBeGreaterThan(10);
    let 拾えた = 0;
    const 合わない: string[] = [];
    for (const f of files) {
      for (const 名 of 指している呼び名(readFileSync(f, "utf8"))) {
        拾えた += 1;
        if (!呼び名.has(名)) 合わない.push(`${f.slice(根.length)}: カタログの ${名} の頁`);
      }
    }
    console.log(`[頁の指し方] md=${files.length} 指している所=${拾えた} 合わない=${合わない.length}`);
    expect(拾えた, "頁を指している所を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    expect(合わない, `分類の一覧に無い呼び名で頁を指している:\n${合わない.join("\n")}`).toEqual([]);
  });

  it("一覧に無い呼び名を拾える (植え込み対照)", () => {
    // 探し方が何にも当たらない形に壊れていると、上は必ず通る
    const 呼び名 = new Set(CATEGORIES.map((c) => c.label));
    const 元 = "図を、カタログの テキスト記法 の頁に載せてある。";
    expect(指している呼び名(元).filter((n) => !呼び名.has(n))).toEqual([]);
    const 植え = "図を、カタログの Text DSL の頁に載せてある。";
    expect(指している呼び名(植え).filter((n) => !呼び名.has(n))).toEqual(["Text DSL"]);
  });

  it("分類の呼び名が出どころになっている", () => {
    // 呼び名を手で並べていたら、この突き合わせは分類を変えても落ちない。
    // 説明書が実際に指している名前が、分類の一覧に載っていることまで見る
    const 指している = new Set(
      説明書のfile一覧().flatMap((f) => 指している呼び名(readFileSync(f, "utf8"))),
    );
    expect(指している.size, "頁を指している所を 1 つも読めていない (検査が空振りしている)").toBeGreaterThan(0);
    for (const 名 of 指している) {
      expect(CATEGORIES.some((c) => c.label === 名), `${名} が分類の一覧に無い`).toBe(true);
    }
  });
});
