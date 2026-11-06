/**
 * 頁を開く検査の file で、file を読む前に画面なしの Chromium を起こし始める準備の段 (`setupFiles`、#3388)。
 *
 * 起こしている Chromium の約束 (Promise) は `globalThis` の `PRELOADED_CHROMIUM` に置き、`startSite` (`playground-support.ts`) が待って使う。
 * 起動は検査の file を読み込む間と並んで進むので、file の最初の頁を開くまでの待ちが縮む。
 * 頁を開く file かは、1 回の実行の準備の段が build を決めるのと同じ規則 (`site-needs.ts`) で file の字から読む。頁を開かない file では playwright も読み込まない。
 *
 * Chromium は検査の file の process の中で起こし、つながずに使う。
 * 別の process で起こした Chromium へつないでいた時 (#3384) は、頁を開くたびに通信の往復が 1 段増え、頁を開くのが約 3 割遅かった。
 * 閉じるのは前後処理ではなく、検査の file の process の終わり。Playwright は process が終わる時 (`exit`) に、自分が起こした Chromium を止め (SIGKILL)、作業用の folder を消す。
 * 混んだ機械では Chromium を閉じるのに 10 秒を超えた回があり、前後処理で閉じると 1 件の上限 (10 秒) に当たる (#3384)。
 *
 * vitest は file を回し終えた作業者の process を SIGTERM で止め、500ms で終わらなければ SIGKILL で落とす。
 * Playwright の既定は SIGTERM を受けると Chromium を行儀よく閉じ始めるだけで、process を終えない。混んだ機械では 500ms で閉じ終わらず、SIGKILL で落ちて `exit` の片付けが走らないので、Chromium と作業用の folder が残った。
 * Playwright に SIGTERM を扱わせず (`handleSIGTERM: false`)、SIGTERM を受けたらすぐ process を終えて `exit` の片付けを走らせる。
 */
import { readFileSync } from "node:fs";
import type { Browser } from "playwright";
import { expect } from "vitest";
import { sitesNeeded } from "./site-needs";

/** 起こしている Chromium の約束を置く `globalThis` の鍵 */
export const PRELOADED_CHROMIUM = Symbol.for("dragon.chromium");

/** 検査の file が見本帳の頁を開くか */
export function opensPages(path: string): boolean {
  return sitesNeeded([readFileSync(path, "utf8")]).length > 0;
}

const store = globalThis as Record<symbol, unknown>;
const path = expect.getState().testPath;
// 同じ process でこの file がもう一度読まれても、2 つ目の Chromium は起こさない
if (path !== undefined && store[PRELOADED_CHROMIUM] === undefined && opensPages(path)) {
  process.once("SIGTERM", () => process.exit());
  const launching: Promise<Browser> = import("playwright").then(({ chromium }) => chromium.launch({ handleSIGTERM: false }));
  // 起動の失敗は `startSite` が待った時に落とす。ここで受けておかないと、頁を開く前に受け手の無い失敗として実行ごと落ちる
  launching.catch(() => undefined);
  store[PRELOADED_CHROMIUM] = launching;
}
