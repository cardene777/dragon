import { diagram } from "@cardenelabs/cdl";
import type { PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Primitives ... lane / node の基本パーツ。
 * 全 card で lane width 440 統一 = SVG viewBox 同サイズ = catalog grid 整列。
 */

const W = 440;

/** 1. NodeKind 全 5 種 (actor / function / storage / event / card) */
export const kindActor = diagram("kind-actor", { topic: "kind: actor (外部主体)" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "Client", eyebrow: "外部主体", value: "42 users" })
  .phase("p", { duration: 1500, title: "actor", body: "外部主体 (Client / 利用者 等)。 数値 value 表示可。" }, (p: PhaseBuilder) => p.activate("a").badge("active"))
  .build();

export const kindFunction = diagram("kind-function", { topic: "kind: function (関数呼び出し)" })
  .lane("l", { x: 0, width: W })
  .node("fn", { lane: "l", stack: 0, kind: "function", title: "handler(req)", eyebrow: "関数呼び出し", subtitle: "-> Result<Order, ValidationError>" })
  .phase("p", { duration: 1500, title: "function", body: "Service の関数。 mono 等幅 title + subtitle で署名表示。" }, (p: PhaseBuilder) => p.activate("fn").badge("active"))
  .build();

export const kindStorage = diagram("kind-storage", { topic: "kind: storage (保存データ)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "storage", title: "users", eyebrow: "保存データ", rows: ["id: PK", "email: text"] })
  .phase("p", { duration: 1500, title: "storage", body: "DB の table。 rows で複数 column 表示。" }, (p: PhaseBuilder) => p.activate("s").badge("active"))
  .build();

export const kindEvent = diagram("kind-event", { topic: "kind: event (イベントログ)" })
  .lane("l", { x: 0, width: W })
  .node("e", { lane: "l", stack: 0, kind: "event", title: "OrderCreated", eyebrow: "イベント", subtitle: "(orderId, userId, total)" })
  .phase("p", { duration: 1500, title: "event", body: "emit された event。 event bus / log が読む。" }, (p: PhaseBuilder) => p.activate("e").badge("active"))
  .build();

export const kindCard = diagram("kind-card", { topic: "kind: card (汎用情報)" })
  .lane("l", { x: 0, width: W })
  .node("c", { lane: "l", stack: 0, kind: "card", title: "備考", eyebrow: "汎用カード", subtitle: "汎用の説明カード" })
  .phase("p", { duration: 1500, title: "card", body: "kind に当てはまらない補足情報。" }, (p: PhaseBuilder) => p.activate("c").badge("active"))
  .build();

/** 2. Lane バリエーション */
export const laneSingle = diagram("lane-single", { topic: "lane: 1 本" })
  .lane("only", { x: 0, width: W })
  .node("a", { lane: "only", stack: 0, kind: "actor", title: "A" })
  .node("b", { lane: "only", stack: 1, kind: "function", title: "B" })
  .phase("p", { duration: 1500, title: "1 lane", body: "1 lane に複数 node を縦 stack。" }, (p: PhaseBuilder) => p.activate("a", "b").badge("OK"))
  .build();

export const laneMulti = diagram("lane-multi", { topic: "lane: 3 本 (横並び)" })
  .lane("l1", { width: 240 })
  .lane("l2", { width: 240 })
  .lane("l3", { width: 240 })
  .node("a", { lane: "l1", stack: 0, kind: "function", title: "A" })
  .node("b", { lane: "l2", stack: 0, kind: "function", title: "B" })
  .node("c", { lane: "l3", stack: 0, kind: "event", title: "C" })
  .phase("p", { duration: 1500, title: "3 lane", body: "lane を横並びで責務分担 (Client / Service / Event)。" }, (p: PhaseBuilder) => p.activate("a", "b", "c").badge("OK"))
  .build();

export const laneContain = diagram("lane-contain", { topic: "lane: contain (枠囲み)" })
  .lane("inner", { x: 0, width: W, contain: true })
  .node("fn", { lane: "inner", stack: 0, kind: "function", title: "internal fn" })
  .node("st", { lane: "inner", stack: 1, kind: "storage", title: "storage" })
  .phase("p", { duration: 1500, title: "contain", body: "lane.contain=true で lane 自体を枠で囲み、 内部を境界明示。" }, (p: PhaseBuilder) => p.activate("fn", "st").badge("OK"))
  .build();

/** 3. Node stack バリエーション */
export const stackPair = diagram("stack-pair", { topic: "stack: 縦 2 段" })
  .lane("l", { x: 0, width: W })
  .node("top", { lane: "l", stack: 0, kind: "actor", title: "上" })
  .node("bot", { lane: "l", stack: 1, kind: "actor", title: "下" })
  .phase("p", { duration: 1500, title: "stack 0/1", body: "同 lane 内で stack で縦並びを制御。" }, (p: PhaseBuilder) => p.activate("top", "bot").badge("OK"))
  .build();

export const stackTriple = diagram("stack-triple", { topic: "stack: 縦 3 段" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "actor", title: "stack 0" })
  .node("b", { lane: "l", stack: 1, kind: "function", title: "stack 1" })
  .node("c", { lane: "l", stack: 2, kind: "storage", title: "stack 2" })
  .phase("p", { duration: 1500, title: "stack 0/1/2", body: "stack の数を増やして縦展開、 row_gap で間隔自動。" }, (p: PhaseBuilder) => p.activate("a", "b", "c").badge("OK"))
  .build();

/** 4. Shape-driven basement 8 (CAR-1099) ... 要素形状自体が意味を持つ SVG path node */
export const shapeFile = diagram("shape-file", { topic: "shape: file (ドッグイア rect、 ファイル / document 表現)" })
  .lane("l", { x: 0, width: W })
  .node("f", { lane: "l", stack: 0, kind: "shape-file", title: "report.pdf", eyebrow: "file", subtitle: "PDF 1.2 MB" })
  .phase("p", { duration: 1500, title: "file", body: "右上がドッグイアで折り返された rect。 ファイル / 文書 / レポート等" }, (p: PhaseBuilder) => p.activate("f").badge("shape"))
  .build();

export const shapeFolder = diagram("shape-folder", { topic: "shape: folder (tab 付き rect、 フォルダ / パッケージ)" })
  .lane("l", { x: 0, width: W })
  .node("f", { lane: "l", stack: 0, kind: "shape-folder", title: "src/", eyebrow: "folder", subtitle: "24 files" })
  .phase("p", { duration: 1500, title: "folder", body: "上端に tab のある rect。 ディレクトリ / package / モジュール群等" }, (p: PhaseBuilder) => p.activate("f").badge("shape"))
  .build();

export const shapeCloud = diagram("shape-cloud", { topic: "shape: cloud (5 円 合成、 クラウド / SaaS 表現)" })
  .lane("l", { x: 0, width: W })
  .node("c", { lane: "l", stack: 0, kind: "shape-cloud", title: "AWS", eyebrow: "cloud" })
  .phase("p", { duration: 1500, title: "cloud", body: "5 円 合成の cloud shape。 AWS / GCP / SaaS / 外部 API 等" }, (p: PhaseBuilder) => p.activate("c").badge("shape"))
  .build();

export const shapeCylinder = diagram("shape-cylinder", { topic: "shape: cylinder (円柱、 DB / storage 表現)" })
  .lane("l", { x: 0, width: W })
  .node("c", { lane: "l", stack: 0, kind: "shape-cylinder", title: "PostgreSQL", eyebrow: "database", subtitle: "500 GB SSD" })
  .phase("p", { duration: 1500, title: "cylinder", body: "円柱 (top + side + bottom ellipse)。 DB / 永続 storage / volume 等" }, (p: PhaseBuilder) => p.activate("c").badge("shape"))
  .build();

export const shapeHexagon = diagram("shape-hexagon", { topic: "shape: hexagon (六角形、 component / service)" })
  .lane("l", { x: 0, width: W })
  .node("h", { lane: "l", stack: 0, kind: "shape-hexagon", title: "AuthService", eyebrow: "component" })
  .phase("p", { duration: 1500, title: "hexagon", body: "六角形。 microservice / ドメインコンポーネント / モジュール表現" }, (p: PhaseBuilder) => p.activate("h").badge("shape"))
  .build();

export const shapeDiamond = diagram("shape-diamond", { topic: "shape: diamond (ひし形、 decision / 判定)" })
  .lane("l", { x: 0, width: W })
  .node("d", { lane: "l", stack: 0, kind: "shape-diamond", title: "valid?", eyebrow: "decision" })
  .phase("p", { duration: 1500, title: "diamond", body: "ひし形。 判定分岐 / choice / gateway 表現" }, (p: PhaseBuilder) => p.activate("d").badge("shape"))
  .build();

export const shapeStack = diagram("shape-stack", { topic: "shape: stack (重ね rect、 layer / history)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "shape-stack", title: "v3.2.0", eyebrow: "release" })
  .phase("p", { duration: 1500, title: "stack", body: "重なった 3 段の rect。 バージョン履歴 / layer / snapshot 群等" }, (p: PhaseBuilder) => p.activate("s").badge("shape"))
  .build();

export const shapePerson = diagram("shape-person", { topic: "shape: person (人型 figure、 actor / user 表現)" })
  .lane("l", { x: 0, width: W })
  .node("p", { lane: "l", stack: 0, kind: "shape-person", title: "エンドユーザ", eyebrow: "actor" })
  .phase("p", { duration: 1500, title: "person", body: "人型 figure (円頭 + 台形 body + 腕 curve)。 actor / user / 担当者" }, (p: PhaseBuilder) => p.activate("p").badge("shape"))
  .build();

/** 5. Shape-driven hardware 6 (CAR-1111 Phase 2-C) ... ハードウェア / IoT / エッジ領域の視覚要素 */
export const shapeServerRack = diagram("shape-server-rack", { topic: "shape: server-rack (19 inch rack、 物理サーバ)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "shape-server-rack", title: "web-01", eyebrow: "server", subtitle: "3 U rack mount" })
  .phase("p", { duration: 1500, title: "server-rack", body: "外枠 + 3 段 slot の rack。 物理サーバ / データセンター / on-prem 機器" }, (p: PhaseBuilder) => p.activate("s").badge("shape"))
  .build();

export const shapeNetworkNode = diagram("shape-network-node", { topic: "shape: network-node (network hub、 router / switch)" })
  .lane("l", { x: 0, width: W })
  .node("n", { lane: "l", stack: 0, kind: "shape-network-node", title: "core-router", eyebrow: "network", subtitle: "L3 gateway" })
  .phase("p", { duration: 1500, title: "network-node", body: "中央 circle + 4 方向 line。 router / switch / hub / L3 gateway 等" }, (p: PhaseBuilder) => p.activate("n").badge("shape"))
  .build();

export const shapeMobileDevice = diagram("shape-mobile-device", { topic: "shape: mobile-device (スマホ、 モバイル端末)" })
  .lane("l", { x: 0, width: W })
  .node("m", { lane: "l", stack: 0, kind: "shape-mobile-device", title: "iPhone", eyebrow: "mobile", subtitle: "iOS client" })
  .phase("p", { duration: 1500, title: "mobile-device", body: "speaker + screen + home button のスマホ。 mobile app / client 端末" }, (p: PhaseBuilder) => p.activate("m").badge("shape"))
  .build();

export const shapeIotSensor = diagram("shape-iot-sensor", { topic: "shape: iot-sensor (IoT beacon、 電波発信)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "shape-iot-sensor", title: "温度センサー", eyebrow: "iot", subtitle: "BLE beacon" })
  .phase("p", { duration: 1500, title: "iot-sensor", body: "sensor 円 + 3 波紋 arc。 IoT beacon / センサー / ZigBee / LoRa 端末" }, (p: PhaseBuilder) => p.activate("s").badge("shape"))
  .build();

export const shapeRobotArm = diagram("shape-robot-arm", { topic: "shape: robot-arm (ロボアーム、 産業機器)" })
  .lane("l", { x: 0, width: W })
  .node("r", { lane: "l", stack: 0, kind: "shape-robot-arm", title: "組立ライン", eyebrow: "robot", subtitle: "6-axis arm" })
  .phase("p", { duration: 1500, title: "robot-arm", body: "base + 2 関節 + gripper のロボアーム。 産業機器 / 自動化 / 制御対象" }, (p: PhaseBuilder) => p.activate("r").badge("shape"))
  .build();

export const shapeSatellite = diagram("shape-satellite", { topic: "shape: satellite (人工衛星、 エッジ通信)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "shape-satellite", title: "Starlink", eyebrow: "satellite", subtitle: "LEO 通信衛星" })
  .phase("p", { duration: 1500, title: "satellite", body: "中央 body + 左右 solar panel + アンテナ。 人工衛星 / 宇宙 / エッジ通信" }, (p: PhaseBuilder) => p.activate("s").badge("shape"))
  .build();

/** 6. Shape-driven blockchain / web3 6 (CAR-1111 Phase 2-D) ... Solidity / EVM 系開発主体 */
export const shapeSmartContract = diagram("shape-smart-contract", { topic: "shape: smart-contract (契約書 + 歯車 = 自動実行)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "shape-smart-contract", title: "Vault.sol", eyebrow: "contract", subtitle: "0.8.24" })
  .phase("p", { duration: 1500, title: "smart-contract", body: "文書 + 底に歯車 (自動実行)。 Solidity 契約 / DAO 規約 / 自動 escrow" }, (p: PhaseBuilder) => p.activate("s").badge("shape"))
  .build();

export const shapeBlockchainBlock = diagram("shape-blockchain-block", { topic: "shape: blockchain-block (連結 3 block + hash pointer)" })
  .lane("l", { x: 0, width: W })
  .node("b", { lane: "l", stack: 0, kind: "shape-blockchain-block", title: "Block #421", eyebrow: "chain", subtitle: "0xaf31c9d2..." })
  .phase("p", { duration: 1500, title: "blockchain-block", body: "縦連結 3 block + hash pointer + tx count。 Ethereum / Bitcoin ブロック" }, (p: PhaseBuilder) => p.activate("b").badge("shape"))
  .build();

export const shapeRpcNode = diagram("shape-rpc-node", { topic: "shape: rpc-node (JSON-RPC node + 6 peers + sync bar)" })
  .lane("l", { x: 0, width: W })
  .node("r", { lane: "l", stack: 0, kind: "shape-rpc-node", title: "Alchemy", eyebrow: "rpc", subtitle: "mainnet endpoint" })
  .phase("p", { duration: 1500, title: "rpc-node", body: "中央 sphere + 6 peer dot + sync bar。 Infura / Alchemy / node provider" }, (p: PhaseBuilder) => p.activate("r").badge("shape"))
  .build();

export const shapeWallet = diagram("shape-wallet", { topic: "shape: wallet (財布 + coin + balance display)" })
  .lane("l", { x: 0, width: W })
  .node("w", { lane: "l", stack: 0, kind: "shape-wallet", title: "MetaMask", eyebrow: "wallet", subtitle: "EOA / EIP-4337" })
  .phase("p", { duration: 1500, title: "wallet", body: "財布 + coin 差し込み + balance。 MetaMask / Ledger / smart wallet" }, (p: PhaseBuilder) => p.activate("w").badge("shape"))
  .build();

export const shapeNft = diagram("shape-nft", { topic: "shape: nft (額縁 + polygonal art + verified badge)" })
  .lane("l", { x: 0, width: W })
  .node("n", { lane: "l", stack: 0, kind: "shape-nft", title: "CryptoPunk", eyebrow: "nft", subtitle: "ERC-721 #1024" })
  .phase("p", { duration: 1500, title: "nft", body: "額縁 + polygonal art + verified check。 ERC-721 / SBT / collection" }, (p: PhaseBuilder) => p.activate("n").badge("shape"))
  .build();

export const shapeToken = diagram("shape-token", { topic: "shape: token (硬貨、 fungible currency)" })
  .lane("l", { x: 0, width: W })
  .node("t", { lane: "l", stack: 0, kind: "shape-token", title: "ETH", eyebrow: "token", subtitle: "ERC-20 / native" })
  .phase("p", { duration: 1500, title: "token", body: "硬貨 + 通貨 symbol Ξ + shine。 ERC-20 / native currency / stablecoin" }, (p: PhaseBuilder) => p.activate("t").badge("shape"))
  .build();

/** 7. Shape-driven finance 6 (CAR-1111 Phase 2-D) ... 銀行 / 決済 / 信託 / 取引所主体 */
export const shapeBank = diagram("shape-bank", { topic: "shape: bank (Greek facade + 4 columns + $)" })
  .lane("l", { x: 0, width: W })
  .node("b", { lane: "l", stack: 0, kind: "shape-bank", title: "みずほ銀行", eyebrow: "bank", subtitle: "都銀" })
  .phase("p", { duration: 1500, title: "bank", body: "神殿風 facade (pediment + columns + base)。 都銀 / 地銀 / 銀行本店" }, (p: PhaseBuilder) => p.activate("b").badge("shape"))
  .build();

export const shapeTrustBank = diagram("shape-trust-bank", { topic: "shape: trust-bank (bank facade + 冠 crown = 受託の信頼)" })
  .lane("l", { x: 0, width: W })
  .node("t", { lane: "l", stack: 0, kind: "shape-trust-bank", title: "三菱 UFJ 信託", eyebrow: "trust-bank", subtitle: "受託業務" })
  .phase("p", { duration: 1500, title: "trust-bank", body: "冠 + facade + Ⓣ letter。 信託銀行 / 受託業務 / 資産管理" }, (p: PhaseBuilder) => p.activate("t").badge("shape"))
  .build();

export const shapePaymentProvider = diagram("shape-payment-provider", { topic: "shape: payment-provider (POS 端末 + screen + keypad)" })
  .lane("l", { x: 0, width: W })
  .node("p", { lane: "l", stack: 0, kind: "shape-payment-provider", title: "Stripe", eyebrow: "payment", subtitle: "card / QR / 電子マネー" })
  .phase("p", { duration: 1500, title: "payment-provider", body: "POS 端末 + APPROVED 表示 + keypad。 決済業者 / Stripe / 電子決済手段等取引業" }, (p: PhaseBuilder) => p.activate("p").badge("shape"))
  .build();

export const shapeBrokerage = diagram("shape-brokerage", { topic: "shape: brokerage (証券会社 tower + candle chart + up arrow)" })
  .lane("l", { x: 0, width: W })
  .node("b", { lane: "l", stack: 0, kind: "shape-brokerage", title: "野村證券", eyebrow: "brokerage", subtitle: "証券会社" })
  .phase("p", { duration: 1500, title: "brokerage", body: "tower + window grid + candle chart + up arrow。 証券会社 / 投資銀行" }, (p: PhaseBuilder) => p.activate("b").badge("shape"))
  .build();

export const shapeExchange = diagram("shape-exchange", { topic: "shape: exchange (取引所、 $ ⇄ Ξ swap)" })
  .lane("l", { x: 0, width: W })
  .node("e", { lane: "l", stack: 0, kind: "shape-exchange", title: "Coinbase", eyebrow: "exchange", subtitle: "spot / derivatives" })
  .phase("p", { duration: 1500, title: "exchange", body: "2 通貨 coin + 双方向 arrow + rate。 取引所 / DEX / 換金" }, (p: PhaseBuilder) => p.activate("e").badge("shape"))
  .build();

export const shapeAtm = diagram("shape-atm", { topic: "shape: atm (現金自動預払機、 card slot + cash dispenser)" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "shape-atm", title: "ATM", eyebrow: "atm", subtitle: "24 h 稼働" })
  .phase("p", { duration: 1500, title: "atm", body: "screen + button + card slot + dispenser。 銀行 ATM / コンビニ ATM" }, (p: PhaseBuilder) => p.activate("a").badge("shape"))
  .build();

/** 8. Shape-driven commerce / web 6 (CAR-1111 Phase 2-D) ... web / EC / インフラ主体 */
export const shapeWebsite = diagram("shape-website", { topic: "shape: website (browser + URL + page layout)" })
  .lane("l", { x: 0, width: W })
  .node("w", { lane: "l", stack: 0, kind: "shape-website", title: "example.com", eyebrow: "website", subtitle: "corporate site" })
  .phase("p", { duration: 1500, title: "website", body: "browser + URL bar + header + 2 col。 corporate / SaaS LP / blog" }, (p: PhaseBuilder) => p.activate("w").badge("shape"))
  .build();

export const shapeStorefront = diagram("shape-storefront", { topic: "shape: storefront (実店舗、 awning + door + windows)" })
  .lane("l", { x: 0, width: W })
  .node("s", { lane: "l", stack: 0, kind: "shape-storefront", title: "コンビニ", eyebrow: "store", subtitle: "リアル店舗" })
  .phase("p", { duration: 1500, title: "storefront", body: "赤白 awning + OPEN sign + door + windows。 リアル店舗 / 小売" }, (p: PhaseBuilder) => p.activate("s").badge("shape"))
  .build();

export const shapeWarehouse = diagram("shape-warehouse", { topic: "shape: warehouse (倉庫、 roof + shutter + boxes)" })
  .lane("l", { x: 0, width: W })
  .node("w", { lane: "l", stack: 0, kind: "shape-warehouse", title: "FC1", eyebrow: "warehouse", subtitle: "配送 hub" })
  .phase("p", { duration: 1500, title: "warehouse", body: "roof + shutter door + box stack。 fulfillment center / 倉庫" }, (p: PhaseBuilder) => p.activate("w").badge("shape"))
  .build();

export const shapeOnlineShop = diagram("shape-online-shop", { topic: "shape: online-shop (browser + cart badge + product grid)" })
  .lane("l", { x: 0, width: W })
  .node("o", { lane: "l", stack: 0, kind: "shape-online-shop", title: "Amazon", eyebrow: "online-shop", subtitle: "EC site" })
  .phase("p", { duration: 1500, title: "online-shop", body: "browser + cart badge (3) + 6 product grid。 EC / online 販売" }, (p: PhaseBuilder) => p.activate("o").badge("shape"))
  .build();

export const shapeCdnEdge = diagram("shape-cdn-edge", { topic: "shape: cdn-edge (地球儀 + 5 edge nodes + arc)" })
  .lane("l", { x: 0, width: W })
  .node("c", { lane: "l", stack: 0, kind: "shape-cdn-edge", title: "Cloudflare", eyebrow: "cdn", subtitle: "300+ POP" })
  .phase("p", { duration: 1500, title: "cdn-edge", body: "地球儀 + 5 edge dot + dashed connect。 Cloudflare / Fastly / edge network" }, (p: PhaseBuilder) => p.activate("c").badge("shape"))
  .build();

export const shapeApiGateway = diagram("shape-api-gateway", { topic: "shape: api-gateway (門柱 + arch + traffic arrow)" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "shape-api-gateway", title: "Kong", eyebrow: "gateway", subtitle: "API 管理" })
  .phase("p", { duration: 1500, title: "api-gateway", body: "2 柱 + arch + API text + traffic arrow。 Kong / AWS API GW / 門番" }, (p: PhaseBuilder) => p.activate("a").badge("shape"))
  .build();

/** 9. Shape-driven people 6 (CAR-1111 Phase 2-D) ... 職種別 person 型 */
export const shapeAuditor = diagram("shape-auditor", { topic: "shape: auditor (監査人 + magnifier + check)" })
  .lane("l", { x: 0, width: W })
  .node("a", { lane: "l", stack: 0, kind: "shape-auditor", title: "監査法人", eyebrow: "auditor", subtitle: "内部監査" })
  .phase("p", { duration: 1500, title: "auditor", body: "人 + tie + magnifier + check icon。 監査人 / 公認会計士 / 内部監査" }, (p: PhaseBuilder) => p.activate("a").badge("shape"))
  .build();

export const shapeRegulator = diagram("shape-regulator", { topic: "shape: regulator (規制当局 + 冠 crown + 章 badge)" })
  .lane("l", { x: 0, width: W })
  .node("r", { lane: "l", stack: 0, kind: "shape-regulator", title: "金融庁", eyebrow: "regulator", subtitle: "監督官庁" })
  .phase("p", { duration: 1500, title: "regulator", body: "人 + crown + 五芒星 badge。 金融庁 / 消費者庁 / 規制当局" }, (p: PhaseBuilder) => p.activate("r").badge("shape"))
  .build();

export const shapeNotary = diagram("shape-notary", { topic: "shape: notary (公証人 + 儒学者風 hat + seal 印)" })
  .lane("l", { x: 0, width: W })
  .node("n", { lane: "l", stack: 0, kind: "shape-notary", title: "公証役場", eyebrow: "notary", subtitle: "公証人" })
  .phase("p", { duration: 1500, title: "notary", body: "人 + 儒学者風 hat + 紅印。 公証人 / 認証業務 / 書類認証" }, (p: PhaseBuilder) => p.activate("n").badge("shape"))
  .build();

export const shapeLawyer = diagram("shape-lawyer", { topic: "shape: lawyer (弁護士 + wig + 天秤)" })
  .lane("l", { x: 0, width: W })
  .node("l", { lane: "l", stack: 0, kind: "shape-lawyer", title: "顧問弁護士", eyebrow: "lawyer", subtitle: "法律事務所" })
  .phase("p", { duration: 1500, title: "lawyer", body: "人 + 髪 + 正義の天秤 icon。 弁護士 / 法務顧問 / 法律事務所" }, (p: PhaseBuilder) => p.activate("l").badge("shape"))
  .build();

export const shapeTrader = diagram("shape-trader", { topic: "shape: trader (トレーダー + headset + laptop chart)" })
  .lane("l", { x: 0, width: W })
  .node("t", { lane: "l", stack: 0, kind: "shape-trader", title: "デイトレーダー", eyebrow: "trader", subtitle: "algorithmic" })
  .phase("p", { duration: 1500, title: "trader", body: "人 + headset + laptop with chart。 トレーダー / MM / algo 発注" }, (p: PhaseBuilder) => p.activate("t").badge("shape"))
  .build();

export const shapeCustomerService = diagram("shape-customer-service", { topic: "shape: customer-service (CS + headset + speech bubble + smile)" })
  .lane("l", { x: 0, width: W })
  .node("c", { lane: "l", stack: 0, kind: "shape-customer-service", title: "サポート担当", eyebrow: "support", subtitle: "24h コンタクト" })
  .phase("p", { duration: 1500, title: "customer-service", body: "人 + headset + speech bubble + name badge。 CS / コールセンター" }, (p: PhaseBuilder) => p.activate("c").badge("shape"))
  .build();

/** 10. Phase 2-D 追加分 (blockchain 4 新 + credit-card 分離) */
export const shapeBlockchain = diagram("shape-blockchain", { topic: "shape: blockchain (5 block linked chain)" })
  .lane("l", { x: 0, width: W })
  .node("b", { lane: "l", stack: 0, kind: "shape-blockchain", title: "ブロックチェーン", eyebrow: "chain", subtitle: "汎用 5 block" })
  .phase("p", { duration: 1500, title: "blockchain", body: "5 block を hash pointer で横に連結。 汎用 chain / L1 / L2 の抽象" }, (p: PhaseBuilder) => p.activate("b").badge("shape"))
  .build();

export const shapeBitcoinChain = diagram("shape-bitcoin-chain", { topic: "shape: bitcoin-chain (₿ + PoW + 橙色)" })
  .lane("l", { x: 0, width: W })
  .node("b", { lane: "l", stack: 0, kind: "shape-bitcoin-chain", title: "Bitcoin", eyebrow: "bitcoin", subtitle: "PoW mining" })
  .phase("p", { duration: 1500, title: "bitcoin-chain", body: "橙 accent + ₿ symbol + PoW mining。 Bitcoin mainnet / testnet" }, (p: PhaseBuilder) => p.activate("b").badge("shape"))
  .build();

export const shapeEthereumChain = diagram("shape-ethereum-chain", { topic: "shape: ethereum-chain (Ξ + PoS + 紫色)" })
  .lane("l", { x: 0, width: W })
  .node("e", { lane: "l", stack: 0, kind: "shape-ethereum-chain", title: "Ethereum", eyebrow: "ethereum", subtitle: "PoS L1" })
  .phase("p", { duration: 1500, title: "ethereum-chain", body: "紫 accent + Ξ symbol + PoS validator。 Ethereum mainnet / rollup base" }, (p: PhaseBuilder) => p.activate("e").badge("shape"))
  .build();

export const shapeBlockchainNode = diagram("shape-blockchain-node", { topic: "shape: blockchain-node (P2P hex + 6 peers)" })
  .lane("l", { x: 0, width: W })
  .node("n", { lane: "l", stack: 0, kind: "shape-blockchain-node", title: "フルノード", eyebrow: "node", subtitle: "P2P peer" })
  .phase("p", { duration: 1500, title: "blockchain-node", body: "中央 hex + 6 peer hex + block stack icon。 P2P full / archive / light node" }, (p: PhaseBuilder) => p.activate("n").badge("shape"))
  .build();

export const shapeCreditCard = diagram("shape-credit-card", { topic: "shape: credit-card (chip + magstripe + brand mark)" })
  .lane("l", { x: 0, width: W })
  .node("c", { lane: "l", stack: 0, kind: "shape-credit-card", title: "クレカ", eyebrow: "card", subtitle: "VISA / Master" })
  .phase("p", { duration: 1500, title: "credit-card", body: "chip + NFC wave + 番号 + 名義 + 有効期限 + brand mark。 実物クレジットカード" }, (p: PhaseBuilder) => p.activate("c").badge("shape"))
  .build();
