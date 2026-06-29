import { diagram } from "@cardenelabs/cdl";
import type { NodeKind, PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Primitives Extra ... 拡充 25 NodeKind (人 / インフラ / アプリ / blockchain / 暗号)。
 * 各 kind を独立 diagram で展示、 全 catalog で lane width=440 統一。
 */

const W = 440;

function single(id: string, kind: NodeKind, eyebrow: string, title: string, subtitle?: string) {
  return diagram(id, { topic: `kind: ${kind}` })
    .lane("l", { x: 0, width: W })
    .node("n", { lane: "l", stack: 0, kind, title, eyebrow, ...(subtitle ? { subtitle } : {}) })
    .phase("p", { duration: 1500, title: kind, body: `${kind} kind の見た目。` }, (p: PhaseBuilder) => p.activate("n").badge("active"))
    .build();
}

// 人系 5
export const kPerson = single("k-person", "person", "個人", "Alice", "外部の 1 ユーザー");
export const kUserGroup = single("k-user-group", "user-group", "複数ユーザー", "Users", "team / コミュニティ");
export const kAdmin = single("k-admin", "admin", "管理者", "Admin", "権限保有者");
export const kDeveloper = single("k-developer", "developer", "開発者", "Developer", "コード書く人");
export const kExternalUser = single("k-external-user", "external-user", "外部ユーザー", "External", "別 system から来訪");

// インフラ 6
export const kDatabase = single("k-database", "database", "DB", "PostgreSQL", "primary database");
export const kCache = single("k-cache", "cache", "キャッシュ", "Redis", "in-memory store");
export const kQueue = single("k-queue", "queue", "キュー", "Job Queue", "Bull / SQS");
export const kMessageBus = single("k-message-bus", "message-bus", "メッセージバス", "Kafka", "topic / partition");
export const kCloud = single("k-cloud", "cloud", "クラウド", "AWS", "cloud service");
export const kCdn = single("k-cdn", "cdn", "CDN", "Cloudflare", "edge network");

// アプリ系 6
export const kService = single("k-service", "service", "サービス", "AuthService", "business logic");
export const kApi = single("k-api", "api", "API", "POST /users", "REST endpoint");
export const kFrontend = single("k-frontend", "frontend", "フロント", "Next.js App", "browser UI");
export const kBackend = single("k-backend", "backend", "バックエンド", "Express", "server runtime");
export const kWebhook = single("k-webhook", "webhook", "Webhook", "POST callback", "incoming event");
export const kMicroservice = single("k-microservice", "microservice", "マイクロサービス", "Order Service", "1 機能 1 サービス");

// ブロックチェーン系 8
export const kWallet = single("k-wallet", "wallet", "ウォレット", "MetaMask", "private key 保持");
export const kValidator = single("k-validator", "validator", "Validator", "Validator A", "stake してブロック生成");
export const kMiner = single("k-miner", "miner", "Miner", "Miner B", "PoW で hash 計算");
export const kBlockchainNode = single("k-blockchain-node", "blockchain-node", "ノード", "Geth Node", "RPC + p2p");
export const kMempool = single("k-mempool", "mempool", "Mempool", "Mempool", "未承認 tx 集約");
export const kBlock = single("k-block", "block", "Block", "Block #18M", "tx 群を確定");
export const kBridgeNode = single("k-bridge-node", "bridge-node", "Bridge", "Bridge Node", "cross-chain 中継");
export const kRelayer = single("k-relayer", "relayer", "Relayer", "Relayer", "msg pass");

// 暗号 / データ 4
export const kSigner = single("k-signer", "signer", "署名者", "Signer", "ECDSA / EdDSA");
export const kOracle = single("k-oracle", "oracle", "Oracle", "Chainlink", "off-chain → on-chain");
export const kMerkleTree = single("k-merkle-tree", "merkle-tree", "Merkle Tree", "Merkle Root", "ハッシュ二分木");
export const kDecision = single("k-decision", "decision", "判定分岐", "if/else", "条件分岐");
