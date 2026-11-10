/**
 * `packages/dragon/test/` の検査の file で 1 つの画面なしの Chromium (#3424)。
 *
 * 初めて要った件が起こし、2 度目からは同じ Chromium を返す。頁は呼んだ側が文脈 (`newContext`) ごとに開いて閉じる。
 * 頁を開くたびに起こし直すと、混んだ機械で 1 回ごとに 1 秒ほどかかる (#3381)。
 *
 * Chromium は前後処理で閉じず、検査の file の process の終わりに Playwright が止める (SIGKILL) 。
 * 混んだ機械では閉じるのに 10 秒を超えた回があり、後処理で閉じると 1 件の上限 (10 秒) に当たる (#3384)。
 * vitest は file を回し終えた作業者の process を SIGTERM で止め、500ms で終わらなければ SIGKILL で落とす。
 * Playwright に SIGTERM を扱わせず (`handleSIGTERM: false`)、SIGTERM を受けたらすぐ process を終えて、Playwright の `exit` の片付けを走らせる。
 * `packages/dragon/test/` の file で準備の段が起こす形も試したが、6 つの file を回す全体の時間が初めて要った件が起こす形より長かった。
 *
 * 書き出しの検査も、書き出しが起こす Chromium の代わりにこの 1 つを受け取る (`shared-chromium.ts`、#3599)。
 * その包みが `chromium.launch` を差し替えるので、ここは包みが差し替える前に預けた本物の起こし方で起こす。
 * 起こした Chromium は process に 1 つ持つ。命令を読み直す件 (`vi.resetModules`) がこの file を読み直しても、2 つ目を起こさないため
 */
import type { Browser, BrowserType } from "playwright-core";

interface Held {
  launching?: Promise<Browser>;
  launches: number;
  /** 包みが差し替える前の `chromium.launch` */
  launch?: BrowserType["launch"];
}

const KEY = Symbol.for("dragon.test.fileChromium");
const held = ((globalThis as { [KEY]?: Held })[KEY] ??= { launches: 0 });

/** file で 1 つの Chromium。初めて要った時に起こす */
export function fileChromium(): Promise<Browser> {
  if (held.launching) return held.launching;
  held.launches++;
  process.once("SIGTERM", () => process.exit());
  const launch = held.launch ? Promise.resolve(held.launch) : import("playwright-core").then(({ chromium }) => chromium.launch.bind(chromium));
  held.launching = launch.then((start) => start({ handleSIGTERM: false }));
  return held.launching;
}

/** 本物の起こし方を預かる。書き出しの起動を差し替える包み (`shared-chromium.ts`) が、差し替える前に渡す (#3599) */
export function keepRealLaunch(launch: BrowserType["launch"]): void {
  held.launch ??= launch;
}

/** この file の process で Chromium を起こした回数 */
export const fileChromiumLaunches = (): number => held.launches;
