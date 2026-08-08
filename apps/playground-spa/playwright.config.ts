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
 * ## 時間を標本にする検査は直列にする
 *
 * 動きの途中を 40ms 間隔で観測する検査は、 負荷が上がると標本を取り損ねて落ちる。 図が壊れて
 * いないのに落ちる = 落ちたことが情報を持たなくなるので、 別 project に分けて 1 件ずつ回す。
 */

/** 動きの途中を時間で標本にする検査。 負荷で結果が変わるため直列で回す */
const 時間を測る検査 = /(editor-initial-animation|rendered-contrast)\.spec\.ts$/;

const 共通 = { baseURL: "http://localhost:4323", trace: "on-first-retry" } as const;

export default defineConfig({
  testDir: "./tests",
  timeout: 30000,
  use: 共通,
  workers: 4,
  projects: [
    {
      name: "default",
      testIgnore: [/html-canvas-motion\.spec\.ts$/, 時間を測る検査],
      use: 共通,
    },
    {
      // 動きの時間を測る検査。 `workers: 1` で他の検査と重ならないようにする
      name: "timing",
      testMatch: 時間を測る検査,
      workers: 1,
      use: 共通,
    },
    {
      name: "motion",
      testMatch: /html-canvas-motion\.spec\.ts$/,
      timeout: 60000,
      workers: 1,
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
