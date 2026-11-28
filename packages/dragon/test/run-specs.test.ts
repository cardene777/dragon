/**
 * 準備の段が読む「この回に回す検査の file の一覧」(`test-support/run-specs.ts`、#3946) の検査。
 *
 * 配る前のテストは package の検査を `--shard=1/3`、`--shard=2/3`、`--shard=3/3` の 3 回の vitest に分けて回す (#4079)。
 * 準備の段は、分けたそれぞれの回で、その回に回す file だけを読む。
 * 一覧を作る vitest を起こすのは重いので、file を読み込む段で済ませる (#3738)。
 * 準備の段の 4 つが一覧をこの部品から読むかは `test-policy.test.ts` の `setups-read-run-specs` が見る。ここで準備の段の path を書くと、関係する検査を選ぶ命令が見本帳の build までたどり、描く所を変えた時にこの file まで選ぶ
 */
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { createVitest } from "vitest/node";
import { runSpecs } from "../../../test-support/run-specs";
import { atLoad } from "./at-load";

const ROOT = join(import.meta.dirname, "../../..");
/** 一覧の材料にする検査の file。上限の検査の見本 (`*.fixture.ts`) は 9 つあり、3 つに分けてもどの回にも file が残る */
const FIXTURES = "test-support/fixtures/limits/*.fixture.ts";

/** 設定の file を読まずに vitest を起こし、`shard` を付けた時と付けない時に準備の段が読む一覧を返す */
async function listed(shard?: string): Promise<string[]> {
  const vitest = await createVitest("test", { root: ROOT, config: false, watch: false, include: [FIXTURES], ...(shard ? { shard } : {}) });
  try {
    return (await runSpecs(vitest)).map((spec) => relative(ROOT, spec.moduleId)).sort();
  } finally {
    await vitest.close();
  }
}

const LISTS = await atLoad("分けた実行と分けない実行の一覧を出す", async () => ({
  whole: await listed(),
  first: await listed("1/3"),
  second: await listed("2/3"),
  third: await listed("3/3"),
}));

describe("この回に回す検査の file の一覧", () => {
  it("run-specs-split-by-shard", () => {
    const { whole, first, second, third } = LISTS.get();
    expect(whole.length, "見本の検査の file が 3 つ未満で、分けた回のどれかが空になる").toBeGreaterThanOrEqual(3);
    expect(first, "1/3 の回の一覧が空").not.toEqual([]);
    expect(second, "2/3 の回の一覧が空").not.toEqual([]);
    expect(third, "3/3 の回の一覧が空").not.toEqual([]);
    const joined = [...first, ...second, ...third];
    expect(joined.filter((file, index) => joined.indexOf(file) !== index), "2 つ以上の回に入る file").toEqual([]);
    expect(joined.sort(), "3 つの回を合わせた一覧が、分けない回の一覧と違う").toEqual(whole);
  });
});
