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
      p.activate("n").badge("動作中"),
    )
    .phase(
      "p2",
      { duration: 1500, title: `${kind} が動く`, body: "箱の値が段の中で動く。" },
      (p: PhaseBuilder) => p.activate("n").tween("v", metric.from, metric.to).badge("値が動く"),
    )
    .build();
}

// 人系 5
export const kPerson = single("k-person", {
  kind: "person", eyebrow: "個人", title: "利用者", subtitle: "外部の 1 ユーザー",
  metric: { value: "{v} 操作", from: 3, to: 18 },
});
export const kUserGroup = single("k-user-group", {
  kind: "user-group", eyebrow: "複数ユーザー", title: "利用者の集まり", subtitle: "組や共同体",
  metric: { value: "{v} 人", from: 4, to: 32 },
});
export const kAdmin = single("k-admin", {
  kind: "admin", eyebrow: "管理者", title: "運用の管理者", subtitle: "権限保有者",
  metric: { value: "承認 {v}", from: 0, to: 7 },
});
export const kDeveloper = single("k-developer", {
  kind: "developer", eyebrow: "開発者", title: "開発する人", subtitle: "コード書く人",
  metric: { value: "{v} 件の変更", from: 1, to: 12 },
});
export const kExternalUser = single("k-external-user", {
  kind: "external-user", eyebrow: "外部ユーザー", title: "外部の利用者", subtitle: "別の仕組みから来訪",
  metric: { value: "{v} 人/分", from: 2, to: 40 },
});

// インフラ 6
export const kDatabase = single("k-database", {
  kind: "database", eyebrow: "DB", title: "PostgreSQL", subtitle: "主データベース",
  metric: { value: "{v} 行/s", from: 120, to: 980 },
});
export const kCache = single("k-cache", {
  kind: "cache", eyebrow: "キャッシュ", title: "Redis", subtitle: "メモリ上の保管",
  metric: { value: "命中 {v}%", from: 62, to: 97 },
});
export const kQueue = single("k-queue", {
  kind: "queue", eyebrow: "キュー", title: "仕事の待ち行列", subtitle: "Bull / SQS",
  metric: { value: "待ち {v}", from: 8, to: 120 },
});
export const kMessageBus = single("k-message-bus", {
  kind: "message-bus", eyebrow: "メッセージバス", title: "Kafka", subtitle: "話題と区画で配る",
  metric: { value: "{v} 件/s", from: 40, to: 620 },
});
export const kCloud = single("k-cloud", {
  kind: "cloud", eyebrow: "クラウド", title: "AWS", subtitle: "クラウドの役務",
  metric: { value: "{v} 台", from: 2, to: 16 },
});
export const kCdn = single("k-cdn", {
  kind: "cdn", eyebrow: "CDN", title: "Cloudflare", subtitle: "配信網の末端",
  metric: { value: "{v} GB/h", from: 5, to: 88 },
});

// アプリ系 6
export const kService = single("k-service", {
  kind: "service", eyebrow: "サービス", title: "認証の役務", subtitle: "業務の処理",
  metric: { value: "{v} 件/s", from: 30, to: 450 },
});
export const kApi = single("k-api", {
  kind: "api", eyebrow: "API", title: "POST /users", subtitle: "REST の口",
  metric: { value: "{v} ms", from: 240, to: 45 },
});
export const kFrontend = single("k-frontend", {
  kind: "frontend", eyebrow: "フロント", title: "画面側のアプリ", subtitle: "閲覧ソフトで動く",
  metric: { value: "描画 {v} ms", from: 180, to: 60 },
});
export const kBackend = single("k-backend", {
  kind: "backend", eyebrow: "バックエンド", title: "Express", subtitle: "サーバの実行環境",
  metric: { value: "CPU {v}%", from: 12, to: 74 },
});
export const kWebhook = single("k-webhook", {
  kind: "webhook", eyebrow: "呼び返し", title: "POST の呼び返し", subtitle: "入ってくる出来事", nodeW: 338,
  metric: { value: "受信 {v}", from: 0, to: 26 },
});
export const kMicroservice = single("k-microservice", {
  kind: "microservice", eyebrow: "マイクロサービス", title: "注文の役務", subtitle: "1 機能 1 サービス", nodeW: 338,
  metric: { value: "{v} 件/分", from: 15, to: 210 },
});

