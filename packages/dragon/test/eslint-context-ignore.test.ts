/**
 * `.context/` を lint の対象から外す指定が、 workspace ごとの `.context/` まで届くか (#1659)。
 *
 * `eslint.config.mjs` の意図は「`.context/` は一時 scratch なので lint しない」 だが、
 * 書いてあった `.context/**` は **repo 直下の 1 つにしか当たらない**。
 * `apps/playground-spa/.context/scratch/*.mjs` が漏れて `pnpm lint` が落ちていた (実測 3 件)。
 *
 * ## 探し方を本番と対照で 2 度書かない
 *
 * どちらの向きも `ESLint#isPathIgnored` に本番の config をそのまま読ませて判定する。
 * 指定の文字列を検査側で書き写すと、 config を直しても検査が古い形を見たまま通る。
 *
 * ## 両方向を固定する
 *
 * 外れることだけを見ると、 全部を外す指定 (`**`) でも通る。
 * lint したい file が外れていないことを併せて見る。
 */
import { ESLint } from "eslint";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO = fileURLToPath(new URL("../../..", import.meta.url));

const 外れるか = async (相対: string): Promise<boolean> =>
  await new ESLint({ cwd: REPO }).isPathIgnored(join(REPO, 相対));

/** lint の対象から外れているはずの場所 */
const 外れる場所 = [
  ".context/scratch/probe.mjs",
  "apps/playground-spa/.context/scratch/probe.mjs",
  "packages/dragon/.context/scratch/probe.mjs",
];

/** lint の対象に残っているはずの場所。 全部を外す指定でも通らないようにする */
const 残る場所 = [
  "apps/playground-spa/src/lib/chart-slope-options.ts",
  "packages/dragon/src/index.ts",
];

describe("`.context/` を lint から外す指定の届く範囲 (#1659)", () => {
  it("workspace ごとの `.context/` も外れる", async () => {
    // Given
    expect(外れる場所.length, "見る場所が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);

    // When / Then
    for (const 場所 of 外れる場所)
      expect(await 外れるか(場所), `${場所} が lint の対象に残っている`).toBe(true);
  });

  it("lint したい file は外れない", async () => {
    // Given = 実在する file で見る。 存在しない path を渡すと、外れない理由が
    // 「指定が届いていない」 なのか「そもそも見ていない」 なのか分からなくなる
    expect(残る場所.length, "見る場所が 1 つも無い (検査が空振りしている)").toBeGreaterThan(0);
    for (const 場所 of 残る場所)
      expect(existsSync(join(REPO, 場所)), `${場所} が実在しない (前提が崩れている)`).toBe(true);

    // When / Then
    for (const 場所 of 残る場所)
      expect(await 外れるか(場所), `${場所} が lint の対象から外れている`).toBe(false);
  });
});
