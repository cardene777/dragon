import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * 画面が使う依存の束ねが、依存そのものより古くないかを見る (#1460)。
 *
 * ## 何が起きたか
 *
 * 依存を 0.15.0 に上げた後も、動いていた開発 server は 8/27 08:11 に作った束ねを使い続けた。
 * 束ねに `drawRatio` も `chart-stat` も **1 件も入っておらず**、画面は 0.15.0 を 1 つも
 * 反映していなかった。 記法に足した項目を書いても描く側が知らないので何も出ない。
 *
 * Vite が束ねを作り直すのは **server の起動時だけ**。 動かしたまま依存を上げても気付かない。
 *
 * ## なぜ検査に置くか
 *
 * server の起動時に見る形は、**動かしっぱなしの server に効かない** (起動時にしか走らない)。
 * 検査は依存を上げた後に必ず回すので、そちらに置く。
 *
 * ## 判定
 *
 * `pnpm-lock.yaml` より束ねが古ければ作り直しが要る。 lockfile は依存を変えた時に必ず
 * 更新されるので、束ねとの前後で「上げた後に作り直したか」 が決まる。
 *
 * **束ねが無い形は落とさない**。 server を 1 度も起動していない人が止まる。
 */

/** 束ねの置き場所と、直し方 */
export interface Bundle {
  /** repo からの相対で、束ねが置かれる dir */
  readonly dir: string;
  /** 直し方 (実行する command) */
  readonly hint: string;
}

/** 見る束ね。 画面を出す app が持つもの */
export const BUNDLES: readonly Bundle[] = [
  {
    dir: "apps/playground-spa/node_modules/.vite/deps",
    hint: "開発 server を止めて `pnpm dev` で起動し直す",
  },
];

/** 判定の結果。 `null` は「見るものが無い」 = 落とさない */
export interface Stale {
  readonly dir: string;
  readonly hint: string;
  /** 束ねが lockfile より何秒古いか */
  readonly 古さ秒: number;
}

/**
 * 束ねが lockfile より古いものを並べる。
 *
 * **時刻を読めない形は落とさない**。 読めない事は「古い」 とは違う = 束ねが無い環境と
 * 区別が付かないまま止めると、server を使わない人が巻き添えになる。
 * 読めなかったことは呼出側が `読めた` で数える。
 */
export function staleBundles(
  root: string,
  bundles: readonly Bundle[] = BUNDLES,
): { stale: Stale[]; 読めた: number } {
  const lock = join(root, "pnpm-lock.yaml");
  if (!existsSync(lock)) return { stale: [], 読めた: 0 };
  const lockAt = statSync(lock, { throwIfNoEntry: false })?.mtimeMs;
  if (lockAt === undefined) return { stale: [], 読めた: 0 };

  const stale: Stale[] = [];
  let 読めた = 0;
  for (const b of bundles) {
    const dir = join(root, b.dir);
    // 束ねが無い = server を 1 度も起動していない。 落とす相手ではない。
    //
    // **`existsSync` を前に置かない**。 `throwIfNoEntry: false` の `statSync` が同じ入力で
    // `undefined` を返すので、置いても 1 度も効かない (変異試験で外しても 0 件 FAIL だった)。
    // 分けられない守りを 2 つ並べると、片方が死んでいることに気付けない
    const at = statSync(dir, { throwIfNoEntry: false })?.mtimeMs;
    if (at === undefined) continue;
    読めた += 1;
    if (at < lockAt) stale.push({ dir: b.dir, hint: b.hint, 古さ秒: Math.round((lockAt - at) / 1000) });
  }
  return { stale, 読めた };
}

/** 落ちた時の案内。 次の一手を必ず添える */
export function staleBundleReport(stale: readonly Stale[]): string {
  return stale
    .map(
      (s) =>
        `${s.dir} が依存より ${s.古さ秒} 秒古い。 画面は古い依存で描くため、足した項目が出ない。\n` +
        `  直す: ${s.hint}`,
    )
    .join("\n\n");
}