// データ / 判定 4
export const kSigner = single("k-signer", {
  kind: "signer", eyebrow: "署名者", title: "署名する側", subtitle: "HMAC / 公開鍵署名",
  metric: { value: "署名 {v}", from: 1, to: 34 },
});
export const kOracle = single("k-oracle", {
  kind: "oracle", eyebrow: "外部の取り込み", title: "機能の切替を配る役務", subtitle: "外部設定の取込", nodeW: 492,
  metric: { value: "取込 {v}", from: 3, to: 48 },
});
export const kMerkleTree = single("k-merkle-tree", {
  kind: "merkle-tree", eyebrow: "マークル木", title: "ハッシュの木", subtitle: "ハッシュ二分木",
  metric: { value: "葉 {v}", from: 4, to: 64 },
});
export const kDecision = single("k-decision", {
  kind: "decision", eyebrow: "判定分岐", title: "条件で分かれる", subtitle: "真なら片方、偽ならもう片方",
  metric: { value: "真 {v}%", from: 20, to: 85 },
});

// ============================================================
// 記法 (#1376)
// ============================================================
//
// catalog は `sourceYaml__<図の export 名>` の名前で記法を拾う (`lib/catalog-items.ts`)。
// 記法があると画面で「コード」 を読めて「エディタで開く」 が押せる。
//
// **手で書かず、組み立て済みの図から機械で出した**。 110 件を手で写すと必ずずれる。
// 実際、先に手で書いた 30 件は図とずれていた = 縦列の幅と見出し、箱の上の小見出し、
// 段の札が落ちていて、コードのタブに **別の図になる記法** が出ていた。
//
// 出した記法は `textDslToDiagram` と `jsonToDiagram` に通して同じ図になることを確かめてから
// 貼っており、以降は一致検査 (`lib/catalog-source-parity.test.tsx`) が骨格まで突き合わせる。
//
// 出す経路は repo に残していない。 1 度きりの生成で、残すべき成果物は記法そのものだから。
// 記法を直したら検査が落ちるので、以降は記法が正になる。
//
// **図は組み立て API のまま残す**。 記法から組み立て直すと図の識別子が題から導かれ、
// 一覧と検索に出る文字列が変わる。

