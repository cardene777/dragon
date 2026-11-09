/**
 * 後から読む見本の記法 (#3246)。
 *
 * `examples.ts` がこの file を `import()` で読み、build はこの file を見本の記法だけを持つ 1 つの塊にする。
 * 概要の頁と編集画面の最初の見本は待たずに出すので、ここに置かず `examples.ts` が最初に読む。
 */
import swapJa from "../../../packages/dragon/examples/swap.dragon?raw";
import swapEn from "../../../packages/dragon/examples/swap.en.dragon?raw";
import swapRevertJa from "../../../packages/dragon/examples/swap-revert.dragon?raw";
import swapRevertEn from "../../../packages/dragon/examples/swap-revert.en.dragon?raw";
import swapTwoHopsJa from "../../../packages/dragon/examples/swap-two-hops.dragon?raw";
import swapTwoHopsEn from "../../../packages/dragon/examples/swap-two-hops.en.dragon?raw";
import swapRetryJa from "../../../packages/dragon/examples/swap-retry.dragon?raw";
import swapRetryEn from "../../../packages/dragon/examples/swap-retry.en.dragon?raw";
import vaultProxyJa from "../../../packages/dragon/examples/vault-proxy.dragon?raw";
import vaultProxyEn from "../../../packages/dragon/examples/vault-proxy.en.dragon?raw";
import aggregatorJa from "../../../packages/dragon/examples/aggregator.dragon?raw";
import aggregatorEn from "../../../packages/dragon/examples/aggregator.en.dragon?raw";
import osShareJa from "../../../packages/dragon/examples/os-share.dragon?raw";
import osShareEn from "../../../packages/dragon/examples/os-share.en.dragon?raw";
import ticketsJa from "../../../packages/dragon/examples/tickets.dragon?raw";
import ticketsEn from "../../../packages/dragon/examples/tickets.en.dragon?raw";
import apiJa from "../../../packages/dragon/examples/api.dragon?raw";
import apiEn from "../../../packages/dragon/examples/api.en.dragon?raw";
import auctionJa from "../../../packages/dragon/examples/auction.dragon?raw";
import auctionEn from "../../../packages/dragon/examples/auction.en.dragon?raw";
import finalityJa from "../../../packages/dragon/examples/finality.dragon?raw";
import finalityEn from "../../../packages/dragon/examples/finality.en.dragon?raw";
import mergeJa from "../../../packages/dragon/examples/merge.dragon?raw";
import mergeEn from "../../../packages/dragon/examples/merge.en.dragon?raw";
import merkleJa from "../../../packages/dragon/examples/merkle.dragon?raw";
import merkleEn from "../../../packages/dragon/examples/merkle.en.dragon?raw";
import orderJa from "../../../packages/dragon/examples/order.dragon?raw";
import orderEn from "../../../packages/dragon/examples/order.en.dragon?raw";
import paymentJa from "../../../packages/dragon/examples/payment.dragon?raw";
import paymentEn from "../../../packages/dragon/examples/payment.en.dragon?raw";
import rebaseJa from "../../../packages/dragon/examples/rebase.dragon?raw";
import rebaseEn from "../../../packages/dragon/examples/rebase.en.dragon?raw";
import retryJa from "../../../packages/dragon/examples/retry.dragon?raw";
import retryEn from "../../../packages/dragon/examples/retry.en.dragon?raw";
import txBlockJa from "../../../packages/dragon/examples/tx-block.dragon?raw";
import txBlockEn from "../../../packages/dragon/examples/tx-block.en.dragon?raw";
import walletJa from "../../../packages/dragon/examples/wallet.dragon?raw";
import walletEn from "../../../packages/dragon/examples/wallet.en.dragon?raw";
import bridgeJa from "../../../packages/dragon/examples/bridge.dragon?raw";
import bridgeEn from "../../../packages/dragon/examples/bridge.en.dragon?raw";
import withdrawJa from "../../../packages/dragon/examples/withdraw.dragon?raw";
import withdrawEn from "../../../packages/dragon/examples/withdraw.en.dragon?raw";
import releasePlanJa from "../../../packages/dragon/examples/release-plan.dragon?raw";
import releasePlanEn from "../../../packages/dragon/examples/release-plan.en.dragon?raw";

import type { LaterExampleKey } from "./examples";
import type { Lang } from "./text";

export const LATER_EXAMPLES: Record<LaterExampleKey, Record<Lang, string>> = {
  api: { ja: apiJa, en: apiEn },
  retry: { ja: retryJa, en: retryEn },
  payment: { ja: paymentJa, en: paymentEn },
  wallet: { ja: walletJa, en: walletEn },
  bridge: { ja: bridgeJa, en: bridgeEn },
  order: { ja: orderJa, en: orderEn },
  rebase: { ja: rebaseJa, en: rebaseEn },
  merge: { ja: mergeJa, en: mergeEn },
  finality: { ja: finalityJa, en: finalityEn },
  withdraw: { ja: withdrawJa, en: withdrawEn },
  "release-plan": { ja: releasePlanJa, en: releasePlanEn },
  merkle: { ja: merkleJa, en: merkleEn },
  auction: { ja: auctionJa, en: auctionEn },
  "tx-block": { ja: txBlockJa, en: txBlockEn },
  swap: { ja: swapJa, en: swapEn },
  "swap-revert": { ja: swapRevertJa, en: swapRevertEn },
  "swap-two-hops": { ja: swapTwoHopsJa, en: swapTwoHopsEn },
  "swap-retry": { ja: swapRetryJa, en: swapRetryEn },
  "vault-proxy": { ja: vaultProxyJa, en: vaultProxyEn },
  aggregator: { ja: aggregatorJa, en: aggregatorEn },
  "os-share": { ja: osShareJa, en: osShareEn },
  tickets: { ja: ticketsJa, en: ticketsEn },
};

/**
 * 見本が使うブロックの読み方を `read` で読んでから記法を返す (#3349)。題と種類を引く所が待つ `LATER_EXAMPLES` だけが呼ぶ。
 * 処理をこの塊に置くのは、最初に読む script に入れないため (#3505)。
 * 読み方を読む処理を受け取るのは、この塊が軽い入口を直に読むと build が軽い入口を最初に読む別の script に分けるため
 */
export async function withReadings(read: (text: string) => Promise<unknown>): Promise<typeof LATER_EXAMPLES> {
  await Promise.all(Object.values(LATER_EXAMPLES).flatMap((texts) => Object.values(texts).map(read)));
  return LATER_EXAMPLES;
}
