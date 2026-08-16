import { diagram } from "@cardenelabs/cdl";
import type { NodeKind, PhaseBuilder } from "@cardenelabs/cdl";

/**
 * Catalog - Primitives Extra ... 拡充 NodeKind (人 / インフラ / アプリ / データ / 判定)。
 * 各 kind を独立 diagram で展示、 全 catalog で lane width=440 統一。
 *
 * **箱は値を持ち、段で動く** (#1172)。 種別の見た目を見せる札だが、値を持たないままだと
 * 「箱は値を持てるのか」 「持てたとして段で動くのか」 が読み取れない。 種別ごとに意味の
 * 通る指標を 1 つ割り当て、2 段目でその値を動かす。
 *
 * 種別の説明 (`eyebrow` / `title` / `subtitle`) は変えない。 値は `value` 欄に出す。
 *
 * 動くことの検査は `lib/catalog-motion-render.test.tsx` が持つ。 **宣言ではなく描画結果を
 * 見る** = 値を変えた 2 つの図を実際に描いて、絵が変わることを確かめる。 宣言だけを見る
 * 検査は、値を描かない種別 (`shape-*` 等) を「動いている」 と誤判定する (#1173 で 79 件)。
 */

const W = 440;

/** 段で動かす指標。 `value` の `{v}` が段の中で `from` → `to` に動く */
type Metric = {
  /** 箱の値の欄に出す形。 `{v}` を必ず含める */
  value: string;
  from: number;
  to: number;
};

type Spec = {
  kind: NodeKind;
  eyebrow: string;
  title: string;
  subtitle: string;
  /** 種別の意味に合う指標。 **必須** = 値を持たない札を作らない (#1172) */
  metric: Metric;
  /** 既定の幅に収まらない文言でだけ指定する */
  nodeW?: number;
};

function single(id: string, spec: Spec) {
  const { kind, eyebrow, title, subtitle, metric, nodeW } = spec;
  return diagram(id, { topic: `kind: ${kind}` })
    .lane("l", { x: 0, width: W })
    .state("v", { initial: metric.from })
    .node("n", {
      lane: "l",
      stack: 0,
      kind,
      title,
      eyebrow,
      subtitle,
      value: metric.value,
      ...(nodeW ? { w: nodeW } : {}),
    })
    .phase("p", { duration: 1500, title: kind, body: `${kind} kind の見た目。` }, (p: PhaseBuilder) =>
      p.activate("n").badge("active"),
    )
    .phase(
      "p2",
      { duration: 1500, title: `${kind} が動く`, body: "箱の値が段の中で動く。" },
      (p: PhaseBuilder) => p.activate("n").tween("v", metric.from, metric.to).badge("running"),
    )
    .build();
}

// 人系 5
export const kPerson = single("k-person", {
  kind: "person", eyebrow: "個人", title: "User", subtitle: "外部の 1 ユーザー",
  metric: { value: "{v} 操作", from: 3, to: 18 },
});
export const kUserGroup = single("k-user-group", {
  kind: "user-group", eyebrow: "複数ユーザー", title: "Users", subtitle: "team / コミュニティ",
  metric: { value: "{v} 人", from: 4, to: 32 },
});
export const kAdmin = single("k-admin", {
  kind: "admin", eyebrow: "管理者", title: "Admin", subtitle: "権限保有者",
  metric: { value: "承認 {v}", from: 0, to: 7 },
});
export const kDeveloper = single("k-developer", {
  kind: "developer", eyebrow: "開発者", title: "Developer", subtitle: "コード書く人",
  metric: { value: "{v} commit", from: 1, to: 12 },
});
export const kExternalUser = single("k-external-user", {
  kind: "external-user", eyebrow: "外部ユーザー", title: "External", subtitle: "別 system から来訪",
  metric: { value: "{v} 人/分", from: 2, to: 40 },
});

// インフラ 6
export const kDatabase = single("k-database", {
  kind: "database", eyebrow: "DB", title: "PostgreSQL", subtitle: "primary database",
  metric: { value: "{v} 行/s", from: 120, to: 980 },
});
export const kCache = single("k-cache", {
  kind: "cache", eyebrow: "キャッシュ", title: "Redis", subtitle: "in-memory store",
  metric: { value: "命中 {v}%", from: 62, to: 97 },
});
export const kQueue = single("k-queue", {
  kind: "queue", eyebrow: "キュー", title: "Job Queue", subtitle: "Bull / SQS",
  metric: { value: "待ち {v}", from: 8, to: 120 },
});
export const kMessageBus = single("k-message-bus", {
  kind: "message-bus", eyebrow: "メッセージバス", title: "Kafka", subtitle: "topic / partition",
  metric: { value: "{v} 件/s", from: 40, to: 620 },
});
export const kCloud = single("k-cloud", {
  kind: "cloud", eyebrow: "クラウド", title: "AWS", subtitle: "cloud service",
  metric: { value: "{v} 台", from: 2, to: 16 },
});
export const kCdn = single("k-cdn", {
  kind: "cdn", eyebrow: "CDN", title: "Cloudflare", subtitle: "edge network",
  metric: { value: "{v} GB/h", from: 5, to: 88 },
});

// アプリ系 6
export const kService = single("k-service", {
  kind: "service", eyebrow: "サービス", title: "AuthService", subtitle: "business logic",
  metric: { value: "{v} 件/s", from: 30, to: 450 },
});
export const kApi = single("k-api", {
  kind: "api", eyebrow: "API", title: "POST /users", subtitle: "REST endpoint",
  metric: { value: "{v} ms", from: 240, to: 45 },
});
export const kFrontend = single("k-frontend", {
  kind: "frontend", eyebrow: "フロント", title: "Next.js App", subtitle: "browser UI",
  metric: { value: "描画 {v} ms", from: 180, to: 60 },
});
export const kBackend = single("k-backend", {
  kind: "backend", eyebrow: "バックエンド", title: "Express", subtitle: "server runtime",
  metric: { value: "CPU {v}%", from: 12, to: 74 },
});
export const kWebhook = single("k-webhook", {
  kind: "webhook", eyebrow: "Webhook", title: "POST callback", subtitle: "incoming event", nodeW: 338,
  metric: { value: "受信 {v}", from: 0, to: 26 },
});
export const kMicroservice = single("k-microservice", {
  kind: "microservice", eyebrow: "マイクロサービス", title: "Order Service", subtitle: "1 機能 1 サービス", nodeW: 338,
  metric: { value: "{v} 件/分", from: 15, to: 210 },
});

// データ / 判定 4
export const kSigner = single("k-signer", {
  kind: "signer", eyebrow: "署名者", title: "Signer", subtitle: "HMAC / 公開鍵署名",
  metric: { value: "署名 {v}", from: 1, to: 34 },
});
export const kOracle = single("k-oracle", {
  kind: "oracle", eyebrow: "Oracle", title: "Feature flag service", subtitle: "外部設定の取込", nodeW: 492,
  metric: { value: "取込 {v}", from: 3, to: 48 },
});
export const kMerkleTree = single("k-merkle-tree", {
  kind: "merkle-tree", eyebrow: "Merkle Tree", title: "Hash tree", subtitle: "ハッシュ二分木",
  metric: { value: "葉 {v}", from: 4, to: 64 },
});
export const kDecision = single("k-decision", {
  kind: "decision", eyebrow: "判定分岐", title: "if/else", subtitle: "条件分岐",
  metric: { value: "真 {v}%", from: 20, to: 85 },
});
