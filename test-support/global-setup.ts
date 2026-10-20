import { SKIP_ENV, TARGETS, collectProblems } from "./dist-freshness-check";

/**
 * test の前に、 `dist` が `src` より古くないかを見る。 古ければ止める。
 *
 * dragon の test は `@cardenelabs/dragon` を package として import する = `dist` を読む。
 * `pnpm test` に build は含まれていないため、 古い `dist` が手元に残っていると
 * **src を壊しても test が通る**。
 *
 * 外す指定は環境変数 `SKIP_ENV.dist` を `1` にした時だけ効く (`0` や `false` では外さない)。
 * 名前は `SKIP_ENV` が持つ。 説明文と判定で別々に書くと、 片方だけ直って食い違う。
 */
export default function setup(): void {
  if (process.env[SKIP_ENV.dist] === "1") return;
  const stale = collectProblems(TARGETS);
  if (stale.length === 0) return;
  throw new Error(
    `dist が src より古い package がある。\n\n${stale.join("\n\n")}\n\n` +
      `一時的に外すなら ${SKIP_ENV.dist}=1 を付ける。`,
  );
}
