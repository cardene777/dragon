import { defineConfig } from "@playwright/test";

import { DEV_URL, PREVIEW_BASE_URL } from "./ports";

/**
 * Playwright config。
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
 * ## 件数が増えた後に測り直した (#2759)
 *
 * 985 件になった時点で 4 でも落ちるようになった。 落ちる検査が毎回入れ替わり、どれも
 * 押す操作が返らずに持ち時間を使い切る形だった。
 *
 * | worker 数 | 時間 | 結果 |
 * |---|---|---|
 * | 3 | 25.3 分 | 1 件が時間切れ (`catalog-event-targets`) |
 * | 4 | 20.9 分 | 2 件が時間切れ (`catalog-panzoom` / `catalog-part-in-box`) |
 * | 4 (持ち時間 60 秒) | 20.9 分 | 全件パス |
 *
 * **worker 数は原因ではなかった**。 下げても落ちる検査が入れ替わるだけで、時間は 4.4 分
 * 増えた。 原因は 1 件の持ち時間で、そちらを 60 秒にした (上の `timeout`)。
 * 既定の 4 は据え置く。
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
 * 代償 = `default` が落ちると `serial` は実行されない (Playwright の仕様)。 `default` が赤い時は
 * そちらを直すのが先なので受容する。
 *
 * **ただし時間切れで赤くなる場合は受容の前提が崩れる** (#2759)。 直す対象が無いのに
 * `serial` の 18 件が走らない。 実際に #2754 の回で `serial` の 10 件が走らず、その中に
 * #2757 の実不具合が隠れて 1 周遅れた。 だから時間切れは持ち時間の側で消す。
 */

/** 他と重ねない検査。 負荷で結果が変わる側と、 負荷を出す側の両方を含む */
const 重ねない検査 = /(editor-initial-animation|rendered-contrast|muted-text-symmetry)\.spec\.ts$/;

/**
 * 開発時のみの頁 (`/__render`) を使う検査。
 *
 * この頁は `main.tsx` が `import.meta.env.DEV` の時だけ繋ぐため、build 済の画面には route が
 * 無い。 向けると `waitForSelector` が時間切れになるので、ここだけ開発 server に残す。
 *
 * 代償 = この 3 件は実行中の編集で作り直される側に残り続ける。 壊れた時に「要素が現れない」
 * としか読めない形で落ちないよう、待ちには上限を付ける (#1438)。
 *
 * 待ちの上限だけでは「頁が壊れた」 と「server が古い」 を分けられない (#1998)。
 * 前に `開発serverの下ごしらえ` を置き、束ねの古さを直し方つきで出す。
 */
const 開発serverの検査 = /row-bounds-offset\.spec\.ts$/;

/**
 * 開発 server を見る検査の下ごしらえ (#1998)。
 *
 * 立てっぱなしの開発 server は起動時に抱えた束ねを配り続けるため、依存の版を上げた後も
 * 古い描画を返す。 `dev` の `dependencies` に置くと、ここが落ちた時に `dev` の検査が
 * 走らずに飛ばされる = 時間切れを 3 回待たずに済む。
 */
const 開発serverの下ごしらえ = /dev-deps-fresh\.setup\.ts$/;

