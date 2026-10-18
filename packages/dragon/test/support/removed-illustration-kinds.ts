/**
 * 見本帳から外したが、まだ cdl が持っている挿絵の種類 (#2946)。
 *
 * 特定の分野に寄った挿絵の形で、cdl からも外す (cardene777/cdl#1256)。
 * dragon がその版へ上げる時 (#2947) に、この file ごと消す。
 * 消すと `notation-option-coverage.test.ts` の未使用の宣言が空に戻るので、
 * `empty-population-scan-2505.test.ts` の `空でよい` にその宣言を戻す。
 *
 * **一覧はここ 1 箇所に置く**。 種類の網羅を見る検査が 2 つあり
 * (`apps/playground-spa/src/lib/catalog-kind-coverage.test.ts` と `notation-option-coverage.test.ts`)、
 * 別々に書くと片方だけ消し忘れる。
 */
export const 外した挿絵の種類: readonly string[] = [
  "shape-kanban-card",
  "shape-message-bubble",
  "shape-gear",
  "shape-network-node",
  "shape-iot-sensor",
  "shape-robot-arm",
  "shape-satellite",
  "shape-website",
  "shape-cdn-edge",
  "shape-api-gateway",
  "shape-storefront",
  "shape-warehouse",
  "shape-online-shop",
  "shape-customer-service",
  "shape-lawyer",
  "shape-auditor",
  "shape-regulator",
  "shape-notary",
  "shape-trader",
  "shape-smart-contract",
  "shape-blockchain-block",
  "shape-blockchain",
  "shape-bitcoin-chain",
  "shape-ethereum-chain",
  "shape-blockchain-node",
  "shape-rpc-node",
  "shape-wallet",
  "shape-nft",
  "shape-token",
  "shape-bank",
  "shape-trust-bank",
  "shape-payment-provider",
  "shape-credit-card",
  "shape-brokerage",
  "shape-exchange",
  "shape-atm",
];
