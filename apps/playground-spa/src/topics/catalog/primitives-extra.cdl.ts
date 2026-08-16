import { diagram } from "@cardenelabs/cdl";
import type { NodeKind, PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Primitives Extra ... 拡充 NodeKind (人 / インフラ / アプリ / データ / 判定)。
 * 各 kind を独立 diagram で展示、 全 catalog で lane width=440 統一。
 */

const W = 440;

/**
 * 見本 1 枚を組み立てる。
 *
 * **箱に値を持たせて段で動かす** (`#1172`)。 見本帳は種別の見た目を見せる場だが、
 * 動かないままだと「箱は値を持てるのか」 「持てたとして段で動くのか」 が読み取れない。
 * どの種別も `value` を持てるので、 1 つの状態を宣言して 2 段で動かす。
 *
 * 動きの判定は値が実際に変わったかを見る (`lib/catalog-motion.ts` の `motionOf`)。
 * 段や `activate` を増やしても値が変わらなければ「段を進めても値は変わらない」 のままなので、
 * 状態と `tween` の両方が要る。
 *
 * `subtitle` には手を入れない。 種別の説明はそのまま残し、 値は `value` 欄に出す。
 */
function single(
  id: string,
  kind: NodeKind,
  eyebrow: string,
  title: string,
  subtitle?: string,
  nodeW?: number,
  metric?: { from: number; to: number; unit: string },
) {
  const m = metric ?? { from: 0, to: 100, unit: "" };
  return diagram(id, { topic: `kind: ${kind}` })
    .lane("l", { x: 0, width: W })
    .state("v", { initial: m.from })
    .node("n", {
      lane: "l",
      stack: 0,
      kind,
      title,
      eyebrow,
      value: `{v}${m.unit}`,
      ...(subtitle ? { subtitle } : {}),
      ...(nodeW ? { w: nodeW } : {}),
    })
    .phase("p1", { duration: 1400, title: kind, body: `${kind} kind の見た目。 箱は値を持てる。` }, (p: PhaseBuilder) =>
      p.activate("n").badge("active"),
    )
    .phase("p2", { duration: 1800, title: `${kind} が動く`, body: "値は段の中で連続して動く。" }, (p: PhaseBuilder) =>
      p.activate("n").tween("v", m.from, m.to).badge("動く"),
    )
    .build();
}

// 人系 5
export const kPerson = single("k-person", "person", "個人", "User", "外部の 1 ユーザー", undefined, { from: 0, to: 1, unit: " 人" });
export const kUserGroup = single("k-user-group", "user-group", "複数ユーザー", "Users", "team / コミュニティ", undefined, { from: 0, to: 248, unit: " 人" });
export const kAdmin = single("k-admin", "admin", "管理者", "Admin", "権限保有者", undefined, { from: 0, to: 3, unit: " 人" });
export const kDeveloper = single("k-developer", "developer", "開発者", "Developer", "コード書く人", undefined, { from: 0, to: 12, unit: " 人" });
export const kExternalUser = single("k-external-user", "external-user", "外部ユーザー", "External", "別 system から来訪", undefined, { from: 0, to: 57, unit: " 人" });

// インフラ 6
export const kDatabase = single("k-database", "database", "DB", "PostgreSQL", "primary database", undefined, { from: 0, to: 1420, unit: " 行/秒" });
export const kCache = single("k-cache", "cache", "キャッシュ", "Redis", "in-memory store", undefined, { from: 0, to: 94, unit: "% 命中" });
export const kQueue = single("k-queue", "queue", "キュー", "Job Queue", "Bull / SQS", undefined, { from: 0, to: 386, unit: " 件待ち" });
export const kMessageBus = single("k-message-bus", "message-bus", "メッセージバス", "Kafka", "topic / partition", undefined, { from: 0, to: 5200, unit: " 通/秒" });
export const kCloud = single("k-cloud", "cloud", "クラウド", "AWS", "cloud service", undefined, { from: 0, to: 18, unit: " 台" });
export const kCdn = single("k-cdn", "cdn", "CDN", "Cloudflare", "edge network", undefined, { from: 0, to: 99, unit: "% 配信" });

// アプリ系 6
export const kService = single("k-service", "service", "サービス", "AuthService", "business logic", undefined, { from: 0, to: 640, unit: " 呼/秒" });
export const kApi = single("k-api", "api", "API", "POST /users", "REST endpoint", undefined, { from: 0, to: 210, unit: " ms" });
export const kFrontend = single("k-frontend", "frontend", "フロント", "Next.js App", "browser UI", undefined, { from: 0, to: 96, unit: " 点" });
export const kBackend = single("k-backend", "backend", "バックエンド", "Express", "server runtime", undefined, { from: 0, to: 72, unit: "% 使用" });
export const kWebhook = single("k-webhook", "webhook", "Webhook", "POST callback", "incoming event", 338, { from: 0, to: 34, unit: " 件受信" });
export const kMicroservice = single("k-microservice", "microservice", "マイクロサービス", "Order Service", "1 機能 1 サービス", 338, { from: 0, to: 8, unit: " 実体" });

// データ / 判定 4
export const kSigner = single("k-signer", "signer", "署名者", "Signer", "HMAC / 公開鍵署名", undefined, { from: 0, to: 1280, unit: " 署名" });
export const kOracle = single("k-oracle", "oracle", "Oracle", "Feature flag service", "外部設定の取込", 492, { from: 0, to: 46, unit: " 設定" });
export const kMerkleTree = single("k-merkle-tree", "merkle-tree", "Merkle Tree", "Hash tree", "ハッシュ二分木", undefined, { from: 0, to: 16, unit: " 段" });
export const kDecision = single("k-decision", "decision", "判定分岐", "if/else", "条件分岐", undefined, { from: 0, to: 100, unit: "% 真" });
