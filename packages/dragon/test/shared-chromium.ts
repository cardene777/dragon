/**
 * 検査の中だけで、書き出しが起こす Chromium を 1 つの Chromium に差し替える (#3599、#3602)。
 *
 * 書き出し (`packages/dragon/src/export`) は呼ぶたびに Chromium を起こし、撮り終えると閉じる。
 * 検査の中でもそうすると、1 つの file で書き出す回数だけ Chromium を起こし、混んだ機械で 1 件の上限 (10 秒) を超えた
 * (0.70.0 の配る前の関門で、時間切れの 27 件中 17 件が書き出しの検査)。
 * 製品の書き出しは変えず、検査の process か thread の中で `playwright-core` の `chromium.launch` だけを差し替える。
 *
 * `playwright-core` は Node が process (thread) に 1 つ持つ module なので、組み上がった書き出し (`dist`) も元の code (`src`) も同じ `chromium` を読む。
 * `vi.mock` で差し替えると、Node が読む `dist` には届かなかった。
 *
 * 差し替えた `launch` は 1 つの Chromium を借りて返す。
 * 借りた Chromium を書き出しが閉じる時は、書き出しが開いた文脈 (頁) だけを閉じ、Chromium は閉じない。
 * 検査の file の process では、画面を開く検査と同じ file で 1 つの Chromium (`fileChromium`) を借りる (`lendFileChromium`)。
 * Chromium を止めるのは今どおり file の process の終わりで、後処理では閉じない (`page-needs.ts`、#3384)。
 * jsdom の外で書き出す thread (`export-thread.ts`) では、thread で 1 つの Chromium を借りる (`lendThreadChromium`)。
 *
 * 書き出しの thread は vitest を通さずに Node がこの file を読み、型だけを外して動かす。
 * そのため型でない import を file の頭に置かず、`page-needs.ts` は `lendFileChromium` の中で読む。
 *
 * 子の Node のプロセスで起こした命令には、この差し替えは届かない。Chromium が無い時の断りは、そちらで確かめる。
 */
import type { Browser, BrowserContext, BrowserType } from "playwright-core";

/** 差し替えた `launch` に付ける印。同じ process で 2 度差し替えて、差し替えた物を本物として預けないため */
const LENT = Symbol.for("dragon.test.lentChromium");

/**
 * この process (thread) の `chromium.launch` を、1 つの Chromium を借りて返す形に差し替える。
 * `take` は差し替える前の本物の起こし方を受け、借りる Chromium を返す関数を返す
 */
async function lend(take: (real: BrowserType["launch"]) => () => Promise<Browser>): Promise<void> {
  const { chromium } = await import("playwright-core");
  const now: unknown = Reflect.get(chromium, "launch");
  if ((now as { [LENT]?: true })[LENT]) return;
  // 差し替える前の本物を、差し替える前に束ねて渡す。差し替えた後に `chromium.launch` を引くと借りる形に戻って回り続ける
  const one = take(chromium.launch.bind(chromium));
  const lent = Object.assign(async () => borrowed(await one()), { [LENT]: true as const });
  chromium.launch = lent;
}

/** この process の `chromium.launch` を、file で 1 つの Chromium を借りて返す形に差し替える */
export async function lendFileChromium(): Promise<void> {
  const { fileChromium, keepRealLaunch } = await import("./page-needs");
  await lend((real) => {
    keepRealLaunch(real);
    return fileChromium;
  });
}

/** thread で起こした Chromium と、起こした回数と、thread で 1 つの Chromium を返す関数 */
const own: { launching?: Promise<Browser>; launches: number; one?: () => Promise<Browser> } = { launches: 0 };

/** この thread の `chromium.launch` を、thread で 1 つの Chromium を借りて返す形に差し替える。初めて要った書き出しが起こす */
export async function lendThreadChromium(): Promise<void> {
  await lend((real) => {
    own.one = () => {
      if (!own.launching) {
        own.launches++;
        own.launching = real({ handleSIGTERM: false });
      }
      return own.launching;
    };
    return own.one;
  });
}

/** この thread で Chromium を起こした回数 */
export const threadChromiumLaunches = (): number => own.launches;

/**
 * thread で 1 つの Chromium を、初めて要る書き出しより前に起こしておく。
 * 差し替えた `launch` を呼ばず、それが借りる Chromium を返す関数を直に呼ぶ。
 * 検査の file が Chromium を自分で起こさないことは、`launch` を呼ぶ書き方が file に無いかで確かめるため (`page-needs.test.ts`)
 */
export async function warmThreadChromium(): Promise<void> {
  if (!own.one) throw new Error("thread の Chromium を貸す前に起こそうとした。先に lendThreadChromium を呼ぶ");
  await own.one();
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