export const sourceYaml__kPerson = `title: "kind: person"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 3

actors:
  - 利用者: { kind: person, lane: l, stack: 0, eyebrow: "個人", subtitle: "外部の 1 ユーザー", value: "{v} 操作" }

animation:
  - step: "person" 1.5s
    focus: ["利用者"]
    badge: "動作中"
    description: "person kind の見た目。"
  - step: "person が動く" 1.5s
    focus: ["利用者"]
    tween:
      v: 3 -> 18
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kPerson = `{
  "title": "kind: person",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "利用者",
      "kind": "person",
      "lane": "l",
      "stack": 0,
      "eyebrow": "個人",
      "subtitle": "外部の 1 ユーザー",
      "value": "{v} 操作"
    }
  ],
  "flow": [],
  "states": { "v": 3 },
  "animation": [
    {
      "step": "person",
      "duration": 1.5,
      "focus": ["利用者"],
      "badge": "動作中",
      "body": "person kind の見た目。"
    },
    {
      "step": "person が動く",
      "duration": 1.5,
      "focus": ["利用者"],
      "tween": { "v": [3, 18] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kUserGroup = `title: "kind: user-group"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 4

actors:
  - 利用者の集まり: { kind: user-group, lane: l, stack: 0, eyebrow: "複数ユーザー", subtitle: "組や共同体", value: "{v} 人" }

animation:
  - step: "user-group" 1.5s
    focus: ["利用者の集まり"]
    badge: "動作中"
    description: "user-group kind の見た目。"
  - step: "user-group が動く" 1.5s
    focus: ["利用者の集まり"]
    tween:
      v: 4 -> 32
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kUserGroup = `{
  "title": "kind: user-group",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "利用者の集まり",
      "kind": "user-group",
      "lane": "l",
      "stack": 0,
      "eyebrow": "複数ユーザー",
      "subtitle": "組や共同体",
      "value": "{v} 人"
    }
  ],
  "flow": [],
  "states": { "v": 4 },
  "animation": [
    {
      "step": "user-group",
      "duration": 1.5,
      "focus": ["利用者の集まり"],
      "badge": "動作中",
      "body": "user-group kind の見た目。"
    },
    {
      "step": "user-group が動く",
      "duration": 1.5,
      "focus": ["利用者の集まり"],
      "tween": { "v": [4, 32] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kAdmin = `title: "kind: admin"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 0

actors:
  - 運用の管理者: { kind: admin, lane: l, stack: 0, eyebrow: "管理者", subtitle: "権限保有者", value: "承認 {v}" }

animation:
  - step: "admin" 1.5s
    focus: ["運用の管理者"]
    badge: "動作中"
    description: "admin kind の見た目。"
  - step: "admin が動く" 1.5s
    focus: ["運用の管理者"]
    tween:
      v: 0 -> 7
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kAdmin = `{
  "title": "kind: admin",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "運用の管理者",
      "kind": "admin",
      "lane": "l",
      "stack": 0,
      "eyebrow": "管理者",
      "subtitle": "権限保有者",
      "value": "承認 {v}"
    }
  ],
  "flow": [],
  "states": { "v": 0 },
  "animation": [
    {
      "step": "admin",
      "duration": 1.5,
      "focus": ["運用の管理者"],
      "badge": "動作中",
      "body": "admin kind の見た目。"
    },
    {
      "step": "admin が動く",
      "duration": 1.5,
      "focus": ["運用の管理者"],
      "tween": { "v": [0, 7] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kDeveloper = `title: "kind: developer"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 1

actors:
  - 開発する人: { kind: developer, lane: l, stack: 0, eyebrow: "開発者", subtitle: "コード書く人", value: "{v} 件の変更" }

animation:
  - step: "developer" 1.5s
    focus: ["開発する人"]
    badge: "動作中"
    description: "developer kind の見た目。"
  - step: "developer が動く" 1.5s
    focus: ["開発する人"]
    tween:
      v: 1 -> 12
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kDeveloper = `{
  "title": "kind: developer",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "開発する人",
      "kind": "developer",
      "lane": "l",
      "stack": 0,
      "eyebrow": "開発者",
      "subtitle": "コード書く人",
      "value": "{v} 件の変更"
    }
  ],
  "flow": [],
  "states": { "v": 1 },
  "animation": [
    {
      "step": "developer",
      "duration": 1.5,
      "focus": ["開発する人"],
      "badge": "動作中",
      "body": "developer kind の見た目。"
    },
    {
      "step": "developer が動く",
      "duration": 1.5,
      "focus": ["開発する人"],
      "tween": { "v": [1, 12] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kExternalUser = `title: "kind: external-user"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 2

actors:
  - 外部の利用者: { kind: external-user, lane: l, stack: 0, eyebrow: "外部ユーザー", subtitle: "別の仕組みから来訪", value: "{v} 人/分" }

animation:
  - step: "external-user" 1.5s
    focus: ["外部の利用者"]
    badge: "動作中"
    description: "external-user kind の見た目。"
  - step: "external-user が動く" 1.5s
    focus: ["外部の利用者"]
    tween:
      v: 2 -> 40
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kExternalUser = `{
  "title": "kind: external-user",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "外部の利用者",
      "kind": "external-user",
      "lane": "l",
      "stack": 0,
      "eyebrow": "外部ユーザー",
      "subtitle": "別の仕組みから来訪",
      "value": "{v} 人/分"
    }
  ],
  "flow": [],
  "states": { "v": 2 },
  "animation": [
    {
      "step": "external-user",
      "duration": 1.5,
      "focus": ["外部の利用者"],
      "badge": "動作中",
      "body": "external-user kind の見た目。"
    },
    {
      "step": "external-user が動く",
      "duration": 1.5,
      "focus": ["外部の利用者"],
      "tween": { "v": [2, 40] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kDatabase = `title: "kind: database"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 120

actors:
  - PostgreSQL: { kind: database, lane: l, stack: 0, eyebrow: "DB", subtitle: "主データベース", value: "{v} 行/s" }

animation:
  - step: "database" 1.5s
    focus: ["PostgreSQL"]
    badge: "動作中"
    description: "database kind の見た目。"
  - step: "database が動く" 1.5s
    focus: ["PostgreSQL"]
    tween:
      v: 120 -> 980
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kDatabase = `{
  "title": "kind: database",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "PostgreSQL",
      "kind": "database",
      "lane": "l",
      "stack": 0,
      "eyebrow": "DB",
      "subtitle": "主データベース",
      "value": "{v} 行/s"
    }
  ],
  "flow": [],
  "states": { "v": 120 },
  "animation": [
    {
      "step": "database",
      "duration": 1.5,
      "focus": ["PostgreSQL"],
      "badge": "動作中",
      "body": "database kind の見た目。"
    },
    {
      "step": "database が動く",
      "duration": 1.5,
      "focus": ["PostgreSQL"],
      "tween": { "v": [120, 980] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kCache = `title: "kind: cache"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 62

actors:
  - Redis: { kind: cache, lane: l, stack: 0, eyebrow: "キャッシュ", subtitle: "メモリ上の保管", value: "命中 {v}%" }

animation:
  - step: "cache" 1.5s
    focus: ["Redis"]
    badge: "動作中"
    description: "cache kind の見た目。"
  - step: "cache が動く" 1.5s
    focus: ["Redis"]
    tween:
      v: 62 -> 97
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kCache = `{
  "title": "kind: cache",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Redis",
      "kind": "cache",
      "lane": "l",
      "stack": 0,
      "eyebrow": "キャッシュ",
      "subtitle": "メモリ上の保管",
      "value": "命中 {v}%"
    }
  ],
  "flow": [],
  "states": { "v": 62 },
  "animation": [
    {
      "step": "cache",
      "duration": 1.5,
      "focus": ["Redis"],
      "badge": "動作中",
      "body": "cache kind の見た目。"
    },
    {
      "step": "cache が動く",
      "duration": 1.5,
      "focus": ["Redis"],
      "tween": { "v": [62, 97] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kQueue = `title: "kind: queue"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 8

actors:
  - 仕事の待ち行列: { kind: queue, lane: l, stack: 0, eyebrow: "キュー", subtitle: "Bull / SQS", value: "待ち {v}" }

animation:
  - step: "queue" 1.5s
    focus: ["仕事の待ち行列"]
    badge: "動作中"
    description: "queue kind の見た目。"
  - step: "queue が動く" 1.5s
    focus: ["仕事の待ち行列"]
    tween:
      v: 8 -> 120
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kQueue = `{
  "title": "kind: queue",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "仕事の待ち行列",
      "kind": "queue",
      "lane": "l",
      "stack": 0,
      "eyebrow": "キュー",
      "subtitle": "Bull / SQS",
      "value": "待ち {v}"
    }
  ],
  "flow": [],
  "states": { "v": 8 },
  "animation": [
    {
      "step": "queue",
      "duration": 1.5,
      "focus": ["仕事の待ち行列"],
      "badge": "動作中",
      "body": "queue kind の見た目。"
    },
    {
      "step": "queue が動く",
      "duration": 1.5,
      "focus": ["仕事の待ち行列"],
      "tween": { "v": [8, 120] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kMessageBus = `title: "kind: message-bus"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 40

actors:
  - Kafka: { kind: message-bus, lane: l, stack: 0, eyebrow: "メッセージバス", subtitle: "話題と区画で配る", value: "{v} 件/s" }

animation:
  - step: "message-bus" 1.5s
    focus: ["Kafka"]
    badge: "動作中"
    description: "message-bus kind の見た目。"
  - step: "message-bus が動く" 1.5s
    focus: ["Kafka"]
    tween:
      v: 40 -> 620
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kMessageBus = `{
  "title": "kind: message-bus",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Kafka",
      "kind": "message-bus",
      "lane": "l",
      "stack": 0,
      "eyebrow": "メッセージバス",
      "subtitle": "話題と区画で配る",
      "value": "{v} 件/s"
    }
  ],
  "flow": [],
  "states": { "v": 40 },
  "animation": [
    {
      "step": "message-bus",
      "duration": 1.5,
      "focus": ["Kafka"],
      "badge": "動作中",
      "body": "message-bus kind の見た目。"
    },
    {
      "step": "message-bus が動く",
      "duration": 1.5,
      "focus": ["Kafka"],
      "tween": { "v": [40, 620] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kCloud = `title: "kind: cloud"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 2

actors:
  - AWS: { kind: cloud, lane: l, stack: 0, eyebrow: "クラウド", subtitle: "クラウドの役務", value: "{v} 台" }

animation:
  - step: "cloud" 1.5s
    focus: ["AWS"]
    badge: "動作中"
    description: "cloud kind の見た目。"
  - step: "cloud が動く" 1.5s
    focus: ["AWS"]
    tween:
      v: 2 -> 16
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kCloud = `{
  "title": "kind: cloud",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "AWS",
      "kind": "cloud",
      "lane": "l",
      "stack": 0,
      "eyebrow": "クラウド",
      "subtitle": "クラウドの役務",
      "value": "{v} 台"
    }
  ],
  "flow": [],
  "states": { "v": 2 },
  "animation": [
    {
      "step": "cloud",
      "duration": 1.5,
      "focus": ["AWS"],
      "badge": "動作中",
      "body": "cloud kind の見た目。"
    },
    {
      "step": "cloud が動く",
      "duration": 1.5,
      "focus": ["AWS"],
      "tween": { "v": [2, 16] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kCdn = `title: "kind: cdn"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 5

actors:
  - Cloudflare: { kind: cdn, lane: l, stack: 0, eyebrow: "CDN", subtitle: "配信網の末端", value: "{v} GB/h" }

animation:
  - step: "cdn" 1.5s
    focus: ["Cloudflare"]
    badge: "動作中"
    description: "cdn kind の見た目。"
  - step: "cdn が動く" 1.5s
    focus: ["Cloudflare"]
    tween:
      v: 5 -> 88
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kCdn = `{
  "title": "kind: cdn",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Cloudflare",
      "kind": "cdn",
      "lane": "l",
      "stack": 0,
      "eyebrow": "CDN",
      "subtitle": "配信網の末端",
      "value": "{v} GB/h"
    }
  ],
  "flow": [],
  "states": { "v": 5 },
  "animation": [
    {
      "step": "cdn",
      "duration": 1.5,
      "focus": ["Cloudflare"],
      "badge": "動作中",
      "body": "cdn kind の見た目。"
    },
    {
      "step": "cdn が動く",
      "duration": 1.5,
      "focus": ["Cloudflare"],
      "tween": { "v": [5, 88] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kService = `title: "kind: service"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 30

actors:
  - 認証の役務: { kind: service, lane: l, stack: 0, eyebrow: "サービス", subtitle: "業務の処理", value: "{v} 件/s" }

animation:
  - step: "service" 1.5s
    focus: ["認証の役務"]
    badge: "動作中"
    description: "service kind の見た目。"
  - step: "service が動く" 1.5s
    focus: ["認証の役務"]
    tween:
      v: 30 -> 450
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kService = `{
  "title": "kind: service",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "認証の役務",
      "kind": "service",
      "lane": "l",
      "stack": 0,
      "eyebrow": "サービス",
      "subtitle": "業務の処理",
      "value": "{v} 件/s"
    }
  ],
  "flow": [],
  "states": { "v": 30 },
  "animation": [
    {
      "step": "service",
      "duration": 1.5,
      "focus": ["認証の役務"],
      "badge": "動作中",
      "body": "service kind の見た目。"
    },
    {
      "step": "service が動く",
      "duration": 1.5,
      "focus": ["認証の役務"],
      "tween": { "v": [30, 450] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kApi = `title: "kind: api"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 240

actors:
  - POST /users: { kind: api, lane: l, stack: 0, eyebrow: "API", subtitle: "REST の口", value: "{v} ms" }

animation:
  - step: "api" 1.5s
    focus: ["POST /users"]
    badge: "動作中"
    description: "api kind の見た目。"
  - step: "api が動く" 1.5s
    focus: ["POST /users"]
    tween:
      v: 240 -> 45
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kApi = `{
  "title": "kind: api",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "POST /users",
      "kind": "api",
      "lane": "l",
      "stack": 0,
      "eyebrow": "API",
      "subtitle": "REST の口",
      "value": "{v} ms"
    }
  ],
  "flow": [],
  "states": { "v": 240 },
  "animation": [
    {
      "step": "api",
      "duration": 1.5,
      "focus": ["POST /users"],
      "badge": "動作中",
      "body": "api kind の見た目。"
    },
    {
      "step": "api が動く",
      "duration": 1.5,
      "focus": ["POST /users"],
      "tween": { "v": [240, 45] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kFrontend = `title: "kind: frontend"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 180

actors:
  - 画面側のアプリ: { kind: frontend, lane: l, stack: 0, eyebrow: "フロント", subtitle: "閲覧ソフトで動く", value: "描画 {v} ms" }

animation:
  - step: "frontend" 1.5s
    focus: ["画面側のアプリ"]
    badge: "動作中"
    description: "frontend kind の見た目。"
  - step: "frontend が動く" 1.5s
    focus: ["画面側のアプリ"]
    tween:
      v: 180 -> 60
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kFrontend = `{
  "title": "kind: frontend",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "画面側のアプリ",
      "kind": "frontend",
      "lane": "l",
      "stack": 0,
      "eyebrow": "フロント",
      "subtitle": "閲覧ソフトで動く",
      "value": "描画 {v} ms"
    }
  ],
  "flow": [],
  "states": { "v": 180 },
  "animation": [
    {
      "step": "frontend",
      "duration": 1.5,
      "focus": ["画面側のアプリ"],
      "badge": "動作中",
      "body": "frontend kind の見た目。"
    },
    {
      "step": "frontend が動く",
      "duration": 1.5,
      "focus": ["画面側のアプリ"],
      "tween": { "v": [180, 60] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kBackend = `title: "kind: backend"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 12

actors:
  - Express: { kind: backend, lane: l, stack: 0, eyebrow: "バックエンド", subtitle: "サーバの実行環境", value: "CPU {v}%" }

animation:
  - step: "backend" 1.5s
    focus: ["Express"]
    badge: "動作中"
    description: "backend kind の見た目。"
  - step: "backend が動く" 1.5s
    focus: ["Express"]
    tween:
      v: 12 -> 74
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kBackend = `{
  "title": "kind: backend",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "Express",
      "kind": "backend",
      "lane": "l",
      "stack": 0,
      "eyebrow": "バックエンド",
      "subtitle": "サーバの実行環境",
      "value": "CPU {v}%"
    }
  ],
  "flow": [],
  "states": { "v": 12 },
  "animation": [
    {
      "step": "backend",
      "duration": 1.5,
      "focus": ["Express"],
      "badge": "動作中",
      "body": "backend kind の見た目。"
    },
    {
      "step": "backend が動く",
      "duration": 1.5,
      "focus": ["Express"],
      "tween": { "v": [12, 74] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kWebhook = `title: "kind: webhook"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 0

actors:
  - POST の呼び返し: { kind: webhook, lane: l, stack: 0, eyebrow: "呼び返し", subtitle: "入ってくる出来事", value: "受信 {v}", posW: 338 }

animation:
  - step: "webhook" 1.5s
    focus: ["POST の呼び返し"]
    badge: "動作中"
    description: "webhook kind の見た目。"
  - step: "webhook が動く" 1.5s
    focus: ["POST の呼び返し"]
    tween:
      v: 0 -> 26
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kWebhook = `{
  "title": "kind: webhook",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "POST の呼び返し",
      "kind": "webhook",
      "lane": "l",
      "stack": 0,
      "eyebrow": "呼び返し",
      "subtitle": "入ってくる出来事",
      "value": "受信 {v}",
      "posW": 338
    }
  ],
  "flow": [],
  "states": { "v": 0 },
  "animation": [
    {
      "step": "webhook",
      "duration": 1.5,
      "focus": ["POST の呼び返し"],
      "badge": "動作中",
      "body": "webhook kind の見た目。"
    },
    {
      "step": "webhook が動く",
      "duration": 1.5,
      "focus": ["POST の呼び返し"],
      "tween": { "v": [0, 26] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kMicroservice = `title: "kind: microservice"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 15

actors:
  - 注文の役務: { kind: microservice, lane: l, stack: 0, eyebrow: "マイクロサービス", subtitle: "1 機能 1 サービス", value: "{v} 件/分", posW: 338 }

animation:
  - step: "microservice" 1.5s
    focus: ["注文の役務"]
    badge: "動作中"
    description: "microservice kind の見た目。"
  - step: "microservice が動く" 1.5s
    focus: ["注文の役務"]
    tween:
      v: 15 -> 210
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kMicroservice = `{
  "title": "kind: microservice",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "注文の役務",
      "kind": "microservice",
      "lane": "l",
      "stack": 0,
      "eyebrow": "マイクロサービス",
      "subtitle": "1 機能 1 サービス",
      "value": "{v} 件/分",
      "posW": 338
    }
  ],
  "flow": [],
  "states": { "v": 15 },
  "animation": [
    {
      "step": "microservice",
      "duration": 1.5,
      "focus": ["注文の役務"],
      "badge": "動作中",
      "body": "microservice kind の見た目。"
    },
    {
      "step": "microservice が動く",
      "duration": 1.5,
      "focus": ["注文の役務"],
      "tween": { "v": [15, 210] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kSigner = `title: "kind: signer"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 1

actors:
  - 署名する側: { kind: signer, lane: l, stack: 0, eyebrow: "署名者", subtitle: "HMAC / 公開鍵署名", value: "署名 {v}" }

animation:
  - step: "signer" 1.5s
    focus: ["署名する側"]
    badge: "動作中"
    description: "signer kind の見た目。"
  - step: "signer が動く" 1.5s
    focus: ["署名する側"]
    tween:
      v: 1 -> 34
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kSigner = `{
  "title": "kind: signer",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "署名する側",
      "kind": "signer",
      "lane": "l",
      "stack": 0,
      "eyebrow": "署名者",
      "subtitle": "HMAC / 公開鍵署名",
      "value": "署名 {v}"
    }
  ],
  "flow": [],
  "states": { "v": 1 },
  "animation": [
    {
      "step": "signer",
      "duration": 1.5,
      "focus": ["署名する側"],
      "badge": "動作中",
      "body": "signer kind の見た目。"
    },
    {
      "step": "signer が動く",
      "duration": 1.5,
      "focus": ["署名する側"],
      "tween": { "v": [1, 34] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kOracle = `title: "kind: oracle"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 3

actors:
  - 機能の切替を配る役務: { kind: oracle, lane: l, stack: 0, eyebrow: "外部の取り込み", subtitle: "外部設定の取込", value: "取込 {v}", posW: 492 }

animation:
  - step: "oracle" 1.5s
    focus: ["機能の切替を配る役務"]
    badge: "動作中"
    description: "oracle kind の見た目。"
  - step: "oracle が動く" 1.5s
    focus: ["機能の切替を配る役務"]
    tween:
      v: 3 -> 48
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kOracle = `{
  "title": "kind: oracle",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "機能の切替を配る役務",
      "kind": "oracle",
      "lane": "l",
      "stack": 0,
      "eyebrow": "外部の取り込み",
      "subtitle": "外部設定の取込",
      "value": "取込 {v}",
      "posW": 492
    }
  ],
  "flow": [],
  "states": { "v": 3 },
  "animation": [
    {
      "step": "oracle",
      "duration": 1.5,
      "focus": ["機能の切替を配る役務"],
      "badge": "動作中",
      "body": "oracle kind の見た目。"
    },
    {
      "step": "oracle が動く",
      "duration": 1.5,
      "focus": ["機能の切替を配る役務"],
      "tween": { "v": [3, 48] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kMerkleTree = `title: "kind: merkle-tree"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 4

actors:
  - ハッシュの木: { kind: merkle-tree, lane: l, stack: 0, eyebrow: "マークル木", subtitle: "ハッシュ二分木", value: "葉 {v}" }

animation:
  - step: "merkle-tree" 1.5s
    focus: ["ハッシュの木"]
    badge: "動作中"
    description: "merkle-tree kind の見た目。"
  - step: "merkle-tree が動く" 1.5s
    focus: ["ハッシュの木"]
    tween:
      v: 4 -> 64
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kMerkleTree = `{
  "title": "kind: merkle-tree",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "ハッシュの木",
      "kind": "merkle-tree",
      "lane": "l",
      "stack": 0,
      "eyebrow": "マークル木",
      "subtitle": "ハッシュ二分木",
      "value": "葉 {v}"
    }
  ],
  "flow": [],
  "states": { "v": 4 },
  "animation": [
    {
      "step": "merkle-tree",
      "duration": 1.5,
      "focus": ["ハッシュの木"],
      "badge": "動作中",
      "body": "merkle-tree kind の見た目。"
    },
    {
      "step": "merkle-tree が動く",
      "duration": 1.5,
      "focus": ["ハッシュの木"],
      "tween": { "v": [4, 64] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;

export const sourceYaml__kDecision = `title: "kind: decision"
type: flow

lanes:
  l: { x: 0, width: 440 }

states:
  v: 20

actors:
  - 条件で分かれる: { kind: decision, lane: l, stack: 0, eyebrow: "判定分岐", subtitle: "真なら片方、偽ならもう片方", value: "真 {v}%" }

animation:
  - step: "decision" 1.5s
    focus: ["条件で分かれる"]
    badge: "動作中"
    description: "decision kind の見た目。"
  - step: "decision が動く" 1.5s
    focus: ["条件で分かれる"]
    tween:
      v: 20 -> 85
    badge: "値が動く"
    description: "箱の値が段の中で動く。"
`;

export const sourceJson__kDecision = `{
  "title": "kind: decision",
  "type": "flow",
  "lanes": {
    "l": { "x": 0, "width": 440 }
  },
  "actors": [
    {
      "name": "条件で分かれる",
      "kind": "decision",
      "lane": "l",
      "stack": 0,
      "eyebrow": "判定分岐",
      "subtitle": "真なら片方、偽ならもう片方",
      "value": "真 {v}%"
    }
  ],
  "flow": [],
  "states": { "v": 20 },
  "animation": [
    {
      "step": "decision",
      "duration": 1.5,
      "focus": ["条件で分かれる"],
      "badge": "動作中",
      "body": "decision kind の見た目。"
    },
    {
      "step": "decision が動く",
      "duration": 1.5,
      "focus": ["条件で分かれる"],
      "tween": { "v": [20, 85] },
      "badge": "値が動く",
      "body": "箱の値が段の中で動く。"
    }
  ]
}`;
