/**
 * この回に回す検査の file の一覧 (#3946)。
 *
 * 準備の段 (`globalSetup`) の 4 つ (`run-limit.ts`、`site-setup.ts`、`pack-setup.ts`、`prepare-setup.ts`) が、回す file の準備と、上限で止まった時に終わっていない file を名指すのに読む。
 * 命令に渡した file の絞り (`vitest run <file>`) は `filenamePattern` に在り、`getRelevantTestSpecifications` がそれで絞る。
 * `--shard=<i>/<n>` を付けた実行では、vitest は検査を回す時に `config.sequence.sequencer` の `shard` で一覧を名前の hash で並べ、i 番目の分だけを回す。
 * 準備の段は検査を回す前に走るので、同じ部品で同じように絞る。
 * 絞らないと、分けたどの回も全ての file の準備を済ませ、上限で止まった時は回さない側の file まで終わっていないと名指す。
 */
import type { TestSpecification, Vitest } from "vitest/node";

export async function runSpecs(vitest: Vitest): Promise<TestSpecification[]> {
  // 命令に渡した file の絞りは `filenamePattern` に在る。型に出ていないので読む形だけ宣言する
  const { filenamePattern } = vitest as Vitest & { filenamePattern?: string[] };
  const specs = await vitest.getRelevantTestSpecifications(filenamePattern);
  if (!vitest.config.shard) return specs;
  const Sequencer = vitest.config.sequence.sequencer;
  return new Sequencer(vitest).shard(specs);
}
