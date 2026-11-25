/**
 * 準備の段が読む「この回に回す検査の file の一覧」(`test-support/run-specs.ts`、#3946) の検査。
 *
 * 配る前のテストは package の検査を `--shard=1/2` と `--shard=2/2` の 2 回の vitest に分けて回す。
 * 準備の段は、分けたそれぞれの回で、その回に回す file だけを読む。
 * 一覧を作る vitest を起こすのは重いので、file を読み込む段で済ませる (#3738)。
 */
import { readFileSync } from "node:fs";
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

/** 回す file の一覧を読む準備の段 (`vitest.config.ts` の `globalSetup`) */
const SETUPS = [
  "test-support/run-limit.ts",
  "test-support/prepare-setup.ts",
  "test-support/pack-setup.ts",
  "apps/playground-spa/src/lib/site-setup.ts",
];

describe("この回に回す検査の file の一覧", () => {
  it("run-specs-split-by-shard", () => {
    const { whole, first, second } = LISTS.get();
    expect(whole.length, "見本の検査の file が 2 つ未満で、分けた回の片方が空になる").toBeGreaterThanOrEqual(2);
    expect(first, "1/2 の回の一覧が空").not.toEqual([]);
    expect(second, "2/2 の回の一覧が空").not.toEqual([]);
    expect(first.filter((file) => second.includes(file)), "1/2 と 2/2 の両方の回に入る file").toEqual([]);
    expect([...first, ...second].sort(), "1/2 と 2/2 を合わせた一覧が、分けない回の一覧と違う").toEqual(whole);
  });

  it("setups-read-run-specs", () => {
    // 一覧を直に読む段が残ると、分けた回でその段だけが回さない側の file まで準備する
    const direct = SETUPS.filter((file) => readFileSync(join(ROOT, file), "utf8").includes("getRelevantTestSpecifications"));
    expect(direct, "一覧を runSpecs でなく直に読む準備の段").toEqual([]);
    const missing = SETUPS.filter((file) => !readFileSync(join(ROOT, file), "utf8").includes("runSpecs(project.vitest)"));
    expect(missing, "一覧を runSpecs から読まない準備の段").toEqual([]);
  });
});
