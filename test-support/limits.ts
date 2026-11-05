/**
 * 検査の時間の上限 (#3381)。
 *
 * 1 件の検査とその前後処理は 10 秒、1 回の実行は 5 分で止める。
 * 止まらずに待ち続ける検査と遅いまま残る検査を、待つ人が気付く前に名前で見せるため。
 * 1 件 10 秒は、画面を開く検査が Chromium を起こして頁を描いてもまだ余る長さで、5 分は課題ごとに待てる長さ。
 *
 * 環境変数 (`DRAGON_TEST_LIMIT_MS`、`DRAGON_RUN_LIMIT_MS`) で下げられるが、上げられない。
 * 下げられるのは、上限を超える見本の検査を、上限の検査の中で数秒で起こすため (`packages/dragon/test/test-limits.test.ts`)。
 * 上げられると、遅い検査を上限だけ緩めて残す道ができる。
 */

/** 1 件の検査とその前後処理の上限 */
export const TEST_LIMIT_MS = 10_000;
/** 1 回の実行の上限 */
export const RUN_LIMIT_MS = 300_000;

/** 環境変数で下げた上限。上限より大きい値、0 以下、数でない値は読まない */
function lowered(name: string, limit: number): number {
  const value = Number(process.env[name]);
  return Number.isFinite(value) && value > 0 && value < limit ? value : limit;
}

export const testLimitMs = (): number => lowered("DRAGON_TEST_LIMIT_MS", TEST_LIMIT_MS);
export const runLimitMs = (): number => lowered("DRAGON_RUN_LIMIT_MS", RUN_LIMIT_MS);