/**
 * 見に行く server。 既定は **build 済の画面** (`pnpm preview` が配る `PREVIEW_BASE_URL`)。
 *
 * 開発 server を見ていた間、実行中に file を編集すると Vite が繋いでいる画面を全再読み込みし、
 * **走行中の検査が巻き添えで落ちていた** (#1438 で 2 回の実行から計 4 件を実測)。 落ち方は
 * 「要素が現れず 30 秒で時間切れ」 のように読めるため flake と区別が付かない。 build 済の
 * 画面は編集で作り直されないので、この経路が消える。
 *
 * 副産物として、移した spec が **subpath 配信 (`/dragon/`) の検証も同時に得る**。 開発 server は
 * root 配信なので、これまで subpath は本番用の spec しか通っていなかった。
 *
 * **spec は先頭 `/` を付けずに書く**。 `new URL(path, base)` は先頭 `/` を「origin 直下」 と
 * 読んで base を捨てるため、`goto("/editor")` は base の外 (origin 直下の `/editor`) を開き、
 * 画面が出ないまま落ちる (Phase 1 で 291 件が同じ形で落ちた)。 `spec-base-url.test.ts` が
 * 先頭 `/` の literal を検出する。
 *
 * `SPA_URL` で差し替えられるようにするのは、依存の版を上げた直後に **動いている server が
 * 古い版を配り続ける** ため (Vite は起動時に依存を抱え込む)。 別 port に立て直した server へ
 * 向けないと、新しい描画を見ているつもりで古い描画を見ることになる。
 *
 * 固定していた間、`chart-line-draw.spec.ts` だけが自前で `SPA_URL` を読んでいた = 同じ回の
 * 検査が 2 つの server に分かれ、片方が古いことに気付けなかった (#1318 で踏んだ)。
 */
const 共通 = {
  baseURL: process.env.SPA_URL ?? PREVIEW_BASE_URL,
  trace: "on-first-retry",
} as const;

export default defineConfig({
  testDir: "./tests",
  // 1 件の持ち時間 (#2759)。 **30 秒では足りない**。 4 worker で一式を回すと押す操作が
  // 返るまでに 30 秒を使い切る検査が毎回 1 件から 2 件出て、落ちる検査が毎回入れ替わった
  // (実測 = `catalog-panzoom` / `catalog-part-in-box` / `catalog-event-targets` /
  // `onload-locale` の 4 件が別々の回で落ち、どれも単独では通る)。
  //
  // 止まっているのではなく遅いだけだった。 60 秒にすると 985 件すべて通り、
  // **全体の時間は変わらない** (20.9 分 → 20.9 分)。 持ち時間は最悪の場合の上限で、
  // 普段の 1 件は 2 秒から 6 秒で終わるため。
  //
  // worker 数を下げる案は測って退けた (3 にすると 25.3 分に伸びた上、別の 1 件が同じ形で
  // 落ちた)。 落ちた回を retry で通す案も採らない = 下の worker 数の判断と同じ理由で、
  // 本当に時々壊れている不具合と区別できなくなる。
  //
  // 代わりに失うのは、本当に止まった検査が出た時に報告が 30 秒遅れること。
  // 普段の 1 件の 10 倍を上限にしているので、止まったことは変わらず分かる。
  timeout: 60000,
  use: 共通,
  workers: 4,
  projects: [
    {
      name: "default",
      testIgnore: [重ねない検査, 開発serverの検査, 開発serverの下ごしらえ],
      use: 共通,
    },
    {
      // 開発 server に dragon が居るかと、配る束ねが古くないかを見る。
      // 相手を 1 回引くだけで図は描かせないので、`dev` と同じ見に行く先は要らない (#2295)
      name: "dev-setup",
      testMatch: 開発serverの下ごしらえ,
      use: 共通,
    },
    {
      // 開発時のみの頁を使うので build 済ではなく開発 server を見る。 `default` とは別の
      // server を相手にするだけで負荷の話ではないため、後ろに回さず同時に走らせる。
      //
      // 差し替えを `SPA_URL` と分けるのは、この project だけ相手が違うため。 1 つにすると
      // 立て直した server へ向けた時に、こちらが古い server に残って気付けない (#1318 の形)
      name: "dev",
      testMatch: 開発serverの検査,
      // 束ねが古い時はここが飛ばされ、時間切れ 3 回の代わりに直し方が出る (#1998)
      dependencies: ["dev-setup"],
      use: { ...共通, baseURL: process.env.DEV_SPA_URL ?? DEV_URL },
    },
    {
      // `default` の後に 1 件ずつ回す (同時に走ると標本を取り損ねる / 他を落とす)
      name: "serial",
      testMatch: 重ねない検査,
      workers: 1,
      dependencies: ["default"],
      use: 共通,
    },
  ],
});
