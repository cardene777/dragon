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
import loginCheckJa from "../../../packages/dragon/examples/login-check.dragon?raw";
import loginCheckEn from "../../../packages/dragon/examples/login-check.en.dragon?raw";
import loginAllPathsJa from "../../../packages/dragon/examples/login-all-paths.dragon?raw";
import loginAllPathsEn from "../../../packages/dragon/examples/login-all-paths.en.dragon?raw";
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
import shopJa from "../../../packages/dragon/examples/shop.dragon?raw";
import shopEn from "../../../packages/dragon/examples/shop.en.dragon?raw";
import videoJa from "../../../packages/dragon/examples/video.dragon?raw";
import videoEn from "../../../packages/dragon/examples/video.en.dragon?raw";
import txStatusJa from "../../../packages/dragon/examples/tx-status.dragon?raw";
import txStatusEn from "../../../packages/dragon/examples/tx-status.en.dragon?raw";
import subscriptionJa from "../../../packages/dragon/examples/subscription.dragon?raw";
import subscriptionEn from "../../../packages/dragon/examples/subscription.en.dragon?raw";
import supportTicketJa from "../../../packages/dragon/examples/support-ticket.dragon?raw";
import supportTicketEn from "../../../packages/dragon/examples/support-ticket.en.dragon?raw";
import hotfixJa from "../../../packages/dragon/examples/hotfix.dragon?raw";
import hotfixEn from "../../../packages/dragon/examples/hotfix.en.dragon?raw";
import squashJa from "../../../packages/dragon/examples/squash.dragon?raw";
import squashEn from "../../../packages/dragon/examples/squash.en.dragon?raw";
import shopOpeningJa from "../../../packages/dragon/examples/shop-opening.dragon?raw";
import shopOpeningEn from "../../../packages/dragon/examples/shop-opening.en.dragon?raw";
import tournamentJa from "../../../packages/dragon/examples/tournament.dragon?raw";
import tournamentEn from "../../../packages/dragon/examples/tournament.en.dragon?raw";
import sitemapJa from "../../../packages/dragon/examples/sitemap.dragon?raw";
import sitemapEn from "../../../packages/dragon/examples/sitemap.en.dragon?raw";
import hdWalletJa from "../../../packages/dragon/examples/hd-wallet.dragon?raw";
import hdWalletEn from "../../../packages/dragon/examples/hd-wallet.en.dragon?raw";
import clinicJa from "../../../packages/dragon/examples/clinic.dragon?raw";
import clinicEn from "../../../packages/dragon/examples/clinic.en.dragon?raw";
import kanbanJa from "../../../packages/dragon/examples/kanban.dragon?raw";
import kanbanEn from "../../../packages/dragon/examples/kanban.en.dragon?raw";
import rollupBatchJa from "../../../packages/dragon/examples/rollup-batch.dragon?raw";
import rollupBatchEn from "../../../packages/dragon/examples/rollup-batch.en.dragon?raw";
import checkoutLanesJa from "../../../packages/dragon/examples/checkout-lanes.dragon?raw";
import checkoutLanesEn from "../../../packages/dragon/examples/checkout-lanes.en.dragon?raw";
import stockReserveJa from "../../../packages/dragon/examples/stock-reserve.dragon?raw";
import stockReserveEn from "../../../packages/dragon/examples/stock-reserve.en.dragon?raw";
import multisigJa from "../../../packages/dragon/examples/multisig.dragon?raw";
import multisigEn from "../../../packages/dragon/examples/multisig.en.dragon?raw";
import gasFeeJa from "../../../packages/dragon/examples/gas-fee.dragon?raw";
import gasFeeEn from "../../../packages/dragon/examples/gas-fee.en.dragon?raw";
import stakingRewardsJa from "../../../packages/dragon/examples/staking-rewards.dragon?raw";
import stakingRewardsEn from "../../../packages/dragon/examples/staking-rewards.en.dragon?raw";
import approveDepositJa from "../../../packages/dragon/examples/approve-deposit.dragon?raw";
import approveDepositEn from "../../../packages/dragon/examples/approve-deposit.en.dragon?raw";
import returnCheckJa from "../../../packages/dragon/examples/return-check.dragon?raw";
import returnCheckEn from "../../../packages/dragon/examples/return-check.en.dragon?raw";
import ethSlotJa from "../../../packages/dragon/examples/eth-slot.dragon?raw";
import ethSlotEn from "../../../packages/dragon/examples/eth-slot.en.dragon?raw";
import sprintJa from "../../../packages/dragon/examples/sprint.dragon?raw";
import sprintEn from "../../../packages/dragon/examples/sprint.en.dragon?raw";
import pdcaJa from "../../../packages/dragon/examples/pdca.dragon?raw";
import pdcaEn from "../../../packages/dragon/examples/pdca.en.dragon?raw";
import restakeJa from "../../../packages/dragon/examples/restake.dragon?raw";
import restakeEn from "../../../packages/dragon/examples/restake.en.dragon?raw";
import budgetAppJa from "../../../packages/dragon/examples/budget-app.dragon?raw";
import budgetAppEn from "../../../packages/dragon/examples/budget-app.en.dragon?raw";
import tripPlanJa from "../../../packages/dragon/examples/trip-plan.dragon?raw";
import tripPlanEn from "../../../packages/dragon/examples/trip-plan.en.dragon?raw";
import daoProposalJa from "../../../packages/dragon/examples/dao-proposal.dragon?raw";
import daoProposalEn from "../../../packages/dragon/examples/dao-proposal.en.dragon?raw";
import walletUxJa from "../../../packages/dragon/examples/wallet-ux.dragon?raw";
import walletUxEn from "../../../packages/dragon/examples/wallet-ux.en.dragon?raw";
import orderTotalJa from "../../../packages/dragon/examples/order-total.dragon?raw";
import orderTotalEn from "../../../packages/dragon/examples/order-total.en.dragon?raw";
import libraryLoanJa from "../../../packages/dragon/examples/library-loan.dragon?raw";
import libraryLoanEn from "../../../packages/dragon/examples/library-loan.en.dragon?raw";
import nftSaleJa from "../../../packages/dragon/examples/nft-sale.dragon?raw";
import nftSaleEn from "../../../packages/dragon/examples/nft-sale.en.dragon?raw";
import tokenTransferJa from "../../../packages/dragon/examples/token-transfer.dragon?raw";
import tokenTransferEn from "../../../packages/dragon/examples/token-transfer.en.dragon?raw";
import walletUsageJa from "../../../packages/dragon/examples/wallet-usage.dragon?raw";
import walletUsageEn from "../../../packages/dragon/examples/wallet-usage.en.dragon?raw";
import l2ChainsJa from "../../../packages/dragon/examples/l2-chains.dragon?raw";
import l2ChainsEn from "../../../packages/dragon/examples/l2-chains.en.dragon?raw";
import hobbiesJa from "../../../packages/dragon/examples/hobbies.dragon?raw";
import hobbiesEn from "../../../packages/dragon/examples/hobbies.en.dragon?raw";
import skillsJa from "../../../packages/dragon/examples/skills.dragon?raw";
import skillsEn from "../../../packages/dragon/examples/skills.en.dragon?raw";

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
  "login-check": { ja: loginCheckJa, en: loginCheckEn },
  "login-all-paths": { ja: loginAllPathsJa, en: loginAllPathsEn },
  shop: { ja: shopJa, en: shopEn },
  video: { ja: videoJa, en: videoEn },
  "tx-status": { ja: txStatusJa, en: txStatusEn },
  subscription: { ja: subscriptionJa, en: subscriptionEn },
  "support-ticket": { ja: supportTicketJa, en: supportTicketEn },
  hotfix: { ja: hotfixJa, en: hotfixEn },
  squash: { ja: squashJa, en: squashEn },
  "shop-opening": { ja: shopOpeningJa, en: shopOpeningEn },
  tournament: { ja: tournamentJa, en: tournamentEn },
  sitemap: { ja: sitemapJa, en: sitemapEn },
  "hd-wallet": { ja: hdWalletJa, en: hdWalletEn },
  clinic: { ja: clinicJa, en: clinicEn },
  kanban: { ja: kanbanJa, en: kanbanEn },
  "rollup-batch": { ja: rollupBatchJa, en: rollupBatchEn },
  "checkout-lanes": { ja: checkoutLanesJa, en: checkoutLanesEn },
  "stock-reserve": { ja: stockReserveJa, en: stockReserveEn },
  multisig: { ja: multisigJa, en: multisigEn },
  "gas-fee": { ja: gasFeeJa, en: gasFeeEn },
  "staking-rewards": { ja: stakingRewardsJa, en: stakingRewardsEn },
  "approve-deposit": { ja: approveDepositJa, en: approveDepositEn },
  "return-check": { ja: returnCheckJa, en: returnCheckEn },
  "eth-slot": { ja: ethSlotJa, en: ethSlotEn },
  sprint: { ja: sprintJa, en: sprintEn },
  pdca: { ja: pdcaJa, en: pdcaEn },
  restake: { ja: restakeJa, en: restakeEn },
  "budget-app": { ja: budgetAppJa, en: budgetAppEn },
  "trip-plan": { ja: tripPlanJa, en: tripPlanEn },
  "dao-proposal": { ja: daoProposalJa, en: daoProposalEn },
  "wallet-ux": { ja: walletUxJa, en: walletUxEn },
  "order-total": { ja: orderTotalJa, en: orderTotalEn },
  "library-loan": { ja: libraryLoanJa, en: libraryLoanEn },
  "nft-sale": { ja: nftSaleJa, en: nftSaleEn },
  "token-transfer": { ja: tokenTransferJa, en: tokenTransferEn },
  "wallet-usage": { ja: walletUsageJa, en: walletUsageEn },
  "l2-chains": { ja: l2ChainsJa, en: l2ChainsEn },
  hobbies: { ja: hobbiesJa, en: hobbiesEn },
  skills: { ja: skillsJa, en: skillsEn },
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
