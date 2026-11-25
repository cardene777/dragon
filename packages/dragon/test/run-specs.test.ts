/**
 * 準備の段が読む「この回に回す検査の file の一覧」(`test-support/run-specs.ts`、#3946) の検査。
 *
 * 配る前のテストは package の検査を `--shard=1/2` と `--shard=2/2` の 2 回の vitest に分けて回す。
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
/** 一覧の材料にする検査の file。上限の検査の見本 (`*.fixture.ts`) は 9 つあり、2 つに分けても両方の回に file が残る */
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
  first: await listed("1/2"),
  second: await listed("2/2"),
}));

describe("この回に回す検査の file の一覧", () => {
  it("run-specs-split-by-shard", () => {
    const { whole, first, second } = LISTS.get();
    expect(whole.length, "見本の検査の file が 2 つ未満で、分けた回の片方が空になる").toBeGreaterThanOrEqual(2);
    expect(first, "1/2 の回の一覧が空").not.toEqual([]);
    expect(second, "2/2 の回の一覧が空").not.toEqual([]);
    expect(first.filter((file) => second.includes(file)), "1/2 と 2/2 の両方の回に入る file").toEqual([]);
    expect([...first, ...second].sort(), "1/2 と 2/2 を合わせた一覧が、分けない回の一覧と違う").toEqual(whole);
  });
});
