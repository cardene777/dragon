import { describe, expect, it } from "vitest";

import { ITEM_NAME_JA } from "@/lib/i18n";
import * as 部品 from "@/topics/catalog/parts.cdl";
import * as 見本 from "@/topics/catalog/parts-motion.cdl";
import { 繋いだ見本を持たない部品 } from "@/topics/catalog/chain-demo-policy";

/**
 * 繋いだ動きの見本を持たない部品が、理由付きで宣言されていること (#2212)。
 *
 * 繋ぎ方の部品の一部は繋いだ見本を持たない。 枚数は書かない = 部品を足すたびに動く
 * (どちらの一覧も下で実物から導く)。 見本を持たない部品が「まだ作っていない」 のか
 * 「作れないと測った」 のかは、宣言が無いと区別できない。
 *
 * ## 実物から導いて突き合わせる
 *
 * 件数を書かず、**繋ぎ方の部品の一覧** と **繋いだ見本に出る部品の一覧** を実物から導き、
 * その差が宣言のキーと一致することを見る (`rules/quality.md § 導出可能記述は人手で書かない`
 * の経路 1)。 部品を足した時に「見本も作るか、理由を書くか」 を必ず選ばされる。
 *
 * ## 繋ぎ方の部品は画面の名前の頭で導く
 *
 * 繋ぎ方の部品は画面の名前が全て「繋ぐ: 」 で始まる (実測で 26 枚)。
 * 節の区切りの注釈から導く形は、注釈の書き方を変えると壊れるので採らない。
 */

/** 図の書き出しか (id と nodes を持つ object) */
function 図か(値: unknown): 値 is { id: string } {
  if (typeof 値 !== "object" || 値 === null) return false;
  const 図 = 値 as { id?: unknown; nodes?: unknown };
  return typeof 図.id === "string" && Array.isArray(図.nodes);
}

/** 繋ぎ方の部品の id (画面の名前が「繋ぐ: 」 で始まるもの) */
const 繋ぎ方の部品 = new Set(
  Object.entries(部品)
    .filter(([名]) => ITEM_NAME_JA[名]?.startsWith("繋ぐ: ") === true)
    .filter(([, 値]) => 図か(値))
    .map(([, 値]) => (値 as { id: string }).id),
);

/** 繋いだ見本 (`sourceYaml__pattern__partsMotion__*`) に出る部品の id */
const 見本に出る部品 = new Set(
  Object.entries(見本)
    .filter(([名, 値]) => 名.startsWith("sourceYaml__") && typeof 値 === "string")
    .flatMap(([, yaml]) => [...(yaml as string).matchAll(/kind:\s*([a-z0-9-]+)/g)])
    .map((m) => `parts-${m[1]!}`)
    .filter((id) => 繋ぎ方の部品.has(id)),
);

const 持たない部品 = [...繋ぎ方の部品].filter((id) => !見本に出る部品.has(id)).sort();

describe("繋いだ動きを持たない部品が理由付きで宣言されている (#2212)", () => {
  it("空振り防止 — 両方の一覧が 1 件以上ある", () => {
    // どちらかが 0 件なら、下の一致は通って当然になる
    expect(繋ぎ方の部品.size, "繋ぎ方の部品を 1 枚も数えられていない").toBeGreaterThan(0);
    expect(見本に出る部品.size, "繋いだ見本に出る部品を 1 枚も数えられていない").toBeGreaterThan(0);
  });

  it("宣言が実物の差と一致する", () => {
    expect(
      持たない部品,
      `繋ぎ方の部品 ${繋ぎ方の部品.size} 枚を走査した。 ` +
        `繋いだ見本を持たない部品は、理由を書いて chain-demo-policy.ts に載せる ` +
        `(見本を足したならその行を消す)`,
    ).toEqual(Object.keys(繋いだ見本を持たない部品).sort());
  });

  it("理由が空でない", () => {
    const 空の理由 = Object.entries(繋いだ見本を持たない部品)
      .filter(([, 理由]) => 理由.trim() === "")
      .map(([名]) => 名);
    expect(空の理由, "理由の無い行がある (なぜ繋げないかを書く)").toEqual([]);
  });

  it("植え込み対照 — 宣言から 1 行消すと差が出る", () => {
    // 突き合わせが効いていることを、宣言を 1 行減らした表に同じ判定を当てて確かめる
    const [消した, ...残り] = Object.keys(繋いだ見本を持たない部品).sort();
    const 足りない = 持たない部品.filter((id) => !残り.includes(id));
    expect(足りない).toEqual([消した]);
  });
});
