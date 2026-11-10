/**
 * 検査の中だけで、書き出しが起こす Chromium を file で 1 つの Chromium に差し替える (#3599)。
 *
 * 書き出し (`packages/dragon/src/export`) は呼ぶたびに Chromium を起こし、撮り終えると閉じる。
 * 検査の中でもそうすると、1 つの file で書き出す回数だけ Chromium を起こし、混んだ機械で 1 件の上限 (10 秒) を超えた
 * (0.70.0 の配る前の関門で、時間切れの 27 件中 17 件が書き出しの検査)。
 * 製品の書き出しは変えず、検査の process の中で `playwright-core` の `chromium.launch` だけを差し替える。
 *
 * `playwright-core` は Node が process に 1 つ持つ module なので、組み上がった書き出し (`dist`) も元の code (`src`) も同じ `chromium` を読む。
 * `vi.mock` で差し替えると、Node が読む `dist` には届かなかった。
 *
 * 差し替えた `launch` は、画面を開く検査と同じ file で 1 つの Chromium (`fileChromium`) を借りて返す。
 * 借りた Chromium を書き出しが閉じる時は、書き出しが開いた文脈 (頁) だけを閉じ、Chromium は閉じない。
 * Chromium を止めるのは今どおり file の process の終わりで、後処理では閉じない (`page-needs.ts`、#3384)。
 *
 * 子の Node のプロセスで起こした命令には、この差し替えは届かない。Chromium が無い時の断りは、そちらで確かめる。
 */
import type { Browser, BrowserContext } from "playwright-core";
import { fileChromium, keepRealLaunch } from "./page-needs";

/** 差し替えた `launch` に付ける印。同じ process で 2 度差し替えて、差し替えた物を本物として預けないため */
const LENT = Symbol.for("dragon.test.lentChromium");

/** この process の `chromium.launch` を、file で 1 つの Chromium を借りて返す形に差し替える */
export async function lendFileChromium(): Promise<void> {
  const { chromium } = await import("playwright-core");
  const now: unknown = Reflect.get(chromium, "launch");
  if ((now as { [LENT]?: true })[LENT]) return;
  // 差し替える前の本物を、差し替える前に束ねて預ける。差し替えた後に `chromium.launch` を引くと借りる形に戻って回り続ける
  keepRealLaunch(chromium.launch.bind(chromium));
  const lent = Object.assign(async () => borrowed(await fileChromium()), { [LENT]: true as const });
  chromium.launch = lent;
}

/** 借りた Chromium。開いた文脈を数え、閉じる時はそれだけを閉じる */
function borrowed(browser: Browser): Browser {
  const opened = new Set<BrowserContext>();
  const keep = (context: BrowserContext): BrowserContext => {
    opened.add(context);
    context.once("close", () => opened.delete(context));
    return context;
  };
  return new Proxy(browser, {
    get(target, key) {
      if (key === "close") {
        return async () => {
          await Promise.all([...opened].map((context) => context.close()));
        };
      }
      if (key === "newContext") return async (...args: Parameters<Browser["newContext"]>) => keep(await target.newContext(...args));
      if (key === "newPage") {
        return async (...args: Parameters<Browser["newPage"]>) => {
          const page = await target.newPage(...args);
          keep(page.context());
          return page;
        };
      }
      const value: unknown = Reflect.get(target, key, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  });
}
