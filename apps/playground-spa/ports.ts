/**
 * 画面を配る port (#1326)。
 *
 * 開発と本番 build で **別の port を使う**。 同じにすると片方を立てている間もう片方を
 * 立てられず、本番 build を確かめるたびに開発 server を落とすことになる。
 *
 * ここに集めるのは、数字が散ると片方だけ直したずれに気付けないため。 実際に踏んだ =
 * 検査は 4324 を探すのに配る側は 4323 のままで、**22 件が常に落ちていた** (#1326)。
 *
 * 調査用の `scripts/*.mjs` は literal のままにする。 実行のたびに人が port を選ぶもので、
 * 決まった経路ではない。
 */

/** 開発 server (`pnpm dev`) */
export const DEV_PORT = 4323;

/** 本番 build の preview (`pnpm preview`)。 `base: "/dragon/"` が付いた形で配る */
export const PREVIEW_PORT = 4324;
