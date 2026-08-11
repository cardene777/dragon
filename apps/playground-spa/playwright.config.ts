import { defineConfig } from "@playwright/test";

/**
 * Playwright config。
 *
 * CAR-1983 = motion spec (`html-canvas-motion.spec.ts`) のみ video 常時録画 + slower timeout。
 * 他 spec は既存挙動維持 (trace on-first-retry のみ、 video 無)。 project 分けで overhead を motion spec に限定。
 *
 * ## 並列で回す (#1094)
 *
 * 検査の大半は待っている時間で、 その間 CPU は空いている (実測 = `waitForTimeout` が 244 箇所、
 * 実行時の総和が約 23 分、 1 worker での CPU 使用率 29%)。 並列化がそのまま効く。
 *
 * | worker 数 | 時間 | 結果 |
 * |---|---|---|
 * | 1 | 29.6 分 | 全件パス |
 * | 4 | 7.2 分 | 全件パス |
 * | 6 | 5.9 分 | 全件パス (別の回で動きの検査が 1 件不安定) |
 *
 * **4 を既定にする**。 6 は 1 度だけ `editor-initial-animation` が落ちた (単独では 3.1 秒で
 * 通る)。 速さより「落ちたら本当に壊れている」 を優先する。 手元で急ぐ時は `--workers=6` を
 * 付けて上書きできる。
 *
 * ## 他と重ねない検査
 *
 * 2 種類ある。 **負荷に弱い側** と **負荷を出す側** で、 どちらも他と重なると結果が変わる。
 *
 * 負荷に弱い側 = 動きの途中を 40ms 間隔で観測する検査。 負荷が上がると標本を取り損ねて落ちる。
 * 図が壊れていないのに落ちる = 落ちたことが情報を持たなくなる。
 *
 * 負荷を出す側 = `fullPage` の写しを何枚も撮る検査 (`muted-text-symmetry`、 20 枚)。 自分は
 * 落ちないが、 同時に走る寸法の検査を落とす。 main で全件を 3 回回して 2 回失敗し、 落ちる
 * test が毎回入れ替わった (単独では通る)。 動きを止めるだけでは足りず、 写しそのものの
 * 負荷が原因だった (GH #1118)。
 *
 * **project の `workers: 1` だけでは足りない**。 それはその project 内の同時実行数を 1 に
 * するだけで、 `default` と同時に走ることは止めない (実測 = 2 project を指定すると
 * `Running 6 tests using 2 workers` になり、 両方が同時に始まる)。 `dependencies` で
 * `default` の後に回す。
 *
 * 代償 = `default` が落ちると `timing` は実行されない (Playwright の仕様)。 `default` が赤い時は
 * そちらを直すのが先なので受容する。
 */

/** 他と重ねない検査。 負荷で結果が変わる側と、 負荷を出す側の両方を含む */
const 重ねない検査 = /(editor-initial-animation|rendered-contrast|muted-text-symmetry)\.spec\.ts$/;

const 共通 = { baseURL: "http://localhost:4323", trace: "on-first-retry" } as const;

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: 共通,
  workers: 4,
  projects: [
    {
      name: "default",
      testIgnore: [/html-canvas-motion\.spec\.ts$/, 重ねない検査],
      use: 共通,
    },
    {
      // `default` の後に 1 件ずつ回す (同時に走ると標本を取り損ねる / 他を落とす)
      name: "serial",
      testMatch: 重ねない検査,
      workers: 1,
      dependencies: ["default"],
      use: 共通,
    },
    {
      name: "motion",
      testMatch: /html-canvas-motion\.spec\.ts$/,
      timeout: 60000,
      workers: 1,
      dependencies: ["default"],
      use: {
        ...共通,
        // video 常時録画 (WebM)、 viewport 内全描画を記録
        video: {
          mode: "on",
          size: { width: 1280, height: 720 },
        },
        viewport: { width: 1280, height: 720 },
      },
    },
  ],
});
