/**
 * 後から読む見本の記法 (#3246)。
 *
 * `examples.ts` がこの file を `import()` で読み、build はこの file を見本の記法だけを持つ 1 つの塊にする。
 * 概要の頁と編集画面の最初の見本は待たずに出すので、ここに置かず `examples.ts` が最初に読む。
 */
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
import walletJa from "../../../packages/dragon/examples/wallet.dragon?raw";
import walletEn from "../../../packages/dragon/examples/wallet.en.dragon?raw";
import withdrawJa from "../../../packages/dragon/examples/withdraw.dragon?raw";
import withdrawEn from "../../../packages/dragon/examples/withdraw.en.dragon?raw";

import type { LaterExampleKey } from "./examples";
import type { Lang } from "./text";

export const LATER_EXAMPLES: Record<LaterExampleKey, Record<Lang, string>> = {
  api: { ja: apiJa, en: apiEn },
  retry: { ja: retryJa, en: retryEn },
  payment: { ja: paymentJa, en: paymentEn },
  wallet: { ja: walletJa, en: walletEn },
  order: { ja: orderJa, en: orderEn },
  rebase: { ja: rebaseJa, en: rebaseEn },
  merge: { ja: mergeJa, en: mergeEn },
  finality: { ja: finalityJa, en: finalityEn },
  withdraw: { ja: withdrawJa, en: withdrawEn },
  merkle: { ja: merkleJa, en: merkleEn },
  auction: { ja: auctionJa, en: auctionEn },
};
