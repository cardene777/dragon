import { BUNDLES, bundleFreshnessProblem, type Bundle } from "./dep-bundle-freshness";
import {
  REPO_ROOT,
  SKIP_ENV,
  TARGETS,
  collectProblems,
  type Target,
} from "./dist-freshness-check";

/**
 * test の前に 2 つを見る。
 *
 * | 見るもの | 古い時 |
 * |---|---|
 * | `dist` が `src` より古くないか | **止める** |
 * | 開発 server の依存の束ねが、 いま解決される依存を指しているか (#1636) | **止めずに知らせる** (#2050) |
 *
 * 1 つ目は test が読むもの。 dragon の test は `@cardenelabs/dragon` を package として import
 * する = `dist` を読む。 `pnpm test` に build は含まれていないため、 古い `dist` が手元に残って
 * いると **src を壊しても test が通る**。
 *
 * `@cardenelabs/cdl` は 1 つ目の対象外。 `#1166` で `link:` を外して公開版に寄せたため、 手元の
 * build 状態に左右されない。
 *
 * ## 束ねの古さは止めずに知らせる (#2050)
 *
 * 束ねは開発 server が配るもので、 **単体検査は読まない**。 #1460 でここに置いた時は、 束ねを
 * 使う e2e の検査に同じ関門が無く、 `pnpm test` を回した時に気付くために止めていた。 #1998 で
 * e2e の開発 server の検査の前 (`dev-deps-fresh.setup.ts`) に同じ判定を足したので、 止めるのは
 * そちらが持つ。 ここに残すのは「気付ける」 だけ。
 *
 * 止めていた間は、 開発 server を起動し直せない (その port を別の作業が使っている) というだけで、
 * 束ねと関係の無い単体検査が 1 件も走らなかった。 #2044 / #2046 / #2048 の 3 回とも、 外す指定を
 * 付けて回している。
 *
 * ## 外す指定は `dist` の関門だけが持つ (#2026)
 *
 * #2026 で関門ごとに外す指定を分けたのは、 直せない束ねのために `dist` の関門まで外れたから
 * (`0.28.0` の公開時)。 束ねの側が止めなくなったので、 束ねを外す指定は要らない。
 *
 * 名前は `SKIP_ENV` が持つ。 説明文と判定で別々に書くと、 片方だけ直って食い違う。
 */

/** どの関門を一時的に外すか。 */
export interface Skips {
  /** `dist` が `src` より古くないかを見る関門 */
  readonly dist: boolean;
}

/** 環境から外す指定を読む。 `1` の時だけ外す (`0` や `false` を外すと読まない)。 */
export function readSkips(env: Record<string, string | undefined>): Skips {
  return { dist: env[SKIP_ENV.dist] === "1" };
}

/** 止める理由を並べて返す。 無ければ空。 説明文は直し方と、 その関門を外す名前を持つ。 */
export function freshnessProblems(skips: Skips, targets: readonly Target[] = TARGETS): string[] {
  if (skips.dist) return [];
  const stale = collectProblems(targets);
  if (stale.length === 0) return [];
  return [
    `dist が src より古い package がある。\n\n${stale.join("\n\n")}\n\n` +
      `一時的に外すなら ${SKIP_ENV.dist}=1 を付ける。`,
  ];
}

/**
 * 開発 server の依存の束ねが古い時の知らせ。 古くなければ `null` (#2050)。
 *
 * 判定は `bundleFreshnessProblem` 1 つを e2e の開発 server の検査と共有する (#1998)。
 * 知らせには、 単体検査は続けることと、 束ねを使う e2e の検査は止まることを添える =
 * 読み手が「単体検査は通ったが画面は古い」 を取り違えない。
 */
export function bundleNotice(root: string, bundles: readonly Bundle[] = BUNDLES): string | null {
  const stale = bundleFreshnessProblem(root, bundles);
  if (stale === null) return null;
  return (
    `開発 server の依存の束ねが古い。 単体検査はこの束ねを読まないので、 検査は続ける。\n\n` +
    `${stale}\n\n` +
    `束ねを使う e2e の開発 server の検査 (dev-deps-fresh.setup.ts) は、 直すまで止まる。`
  );
}

/**
 * 前処理の本体。 束ねが古ければ `知らせる` に渡し、 止める理由があれば投げる。
 *
 * **知らせを先に出す**。 `dist` の古さで止まる時も、 束ねの古さを見落とさない。
 */
export function runFreshnessChecks(
  root: string,
  env: Record<string, string | undefined>,
  知らせる: (知らせ: string) => void,
  targets: readonly Target[] = TARGETS,
  bundles: readonly Bundle[] = BUNDLES,
): void {
  const 知らせ = bundleNotice(root, bundles);
  if (知らせ !== null) 知らせる(知らせ);
  const problems = freshnessProblems(readSkips(env), targets);
  if (problems.length > 0) throw new Error(problems.join("\n\n"));
}

export default function setup(): void {
  runFreshnessChecks(REPO_ROOT, process.env, (知らせ) => console.warn(知らせ));
}
